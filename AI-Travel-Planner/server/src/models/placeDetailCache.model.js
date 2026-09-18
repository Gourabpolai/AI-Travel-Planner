const mongoose = require("mongoose");

/**
 * PlaceDetailCache Schema
 *
 * Persists normalized Google Places details in MongoDB Atlas with automated TTL expiration.
 * Complies with Google Places caching terms by using a bounded 24-hour TTL index.
 */
const placeDetailCacheSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
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
      index: { expires: 0 }, // MongoDB TTL index automatically purges expired records
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PlaceDetailCache ||
  mongoose.model("PlaceDetailCache", placeDetailCacheSchema);
