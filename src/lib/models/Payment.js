const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  transactionId: { type: String, unique: true },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["esewa", "khalti", "fonepay", "imepay", "connectips", "cash", "bank", "wallet"],
    required: true,
  },
  status: {
    type: String,
    enum: ["initiated", "success", "failed", "refunded"],
    default: "initiated",
  },
  gatewayRef: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  refund: {
    amount: Number,
    reason: String,
    processedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt: Date,
}, { timestamps: true });

paymentSchema.index({ booking: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paidBy: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
