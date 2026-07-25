const mongoose = require("mongoose");

const placeCacheSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    places: [
      {
        id: String,
        name: String,
        description: String,
        category: String,
        bestTime: String,
        estimatedVisitHours: Number,
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

module.exports = mongoose.model("PlaceCache", placeCacheSchema);