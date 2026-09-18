const mongoose = require("mongoose");

/**
 * Normalizes text for indexed search (lowercase, alphanumeric + spaces only).
 */
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const attractionSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    placeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    photoReference: {
      type: String,
      default: null,
      index: true,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    imageValidated: {
      type: Boolean,
      default: false,
      index: true,
    },

    rating: {
      type: Number,
      default: 4.5,
    },

    userRatingCount: {
      type: Number,
      default: 0,
    },

    formattedAddress: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    types: [
      {
        type: String,
      },
    ],

    photoStatus: {
      type: String,
      enum: ["PENDING", "AVAILABLE", "UNAVAILABLE", "QUOTA_EXCEEDED"],
      default: "PENDING",
      index: true,
    },

    matchScore: {
      type: Number,
      default: 0,
    },

    googleMapsUri: {
      type: String,
      default: "",
    },

    lastVerified: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Secondary lookup index per destination and attraction name
attractionSchema.index({ destination: 1, normalizedName: 1 });

// Pre-save hook to ensure normalizedName is always computed
attractionSchema.pre("validate", function (next) {
  if (this.name && !this.normalizedName) {
    this.normalizedName = normalizeText(this.name);
  }
  if (this.destination) {
    this.destination = this.destination.toLowerCase().trim();
  }
  if (typeof next === "function") next();
});

module.exports = mongoose.models.Attraction || mongoose.model("Attraction", attractionSchema);
