const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    placeId: {
      type: String,
      trim: true,
      index: true,
    },
    destination: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual comment alias for content compatibility
reviewSchema.virtual("comment").get(function () {
  return this.content;
});
reviewSchema.virtual("comment").set(function (val) {
  this.content = val;
});

// Enforce one review per user per Google Place ID
reviewSchema.index(
  { user: 1, placeId: 1 },
  { unique: true, partialFilterExpression: { placeId: { $type: "string" } } }
);

// Enforce one review per user per Destination (preserves existing destination reviews)
reviewSchema.index(
  { user: 1, destination: 1 },
  { unique: true, partialFilterExpression: { destination: { $type: "string" } } }
);

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
