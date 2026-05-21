const Order = require('../models/Order');

const DATE_FORMAT = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' };
const REVENUE_STATUSES = ['delivered', 'shipped', 'processing'];

const revenueDateExpr = {
  $ifNull: ['$deliveredAt', '$createdAt']
};

/**
 * Revenue + orders grouped by day/week/month within a date range.
 */
const getSalesTrend = async (dateFrom, dateTo, groupBy = 'day') => {
  const fmt = DATE_FORMAT[groupBy] || DATE_FORMAT.day;
  return Order.aggregate([
    {
      $match: {
        status: { $in: REVENUE_STATUSES },
        $expr: {
          $and: [
            { $gte: [revenueDateExpr, new Date(dateFrom)] },
            { $lte: [revenueDateExpr, new Date(dateTo)] }
          ]
        }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: revenueDateExpr } },
        revenue: { $sum: '$totalPrice' },
        orders:  { $sum: 1 }
      }
    },
    { $project: { _id: 0, period: '$_id', revenue: 1, orders: 1 } },
    { $sort: { period: 1 } }
  ]);
};

/**
 * Revenue breakdown per category from embedded orderItems.
 */
const getCategoryBreakdown = async (dateFrom, dateTo) =>
  Order.aggregate([
    {
      $match: {
        status: { $in: REVENUE_STATUSES },
        $expr: {
          $and: [
            { $gte: [revenueDateExpr, new Date(dateFrom)] },
            { $lte: [revenueDateExpr, new Date(dateTo)] }
          ]
        }
      }
    },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productDoc'
      }
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$productDoc.category', 'Unknown'] },
        revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        units:   { $sum: '$orderItems.qty' }
      }
    },
    { $project: { _id: 0, category: '$_id', revenue: 1, units: 1 } },
    { $sort: { revenue: -1 } }
  ]);

/**
 * Top-selling products by revenue within a date range.
 */
const getTopProducts = async (dateFrom, dateTo, limit = 10) =>
  Order.aggregate([
    {
      $match: {
        status: { $in: REVENUE_STATUSES },
        $expr: {
          $and: [
            { $gte: [revenueDateExpr, new Date(dateFrom)] },
            { $lte: [revenueDateExpr, new Date(dateTo)] }
          ]
        }
      }
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id:     '$orderItems.product',
        name:    { $first: '$orderItems.name' },
        revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        units:   { $sum: '$orderItems.qty' }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    { $project: { _id: 0, productId: '$_id', name: 1, revenue: 1, units: 1 } }
  ]);

/**
 * High-level summary: total revenue, orders, avg order value, and growth vs previous period.
 */
const getDashboardSummary = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [current, previous] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, $expr: { $gte: [revenueDateExpr, monthStart] } } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }
    ]),
    Order.aggregate([
      {
        $match: {
          status: { $in: REVENUE_STATUSES },
          $expr: {
            $and: [
              { $gte: [revenueDateExpr, lastMonthStart] },
              { $lt: [revenueDateExpr, monthStart] }
            ]
          }
        }
      },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } }
    ])
  ]);

  const cur = current[0] || { revenue: 0, orders: 0 };
  const prev = previous[0] || { revenue: 0, orders: 0 };

  const revenueGrowth = prev.revenue > 0
    ? (((cur.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)
    : 0;

  return {
    totalRevenue:   cur.revenue,
    totalOrders:    cur.orders,
    avgOrderValue:  cur.orders > 0 ? (cur.revenue / cur.orders).toFixed(0) : 0,
    revenueGrowth:  parseFloat(revenueGrowth),
    prevMonthRevenue: prev.revenue
  };
};

module.exports = { getSalesTrend, getCategoryBreakdown, getTopProducts, getDashboardSummary };
