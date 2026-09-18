const mongoose = require("mongoose");

/**
 * PlaceSearchCache Schema
 * 
 * Stores lightweight Google Places / Photon destination search results.
 * Respects Google Places API caching guidelines by storing only necessary identifiers
 * (placeId, name, formattedAddress, coordinates) with an automated TTL expiry index.
 */
const placeSearchCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    results: [
      {
        id: String,
        placeId: String,
        name: String,
        formattedAddress: String,
        latitude: Number,
        longitude: Number,
      },
    ],
    source: {
      type: String,
      enum: ["google", "photon", "custom"],
      default: "google",
    },
    cachedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index automatically removes expired entries
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PlaceSearchCache ||
  mongoose.model("PlaceSearchCache", placeSearchCacheSchema);
