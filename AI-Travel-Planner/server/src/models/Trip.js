const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    budget: {
      type: Number,
      default: 0,
    },

    travelers: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["Planning", "Upcoming", "Completed"],
      default: "Planning",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", tripSchema);