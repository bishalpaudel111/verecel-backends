const adminRoutes = require("./routes/adminRoutes");
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const connectToMongo = require("./config/db");
const { getEsewaPaymentHash, verifyEsewaPayment } = require("./controllers/esewa");

const contactRoute = require("./routes/contactRoute");

const Payment = require("./models/paymentModel");
const Item = require("./models/itemModel");
const PurchasedItem = require("./models/purchasedItemModel");

dotenv.config();
connectToMongo();

const app = express();
app.use(bodyParser.json()); // Parses application/json
// app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use("/api/contact", contactRoute);

// app.use(bodyParser.json());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
  },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/api/admin", adminRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/esewa", (req, res) => {
  res.sendFile(__dirname + "/test.html");
});

app.post("/initialize-esewa", async (req, res) => {
  try {
    const { items, totalPrice, userId } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    const purchasedItemData = await PurchasedItem.create({
      items,
      totalPrice,
      userId,
      paymentMethod: "esewa",
      status: "pending",
    });

    const paymentInitate = await getEsewaPaymentHash({
      amount: totalPrice,
      transaction_uuid: purchasedItemData._id.toString(),
    });

    res.json({
      success: true,
      payment: paymentInitate,
      purchasedItemData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || error });
  }
});
app.get("/complete-payment", async (req, res) => {
  const { data } = req.query;
  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const purchasedItemData = await PurchasedItem.findById(paymentInfo.response.transaction_uuid);

    if (!purchasedItemData) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    const paymentData = await Payment.create({
      transactionId: paymentInfo.decodedData.transaction_code,
      orderId: paymentInfo.response.transaction_uuid,
      productId: paymentInfo.response.transaction_uuid,
      userId: purchasedItemData.userId,
      amount: purchasedItemData.totalPrice,
      items: purchasedItemData.items,
      dataFromVerificationReq: paymentInfo,
      paymentGateway: "esewa",
      status: "success",
      paymentMethod: "eSewa",
    });

    await PurchasedItem.findByIdAndUpdate(paymentInfo.response.transaction_uuid, { status: "completed" });

    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?transaction_uuid=${paymentInfo.response.transaction_uuid}`);
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred", error });
  }
});


app.listen(3001, () => {
  console.log("✅ Backend listening at http://localhost:3001");
});
