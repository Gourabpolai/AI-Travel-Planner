const placesService = require("../services/places.service");
const destinationService = require("../services/destination.service");
const photoService = require("../services/photo.service");

/**
 * Places Controller — Thin routing layer
 *
 * Receives request → Calls correct service → Returns response.
 * No business logic.
 */

const searchPlaces = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Call lightweight Destination Search Service with Two-Tier Cache & Single-Flight
    const searchResult = await placesService.searchPlaces(q.trim());
    const places = Array.isArray(searchResult)
      ? searchResult
      : searchResult.places || [];
    const source = searchResult.source || "google";

    // Set debugging cache hit/miss header
    res.set("X-Cache", source === "cache" ? "HIT" : "MISS");

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places,
      source,
    });
  } catch (error) {
    console.error("Error in searchPlaces controller:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch destination search suggestions",
    });
  }
};

const getPlacePhotos = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const photos = await photoService.getPhotos(q);

    return res.status(200).json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error("Error fetching place photos:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch place photos",
    });
  }
};

const getDestinationDetails = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const details = await destinationService.getDestinationDetails(q);

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error fetching destination details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch destination details",
    });
  }
};

const getPopularPlaces = async (req, res) => {
  try {
    const destination = req.query.destination || req.query.q;

    if (!destination || !destination.trim()) {
      return res.status(400).json({
        success: false,
        message: "Destination query parameter is required",
      });
    }

    // Use getDestinationDetails which checks the Tier 1 cache and returns instantly if cached
    const details = await destinationService.getDestinationDetails(destination.trim());

    return res.status(200).json({
      success: true,
      destination: destination.trim(),
      places: details && details.attractions ? details.attractions : [],
    });
  } catch (error) {
    console.error("Error in getPopularPlaces controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch popular places",
    });
  }
};

/**
 * GET /api/places/:placeId
 * Fetches authoritative Google Place details with L1/L2 caching.
 */
const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId || !placeId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Place ID is required",
      });
    }

    const { place, source } = await placesService.getPlaceDetails(placeId.trim());

    res.set("X-Cache", source === "cache" ? "HIT" : "MISS");

    return res.status(200).json({
      success: true,
      data: place,
      source,
    });
  } catch (error) {
    if (
      error.status === 404 ||
      error.message?.includes("404") ||
      error.message?.includes("not found") ||
      error.message?.includes("400") ||
      error.message?.includes("not valid") ||
      error.message?.includes("INVALID_ARGUMENT")
    ) {
      return res.status(404).json({
        success: false,
        message: "Place not found or invalid place ID",
      });
    }

    console.error("Error in getPlaceDetails controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch place details",
    });
  }
};

/**
 * GET /api/places/photo?ref=...&maxWidth=...&maxHeight=...
 * Proxies Google Place Photo media server-side to keep the API key strictly private.
 */
const getPlacePhotoMedia = async (req, res) => {
  try {
    const { ref, maxWidth, maxHeight } = req.query;

    if (!ref || typeof ref !== "string" || !ref.trim()) {
      return res.status(400).json({
        success: false,
        message: "Photo reference is required",
      });
    }

    const trimmedRef = ref.trim();
    const PHOTO_REF_REGEX = /^places\/[A-Za-z0-9_\-]+\/photos\/[A-Za-z0-9_\-]+$/;
    if (!PHOTO_REF_REGEX.test(trimmedRef)) {
      return res.status(400).json({
        success: false,
        message: "Invalid photo reference format",
      });
    }

    const width = parseInt(maxWidth, 10) || 1200;
    const height = parseInt(maxHeight, 10) || 800;

    const media = await placesService.fetchPhotoMedia(trimmedRef, width, height);

    if (!media || !media.buffer) {
      return res.redirect(302, "/placeholder-travel.svg");
    }

    res.set("Content-Type", media.contentType);
    res.set("Cache-Control", "public, max-age=86400, immutable");
    return res.send(media.buffer);
  } catch (error) {
    if (error.message === "Invalid photo reference format") {
      return res.status(400).json({
        success: false,
        message: "Invalid photo reference format",
      });
    }
    console.error("Error in getPlacePhotoMedia proxy:", error.message);
    return res.redirect(302, "/placeholder-travel.svg");
  }
};

module.exports = {
  searchPlaces,
  getPlacePhotos,
  getDestinationDetails,
  getPopularPlaces,
  getPlaceDetails,
  getPlacePhotoMedia,
};