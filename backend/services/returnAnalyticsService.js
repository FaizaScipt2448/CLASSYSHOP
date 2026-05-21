const Return = require('../models/Return');
const Order  = require('../models/Order');

/**
 * Return rate = returned units / total sold units over a period.
 */
const getReturnRate = async (dateFrom, dateTo) => {
  const [returnData, orderData] = await Promise.all([
    Return.aggregate([
      { $match: { createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) }, status: { $in: ['approved', 'refunded'] } } },
      { $unwind: '$items' },
      { $group: { _id: null, units: { $sum: '$items.qty' }, count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] }, createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } },
      { $unwind: '$orderItems' },
      { $group: { _id: null, units: { $sum: '$orderItems.qty' } } }
    ])
  ]);

  const returnedUnits = returnData[0]?.units ?? 0;
  const returnCount   = returnData[0]?.count  ?? 0;
  const soldUnits     = orderData[0]?.units   ?? 0;
  const returnRate    = soldUnits > 0 ? ((returnedUnits / soldUnits) * 100).toFixed(2) : 0;

  return { returnedUnits, returnCount, soldUnits, returnRate: parseFloat(returnRate) };
};

/**
 * Return trend grouped by day/week/month.
 */
const getReturnTrend = async (dateFrom, dateTo, groupBy = 'day') => {
  const fmt = { day: '%Y-%m-%d', week: '%G-W%V', month: '%Y-%m' }[groupBy] || '%Y-%m-%d';
  return Return.aggregate([
    { $match: { createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } },
    {
      $group: {
        _id:    { $dateToString: { format: fmt, date: '$createdAt' } },
        count:  { $sum: 1 },
        refund: { $sum: '$totalRefund' }
      }
    },
    { $project: { _id: 0, period: '$_id', count: 1, refund: 1 } },
    { $sort: { period: 1 } }
  ]);
};

/**
 * Products with the highest number of returns.
 */
const getMostReturnedProducts = async (limit = 10) =>
  Return.aggregate([
    { $match: { status: { $in: ['approved', 'refunded'] } } },
    { $unwind: '$items' },
    {
      $group: {
        _id:   '$items.product',
        name:  { $first: '$items.name' },
        units: { $sum: '$items.qty' },
        count: { $sum: 1 }
      }
    },
    { $sort: { units: -1 } },
    { $limit: limit },
    { $project: { _id: 0, productId: '$_id', name: 1, units: 1, count: 1 } }
  ]);

/**
 * Breakdown of return reasons as percentages.
 */
const getReturnReasonBreakdown = async (dateFrom, dateTo) =>
  Return.aggregate([
    { $match: { createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.reason', count: { $sum: 1 } } },
    { $project: { _id: 0, reason: '$_id', count: 1 } },
    { $sort: { count: -1 } }
  ]);

module.exports = { getReturnRate, getReturnTrend, getMostReturnedProducts, getReturnReasonBreakdown };
