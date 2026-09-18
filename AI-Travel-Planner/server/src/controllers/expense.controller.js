const Expense = require("../models/expense.model");
const Trip = require("../models/Trip");

const getExpenses = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Check ownership of the trip
    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const expenses = await Expense.find({ trip_id: tripId }).sort({ date: -1 });
    const mapped = expenses.map(e => ({
      ...e.toObject(),
      id: e._id.toString(),
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { description, amount, category, date } = req.body;

    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const expense = await Expense.create({
      trip_id: tripId,
      description,
      amount,
      category,
      date,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...expense.toObject(),
        id: expense._id.toString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // Check trip ownership
    const trip = await Trip.findOne({ _id: expense.trip_id, user: req.user._id });
    if (!trip) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await expense.deleteOne();

    return res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense,
};
