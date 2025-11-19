
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    inStock: { type: Boolean, required: true, default: true },
    category: { type: String },
    description: { type: String },
    image: { type: String },
    province: { type: String }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);