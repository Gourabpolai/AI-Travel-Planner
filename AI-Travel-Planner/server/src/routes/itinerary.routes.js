const express = require("express");

const router = express.Router();

const {protect} = require("../middleware/authMiddleware");

const {
  generateAIItinerary,
    getItinerary,
      deleteItinerary,


} = require("../controllers/itinerary.controller");

router.post(
  "/generate/:tripId",
  protect,
  generateAIItinerary
);

router.post(
  "/regenerate/:tripId",
  protect,
  generateAIItinerary
);

router.get("/:tripId", protect, getItinerary);

router.delete("/:tripId", protect, deleteItinerary);



module.exports = router;