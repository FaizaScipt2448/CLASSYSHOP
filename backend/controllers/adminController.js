const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalOrders, totalProducts, totalCategories] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments()
  ]);
  res.json({ totalUsers, totalOrders, totalProducts, totalCategories });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.isAdmin) { res.status(400); throw new Error('Cannot delete admin user'); }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { computeEstimatedDelivery } = require('./orderController');
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const newStatus = req.body.status;
  const noteMap = {
    processing:       'Order packed and ready for dispatch',
    shipped:          'Order handed to courier',
    out_for_delivery: 'Out for delivery — arriving today',
    delivered:        'Order successfully delivered',
    cancelled:        'Order cancelled'
  };

  order.status = newStatus;
  order.estimatedDelivery = computeEstimatedDelivery(order.createdAt, newStatus);
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status:    newStatus,
    timestamp: new Date(),
    note:      noteMap[newStatus] || `Status updated to ${newStatus}`
  });
  if (newStatus === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  const updated = await order.save();
  res.json(updated);
});

const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Product.deleteMany({ _id: { $in: ids } });
  res.json({ message: `${ids.length} products deleted` });
});

module.exports = { getStats, getAllUsers, deleteUser, updateOrderStatus, bulkDeleteProducts };
