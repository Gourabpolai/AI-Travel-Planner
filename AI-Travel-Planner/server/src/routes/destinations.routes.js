const express = require("express");
const router = express.Router();
const {
  getDestinations,
  getDestination,
  getDestinationImage,
} = require("../controllers/destinations.controller");

router.get("/", getDestinations);
router.get("/:nameOrSlug", getDestination);
router.get("/:nameOrSlug/image", getDestinationImage);

module.exports = router;
