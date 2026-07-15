const express = require("express");
const router = express.Router();

const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require("../controllers/trip.controller");

const protect = require("../middleware/protect");
const { createTripValidation } = require("../validators/trip.validator");
const validate = require("../middleware/validate");
