const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

router.post("/save", async (req, res) => {
  try {
    const newPayment = new Payment(req.body);
    await newPayment.save();
    res.json({ success: true, message: "Payment saved successfully", payment: newPayment });
  } catch (err) {
    console.error("Payment save error:", err);
    res.status(500).json({ success: false, message: "Payment save failed" });
  }
});

router.get("/receipt/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Not found" });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving payment" });
  }
});

module.exports = router;
