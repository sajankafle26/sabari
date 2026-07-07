const mongoose = require("mongoose");

const gpsLogSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: Number,
  heading: Number,
  speed: { type: Number, default: 0 },
  accuracy: Number,
  battery: Number,
  internet: { type: String, enum: ["wifi", "4g", "5g", "none"] },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

gpsLogSchema.index({ location: "2dsphere" });
gpsLogSchema.index({ vehicle: 1, timestamp: -1 });
gpsLogSchema.index({ trip: 1, timestamp: 1 });

module.exports = mongoose.model("GPSLog", gpsLogSchema);
