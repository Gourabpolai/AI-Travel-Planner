const Trip = require("../models/Trip");

exports.createTrip = async (req, res) => {
  try {
    const {
      title,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      status,
    } = req.body;

    // Validate required fields
    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Create trip
    const trip = await Trip.create({
      user: req.user._id,
      title,
      destination,
      startDate,
      endDate,
      budget,
      travelers,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
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
    console.log("Logged in user:", req.user);
    const trips = await Trip.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

        console.log("Trips found:", trips);


    res.status(200).json({
      success: true,
      count: trips.length,
      trips,
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

    trip = await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      trip,
    });

  } catch (error) {
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

    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};