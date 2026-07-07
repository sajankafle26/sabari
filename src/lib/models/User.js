const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ["super_admin", "company_admin", "counter_operator", "driver", "passenger"],
    default: "passenger",
  },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  profileImage: String,
  deviceTokens: [String],
  loginHistory: [{
    ip: String,
    device: String,
    timestamp: { type: Date, default: Date.now },
  }],
  lastLogin: Date,
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  return obj;
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ "phone": 1 });

module.exports = mongoose.model("User", userSchema);
