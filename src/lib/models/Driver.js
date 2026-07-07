const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: String,
  licenseNumber: { type: String, required: true },
  licenseExpiry: Date,
  photo: String,
  documents: {
    licenseImage: String,
    citizenship: String,
  },
  status: {
    type: String,
    enum: ["available", "on_trip", "on_break", "offline"],
    default: "offline",
  },
  currentLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

driverSchema.index({ "currentLocation": "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
