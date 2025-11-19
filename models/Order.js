
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  qty: Number,
  img: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  transactionUUID: { type: String, default: uuidv4, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  email: String,
  items: [orderItemSchema],
  province: String,
  totalPrice: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "processing", "shipped", "completed", "cancelled"], default: "pending" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);