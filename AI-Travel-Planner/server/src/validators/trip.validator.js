const { body } = require("express-validator");

const createTripValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Trip title is required"),

  body("destination")
    .trim()
    .notEmpty()
    .withMessage("Destination is required"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid end date"),

  body("budget")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Budget cannot be negative"),
];

module.exports = {
  createTripValidation,
};