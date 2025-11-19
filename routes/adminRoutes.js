
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

const Payment = require("../models/paymentModel");
const User = require("../models/User");
const Item = require("../models/itemModel");
const Order = require("../models/Order");


router.post("/login", adminController.adminLogin);

router.use(authMiddleware.verifyAdmin);

router.get("/users", adminController.getAllUsers);
router.delete("/users/:id", adminController.deleteUser);

router.get("/items", adminController.getAllItems);
router.post("/items", adminController.createItem);
router.put("/items/:id", adminController.updateItem);
router.delete("/items/:id", adminController.deleteItem);

router.get("/orders", adminController.getAllOrders);
router.put("/orders/:id", adminController.updateOrderStatus);
router.delete("/orders/:id", adminController.deleteOrder);

router.get("/payments", adminController.getAllPayments);
router.put("/payments/:id", adminController.updatePaymentStatus);

router.post("/save-order", adminController.saveOrderAfterPayment);


router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find().populate("userId");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
