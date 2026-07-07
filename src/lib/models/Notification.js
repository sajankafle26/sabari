const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientRole: {
    type: String,
    enum: ["passenger", "driver", "counter", "company_admin", "super_admin"],
  },
  type: {
    type: String,
    enum: [
      "bus_started", "bus_delayed", "bus_reached", "seat_confirmed",
      "payment_success", "vehicle_near", "trip_completed",
      "vehicle_started", "vehicle_delayed", "seat_sold",
      "vehicle_arrived", "vehicle_cancelled", "driver_changed",
      "emergency", "system",
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  sentVia: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
  },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
