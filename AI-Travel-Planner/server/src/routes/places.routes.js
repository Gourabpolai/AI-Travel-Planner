const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { placesLimiter, reviewLimiter } = require("../middleware/rateLimiter");

const {
  searchPlaces,
  getPlacePhotos,
  getDestinationDetails,
  getPopularPlaces,
  getPlaceDetails,
  getPlacePhotoMedia,
} = require("../controllers/places.controller");

const {
  getPlaceReviews,
  createPlaceReview,
  deletePlaceReview,
  updatePlaceReview,
} = require("../controllers/review.controller");

// Destination & Search routes (rate limited to 60 req/min)
router.get("/search", placesLimiter, searchPlaces);
router.get("/photo", placesLimiter, getPlacePhotoMedia);
router.get("/photos", placesLimiter, getPlacePhotos);
router.get("/details", placesLimiter, getDestinationDetails);
router.get("/popular", placesLimiter, getPopularPlaces);

// Persistent Place Review routes (keyed to Google Place ID)
router.get("/:placeId/reviews", getPlaceReviews);
router.post("/:placeId/reviews", protect, reviewLimiter, createPlaceReview);
router.delete("/:placeId/reviews/:reviewId", protect, deletePlaceReview);
router.patch("/:placeId/reviews/:reviewId", protect, reviewLimiter, updatePlaceReview);

// Authoritative place details
router.get("/:placeId", placesLimiter, getPlaceDetails);

module.exports = router;