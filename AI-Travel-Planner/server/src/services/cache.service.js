const mongoose = require("mongoose");
const PlaceCache = require("../models/placeCache.model");
const Attraction = require("../models/attraction.model");

/**
 * Cache Service — Pure MongoDB Cache
 *
 * Single Responsibility: Read, Write, Update, and Delete MongoDB records for:
 * 1. Tier 1: Composite Destination Cache (`PlaceCache`)
 * 2. Tier 2: Permanent Granular Attraction Cache (`Attraction`)
 *
 * Ground Rules:
 * - Pure data access layer.
 * - No Google Places API calls.
 * - No external network requests.
 * - No AI or business logic.
 */

// Cache TTL: 24 hours for composite destination entries; 5 minutes for quota-exceeded entries
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const QUOTA_RETRY_MS = 5 * 60 * 1000;

/**
 * Normalizes text for comparison (lowercase, alphanumeric + spaces only).
 */
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/* ==========================================================================
   TIER 1: COMPOSITE DESTINATION CACHE (PlaceCache)
   ========================================================================== */

/**
 * Read cached destination details from MongoDB.
 *
 * @param {string} query - Destination query
 * @returns {Promise<object | null>} Cached data or null if miss/expired
 */
const getCachedDestination = async (query) => {
  if (!query) return null;
  const normalizedQuery = query.trim().toLowerCase();

  try {
    if (mongoose.connection.readyState !== 1) return null;

    const cached = await PlaceCache.findOne({ query: normalizedQuery });
    if (!cached) return null;

    // Check if cache has any QUOTA_EXCEEDED entries that are ready for retry
    const hasQuotaExceeded = (cached.attractions || []).some(
      (a) => a.photoStatus === "QUOTA_EXCEEDED"
    );

    const now = Date.now();
    const updatedAt = cached.updatedAt ? new Date(cached.updatedAt).getTime() : 0;
    const ageMs = now - updatedAt;

    // If quota was exceeded and retry window has elapsed, treat as cache miss to allow fresh retry
    if (hasQuotaExceeded && ageMs > QUOTA_RETRY_MS) {
      console.log(`🔄 [CACHE RETRY] Expired quota-exceeded cache for "${query}". Retrying fresh...`);
      return null;
    }

    // Check general cache expiry (24h)
    if (ageMs > CACHE_TTL_MS) {
      console.log(`⌛ [CACHE EXPIRED] 24h TTL expired for "${query}". Rebuilding...`);
      return null;
    }

    // Check structural completeness
    const hasRichAttractions = cached.attractions && cached.attractions.length >= 1;
    const hasOverview = cached.overview && cached.overview.length >= 30;

    if (hasRichAttractions && hasOverview) {
      console.log(`⚡ [TIER 1 CACHE HIT] Serving "${query}" composite guide from MongoDB`);
      return {
        destination: cached.destination || query,
        state: cached.state || "",
        country: cached.country || "",
        description: cached.description || "",
        overview: cached.overview || cached.description || "",
        heroImage: cached.heroImage || null,
        location: cached.location || "",
        coordinates: cached.coordinates || null,
        elevation: cached.elevation || "",
        timezone: cached.timezone || "",
        currency: cached.currency || "",
        languages: cached.languages || "",
        bestTime: cached.bestTime || "",
        nearestAirport: cached.nearestAirport || "",
        nearestRailwayStation: cached.nearestRailwayStation || "",
        weather: cached.weather || null,
        photos: cached.photos || [],
        attractions: (cached.attractions || []).map((attr) => ({
          id: attr.id,
          name: attr.name,
          rating: attr.rating,
          userRatingCount: attr.userRatingCount,
          imageUrl: attr.imageUrl || null,
          photoStatus: attr.photoStatus || "UNAVAILABLE",
          matchScore: attr.matchScore || 0,
          formattedAddress: attr.formattedAddress || "",
          latitude: attr.latitude || null,
          longitude: attr.longitude || null,
          distanceKm: attr.distanceKm !== undefined ? attr.distanceKm : null,
          googleMapsUri: attr.googleMapsUri || "",
          types: attr.types || [],
        })),
      };
    }

    return null;
  } catch (dbErr) {
    console.warn("Destination cache read skipped:", dbErr.message);
    return null;
  }
};

/**
 * Write destination details to MongoDB cache.
 *
 * @param {string} query - Destination search query
 * @param {object} detailsData - Destination data object
 * @returns {Promise<void>}
 */
const saveDestination = async (query, detailsData) => {
  if (!query || !detailsData) return;
  const normalizedQuery = query.trim().toLowerCase();

  try {
    if (mongoose.connection.readyState !== 1) return;

    await PlaceCache.findOneAndUpdate(
      { query: normalizedQuery },
      {
        query: normalizedQuery,
        destination: detailsData.destination || query,
        state: detailsData.state || "",
        country: detailsData.country || "",
        description: detailsData.description || "",
        overview: detailsData.overview || detailsData.description || "",
        heroImage: detailsData.heroImage || null,
        location: detailsData.location || "",
        coordinates: detailsData.coordinates || null,
        elevation: detailsData.elevation || "",
        timezone: detailsData.timezone || "",
        currency: detailsData.currency || "",
        languages: detailsData.languages || "",
        bestTime: detailsData.bestTime || "",
        nearestAirport: detailsData.nearestAirport || "",
        nearestRailwayStation: detailsData.nearestRailwayStation || "",
        weather: detailsData.weather || null,
        photos: detailsData.photos || [],
        attractions: detailsData.attractions || [],
        updatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`💾 [TIER 1 CACHE SAVED] Stored composite destination for "${query}" in MongoDB`);
  } catch (saveErr) {
    console.warn("Destination cache write failed:", saveErr.message);
  }
};

/**
 * Delete a destination cache entry from MongoDB.
 *
 * @param {string} query - Destination query to invalidate
 * @returns {Promise<boolean>}
 */
const deleteDestination = async (query) => {
  if (!query) return false;
  const normalizedQuery = query.trim().toLowerCase();

  try {
    if (mongoose.connection.readyState !== 1) return false;
    await PlaceCache.deleteOne({ query: normalizedQuery });
    console.log(`🗑️ [TIER 1 CACHE DELETED] Invalidated composite cache for "${query}"`);
    return true;
  } catch (err) {
    console.warn("Destination cache delete failed:", err.message);
    return false;
  }
};

/* ==========================================================================
   TIER 2: GRANULAR PERMANENT ATTRACTION CACHE (Attraction Collection)
   ========================================================================== */

/**
 * Builds a direct Google Place Photo media URL from durable photoReference.
 */
const buildGooglePhotoUrl = (photoReference, maxWidthPx = 1200, maxHeightPx = 800) => {
  const apiKey = process.env.GOOGLE_PLACES_PHOTO_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!photoReference || !apiKey) return null;
  return `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidthPx}&maxHeightPx=${maxHeightPx}&key=${apiKey}`;
};

/**
 * Batch read cached attractions for a destination.
 *
 * Rules:
 * - If a cached doc has photoStatus === "QUOTA_EXCEEDED", it is treated as a cache miss to allow retrying Google Places API.
 * - Reconstructs fresh media imageUrl on-demand from durable photoReference.
 *
 * @param {string[]} names - Array of attraction names to lookup
 * @param {string} destination - Destination / city name
 * @returns {Promise<{hitsMap: Map<string, object>, hitList: object[]}>}
 */
const getCachedAttractions = async (names = [], destination = "") => {
  const hitsMap = new Map();
  const hitList = [];

  if (!names || names.length === 0 || !destination) {
    return { hitsMap, hitList };
  }

  const cleanDest = destination.trim().toLowerCase();
  const normalizedNames = names.map(normalizeText).filter(Boolean);

  try {
    if (mongoose.connection.readyState !== 1) return { hitsMap, hitList };

    // Batch query with $in
    const docs = await Attraction.find({
      destination: cleanDest,
      normalizedName: { $in: normalizedNames },
    }).lean();

    for (const doc of docs) {
      // If photo was quota exceeded, skip cache hit to retry Google resolution
      if (doc.photoStatus === "QUOTA_EXCEEDED") {
        continue;
      }

      // Re-derive transient imageUrl from durable photoReference if available
      let resolvedImageUrl = doc.imageUrl;
      if (doc.photoReference) {
        resolvedImageUrl = buildGooglePhotoUrl(doc.photoReference) || doc.imageUrl;
      }

      const enrichedDoc = {
        ...doc,
        imageUrl: resolvedImageUrl,
      };

      hitsMap.set(doc.normalizedName, enrichedDoc);
      hitList.push(enrichedDoc);
    }

    return { hitsMap, hitList };
  } catch (err) {
    console.warn("Batch attraction cache read failed:", err.message);
    return { hitsMap, hitList };
  }
};

/**
 * Read a single attraction from MongoDB.
 *
 * @param {string} name - Attraction name
 * @param {string} destination - Destination name
 * @returns {Promise<object | null>}
 */
const getAttraction = async (name, destination) => {
  if (!name || !destination) return null;
  const cleanDest = destination.trim().toLowerCase();
  const normName = normalizeText(name);

  try {
    if (mongoose.connection.readyState !== 1) return null;
    const doc = await Attraction.findOne({
      destination: cleanDest,
      normalizedName: normName,
    }).lean();

    if (!doc || doc.photoStatus === "QUOTA_EXCEEDED") return null;

    if (doc.photoReference) {
      doc.imageUrl = buildGooglePhotoUrl(doc.photoReference) || doc.imageUrl;
    }
    return doc;
  } catch (err) {
    console.warn("Single attraction read failed:", err.message);
    return null;
  }
};

/**
 * Batch upsert resolved attractions into the Attraction collection.
 * Primary unique key: placeId.
 *
 * Rules:
 * - QUOTA_EXCEEDED status is NOT cached permanently as a dead record.
 * - placeId is the permanent identity.
 * - photoReference is the durable photo identifier.
 *
 * @param {string} destination - Destination name
 * @param {Array<object>} attractions - Array of resolved attraction objects
 * @returns {Promise<number>} Number of records saved/updated
 */
const saveAttractions = async (destination, attractions = []) => {
  if (!destination || !attractions || attractions.length === 0) return 0;
  const cleanDest = destination.trim().toLowerCase();

  try {
    if (mongoose.connection.readyState !== 1) return 0;

    const operations = attractions
      .filter((attr) => attr && attr.name && attr.placeId && attr.photoStatus !== "QUOTA_EXCEEDED")
      .map((attr) => {
        const normName = normalizeText(attr.name);
        return {
          updateOne: {
            filter: {
              placeId: attr.placeId,
            },
            update: {
              $set: {
                destination: cleanDest,
                name: attr.name,
                normalizedName: normName,
                placeId: attr.placeId,
                photoReference: attr.photoReference || null,
                imageUrl: attr.imageUrl || null,
                imageValidated: attr.imageValidated === true,
                rating: attr.rating !== undefined && attr.rating !== null ? Number(attr.rating) : 4.5,
                userRatingCount: Number(attr.userRatingCount || 0),
                formattedAddress: attr.formattedAddress || `${attr.name}, ${destination}`,
                latitude: attr.latitude || (attr.location ? attr.location.latitude : null),
                longitude: attr.longitude || (attr.location ? attr.location.longitude : null),
                types: attr.types || ["tourist_attraction"],
                photoStatus: attr.photoStatus || (attr.imageValidated ? "AVAILABLE" : "UNAVAILABLE"),
                matchScore: attr.matchScore !== undefined ? attr.matchScore : 0,
                googleMapsUri: attr.googleMapsUri || "",
                lastVerified: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

    if (operations.length === 0) return 0;

    const result = await Attraction.bulkWrite(operations, { ordered: false });
    const count = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    console.log(`💾 [TIER 2 ATTRACTION CACHE] Saved ${count} attraction records for "${destination}" into MongoDB`);
    return count;
  } catch (err) {
    console.warn("Batch attraction cache write failed:", err.message);
    return 0;
  }
};

/**
 * Delete all cached attractions for a destination.
 *
 * @param {string} destination - Destination name
 * @returns {Promise<number>}
 */
const deleteAttractionsForDestination = async (destination) => {
  if (!destination) return 0;
  const cleanDest = destination.trim().toLowerCase();

  try {
    if (mongoose.connection.readyState !== 1) return 0;
    const res = await Attraction.deleteMany({ destination: cleanDest });
    console.log(`🗑️ [TIER 2 CACHE DELETED] Removed ${res.deletedCount} attraction records for "${destination}"`);
    return res.deletedCount;
  } catch (err) {
    console.warn("Attraction cache delete failed:", err.message);
    return 0;
  }
};

module.exports = {
  // Tier 1: Composite Destination
  getCachedDestination,
  saveDestination,
  deleteDestination,

  // Tier 2: Granular Attraction Cache
  getCachedAttractions,
  getAttraction,
  saveAttractions,
  deleteAttractionsForDestination,
  normalizeText,
};
