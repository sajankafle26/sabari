const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  duration: { type: Number, required: true, comment: "Duration in days" },
  features: [{
    name: String,
    included: Boolean,
    limit: Number,
  }],
  maxVehicles: { type: Number, default: 5 },
  maxDrivers: { type: Number, default: 10 },
  maxCounters: { type: Number, default: 3 },
  maxRoutes: { type: Number, default: 10 },
  commissionRate: { type: Number, default: 5 },
  hasLiveTracking: { type: Boolean, default: true },
  hasReporting: { type: Boolean, default: true },
  hasAPIAccess: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
