const Product         = require('../models/Product');
const Order           = require('../models/Order');
const Return          = require('../models/Return');
const Season          = require('../models/Season');
const StockSuggestion = require('../models/StockSuggestion');

const WINDOW_DAYS    = 30;
const LEAD_TIME_DAYS = 7;  // default supplier lead time

/**
 * Run the full stock suggestion engine for all products.
 * Called nightly by the background job.
 */
const calculateSuggestions = async () => {
  const now         = new Date();
  const windowStart = new Date(now - WINDOW_DAYS * 86400000);
  const month       = now.getMonth() + 1;

  // Check if we are within 30 days before any season start
  const upcomingSeason = await Season.findOne({
    isActive: true,
    $expr: {
      $and: [
        { $lte: ['$startMonth', { $add: [month, 1] }] },
        { $gte: ['$startMonth', month] }
      ]
    }
  });
  const seasonalMultiplier = upcomingSeason?.demandMultiplier ?? 1.0;

  // Sales per product in last 30d
  const salesAgg = await Order.aggregate([
    {
      $match: {
        status: { $in: ['delivered', 'shipped', 'processing'] },
        createdAt: { $gte: windowStart }
      }
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id:   '$orderItems.product',
        units: { $sum: '$orderItems.qty' }
      }
    }
  ]);

  // Returns per product in last 30d
  const returnAgg = await Return.aggregate([
    { $match: { status: { $in: ['approved', 'refunded'] }, createdAt: { $gte: windowStart } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', units: { $sum: '$items.qty' } } }
  ]);

  const salesMap  = Object.fromEntries(salesAgg.map(s => [s._id.toString(), s.units]));
  const returnMap = Object.fromEntries(returnAgg.map(r => [r._id.toString(), r.units]));

  const products = await Product.find({}).select('_id countInStock trendScore sales');

  const suggestions = products.map(product => {
    const id             = product._id.toString();
    const soldUnits      = salesMap[id]   ?? 0;
    const returnedUnits  = returnMap[id]  ?? 0;
    const currentStock   = product.countInStock ?? 0;
    const trendScore     = product.trendScore   ?? 1.0;

    const avgDailySales  = soldUnits / WINDOW_DAYS;
    const daysRemaining  = avgDailySales > 0 ? currentStock / avgDailySales : 9999;
    const safetyStock    = avgDailySales * LEAD_TIME_DAYS * 0.5;
    const reorderPoint   = avgDailySales * LEAD_TIME_DAYS + safetyStock;
    const returnRisk     = soldUnits > 0 ? returnedUnits / soldUnits : 0;

    const baseQty        = avgDailySales * WINDOW_DAYS * seasonalMultiplier;
    const suggestedQty   = Math.max(Math.ceil(baseQty - currentStock), 0);

    // Recommendation logic
    let recommendation = 'watch';
    let urgency        = 'low';

    if (currentStock === 0) {
      recommendation = 'reorder'; urgency = 'critical';
    } else if (daysRemaining < 7) {
      recommendation = 'reorder'; urgency = 'critical';
    } else if (daysRemaining <= reorderPoint) {
      recommendation = 'reorder'; urgency = trendScore >= 1.2 ? 'high' : 'medium';
    } else if (returnRisk > 0.2) {
      recommendation = avgDailySales < 0.05 ? 'discontinue' : 'watch';
      urgency = 'medium';
    } else if (avgDailySales === 0 && currentStock > 0) {
      recommendation = 'promote'; urgency = 'medium';
    } else if (currentStock > avgDailySales * 120 && avgDailySales > 0) {
      recommendation = 'reduce'; urgency = 'low';
    }

    return {
      product:              product._id,
      calculatedAt:         now,
      avgDailySales:        parseFloat(avgDailySales.toFixed(4)),
      totalSoldLast30d:     soldUnits,
      daysOfStockRemaining: parseFloat(Math.min(daysRemaining, 9999).toFixed(1)),
      reorderPoint:         parseFloat(reorderPoint.toFixed(1)),
      suggestedReorderQty:  suggestedQty,
      seasonalMultiplier,
      trendScore,
      returnRiskScore:      parseFloat(returnRisk.toFixed(4)),
      currentStock,
      recommendation,
      urgency
    };
  });

  // Upsert all suggestions
  const bulkOps = suggestions.map(s => ({
    updateOne: {
      filter: { product: s.product },
      update: { $set: s },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) await StockSuggestion.bulkWrite(bulkOps);
  return suggestions.length;
};

module.exports = { calculateSuggestions };
