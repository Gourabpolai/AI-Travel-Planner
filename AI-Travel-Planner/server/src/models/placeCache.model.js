const mongoose = require("mongoose");

const placeCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    destination: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    overview: {
      type: String,
      default: "",
    },

    heroImage: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    coordinates: {
      latitude: Number,
      longitude: Number,
    },

    elevation: {
      type: String,
      default: "",
    },

    timezone: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      default: "",
    },

    languages: {
      type: String,
      default: "",
    },

    bestTime: {
      type: String,
      default: "",
    },

    nearestAirport: {
      type: String,
      default: "",
    },

    nearestRailwayStation: {
      type: String,
      default: "",
    },

    weather: {
      currentTemp: String,
      condition: String,
    },

    photos: [String],

    attractions: [
      {
        id: String,
        placeId: String,
        name: String,
        rating: Number,
        userRatingCount: Number,
        photoReference: String,
        imageUrl: String,
        imageValidated: {
          type: Boolean,
          default: false,
        },
        photoStatus: {
          type: String,
          enum: ["PENDING", "AVAILABLE", "UNAVAILABLE", "QUOTA_EXCEEDED"],
          default: "PENDING",
        },
        matchScore: Number,
        formattedAddress: String,
        latitude: Number,
        longitude: Number,
        distanceKm: Number,
        googleMapsUri: String,
        types: [String],
      },
    ],

    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.PlaceCache || mongoose.model("PlaceCache", placeCacheSchema);