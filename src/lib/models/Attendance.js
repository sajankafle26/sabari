const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  role: { type: String, enum: ["driver", "staff", "counter_operator"], default: "driver" },
  date: { type: Date, required: true },
  clockIn: { type: Date, required: true },
  clockOut: Date,
  status: {
    type: String,
    enum: ["present", "absent", "late", "half_day", "leave"],
    default: "present",
  },
  note: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  workDuration: Number,
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ company: 1, date: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
