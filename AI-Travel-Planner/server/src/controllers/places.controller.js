const placesService = require("../services/places.service");

const searchPlaces = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const places = await placesService.searchPlaces(q);

    return res.status(200).json({
      success: true,
      data: places,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch places",
    });
  }
};

module.exports = {
  searchPlaces,
};