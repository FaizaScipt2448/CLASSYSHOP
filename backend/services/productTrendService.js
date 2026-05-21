const UserBehavior = require('../models/UserBehavior');
const Order        = require('../models/Order');
const Product      = require('../models/Product');

const WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Calculate trend score for a list of product IDs.
 * Compares last 7 days vs prior 7 days for views + sales.
 * Returns array sorted by trendScore desc.
 */
const getTrendScores = async (productIds) => {
  const now      = new Date();
  const w1Start  = new Date(now - WINDOW);
  const w2Start  = new Date(now - WINDOW * 2);

  // Views from UserBehavior
  const viewAgg = await UserBehavior.aggregate([
    {
      $match: {
        product: { $in: productIds },
        action:  'view',
        createdAt: { $gte: w2Start }
      }
    },
    {
      $group: {
        _id: '$product',
        views7:    { $sum: { $cond: [{ $gte: ['$createdAt', w1Start] }, 1, 0] } },
        viewsPrev: { $sum: { $cond: [{ $lt:  ['$createdAt', w1Start] }, 1, 0] } }
      }
    }
  ]);

  // Cart adds from UserBehavior
  const cartAgg = await UserBehavior.aggregate([
    {
      $match: {
        product: { $in: productIds },
        action:  'add_to_cart',
        createdAt: { $gte: w2Start }
      }
    },
    {
      $group: {
        _id: '$product',
        carts7:    { $sum: { $cond: [{ $gte: ['$createdAt', w1Start] }, 1, 0] } },
        cartsPrev: { $sum: { $cond: [{ $lt:  ['$createdAt', w1Start] }, 1, 0] } }
      }
    }
  ]);

  // Sales from Orders
  const salesAgg = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'processing'] },
        createdAt: { $gte: w2Start }
      }
    },
    { $unwind: '$orderItems' },
    { $match: { 'orderItems.product': { $in: productIds } } },
    {
      $group: {
        _id: '$orderItems.product',
        sales7:    { $sum: { $cond: [{ $gte: ['$createdAt', w1Start] }, '$orderItems.qty', 0] } },
        salesPrev: { $sum: { $cond: [{ $lt:  ['$createdAt', w1Start] }, '$orderItems.qty', 0] } }
      }
    }
  ]);

  // Index by productId
  const viewMap  = Object.fromEntries(viewAgg.map(v => [v._id.toString(), v]));
  const cartMap  = Object.fromEntries(cartAgg.map(v => [v._id.toString(), v]));
  const salesMap = Object.fromEntries(salesAgg.map(v => [v._id.toString(), v]));

  const results = productIds.map(id => {
    const key   = id.toString();
    const v     = viewMap[key]  || { views7: 0, viewsPrev: 1 };
    const c     = cartMap[key]  || { carts7: 0, cartsPrev: 1 };
    const s     = salesMap[key] || { sales7: 0, salesPrev: 1 };

    const viewRatio  = v.views7  / Math.max(v.viewsPrev,  1);
    const cartRatio  = c.carts7  / Math.max(c.cartsPrev,  1);
    const salesRatio = s.sales7  / Math.max(s.salesPrev,  1);

    // Weighted: sales 50%, views 30%, carts 20%
    const trendScore = salesRatio * 0.5 + viewRatio * 0.3 + cartRatio * 0.2;

    let trend;
    if      (trendScore >= 1.5) trend = 'hot';
    else if (trendScore >= 1.2) trend = 'rising';
    else if (trendScore <  0.8) trend = 'falling';
    else                         trend = 'stable';

    // High views but low conversion
    const conversionFlag = v.views7 > 20 && s.sales7 === 0;

    return {
      productId:      id,
      trendScore:     parseFloat(trendScore.toFixed(3)),
      trend,
      views7:         v.views7,
      carts7:         c.carts7,
      sales7:         s.sales7,
      conversionFlag
    };
  });

  return results.sort((a, b) => b.trendScore - a.trendScore);
};

/**
 * Refresh trendScore on all active products in the database.
 * Called by the background job.
 */
const refreshAllTrendScores = async () => {
  const products = await Product.find({ isActive: { $ne: false } }).select('_id');
  const ids = products.map(p => p._id);
  const scores = await getTrendScores(ids);

  const bulkOps = scores.map(s => ({
    updateOne: {
      filter: { _id: s.productId },
      update: { $set: { trendScore: s.trendScore } }
    }
  }));

  if (bulkOps.length > 0) await Product.bulkWrite(bulkOps);
  return scores.length;
};

module.exports = { getTrendScores, refreshAllTrendScores };
