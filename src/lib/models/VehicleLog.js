const mongoose = require("mongoose");

const vehicleLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  type: {
    type: String,
    enum: ["fuel", "service", "mileage", "repair", "accident", "inspection", "other"],
    required: true,
  },
  amount: Number,
  quantity: Number,
  mileage: Number,
  description: String,
  notes: String,
  odometerReading: Number,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedAt: { type: Date, default: Date.now },
  nextDue: Date,
  vendor: String,
  receiptImage: String,
}, { timestamps: true });

vehicleLogSchema.index({ vehicle: 1, performedAt: -1 });
vehicleLogSchema.index({ company: 1, type: 1 });

module.exports = mongoose.model("VehicleLog", vehicleLogSchema);
