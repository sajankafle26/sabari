const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  type: {
    type: String,
    enum: ["fuel", "maintenance", "salary", "toll", "parking", "food", "other"],
    required: true,
  },
  amount: { type: Number, required: true },
  description: String,
  receipt: String,
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

expenseSchema.index({ company: 1, date: -1 });
expenseSchema.index({ vehicle: 1, date: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
