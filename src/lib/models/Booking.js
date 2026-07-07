const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  passengers: [{
    name: { type: String, required: true },
    phone: String,
    email: String,
    age: Number,
    gender: { type: String, enum: ["male", "female", "other"] },
    seatNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["confirmed", "boarded", "cancelled", "no_show"],
      default: "confirmed",
    },
  }],
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  source: {
    type: String,
    enum: ["online", "counter"],
    default: "online",
  },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "refunded", "partial_refund"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["esewa", "khalti", "fonepay", "imepay", "connectips", "cash", "bank", "wallet"],
  },
  bookingStatus: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed", "refunded"],
    default: "pending",
  },
  journeyDate: { type: Date, required: true },
  cancellation: {
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: String,
    refundAmount: Number,
    refundStatus: { type: String, enum: ["pending", "processed", "none"], default: "none" },
  },
  qrCode: String,
  notes: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

bookingSchema.pre("save", function () {
  if (!this.bookingId) {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.bookingId = `SBR-${year}${month}${day}-${rand}`;
  }
});

bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ journeyDate: 1 });
bookingSchema.index({ company: 1, journeyDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
