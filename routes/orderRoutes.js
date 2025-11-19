
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Payment = require("../models/paymentModel");
const { authMiddleware } = require("../middleware/authMiddleware");
const PurchasedItem = require("../models/purchasedItemModel");
const { getUserOrders } = require("../controllers/orderController");
const { getRecommendations } = require("../controllers/orderController");
router.post("/add", async (req, res) => {
  const { userId, itemId, name, price, quantity } = req.body;
  try {
    res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { userId, items, totalPrice, province, name, email, transaction_uuid } = req.body;

    if (!userId || !items || !items.length) {
      return res.status(400).json({ message: "Incomplete order data" });
    }

    const order = new Order({
      userId,
      items,
      totalPrice,
      province,
      name,
      email,
      transactionUUID: transaction_uuid,
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date(),
    });

    await order.save();

    if (userId) {
      await User.findByIdAndUpdate(userId, { $push: { orders: order._id } });
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).json({ success: false, message: "Server error saving order" });
  }
});

router.get("/transaction/:transaction_uuid", authMiddleware, async (req, res) => {
  try {
    const { transaction_uuid } = req.params;
    const order = await Order.findOne({ transactionUUID: transaction_uuid }).populate(
      "userId",
      "name email phone address"
    );
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("Fetch order error:", err);
    res.status(500).json({ success: false, message: "Server error fetching order" });
  }
});

router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { user, items, totalAmount, province, transaction_uuid, dataFromVerificationReq } = req.body;
    if (!user || !transaction_uuid) return res.status(400).json({ success: false, message: "Invalid payment data" });

    let order = await Order.findOne({ transactionUUID: transaction_uuid });

    if (!order) {
      const purchasedItem = await PurchasedItem.findById(transaction_uuid);
      if (!purchasedItem) return res.status(404).json({ success: false, message: "Purchased item not found" });

      order = await Order.create({
        userId: user._id,
        items: purchasedItem.items,
        totalPrice: purchasedItem.totalPrice,
        province: purchasedItem.province || province || "Unknown",
        name: user.name,
        email: user.email,
        transactionUUID: transaction_uuid,
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
      });

      await User.findByIdAndUpdate(user._id, { $push: { orders: order._id } });
    }

    await Payment.create({
      userId: user._id,
      orderId: order._id,
      items,
      amount: totalAmount,
      province,
      transactionData: dataFromVerificationReq,
      status: "completed",
      createdAt: new Date(),
    });

    await Order.findByIdAndUpdate(order._id, { paymentStatus: "completed" });

    res.json({ success: true, message: "Payment saved successfully" });
  } catch (err) {
    console.error("Save payment error:", err);
    res.status(500).json({ success: false, message: "Server error saving payment" });
  }
});

router.get("/recommendations", authMiddleware, getRecommendations);

router.get("/user/:userId", authMiddleware, getUserOrders);


router.get("/province/:province", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ province: req.params.province });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch province orders", error });
  }
});
module.exports = router;
