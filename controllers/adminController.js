
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Item = require("../models/itemModel");
const Order = require("../models/Order");
const Payment = require("../models/paymentModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ msg: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: admin._id, isAdmin: true, role: admin.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: admin._id, name: admin.name, email: admin.email, token } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ msg: "User deleted" });
};

exports.getAllItems = async (req, res) => {
  const items = await Item.find();
  res.json(items);
};

exports.createItem = async (req, res) => {
  const { name, price, inStock, category } = req.body;
  const item = await Item.create({ name, price, inStock, category });
  res.json(item);
};

exports.updateItem = async (req, res) => {
  const { name, price, inStock, category } = req.body;
  const item = await Item.findByIdAndUpdate(req.params.id, { name, price, inStock, category }, { new: true });
  res.json(item);
};

exports.deleteItem = async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ msg: "Item deleted" });
};

exports.getAllOrders = async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(order);
};

exports.deleteOrder = async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ msg: "Order deleted" });
};

exports.getAllPayments = async (req, res) => {
  const payments = await Payment.find();
  res.json(payments);
};

exports.updatePaymentStatus = async (req, res) => {
  const { status } = req.body;
  const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(payment);
};

exports.saveOrderAfterPayment = async (req, res) => {
  try {
    const { user, items, totalAmount, province, transaction_uuid } = req.body;
    const orderItems = items.map(i => ({ ...i, province }));
    const order = new Order({
      userId: user._id,
      items: orderItems,
      province,
      name: user.name,
      email: user.email,
      totalPrice: totalAmount,
      status: 'pending',
      paymentStatus: 'paid'
    });
    await order.save();

    await Payment.create({
      transactionId: transaction_uuid,
      orderId: order._id,
      userId: user._id,
      amount: totalAmount,
      items: orderItems,
      province,
      paymentGateway: "esewa",
      paymentMethod: "eSewa",
      status: "success"
    });

    for (const item of orderItems) {
      await Item.findByIdAndUpdate(item.id, { $set: { inStock: false } }, { new: true });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
