const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  registrationNumber: { type: String, required: true },
  address: {
    district: String,
    municipality: String,
    ward: String,
    street: String,
  },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  website: String,
  logo: String,
  status: {
    type: String,
    enum: ["active", "suspended", "pending"],
    default: "pending",
  },
  subscription: {
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  },
  documents: {
    registrationDoc: String,
    taxDoc: String,
    permitDoc: String,
  },
  settings: {
    commissionRate: { type: Number, default: 5 },
    allowOnlineBooking: { type: Boolean, default: true },
    allowCounterBooking: { type: Boolean, default: true },
    refundPolicy: { type: String, default: "standard" },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

companySchema.index({ email: 1 });
companySchema.index({ status: 1 });

module.exports = mongoose.model("Company", companySchema);
