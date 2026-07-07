const mongoose = require("mongoose");

const municipalitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  district: { type: mongoose.Schema.Types.ObjectId, ref: "District", required: true },
  type: { type: String, enum: ["metropolitan", "sub-metropolitan", "municipality", "rural-municipality"] },
  wardCount: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

municipalitySchema.index({ district: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Municipality", municipalitySchema);
