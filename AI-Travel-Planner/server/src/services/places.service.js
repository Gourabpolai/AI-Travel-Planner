const PlaceCache = require("../models/placeCache.model");
const { getPopularPlaces } = require("./ai.service");

const CACHE_DURATION = 30; // days

const searchPlaces = async (query) => {
  if (!query) {
    throw new Error("Search query is required");
  }

  const normalizedQuery = query.trim().toLowerCase();

  // Check if cache exists
  const cached = await PlaceCache.findOne({ query: normalizedQuery });

  if (cached) {
    const ageInDays =
      (Date.now() - cached.generatedAt.getTime()) /
      (1000 * 60 * 60 * 24);

    // Fresh cache
    if (ageInDays < CACHE_DURATION) {
      console.log("✅ Returning places from cache");
      return cached.places;
    }

    console.log("♻ Cache expired. Regenerating...");
  }

  console.log("🤖 Fetching places from Gemini...");

  const places = await getPopularPlaces(query);

  if (cached) {
    cached.places = places;
    cached.generatedAt = new Date();
    await cached.save();
  } else {
    await PlaceCache.create({
      query: normalizedQuery,
      places,
    });
  }

  return places;
};

module.exports = {
  searchPlaces,
};