const express = require("express");
const router = express.Router();

const {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  saveSelectedPlaces,
} = require("../controllers/tripController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createTrip);
router.get("/", protect, getMyTrips);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTrip);
router.put("/:id/places", protect, saveSelectedPlaces);
router.delete("/:id", protect, deleteTrip);


module.exports = router;