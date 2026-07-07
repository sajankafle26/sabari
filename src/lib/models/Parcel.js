const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "picked_up", "in_transit", "arrived", "out_for_delivery", "delivered", "cancelled"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note: String,
  location: String,
}, { _id: false });

const parcelSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  trackingId: { type: String, unique: true },
  sender: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: String,
  },
  receiver: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: String,
  },
  pickupAddress: String,
  deliveryAddress: String,
  weight: { type: Number, required: true },
  length: Number,
  width: Number,
  height: Number,
  description: { type: String, required: true },
  isFragile: Boolean,
  cod: { type: Boolean, default: false },
  codAmount: Number,
  codPaid: { type: Boolean, default: false },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  status: {
    type: String,
    enum: ["pending", "picked_up", "in_transit", "arrived", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
  },
  statusHistory: [statusHistorySchema],
  deliveryProof: String,
  amount: { type: Number, required: true },
  deliveryCharge: Number,
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "cod"],
    default: "pending",
  },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  pickupDate: Date,
  estimatedDeliveryDate: Date,
  deliveredAt: Date,
}, { timestamps: true });

parcelSchema.pre("save", function () {
  if (!this.trackingId) {
    const prefix = "PRC";
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.trackingId = `${prefix}${year}${month}${day}${rand}`;
  }
});

parcelSchema.index({ trackingId: 1 });
parcelSchema.index({ company: 1, createdAt: -1 });
parcelSchema.index({ status: 1 });

module.exports = mongoose.model("Parcel", parcelSchema);
