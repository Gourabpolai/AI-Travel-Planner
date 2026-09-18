const mongoose = require("mongoose");

/**
 * Destination Schema
 * 
 * Stores curated destination data with real photograph references and attribution metadata.
 * Image files are stored in TripSync static storage (/destination-images/); MongoDB stores
 * only URLs, dimensions, author, license, and landmark references.
 */
const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    category: {
      type: String,
      default: "Travel Destination",
    },
    primaryLandmarks: {
      type: [String],
      default: [],
    },
    searchQueries: {
      type: [String],
      default: [],
    },
    image: {
      url: {
        type: String,
        default: null,
      },
      thumbnailUrl: {
        type: String,
        default: null,
      },
      source: {
        type: String,
        default: "Wikimedia Commons",
      },
      sourceUrl: {
        type: String,
        default: null,
      },
      fileTitle: {
        type: String,
        default: null,
      },
      author: {
        type: String,
        default: "Unknown",
      },
      license: {
        type: String,
        default: "Public Domain / CC",
      },
      licenseUrl: {
        type: String,
        default: null,
      },
      attribution: {
        type: String,
        default: "",
      },
      imageWidth: {
        type: Number,
        default: null,
      },
      imageHeight: {
        type: Number,
        default: null,
      },
      confidenceScore: {
        type: Number,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ["verified", "needs_manual_review", "no_image"],
      default: "verified",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Destination ||
  mongoose.model("Destination", destinationSchema);
