const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  vehicleNumber: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["bus", "deluxe-bus", "ac-bus", "tourist-bus", "night-bus", "sumo", "hiace", "jeep", "ev-bus", "electric-van", "micro-bus"],
    required: true,
  },
  brand: String,
  model: String,
  year: Number,
  capacity: { type: Number, required: true },
  seatLayout: {
    type: String,
    enum: ["2x2", "2x1", "luxury", "sleeper", "hiace", "sumo", "custom"],
    default: "2x2",
  },
  amenities: [String],
  features: {
    wifi: Boolean,
    ac: Boolean,
    charging: Boolean,
    blanket: Boolean,
    snacks: Boolean,
    toilet: Boolean,
    entertainment: Boolean,
  },
  images: [String],
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
  },
  taxExpiry: Date,
  permitExpiry: Date,
  lastService: Date,
  status: {
    type: String,
    enum: ["active", "maintenance", "inactive"],
    default: "active",
  },
  isActive: { type: Boolean, default: true },

  // Health tracking fields
  fuelLevel: { type: Number, min: 0, max: 100, default: 100 },
  currentMileage: { type: Number, default: 0 },
  nextServiceMileage: { type: Number, default: 0 },
  nextServiceDate: Date,
  lastServicedAt: Date,
  fuelType: { type: String, enum: ["diesel", "petrol", "electric", "cng", "lpg"], default: "diesel" },
  mileagePerLiter: { type: Number, default: 0 },
}, { timestamps: true });

vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ company: 1, type: 1 });
vehicleSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
