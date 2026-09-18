const PackingItem = require("../models/packingItem.model");
const Trip = require("../models/Trip");

const getPackingItems = async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const items = await PackingItem.find({ trip_id: tripId }).sort({ category: 1, name: 1 });
    const mapped = items.map(i => ({
      ...i.toObject(),
      id: i._id.toString(),
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addPackingItems = async (req, res) => {
  try {
    const { tripId } = req.params;
    const itemsData = req.body; // Can be a single object or an array of objects

    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    if (Array.isArray(itemsData)) {
      const rows = itemsData.map(item => ({
        trip_id: tripId,
        name: item.name,
        category: item.category || "essentials",
        checked: item.checked || false,
      }));
      const created = await PackingItem.insertMany(rows);
      const mapped = created.map(i => ({
        ...i.toObject(),
        id: i._id.toString(),
      }));
      return res.status(201).json({ success: true, data: mapped });
    } else {
      const { name, category } = itemsData;
      const created = await PackingItem.create({
        trip_id: tripId,
        name,
        category: category || "essentials",
      });
      return res.status(201).json({
        success: true,
        data: {
          ...created.toObject(),
          id: created._id.toString(),
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePackingItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { checked, name, category } = req.body;

    const item = await PackingItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Packing item not found" });
    }

    // Check ownership of the trip
    const trip = await Trip.findOne({ _id: item.trip_id, user: req.user._id });
    if (!trip) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (checked !== undefined) item.checked = checked;
    if (name !== undefined) item.name = name;
    if (category !== undefined) item.category = category;

    await item.save();

    return res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        id: item._id.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePackingItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await PackingItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Packing item not found" });
    }

    // Check trip ownership
    const trip = await Trip.findOne({ _id: item.trip_id, user: req.user._id });
    if (!trip) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await item.deleteOne();

    return res.status(200).json({ success: true, message: "Packing item deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPackingItems,
  addPackingItems,
  updatePackingItem,
  deletePackingItem,
};
