const Review = require("../models/review.model");

/**
 * Format review document into safe public payload
 */
const formatReviewResponse = (r) => {
  const userObj = r.user || {};
  const userName = userObj.name || (userObj.email ? userObj.email.split("@")[0] : "Traveler");
  const userId = userObj._id || userObj.id || userObj;

  return {
    _id: r._id,
    placeId: r.placeId,
    destination: r.destination,
    userId: userId?.toString ? userId.toString() : userId,
    userName,
    user: {
      _id: userId,
      name: userName,
      email: userObj.email || "",
      profilePicture: userObj.profilePicture || null,
    },
    rating: r.rating,
    comment: r.content,
    content: r.content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

/**
 * GET /api/places/:placeId/reviews
 * Fetch all reviews belonging to a specific Google Place ID
 */
const getPlaceReviews = async (req, res) => {
  try {
    const placeId = req.params.placeId ? req.params.placeId.trim() : "";

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "Google Place ID parameter is required",
      });
    }

    const reviews = await Review.find({ placeId })
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const sumRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
      distribution[star] = (distribution[star] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      count: totalReviews,
      data: reviews.map(formatReviewResponse),
      summary: {
        totalReviews,
        averageRating,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching place reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch place reviews",
    });
  }
};

/**
 * POST /api/places/:placeId/reviews
 * Create or update a review for a Google Place ID (authenticated user only)
 */
const createPlaceReview = async (req, res) => {
  try {
    const placeId = req.params.placeId ? req.params.placeId.trim() : "";
    const userId = req.user.id;

    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: "Google Place ID is required",
      });
    }

    const { rating, comment, content, destination } = req.body;

    // Strict validation: rating must be integer from 1 to 5
    const numericRating = Number(rating);
    if (!rating || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Strict validation: comment is required, trimmed, max 1000 chars
    const reviewComment = (comment !== undefined ? comment : content !== undefined ? content : "").trim();
    if (!reviewComment) {
      return res.status(400).json({
        success: false,
        message: "Review comment is required and cannot be empty",
      });
    }

    if (reviewComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review comment cannot exceed 1000 characters",
      });
    }

    const updateDoc = {
      rating: numericRating,
      content: reviewComment,
    };

    if (destination && typeof destination === "string" && destination.trim()) {
      updateDoc.destination = destination.trim().toLowerCase();
    }

    // Atomic upsert enforces one review per user per place
    const review = await Review.findOneAndUpdate(
      { user: userId, placeId },
      updateDoc,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate("user", "name email profilePicture");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: formatReviewResponse(review),
    });
  } catch (error) {
    console.error("Error creating place review:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review",
    });
  }
};

/**
 * DELETE /api/places/:placeId/reviews/:reviewId
 * Delete review belonging to authenticated user (strictly verifies ownership)
 */
const deletePlaceReview = async (req, res) => {
  try {
    const { reviewId, id } = req.params;
    const targetId = reviewId || id;
    const userId = req.user.id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: "Review identifier is required",
      });
    }

    const review = await Review.findById(targetId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Server-side ownership verification: only author can delete
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete another user's review",
      });
    }

    await Review.findByIdAndDelete(targetId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "reviewId"}`,
      });
    }
    console.error("Error deleting place review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

/**
 * PATCH /api/places/:placeId/reviews/:reviewId
 * Edit review belonging to authenticated user
 */
const updatePlaceReview = async (req, res) => {
  try {
    const { reviewId, id } = req.params;
    const targetId = reviewId || id;
    const userId = req.user.id;
    const { rating, comment, content } = req.body;

    const review = await Review.findById(targetId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Verify ownership
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to edit another user's review",
      });
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be an integer between 1 and 5",
        });
      }
      review.rating = numericRating;
    }

    const reviewComment = (comment !== undefined ? comment : content !== undefined ? content : null);
    if (reviewComment !== null) {
      const trimmed = reviewComment.trim();
      if (!trimmed) {
        return res.status(400).json({
          success: false,
          message: "Review comment cannot be empty",
        });
      }
      if (trimmed.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Review comment cannot exceed 1000 characters",
        });
      }
      review.content = trimmed;
    }

    await review.save();
    await review.populate("user", "name email profilePicture");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: formatReviewResponse(review),
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "reviewId"}`,
      });
    }
    console.error("Error updating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

// Existing destination review handlers preserved
const createReview = async (req, res) => {
  try {
    const { destination, rating, content, placeId } = req.body;
    const userId = req.user.id;

    if (!destination && !placeId) {
      return res.status(400).json({
        success: false,
        message: "Destination or placeId is required",
      });
    }

    if (!rating || !content) {
      return res.status(400).json({
        success: false,
        message: "Rating and content are required",
      });
    }

    const query = placeId ? { user: userId, placeId } : { user: userId, destination: destination.toLowerCase().trim() };
    const update = { rating, content };
    if (destination) update.destination = destination.toLowerCase().trim();
    if (placeId) update.placeId = placeId.trim();

    const review = await Review.findOneAndUpdate(
      query,
      update,
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "name email profilePicture");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: formatReviewResponse(review),
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
    });
  }
};

const getDestinationReviews = async (req, res) => {
  try {
    const { destination } = req.params;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Destination parameter is required",
      });
    }

    const reviews = await Review.find({ destination: destination.toLowerCase().trim() })
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews.map(formatReviewResponse),
    });
  } catch (error) {
    console.error("Error fetching destination reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ user: userId })
      .populate("user", "name email profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews.map(formatReviewResponse),
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reviews",
    });
  }
};

module.exports = {
  getPlaceReviews,
  createPlaceReview,
  deletePlaceReview,
  updatePlaceReview,
  createReview,
  getDestinationReviews,
  getUserReviews,
};

