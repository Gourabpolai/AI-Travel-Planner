const { safeFetchWithTimeout } = require("../utils/apiResilience");

/**
 * Wikipedia Service — 100% Factual Source
 *
 * Single Responsibility: Retrieve verified summaries, extracts, and authentic
 * high-resolution photographs from Wikipedia and Wikimedia Commons.
 */

const USER_AGENT = "TripSync-TravelPlanner/1.0 (https://tripsync.example.com; travel@tripsync.example.com)";

/**
 * Clean and normalize a destination query for Wikipedia page matching.
 * @param {string} query
 * @returns {string}
 */
const normalizeTitle = (query) => {
  if (!query) return "";
  // Strip trailing country/state if present, e.g. "Koraput, Odisha, India" -> "Koraput"
  const clean = query.split(",")[0].trim();
  return clean;
};

/**
 * Fetch Wikipedia summary and extract for a destination.
 *
 * @param {string} destination - City / destination name
 * @returns {Promise<{title: string, description: string, extract: string, thumbnail: string | null, coordinates: {lat: number, lon: number} | null} | null>}
 */
const getWikipediaSummary = async (destination) => {
  if (!destination || !destination.trim()) return null;
  const cleanTitle = normalizeTitle(destination);

  const candidateTitles = [
    cleanTitle,
    `${cleanTitle}, India`,
    `${cleanTitle} district`,
    `${cleanTitle} (city)`,
  ];

  for (const title of candidateTitles) {
    try {
      const response = await safeFetchWithTimeout(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        {
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
          },
        },
        3500
      );

      if (response.ok) {
        const data = await response.json();
        // Ignore disambiguation pages
        if (data.type === "disambiguation") continue;

        if (data.extract && data.extract.length > 30) {
          const thumbnail = data.originalimage?.source || data.thumbnail?.source || null;
          const coordinates = data.coordinates ? { lat: data.coordinates.lat, lon: data.coordinates.lon } : null;

          return {
            title: data.title || cleanTitle,
            description: data.description || "",
            extract: data.extract,
            thumbnail,
            coordinates,
          };
        }
      }
    } catch (err) {
      console.warn(`Wikipedia summary failed for "${title}":`, err.message);
    }
  }

  return null;
};

/**
 * Fetch high-resolution real photographs from Wikipedia / Wikimedia Commons.
 *
 * @param {string} destination - City / destination name
 * @param {number} maxCount - Max photos to return
 * @returns {Promise<string[]>} List of real image URLs
 */
const getWikipediaPhotos = async (destination, maxCount = 8) => {
  if (!destination || !destination.trim()) return [];
  const cleanTitle = normalizeTitle(destination);
  const photos = [];

  // 1. Check page summary thumbnail first
  const summary = await getWikipediaSummary(cleanTitle);
  if (summary && summary.thumbnail) {
    photos.push(summary.thumbnail);
  }

  // 2. Fetch media list from Wikipedia REST API
  try {
    const mediaRes = await safeFetchWithTimeout(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(cleanTitle)}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
      },
      4000
    );

    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      const items = mediaData.items || [];

      for (const item of items) {
        if (item.type === "image" && item.srcset && item.srcset.length > 0) {
          // Exclude icons, flags, maps, logos
          const titleLower = (item.title || "").toLowerCase();
          if (
            titleLower.includes("flag") ||
            titleLower.includes("map") ||
            titleLower.includes("icon") ||
            titleLower.includes("logo") ||
            titleLower.includes("coat_of_arms") ||
            titleLower.includes("seal") ||
            titleLower.includes("locator")
          ) {
            continue;
          }

          // Pick the highest resolution available in srcset
          const bestSrc = item.srcset[item.srcset.length - 1]?.src || item.srcset[0]?.src;
          if (bestSrc) {
            const fullUrl = bestSrc.startsWith("//") ? `https:${bestSrc}` : (bestSrc.startsWith("http") ? bestSrc : `https://${bestSrc}`);
            if (!photos.includes(fullUrl)) {
              photos.push(fullUrl);
            }
          }
        }
        if (photos.length >= maxCount) break;
      }
    }
  } catch (mediaErr) {
    console.warn(`Wikipedia media fetch skipped for "${cleanTitle}":`, mediaErr.message);
  }

  return photos.slice(0, maxCount);
};

/**
 * Fetch a high-resolution authentic photograph for an attraction from Wikipedia / Wikimedia Commons.
 *
 * @param {string} attractionName - Name of the landmark or attraction
 * @param {string} destination - Destination or city name
 * @returns {Promise<string | null>} High-res image URL or null
 */
const getWikipediaAttractionPhoto = async (attractionName, destination = "") => {
  if (!attractionName || !attractionName.trim()) return null;
  const cleanName = attractionName.trim();

  // 1. Check direct page summary thumbnail
  const summary = await getWikipediaSummary(cleanName);
  if (summary && summary.thumbnail) {
    return summary.thumbnail;
  }

  // 2. Perform Generator Search on Wikipedia
  const queries = [
    cleanName,
    destination ? `${cleanName} ${destination}` : null,
    cleanName.replace(/\b(lake|pass|waterfall|temple|monastery|fort|caves|dam|beach|palace)\b/gi, "").trim(),
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages&pithumbsize=1200&format=json`;
      const res = await safeFetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
          },
        },
        3500
      );

      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const firstKey = Object.keys(pages)[0];
          const thumb = pages[firstKey]?.thumbnail?.source;
          if (thumb) {
            return thumb;
          }
        }
      }
    } catch (searchErr) {
      // Continue to next query
    }
  }

  return null;
};

module.exports = {
  getWikipediaSummary,
  getWikipediaPhotos,
  getWikipediaAttractionPhoto,
};
