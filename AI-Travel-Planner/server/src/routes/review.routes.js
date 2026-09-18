const express = require("express");
const router = express.Router();
const {
  createReview,
  getDestinationReviews,
  getUserReviews,
  getPlaceReviews,
  createPlaceReview,
  deletePlaceReview,
  updatePlaceReview,
} = require("../controllers/review.controller");
const { protect } = require("../middleware/authMiddleware");
const { reviewLimiter } = require("../middleware/rateLimiter");

// Create or update a review (destination)
router.post("/", protect, reviewLimiter, createReview);

// Place reviews (by Google Place ID)
router.get("/place/:placeId", getPlaceReviews);
router.post("/place/:placeId", protect, reviewLimiter, createPlaceReview);
router.delete("/place/:placeId/:reviewId", protect, deletePlaceReview);
router.delete("/:reviewId", protect, deletePlaceReview);
router.patch("/:reviewId", protect, reviewLimiter, updatePlaceReview);

// Get reviews for a specific destination
router.get("/destination/:destination", getDestinationReviews);

// Get reviews written by the authenticated user
router.get("/user/me", protect, getUserReviews);

module.exports = router;

