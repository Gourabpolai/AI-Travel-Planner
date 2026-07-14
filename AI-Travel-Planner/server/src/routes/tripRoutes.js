const express = require("express");
const router = express.Router();

const {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createTrip);
router.get("/", protect, getMyTrips);
router.get("/:id", protect, getTripById);
router.put("/:id", protect, updateTrip);
router.delete("/:id", protect, deleteTrip);

module.exports = router;