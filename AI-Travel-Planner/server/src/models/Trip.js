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

    start_date: {
      type: String,
    },

    end_date: {
      type: String,
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
      enum: ["Planning", "Upcoming", "Completed", "planning", "active", "completed"],
      default: "Planning",
    },

    selectedPlaces: [
      {
        id: String,
        name: String,
        category: String,
        description: String,
        bestTime: String,
        estimatedVisitHours: Number,
      },
    ],

    cover_image: {
      type: String,
    },

    interests: {
      type: [String],
      default: [],
    },

    currency: {
      type: String,
      default: "USD",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tripSchema.pre("validate", function () {
  if (this.start_date && !this.startDate) {
    this.startDate = new Date(this.start_date);
  } else if (this.startDate && !this.start_date) {
    const d = new Date(this.startDate);
    if (!isNaN(d.getTime())) {
      this.start_date = d.toISOString().slice(0, 10);
    }
  }

  if (this.end_date && !this.endDate) {
    this.endDate = new Date(this.end_date);
  } else if (this.endDate && !this.end_date) {
    const d = new Date(this.endDate);
    if (!isNaN(d.getTime())) {
      this.end_date = d.toISOString().slice(0, 10);
    }
  }

  // Normalize status for UI comparison if needed
  if (this.status) {
    const s = this.status.toLowerCase();
    if (s === "active" || s === "upcoming") {
      this.status = "active";
    } else if (s === "completed") {
      this.status = "completed";
    } else {
      this.status = "planning";
    }
  }
});

module.exports = mongoose.model("Trip", tripSchema);