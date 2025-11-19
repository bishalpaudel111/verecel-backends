
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  province: String,
  orders: [
    {
      date: { type: Date, default: Date.now },
      items: [{ id: String, name: String, price: Number, qty: Number }],
      province: String,
    },
  ],
  password: { type: String, required: true },
  address: { type: String },
  profileImage: { type: String, default: "" },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  isAdmin: { type: Boolean, default: false },
  otpHash: { type: String }, // bcrypt hashed OTP

  otpExpires: Date,

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
