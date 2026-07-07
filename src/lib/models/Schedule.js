const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  departureTime: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "custom"],
    default: "daily",
  },
  daysOfWeek: [Number],
  fare: { type: Number, required: true },
  discountedFare: Number,
  status: {
    type: String,
    enum: ["scheduled", "running", "completed", "cancelled", "delayed"],
    default: "scheduled",
  },
  date: { type: Date, required: true },
  recurring: { type: Boolean, default: false },
  notes: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

scheduleSchema.index({ route: 1, date: 1 });
scheduleSchema.index({ vehicle: 1, date: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);
