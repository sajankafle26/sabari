const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  province: { type: String, required: true },
  code: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("District", districtSchema);
