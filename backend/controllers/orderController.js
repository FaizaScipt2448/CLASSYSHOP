const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

// Compute estimated delivery date based on current status
const computeEstimatedDelivery = (createdAt, status) => {
  const base   = new Date(createdAt);
  const dayMap = { pending: 7, processing: 6, shipped: 4, out_for_delivery: 1, delivered: 0 };
  const days   = dayMap[status] ?? 7;
  const est    = new Date(base);
  est.setDate(est.getDate() + days);
  return est;
};

const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }
  const now = new Date();
  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    statusHistory: [{ status: 'pending', timestamp: now, note: 'Order received' }],
    estimatedDelivery: computeEstimatedDelivery(now, 'pending')
  });
  const created = await order.save();
  res.status(201).json(created);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) res.json(order);
  else { res.status(404); throw new Error('Order not found'); }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid   = true;
    order.paidAt   = Date.now();
    order.status   = 'processing';
    order.estimatedDelivery = computeEstimatedDelivery(order.createdAt, 'processing');
    order.statusHistory.push({ status: 'processing', timestamp: new Date(), note: 'Payment confirmed, order being packed' });
    const updated  = await order.save();
    res.json(updated);
  } else { res.status(404); throw new Error('Order not found'); }
});

// GET /api/orders/:id/track — rich tracking response for chatbot + order page
const getOrderTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const STATUS_LABELS = {
    pending:          'Order Placed',
    processing:       'Packed & Ready',
    shipped:          'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
    cancelled:        'Cancelled'
  };

  // Build full timeline from statusHistory, falling back to createdAt for missing steps
  const historyMap = {};
  (order.statusHistory || []).forEach(h => { historyMap[h.status] = h; });

  const estimated = order.estimatedDelivery || computeEstimatedDelivery(order.createdAt, order.status);

  res.json({
    _id:               order._id,
    status:            order.status,
    statusLabel:       STATUS_LABELS[order.status] || order.status,
    isPaid:            order.isPaid,
    paidAt:            order.paidAt,
    isDelivered:       order.isDelivered,
    deliveredAt:       order.deliveredAt,
    estimatedDelivery: estimated,
    createdAt:         order.createdAt,
    totalPrice:        order.totalPrice,
    itemCount:         order.orderItems?.length || 0,
    statusHistory:     order.statusHistory || [],
    shippingAddress:   order.shippingAddress,
    paymentMethod:     order.paymentMethod
  });
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email');
  res.json(orders);
});

module.exports = { createOrder, getOrderById, getMyOrders, updateOrderToPaid, getAllOrders, getOrderTracking, computeEstimatedDelivery };
