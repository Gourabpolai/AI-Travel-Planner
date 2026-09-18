const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getExpenses, addExpense, deleteExpense } = require("../controllers/expense.controller");

router.get("/:tripId", protect, getExpenses);
router.post("/:tripId", protect, addExpense);
router.delete("/:expenseId", protect, deleteExpense);

module.exports = router;
