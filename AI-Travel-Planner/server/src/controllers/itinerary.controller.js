const Trip = require("../models/Trip");
const ItineraryItem = require("../models/itineraryItem.model");
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

    const startDate = trip.startDate || trip.start_date || new Date();
    const endDate = trip.endDate || trip.end_date || new Date(Date.now() + 3 * 86400000);

    const calculatedDuration = calculateTripDuration(startDate, endDate);
    const duration = (isNaN(calculatedDuration) || calculatedDuration <= 0) ? 3 : calculatedDuration;

    const isRegenerate = req.originalUrl.includes("regenerate");

    const aiResponse = await generateItinerary({
      destination: trip.destination,
      budget: trip.budget,
      travelers: trip.travelers,
      startDate: startDate,
      endDate: endDate,
      duration: duration,
      selectedPlaces: trip.selectedPlaces,
      isRegenerate,
    });

    // Clear existing itinerary items for this trip
    await ItineraryItem.deleteMany({ trip_id: trip._id });

    // Create new flat itinerary items from days activities
    const itemsToInsert = [];
    if (aiResponse && aiResponse.days) {
      aiResponse.days.forEach((dayObj) => {
        if (dayObj.activities) {
          dayObj.activities.forEach((act) => {
            let desc = act.description || "";
            if (act.location) desc += ` @ ${act.location}`;
            if (act.estimatedCost) desc += ` (Est: ₹${act.estimatedCost})`;

            // Infer activity type
            let type = "activity";
            const titleLower = act.title.toLowerCase();
            if (titleLower.includes("lunch") || titleLower.includes("dinner") || titleLower.includes("breakfast") || titleLower.includes("restaurant") || titleLower.includes("food") || titleLower.includes("meal")) {
              type = "meal";
            } else if (titleLower.includes("flight") || titleLower.includes("train") || titleLower.includes("taxi") || titleLower.includes("drive") || titleLower.includes("bus") || titleLower.includes("metro") || titleLower.includes("car")) {
              type = "transport";
            } else if (titleLower.includes("hotel") || titleLower.includes("stay") || titleLower.includes("check in") || titleLower.includes("resort") || titleLower.includes("hostel")) {
              type = "accommodation";
            }

            itemsToInsert.push({
              trip_id: trip._id,
              day: dayObj.day,
              time: act.time || "",
              title: act.title,
              description: desc,
              type,
            });
          });
        }
      });
    }

    const items = await ItineraryItem.insertMany(itemsToInsert);
    const mappedItems = items.map((item) => ({
      ...item.toObject(),
      id: item._id.toString(),
    }));

    return res.status(200).json({
      success: true,
      message: "AI itinerary generated successfully",
      items: mappedItems,
      data: {
        days: aiResponse ? aiResponse.days : []
      }
    });
  } catch (error) {
    console.error("Error generating AI itinerary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate itinerary",
    });
  }
};

const getItinerary = async (req, res) => {
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

    const items = await ItineraryItem.find({ trip_id: trip._id }).sort({
      day: 1,
      time: 1,
    });

    const mappedItems = items.map((item) => ({
      ...item.toObject(),
      id: item._id.toString(),
    }));

    // Group items by day for frontend compatibility
    const daysMap = {};
    mappedItems.forEach(item => {
      if (!daysMap[item.day]) {
        daysMap[item.day] = {
          day: item.day,
          title: `Day ${item.day}`,
          activities: []
        };
      }
      daysMap[item.day].activities.push({
        title: item.title,
        description: item.description,
        time: item.time,
        location: item.location || trip.destination,
        estimatedCost: item.estimatedCost || 0
      });
    });

    const daysArray = Object.values(daysMap);

    return res.status(200).json({
      success: true,
      data: mappedItems,
      items: mappedItems,
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

    await ItineraryItem.deleteMany({ trip_id: trip._id });

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

const addItineraryItem = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { day, time, title, description, type } = req.body;

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

    const item = await ItineraryItem.create({
      trip_id: trip._id,
      day,
      time,
      title,
      description,
      type,
    });

    return res.status(201).json({
      success: true,
      item: {
        ...item.toObject(),
        id: item._id.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteItineraryItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await ItineraryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Itinerary item not found",
      });
    }

    const trip = await Trip.findOne({
      _id: item.trip_id,
      user: req.user._id,
    });

    if (!trip) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Itinerary item deleted",
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
  addItineraryItem,
  deleteItineraryItem,
};