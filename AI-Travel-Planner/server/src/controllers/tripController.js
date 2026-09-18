const Trip = require("../models/Trip");
const ItineraryItem = require("../models/itineraryItem.model");
const Expense = require("../models/expense.model");
const PackingItem = require("../models/packingItem.model");
const photoService = require("../services/photo.service");

exports.createTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      startDate,
      endDate,
      start_date,
      end_date,
      budget,
      travelers,
      status,
      cover_image,
      interests,
      currency,
    } = req.body;

    // Validate required fields
    if (!title || !destination || (!startDate && !start_date) || (!endDate && !end_date)) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const trip = await Trip.create({
      user: req.user._id,
      title,
      destination,
      startDate,
      endDate,
      start_date,
      end_date,
      budget,
      travelers,
      status,
      cover_image,
      interests,
      currency,
    });

    // Asynchronously update cover image with real photo
    photoService.getPhoto(destination).then(async (realImage) => {
      if (realImage && realImage !== cover_image) {
        trip.cover_image = realImage;
        await trip.save();
      }
    }).catch(err => console.error("Error fetching trip cover image:", err));

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip: {
        ...trip.toObject(),
        id: trip._id.toString(),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    const tripsWithCounts = await Promise.all(
      trips.map(async (trip) => {
        const itineraryCount = await ItineraryItem.countDocuments({ trip_id: trip._id });
        const expenses = await Expense.find({ trip_id: trip._id });
        const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return {
          ...trip.toObject(),
          itinerary_count: itineraryCount,
          expense_total: expenseTotal,
          id: trip._id.toString(),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: tripsWithCounts.length,
      trips: tripsWithCounts,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this trip",
      });
    }

    res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "id"}`,
      });
    }
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    // Whitelist allowed update fields to prevent mass assignment
    const allowedFields = [
      "title",
      "destination",
      "startDate",
      "endDate",
      "start_date",
      "end_date",
      "budget",
      "travelers",
      "status",
      "cover_image",
      "interests",
      "currency",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        trip[field] = req.body[field];
      }
    });

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      trip,
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "id"}`,
      });
    }
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.saveSelectedPlaces = async (req, res) => {
  try {
    const { places } = req.body;

    if (!Array.isArray(places)) {
      return res.status(400).json({
        success: false,
        message: "Places must be an array",
      });
    }

    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    trip.selectedPlaces = places;

    await trip.save();

    res.status(200).json({
      success: true,
      message: "Places saved successfully",
      trip,
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "id"}`,
      });
    }
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this trip",
      });
    }

    // Cascade delete associated itinerary items, expenses, and packing items
    await ItineraryItem.deleteMany({ trip_id: trip._id });
    await Expense.deleteMany({ trip_id: trip._id });
    await PackingItem.deleteMany({ trip_id: trip._id });

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${error.path || "id"}`,
      });
    }
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};