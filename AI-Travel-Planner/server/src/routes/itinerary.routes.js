const express = require("express");

const router = express.Router();

const {protect} = require("../middleware/authMiddleware");

const {
  generateAIItinerary,
} = require("../controllers/itinerary.controller");

router.post(
  "/generate/:tripId",
  protect,
  generateAIItinerary
);

module.exports = router;