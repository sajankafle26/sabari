const mongoose = require("mongoose");

const ticketCommissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["percentage", "fixed"], required: true },
  value: { type: Number, required: true },
  appliesTo: { type: String, enum: ["all", "company", "route", "vehicle_type"], default: "all" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  vehicleType: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("TicketCommission", ticketCommissionSchema);
