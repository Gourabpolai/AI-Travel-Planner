const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimiter");

const {
  generateAIItinerary,
  getItinerary,
  deleteItinerary,
  addItineraryItem,
  deleteItineraryItem,
} = require("../controllers/itinerary.controller");

router.post(
  "/generate/:tripId",
  protect,
  aiLimiter,
  generateAIItinerary
);

router.post(
  "/regenerate/:tripId",
  protect,
  aiLimiter,
  generateAIItinerary
);

router.get("/:tripId", protect, getItinerary);

router.delete("/:tripId", protect, deleteItinerary);

router.post("/:tripId", protect, addItineraryItem);
router.delete("/item/:itemId", protect, deleteItineraryItem);

//router.put("/:tripId", protect, updateItinerary);



module.exports = router;