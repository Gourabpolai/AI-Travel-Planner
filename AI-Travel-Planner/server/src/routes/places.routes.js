const express = require("express");
const router = express.Router();

const { searchPlaces } = require("../controllers/places.controller");

router.get("/search", searchPlaces);

module.exports = router;