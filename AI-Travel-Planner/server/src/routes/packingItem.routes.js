const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPackingItems,
  addPackingItems,
  updatePackingItem,
  deletePackingItem,
} = require("../controllers/packingItem.controller");

router.get("/:tripId", protect, getPackingItems);
router.post("/:tripId", protect, addPackingItems);
router.put("/:itemId", protect, updatePackingItem);
router.delete("/:itemId", protect, deletePackingItem);

module.exports = router;
