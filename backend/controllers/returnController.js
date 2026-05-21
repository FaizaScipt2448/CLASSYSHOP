const asyncHandler       = require('express-async-handler');
const Return             = require('../models/Return');
const Order              = require('../models/Order');
const returnAnalyticsSvc = require('../services/returnAnalyticsService');
const { success, error } = require('../helpers/apiResponse');

/**
 * POST /api/returns
 * Customer creates a return request for an existing delivered order.
 */
const createReturn = asyncHandler(async (req, res) => {
  const { orderId, items, notes } = req.body;

  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not your order');
  }
  if (!['delivered'].includes(order.status)) {
    res.status(400); throw new Error('Only delivered orders can be returned');
  }

  const totalRefund = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const returnDoc = await Return.create({
    order:  orderId,
    user:   req.user._id,
    items,
    notes:  notes || '',
    totalRefund
  });

  success(res, returnDoc, {}, 201);
});

/**
 * GET /api/returns  (customer sees their own returns)
 */
const getMyReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find({ user: req.user._id })
    .populate('order', 'orderNumber totalPrice createdAt')
    .sort({ createdAt: -1 });
  success(res, returns);
});

// ─── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/returns
 */
const adminGetReturns = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Return.find(filter)
      .populate('user', 'name email')
      .populate('order', 'totalPrice createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit),
    Return.countDocuments(filter)
  ]);

  success(res, data, { page: +page, limit: +limit, total });
});

/**
 * GET /api/admin/returns/:id
 */
const adminGetReturn = asyncHandler(async (req, res) => {
  const ret = await Return.findById(req.params.id)
    .populate('user', 'name email')
    .populate('order');
  if (!ret) { res.status(404); throw new Error('Return not found'); }
  success(res, ret);
});

/**
 * PATCH /api/admin/returns/:id/status
 * Body: { status: 'approved' | 'rejected' | 'refunded' }
 */
const adminUpdateReturnStatus = asyncHandler(async (req, res) => {
  const { status: newStatus } = req.body;
  const ret = await Return.findById(req.params.id);
  if (!ret) { res.status(404); throw new Error('Return not found'); }

  ret.status = newStatus;
  if (newStatus === 'refunded' || newStatus === 'approved') {
    ret.processedAt = new Date();
  }
  await ret.save();
  success(res, ret);
});

/**
 * GET /api/admin/returns/analytics
 */
const adminGetReturnAnalytics = asyncHandler(async (req, res) => {
  const { from: fromQuery, to: toQuery, dateFrom, dateTo, groupBy = 'day' } = req.query;
  const from = fromQuery || dateFrom || new Date(Date.now() - 30 * 86400000).toISOString();
  const to   = toQuery || dateTo || new Date().toISOString();

  const [rate, trend, topProducts, reasons] = await Promise.all([
    returnAnalyticsSvc.getReturnRate(from, to),
    returnAnalyticsSvc.getReturnTrend(from, to, groupBy),
    returnAnalyticsSvc.getMostReturnedProducts(10),
    returnAnalyticsSvc.getReturnReasonBreakdown(from, to)
  ]);

  success(res, {
    rate,
    totalReturnedProducts: rate.returnedUnits,
    returnRate: rate.returnRate,
    trend,
    topProducts,
    reasons,
    highReturnRiskProducts: topProducts.filter(product => (product.units || 0) >= 2)
  });
});

module.exports = { createReturn, getMyReturns, adminGetReturns, adminGetReturn, adminUpdateReturnStatus, adminGetReturnAnalytics };
