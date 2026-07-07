const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  fromDistrict: String,
  toDistrict: String,
  distance: { type: Number, required: true },
  estimatedDuration: { type: Number, required: true },
  stops: [{
    name: String,
    district: String,
    municipality: String,
    order: Number,
    distanceFromStart: Number,
    estimatedArrival: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  }],
  isActive: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
}, { timestamps: true });

routeSchema.virtual("fromTo").get(function () {
  return `${this.from} → ${this.to}`;
});

routeSchema.index({ from: 1, to: 1 });
routeSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model("Route", routeSchema);
