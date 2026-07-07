const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: Date, required: true },
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ["scheduled", "running", "completed", "cancelled", "emergency"],
    default: "scheduled",
  },
  startOdometer: Number,
  endOdometer: Number,
  distance: Number,
  fuelStart: Number,
  fuelEnd: Number,
  fuelConsumed: Number,
  passengerCount: { type: Number, default: 0 },
  startLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: [Number],
    name: String,
  },
  endLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: [Number],
    name: String,
  },
  currentStop: String,
  nextStop: String,
  delay: { type: Number, default: 0 },
  inspection: {
    tyres: { type: String, enum: ["good", "fair", "poor"] },
    brake: { type: String, enum: ["good", "fair", "poor"] },
    fuel: { type: String, enum: ["full", "three_quarter", "half", "quarter", "empty"] },
    engine: { type: String, enum: ["normal", "warning", "error"] },
    photo: String,
    submittedAt: Date,
  },
  emergency: {
    triggered: { type: Boolean, default: false },
    triggeredAt: Date,
    type: String,
    notes: String,
  },
  notes: String,
}, { timestamps: true });

tripSchema.index({ vehicle: 1, date: -1 });
tripSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model("Trip", tripSchema);
