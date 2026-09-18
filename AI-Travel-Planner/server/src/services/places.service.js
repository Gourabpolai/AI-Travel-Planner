const mongoose = require("mongoose");
const { safeFetchWithTimeout } = require("../utils/apiResilience");
const PlaceSearchCache = require("../models/placeSearchCache.model");
const PlaceDetailCache = require("../models/placeDetailCache.model");
const wikipediaService = require("./wikipedia.service");

/**
 * Places Service — Fast, Resilient Destination Search with Two-Tier Caching
 *
 * Architecture:
 * 1. normalizeQuery(query) — trims, collapses internal spaces, lowercase
 * 2. L1 Bounded In-Memory Cache (sub-millisecond retrieval, auto LRU eviction & TTL)
 * 3. L2 MongoDB Persistent Cache (persists across restarts with automated TTL index)
 * 4. Single-Flight Deduplication (inFlightRequests Map coalesces concurrent requests)
 * 5. Google Places Autocomplete API (New) via safeFetchWithTimeout
 * 6. Photon OSM Geocoding Fallback via safeFetchWithTimeout
 * 7. Graceful Degradation — cache/DB errors never fail the search
 */

// Common regional and global destination aliases for instant matching
const DESTINATION_ALIASES = {
  vizag: "Visakhapatnam, Andhra Pradesh, India",
  vizak: "Visakhapatnam, Andhra Pradesh, India",
  visakhapatnam: "Visakhapatnam, Andhra Pradesh, India",
  waltair: "Visakhapatnam, Andhra Pradesh, India",
  bengaluru: "Bengaluru, Karnataka, India",
  bangalore: "Bengaluru, Karnataka, India",
  trivandrum: "Thiruvananthapuram, Kerala, India",
  thiruvananthapuram: "Thiruvananthapuram, Kerala, India",
  pondicherry: "Puducherry, India",
  pondy: "Puducherry, India",
  puducherry: "Puducherry, India",
  calcutta: "Kolkata, West Bengal, India",
  kolkata: "Kolkata, West Bengal, India",
  bombay: "Mumbai, Maharashtra, India",
  mumbai: "Mumbai, Maharashtra, India",
  madras: "Chennai, Tamil Nadu, India",
  chennai: "Chennai, Tamil Nadu, India",
  banaras: "Varanasi, Uttar Pradesh, India",
  kashi: "Varanasi, Uttar Pradesh, India",
  varanasi: "Varanasi, Uttar Pradesh, India",
};

/**
 * Normalizes query string:
 * - Trims whitespace
 * - Collapses multiple internal spaces into a single space
 * - Converts to lowercase
 * 
 * Example: "  PURI  " -> "puri", "New   Delhi" -> "new delhi"
 */
const normalizeQuery = (query) => {
  if (!query || typeof query !== "string") return "";
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

// Default TTL: 24 hours (86,400 seconds) - Configurable via GOOGLE_PLACES_CACHE_TTL
const DEFAULT_CACHE_TTL_SEC = 86400;
const getCacheTtlMs = () => {
  const envTtl = parseInt(process.env.GOOGLE_PLACES_CACHE_TTL, 10);
  return (!isNaN(envTtl) && envTtl > 0 ? envTtl : DEFAULT_CACHE_TTL_SEC) * 1000;
};

/* ==========================================================================
   L1 IN-MEMORY BOUNDED CACHE
   ========================================================================== */
const MAX_L1_ENTRIES = 500;
const l1MemoryCache = new Map(); // key -> { results, source, cachedAt, expiresAt }

const getFromL1Cache = (key) => {
  const entry = l1MemoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    l1MemoryCache.delete(key);
    return null;
  }

  // Refresh LRU order (delete & re-insert)
  l1MemoryCache.delete(key);
  l1MemoryCache.set(key, entry);
  return entry;
};

const setToL1Cache = (key, results, source) => {
  if (l1MemoryCache.size >= MAX_L1_ENTRIES) {
    // Evict oldest entry (first item in Map keys)
    const oldestKey = l1MemoryCache.keys().next().value;
    if (oldestKey) l1MemoryCache.delete(oldestKey);
  }

  const ttlMs = getCacheTtlMs();
  l1MemoryCache.set(key, {
    results,
    source,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
};

/* ==========================================================================
   L2 MONGODB PERSISTENT CACHE (Safe & Non-blocking)
   ========================================================================== */
const getFromL2MongoCache = async (normalizedKey) => {
  try {
    if (mongoose.connection.readyState !== 1) return null;

    const doc = await PlaceSearchCache.findOne({ query: normalizedKey }).lean();
    if (!doc) return null;

    if (new Date(doc.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return {
      results: doc.results || [],
      source: doc.source || "google",
    };
  } catch (dbErr) {
    console.warn("[CACHE L2 WARN] MongoDB read skipped:", dbErr.message);
    return null;
  }
};

const saveToL2MongoCache = async (normalizedKey, results, source) => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const ttlMs = getCacheTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);

    await PlaceSearchCache.findOneAndUpdate(
      { query: normalizedKey },
      {
        query: normalizedKey,
        results,
        source,
        cachedAt: new Date(),
        expiresAt,
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (saveErr) {
    console.warn("[CACHE L2 WARN] MongoDB write skipped:", saveErr.message);
  }
};

/* ==========================================================================
   SINGLE-FLIGHT REQUEST DEDUPLICATION
   ========================================================================== */
const inFlightRequests = new Map(); // normalizedKey -> Promise<{ places, source }>

/**
 * Execute external API call with fallback:
 * Google Places API -> Photon OSM Fallback -> Structured Fallback
 */
const fetchRemotePlaces = async (normalizedKey, rawTrimmed) => {
  const searchQuery = DESTINATION_ALIASES[normalizedKey] || rawTrimmed;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  let autocompleteResults = [];

  // 1. Primary: Google Places Autocomplete API (New)
  if (apiKey) {
    try {
      console.log(`[GOOGLE REQUEST] ${normalizedKey}`);
      const response = await safeFetchWithTimeout(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify({
            input: searchQuery,
            includedRegionCodes: ["in"],
          }),
        },
        2500
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.suggestions && data.suggestions.length > 0) {
          autocompleteResults = data.suggestions
            .map((item) => item.placePrediction)
            .filter(Boolean)
            .map((pred) => {
              const mainText =
                pred.structuredFormat?.mainText?.text ||
                pred.text?.text ||
                rawTrimmed;
              const secondaryText =
                pred.structuredFormat?.secondaryText?.text || "";
              const formattedAddress = secondaryText
                ? `${mainText}, ${secondaryText}`
                : pred.text?.text || mainText;

              return {
                id: pred.placeId || pred.place || `place-${Math.random()}`,
                placeId: pred.placeId || "",
                name: mainText,
                formattedAddress,
                latitude: null,
                longitude: null,
              };
            });
        }
      } else {
        const errText = await response.text();
        console.warn(
          `Google Places Autocomplete API returned HTTP ${response.status}:`,
          errText
        );
      }
    } catch (err) {
      console.warn("Google Places Autocomplete timed out / failed:", err.message);
    }
  }

  if (autocompleteResults.length > 0) {
    // Cache Google results
    setToL1Cache(normalizedKey, autocompleteResults, "google");
    saveToL2MongoCache(normalizedKey, autocompleteResults, "google");
    console.log(`[CACHE SET] ${normalizedKey} (${autocompleteResults.length} results)`);
    return { places: autocompleteResults, source: "google" };
  }

  // 2. Fallback: Photon OpenStreetMap Geocoding Autocomplete API
  try {
    console.log(`[PHOTON FALLBACK] ${normalizedKey}`);
    const photonQuery = searchQuery.toLowerCase().includes("india")
      ? searchQuery
      : `${searchQuery}, India`;

    const geoRes = await safeFetchWithTimeout(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}&limit=10`,
      {
        method: "GET",
        headers: {
          "User-Agent": "TripSync-TravelPlanner/1.0",
        },
      },
      2500
    );

    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData && geoData.features && geoData.features.length > 0) {
        const photonResults = geoData.features
          .filter(
            (f) =>
              f.properties &&
              f.geometry &&
              f.geometry.coordinates &&
              (f.properties.country?.toLowerCase() === "india" ||
                f.properties.countrycode?.toLowerCase() === "in")
          )
          .map((f, idx) => {
            const props = f.properties;
            const [lng, lat] = f.geometry.coordinates;

            const name = props.name || props.city || rawTrimmed;
            const parts = [props.city, props.state, props.country].filter(
              (p) => p && p.toLowerCase() !== name.toLowerCase()
            );

            const formattedAddress = [name, ...parts].join(", ");

            return {
              id: `photon-${props.osm_id || idx}-${Date.now()}`,
              placeId: `osm-${props.osm_id || idx}`,
              name,
              formattedAddress,
              latitude: lat,
              longitude: lng,
            };
          });

        if (photonResults.length > 0) {
          // Cache Photon results
          setToL1Cache(normalizedKey, photonResults, "photon");
          saveToL2MongoCache(normalizedKey, photonResults, "photon");
          console.log(`[CACHE SET] ${normalizedKey} via Photon (${photonResults.length} results)`);
          return { places: photonResults, source: "photon" };
        }
      }
    }
  } catch (geoErr) {
    console.warn("Photon geocoding fallback failed:", geoErr.message);
  }

  // 3. Last Fallback: Single structured item for custom destination query
  const fallback = [
    {
      id: `dest-${normalizedKey.replace(/\s+/g, "-")}`,
      placeId: `custom-${normalizedKey}`,
      name: rawTrimmed.charAt(0).toUpperCase() + rawTrimmed.slice(1),
      formattedAddress: `${
        rawTrimmed.charAt(0).toUpperCase() + rawTrimmed.slice(1)
      }, Destination`,
      latitude: null,
      longitude: null,
    },
  ];

  return { places: fallback, source: "custom" };
};

/**
 * Search for destination suggestions using Cache -> Single-Flight -> Google Places -> Photon.
 *
 * @param {string} query - User search input
 * @returns {Promise<{places: Array<object>, source: string}>}
 */
const searchPlaces = async (query) => {
  if (!query || typeof query !== "string") {
    return { places: [], source: "cache" };
  }

  const normalizedKey = normalizeQuery(query);
  const rawTrimmed = query.trim();

  // Enforce minimum query length (2 chars)
  if (!normalizedKey || normalizedKey.length < 2) {
    return { places: [], source: "cache" };
  }

  // Step 1: Check L1 In-Memory Cache
  const l1Hit = getFromL1Cache(normalizedKey);
  if (l1Hit) {
    console.log(`[CACHE HIT] (L1) ${normalizedKey}`);
    return { places: l1Hit.results, source: "cache" };
  }

  // Step 2: Check L2 MongoDB Cache
  const l2Hit = await getFromL2MongoCache(normalizedKey);
  if (l2Hit) {
    console.log(`[CACHE HIT] (L2) ${normalizedKey}`);
    // Populate L1 cache for sub-millisecond future hits
    setToL1Cache(normalizedKey, l2Hit.results, l2Hit.source);
    return { places: l2Hit.results, source: "cache" };
  }

  // Step 3: Cache MISS - Prepare to fetch remotely
  console.log(`[CACHE MISS] ${normalizedKey}`);

  // Step 4: Single-Flight Request Deduplication
  if (inFlightRequests.has(normalizedKey)) {
    console.log(`[SINGLE-FLIGHT] Coalescing concurrent request for: "${normalizedKey}"`);
    return await inFlightRequests.get(normalizedKey);
  }

  // Create single-flight promise
  const fetchPromise = (async () => {
    try {
      return await fetchRemotePlaces(normalizedKey, rawTrimmed);
    } finally {
      // Guarantee key cleanup so failed or finished requests do not linger
      inFlightRequests.delete(normalizedKey);
    }
  })();

  inFlightRequests.set(normalizedKey, fetchPromise);
  return await fetchPromise;
};

/* ==========================================================================
   PLACE DETAILS — TWO-TIER CACHE & SINGLE-FLIGHT ENGINE
   ========================================================================== */
const placeDetailsL1Cache = new Map(); // placeId -> { data, source, cachedAt, expiresAt }
const inFlightPlaceDetails = new Map(); // placeId -> Promise<{ place, source }>

const getPlaceDetailsFromL1 = (placeId) => {
  const entry = placeDetailsL1Cache.get(placeId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    placeDetailsL1Cache.delete(placeId);
    return null;
  }
  // LRU refresh
  placeDetailsL1Cache.delete(placeId);
  placeDetailsL1Cache.set(placeId, entry);
  return entry;
};

const setPlaceDetailsToL1 = (placeId, data, source) => {
  if (placeDetailsL1Cache.size >= MAX_L1_ENTRIES) {
    const oldestKey = placeDetailsL1Cache.keys().next().value;
    if (oldestKey) placeDetailsL1Cache.delete(oldestKey);
  }
  const ttlMs = getCacheTtlMs();
  placeDetailsL1Cache.set(placeId, {
    data,
    source,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
};

const getPlaceDetailsFromL2 = async (placeId) => {
  try {
    if (mongoose.connection.readyState !== 1) return null;
    const doc = await PlaceDetailCache.findOne({ placeId }).lean();
    if (!doc) return null;
    if (new Date(doc.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return {
      data: doc.data,
      source: doc.source || "google",
    };
  } catch (dbErr) {
    console.warn("[CACHE L2 WARN] Place details read skipped:", dbErr.message);
    return null;
  }
};

const savePlaceDetailsToL2 = async (placeId, data, source) => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const ttlMs = getCacheTtlMs();
    const expiresAt = new Date(Date.now() + ttlMs);
    await PlaceDetailCache.findOneAndUpdate(
      { placeId },
      {
        placeId,
        data,
        source,
        cachedAt: new Date(),
        expiresAt,
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (saveErr) {
    console.warn("[CACHE L2 WARN] Place details write skipped:", saveErr.message);
  }
};

/**
 * Normalizes raw Google Places (New) place detail response into standard TripSync PlaceDetails schema.
 */
const normalizePlaceDetails = (data, placeId) => {
  if (!data) return null;

  const cleanId = placeId.startsWith("places/") ? placeId.replace(/^places\//, "") : placeId;

  // Resolve short address
  let shortAddress = data.shortFormattedAddress || null;
  if (!shortAddress && Array.isArray(data.addressComponents)) {
    const locality = data.addressComponents.find((c) => c.types?.includes("locality"))?.longText;
    const state = data.addressComponents.find((c) => c.types?.includes("administrative_area_level_1"))?.longText;
    const country = data.addressComponents.find((c) => c.types?.includes("country"))?.longText;
    shortAddress = [locality, state, country].filter(Boolean).join(", ");
  }
  if (!shortAddress) {
    shortAddress = data.formattedAddress || null;
  }

  // Weekday descriptions
  const weekdayDescriptions =
    data.regularOpeningHours?.weekdayDescriptions ||
    data.currentOpeningHours?.weekdayDescriptions ||
    [];

  // Photos with server-side proxy URLs
  const photos = (data.photos || []).map((p) => ({
    name: p.name,
    widthPx: p.widthPx,
    heightPx: p.heightPx,
    authorAttributions: (p.authorAttributions || []).map((a) => ({
      displayName: a.displayName || "Contributor",
      uri: a.uri || null,
      photoUri: a.photoUri || null,
    })),
    url: `/api/places/photo?ref=${encodeURIComponent(p.name)}&maxWidth=1200`,
    thumbnailUrl: `/api/places/photo?ref=${encodeURIComponent(p.name)}&maxWidth=400`,
  }));

  return {
    id: data.id || cleanId,
    placeId: cleanId,
    name: data.displayName?.text || "Unknown Place",
    formattedAddress: data.formattedAddress || "",
    shortAddress,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    rating: typeof data.rating === "number" ? data.rating : null,
    userRatingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : null,
    types: Array.isArray(data.types) ? data.types : [],
    primaryType: data.primaryType || null,
    primaryTypeDisplayName: data.primaryTypeDisplayName?.text || null,
    businessStatus: data.businessStatus || null,
    currentOpeningHours: data.currentOpeningHours
      ? {
          openNow: data.currentOpeningHours.openNow,
          periods: data.currentOpeningHours.periods || [],
          weekdayDescriptions: data.currentOpeningHours.weekdayDescriptions || [],
        }
      : null,
    regularOpeningHours: data.regularOpeningHours
      ? {
          openNow: data.regularOpeningHours.openNow,
          periods: data.regularOpeningHours.periods || [],
          weekdayDescriptions: data.regularOpeningHours.weekdayDescriptions || [],
        }
      : null,
    weekdayDescriptions,
    nationalPhoneNumber: data.nationalPhoneNumber || null,
    internationalPhoneNumber: data.internationalPhoneNumber || null,
    websiteUri: data.websiteUri || null,
    googleMapsUri:
      data.googleMapsUri ||
      (data.location
        ? `https://www.google.com/maps/search/?api=1&query=${data.location.latitude},${data.location.longitude}`
        : null),
    photos,
    imageUrl: photos[0]?.url || null,
    editorialSummary: data.editorialSummary?.text || null,
  };
};

/**
 * Fetch Place Details with Two-Tier Cache & Single-Flight Deduplication.
 *
 * @param {string} rawPlaceId - Canonical Google Place ID (or OSM ID)
 * @returns {Promise<{place: object, source: string}>}
 */
const getPlaceDetails = async (rawPlaceId) => {
  if (!rawPlaceId || typeof rawPlaceId !== "string" || !rawPlaceId.trim()) {
    throw new Error("Place ID is required");
  }

  const placeId = rawPlaceId.trim();
  const cleanId = placeId.startsWith("places/") ? placeId.replace(/^places\//, "") : placeId;

  // 1. Tier 1: L1 In-Memory Cache
  const l1Hit = getPlaceDetailsFromL1(cleanId);
  if (l1Hit) {
    return { place: l1Hit.data, source: "cache" };
  }

  // 2. Tier 2: L2 MongoDB Atlas Cache
  const l2Hit = await getPlaceDetailsFromL2(cleanId);
  if (l2Hit) {
    setPlaceDetailsToL1(cleanId, l2Hit.data, l2Hit.source);
    return { place: l2Hit.data, source: "cache" };
  }

  // 3. Single-Flight Deduplication
  if (inFlightPlaceDetails.has(cleanId)) {
    return await inFlightPlaceDetails.get(cleanId);
  }

  const fetchPromise = (async () => {
    try {
      // Check for OSM identifier from Photon fallback
      if (cleanId.startsWith("osm-")) {
        const fallbackPlace = {
          id: cleanId,
          placeId: cleanId,
          name: "Attraction",
          formattedAddress: "India",
          shortAddress: "India",
          latitude: null,
          longitude: null,
          rating: null,
          userRatingCount: null,
          types: ["tourist_attraction"],
          primaryType: "tourist_attraction",
          primaryTypeDisplayName: "Tourist Attraction",
          businessStatus: "OPERATIONAL",
          currentOpeningHours: null,
          regularOpeningHours: null,
          weekdayDescriptions: [],
          nationalPhoneNumber: null,
          internationalPhoneNumber: null,
          websiteUri: null,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanId)}`,
          photos: [],
          imageUrl: null,
          editorialSummary: null,
        };
        setPlaceDetailsToL1(cleanId, fallbackPlace, "photon");
        await savePlaceDetailsToL2(cleanId, fallbackPlace, "photon");
        return { place: fallbackPlace, source: "photon" };
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error("Google Places API key is not configured on the server");
      }

      const fieldMask = [
        "id",
        "displayName",
        "formattedAddress",
        "shortFormattedAddress",
        "addressComponents",
        "location",
        "rating",
        "userRatingCount",
        "types",
        "primaryType",
        "primaryTypeDisplayName",
        "businessStatus",
        "currentOpeningHours",
        "regularOpeningHours",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "photos",
        "editorialSummary",
      ].join(",");

      const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanId)}`;

      const response = await safeFetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
          },
        },
        5000
      );

      if (!response.ok) {
        if (response.status === 404) {
          const err = new Error("Place not found");
          err.status = 404;
          throw err;
        }
        const errText = await response.text();
        throw new Error(`Google Places API returned HTTP ${response.status}: ${errText}`);
      }

      const rawData = await response.json();
      const normalized = normalizePlaceDetails(rawData, cleanId);

      // If Google Places omits photos or summary for prominent landmark, check Wikipedia
      if (normalized && normalized.name) {
        if (normalized.photos.length === 0 || !normalized.editorialSummary) {
          try {
            const wiki = await wikipediaService.getWikipediaSummary(normalized.name);
            if (wiki) {
              if (normalized.photos.length === 0 && wiki.thumbnail) {
                normalized.photos = [
                  {
                    name: `wiki-${wiki.title}`,
                    widthPx: 1200,
                    heightPx: 800,
                    authorAttributions: [
                      { displayName: "Wikimedia Commons", uri: wiki.thumbnail },
                    ],
                    url: wiki.thumbnail,
                    thumbnailUrl: wiki.thumbnail,
                  },
                ];
                normalized.imageUrl = wiki.thumbnail;
              }
              if (!normalized.editorialSummary && wiki.extract) {
                normalized.editorialSummary = wiki.extract;
              }
            }
          } catch (wikiErr) {
            // Graceful non-blocking fallback
          }
        }
      }

      // Populate L1 & L2 caches
      setPlaceDetailsToL1(cleanId, normalized, "google");
      await savePlaceDetailsToL2(cleanId, normalized, "google");

      return { place: normalized, source: "google" };
    } finally {
      inFlightPlaceDetails.delete(cleanId);
    }
  })();

  inFlightPlaceDetails.set(cleanId, fetchPromise);
  return await fetchPromise;
};

/**
 * Server-side controlled photo proxy for Google Place Photos.
 * Streams photo bytes with immutable cache headers without exposing the API key to the client.
 *
 * @param {string} photoRef - Google Places photo reference (places/{placeId}/photos/{photoId})
 * @param {number} maxWidth - Max width in pixels
 * @param {number} maxHeight - Max height in pixels
 * @returns {Promise<{contentType: string, buffer: Buffer} | null>}
 */
const fetchPhotoMedia = async (photoRef, maxWidth = 1200, maxHeight = 800) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !photoRef || typeof photoRef !== "string") return null;

  const cleanRef = photoRef.replace(/^\/+/, "").trim();

  // Strict pattern enforcement to prevent SSRF, path traversal, or unexpected endpoint calls
  const validPhotoPattern = /^places\/[A-Za-z0-9_\-]+\/photos\/[A-Za-z0-9_\-]+$/;
  if (!validPhotoPattern.test(cleanRef)) {
    console.warn(`[PHOTO PROXY] Rejected invalid photo reference format: "${cleanRef}"`);
    return null;
  }

  // Clamp dimensions within safe boundaries (50px - 2400px)
  const clampedWidth = Math.min(2400, Math.max(50, parseInt(maxWidth, 10) || 1200));
  const clampedHeight = Math.min(2400, Math.max(50, parseInt(maxHeight, 10) || 800));

  const targetUrl = `https://places.googleapis.com/v1/${cleanRef}/media?maxWidthPx=${clampedWidth}&maxHeightPx=${clampedHeight}&key=${apiKey}`;

  try {
    const response = await safeFetchWithTimeout(
      targetUrl,
      {
        method: "GET",
        headers: {
          Accept: "image/*",
        },
      },
      6500
    );

    if (!response.ok) {
      console.warn(`[PHOTO PROXY] Google returned HTTP ${response.status} for photo "${cleanRef}"`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuf = await response.arrayBuffer();
    return {
      contentType,
      buffer: Buffer.from(arrayBuf),
    };
  } catch (err) {
    console.warn(`[PHOTO PROXY] Failed to fetch photo "${cleanRef}":`, err.message);
    return null;
  }
};

module.exports = {
  searchPlaces,
  getPlaceDetails,
  fetchPhotoMedia,
  normalizeQuery,
  // Exported for testing
  _l1MemoryCache: l1MemoryCache,
  _inFlightRequests: inFlightRequests,
  _placeDetailsL1Cache: placeDetailsL1Cache,
  _inFlightPlaceDetails: inFlightPlaceDetails,
};