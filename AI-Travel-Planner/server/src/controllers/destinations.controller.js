const Destination = require("../models/destination.model");

const escapeRegex = (string) => {
  return typeof string === "string" ? string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
};

/**
 * Get all curated destinations with real photographs
 */
const getDestinations = async (req, res) => {
  try {
    const { status, limit = 100, q } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (q && typeof q === "string" && q.trim()) {
      const escapedQ = escapeRegex(q.trim());
      filter.$or = [
        { name: { $regex: escapedQ, $options: "i" } },
        { state: { $regex: escapedQ, $options: "i" } },
      ];
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 300;
    const destinations = await Destination.find(filter)
      .limit(parsedLimit)
      .lean();

    return res.status(200).json({
      success: true,
      count: destinations.length,
      data: destinations,
    });
  } catch (error) {
    console.error("Error in getDestinations controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch curated destinations",
    });
  }
};

/**
 * Get single destination details by name or slug
 */
const getDestination = async (req, res) => {
  try {
    const { nameOrSlug } = req.params;
    if (!nameOrSlug || typeof nameOrSlug !== "string") {
      return res.status(400).json({
        success: false,
        message: "Destination identifier is required",
      });
    }

    const normSlug = nameOrSlug.toLowerCase().trim().replace(/\s+/g, "-");
    const escapedName = escapeRegex(nameOrSlug.trim());

    const destination = await Destination.findOne({
      $or: [
        { slug: normSlug },
        { name: { $regex: `^${escapedName}$`, $options: "i" } },
      ],
    }).lean();

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: "Destination not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: destination,
    });
  } catch (error) {
    console.error("Error in getDestination controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch destination details",
    });
  }
};

/**
 * Get destination image by name or slug
 */
const getDestinationImage = async (req, res) => {
  try {
    const { nameOrSlug } = req.params;
    if (!nameOrSlug || typeof nameOrSlug !== "string") {
      return res.status(400).json({
        success: false,
        message: "Destination identifier is required",
      });
    }

    const normSlug = nameOrSlug.toLowerCase().trim().replace(/\s+/g, "-");
    const escapedName = escapeRegex(nameOrSlug.trim());

    const destination = await Destination.findOne({
      $or: [
        { slug: normSlug },
        { name: { $regex: `^${escapedName}$`, $options: "i" } },
      ],
    }).lean();

    if (!destination || !destination.image) {
      return res.status(404).json({
        success: false,
        message: "Destination image not found",
        defaultImage: "/placeholder-travel.svg",
      });
    }

    return res.status(200).json({
      success: true,
      data: destination.image,
    });
  } catch (error) {
    console.error("Error in getDestinationImage controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch destination image",
    });
  }
};

module.exports = {
  getDestinations,
  getDestination,
  getDestinationImage,
};
