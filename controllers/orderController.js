
const Order = require('../models/Order');
const Payment = require('../models/paymentModel');
const User = require('../models/User');
const Item = require("../models/itemModel");
const defaultFoodItems = require("../data/foodItems"); 



exports.submitOrder = async (req, res) => {
  try {
    const { userId, items, province, name, email, totalPrice, paymentMethod } = req.body;

    const order = await Order.create({
      userId, items, province, name, email, totalPrice, status: "pending", paymentStatus: "pending"
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { $push: { orders: order._id } });
    }

    if (paymentMethod) {
      await Payment.create({ userId, orderId: order._id, amount: totalPrice, status: "pending", paymentMethod });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('userId', 'name email phone address');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const payment = await Payment.findOne({ orderId: order._id });
    res.json({ success: true, order, payment });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const { status, paymentStatus, province, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (province) filter.province = province;
    if (q) filter.$or = [
      { name: new RegExp(q, "i") },
      { email: new RegExp(q, "i") },
    ];

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).populate('userId', 'name email phone');
    res.json({ success: true, orders });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    res.json({ success: true, order });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    await Order.findByIdAndDelete(orderId);
    await User.updateMany({}, { $pull: { orders: { _id: orderId } }});
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ "user._id": userId });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.query.userId;
    const province = req.query.province;
    if (!userId || !province) return res.status(400).json({ success: false, message: "User ID and province are required" });

    const userOrdersInProvince = await Order.find({ userId, province });
    if (!userOrdersInProvince.length) return res.json({ success: true, recommendations: [] });

    const orderedItemNames = userOrdersInProvince.flatMap(order => order.items.map(item => item.name));
    const recommendedItems = defaultFoodItems.filter(item => orderedItemNames.includes(item.name));
    const shuffled = recommendedItems.sort(() => 0.5 - Math.random()).slice(0, 8);

    res.json({ success: true, recommendations: shuffled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
};





// exports.getRecommendations = async (req, res) => {
//   try {
//     const userId = req.query.userId;
//     const province = req.query.province;

//     if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

//     const userOrders = await Order.find({ userId });
//     const userPastItems = userOrders.flatMap(order => order.items.map(item => item.name));

//     const provinceOrders = await Order.find({ province });
//     const provincePastItems = provinceOrders.flatMap(order => order.items.map(item => item.name));

//     const recommendedItems = defaultFoodItems.filter(item =>
//       userPastItems.includes(item.name) || provincePastItems.includes(item.name)
//     );

//     const shuffled = recommendedItems.sort(() => 0.5 - Math.random()).slice(0, 8);

//     res.json({ success: true, recommendations: shuffled });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
//   }
// };
