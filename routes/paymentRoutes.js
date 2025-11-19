const express = require("express");
const router = express.Router();
const { saveEsewaPayment, getPaymentByOrderId, getAllPayments } = require("../controllers/paymentController");

router.post("/save", saveEsewaPayment);

router.get("/receipt/:orderId", getPaymentByOrderId);

router.get("/", getAllPayments);

module.exports = router;
