
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },

    productId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchasedItem" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    items: [
      {
        itemId: String,
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    dataFromVerificationReq: { type: Object },
    paymentGateway: { type: String, enum: ["khalti", "esewa", "connectIps"], required: true },
    status: { type: String, enum: ["success", "pending", "failed"], default: "pending" },
    paymentMethod: { type: String, default: "eSewa" },
    paymentDate: { type: Date, default: Date.now },
    province: String,

  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
