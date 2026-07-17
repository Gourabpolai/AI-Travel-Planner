const Trip = require("../models/Trip");
const Itinerary = require("../models/itinerary.model");

const { generateItinerary } = require("../services/ai.service");
const { calculateTripDuration } = require("../services/date.service");

const generateAIItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

   const trip = await Trip.findOne({
  _id: tripId,
  user: req.user._id,
});

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const duration = calculateTripDuration(
      trip.startDate,
      trip.endDate
    );

   const aiResponse = await generateItinerary({
  destination: trip.destination,
  budget: trip.budget,
  travelers: trip.travelers,
  duration,
});
         
    // 👉 We'll continue writing from here in the next step
         const itinerary = await Itinerary.findOneAndUpdate(
  {
    trip: trip._id,
  },
  {
    trip: trip._id,
    days: aiResponse.days,
    generatedBy: "ai",
    lastGeneratedAt: new Date(),
  },
  {
    new: true,
    upsert: true,
    runValidators: true,
  }
);

return res.status(200).json({
      success: true,
      message: "AI itinerary generated successfully",
      data: itinerary,
    });

  }catch (error) {
  if (
    error.message.includes("503") ||
    error.message.includes("UNAVAILABLE")
  ) {
    return res.status(503).json({
      success: false,
      message: "AI service is busy. Please try again in a few moments.",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
}
};


const getItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check if the trip belongs to the logged-in user
    const trip = await Trip.findOne({
      _id: tripId,
      user: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Find itinerary for the trip
    const itinerary = await Itinerary.findOne({
      trip: trip._id,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      _id: tripId,
      user: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const itinerary = await Itinerary.findOneAndDelete({
      trip: trip._id,
    });

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Itinerary deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateItinerary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({
      _id: tripId,
      user: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const itinerary = await Itinerary.findOneAndUpdate(
      { trip: trip._id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Itinerary not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Itinerary updated successfully",
      data: itinerary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateAIItinerary,
  getItinerary,
  deleteItinerary,
  updateItinerary,
};