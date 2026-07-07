const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true },
  code: { type: String, unique: true },
  address: {
    district: String,
    municipality: String,
    ward: String,
    street: String,
  },
  phone: String,
  email: String,
  operators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

counterSchema.pre("save", function () {
  if (!this.code) {
    this.code = `CTR-${Date.now().toString(36).toUpperCase()}`;
  }
});

module.exports = mongoose.model("Counter", counterSchema);
