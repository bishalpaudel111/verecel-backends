const express = require("express");
const router = express.Router();
const PurchasedItem = require("../models/purchasedItemModel");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await PurchasedItem.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    const user = await User.findById(order.userId).select("name email address province");

    res.json({
      items: order.items,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      province: user?.province || "Unknown",
      user,
    });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch order", error: error.message });
  }
});

module.exports = router;
