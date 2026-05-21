const cron              = require('node-cron');
const salesSvc          = require('../services/salesAnalyticsService');
const returnSvc         = require('../services/returnAnalyticsService');
const AnalyticsSnapshot = require('../models/AnalyticsSnapshot');

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const today     = new Date();
    const yesterday = new Date(today - 86400000);
    const from      = yesterday.toISOString();
    const to        = today.toISOString();

    const [salesSummary, categories, topProducts, returnRate] = await Promise.all([
      salesSvc.getDashboardSummary(),
      salesSvc.getCategoryBreakdown(from, to),
      salesSvc.getTopProducts(from, to, 10),
      returnSvc.getReturnRate(from, to)
    ]);

    const snapshotDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    await AnalyticsSnapshot.findOneAndUpdate(
      { date: snapshotDate, type: 'daily' },
      {
        date: snapshotDate,
        type: 'daily',
        data: {
          totalRevenue:      salesSummary.totalRevenue,
          totalOrders:       salesSummary.totalOrders,
          avgOrderValue:     salesSummary.avgOrderValue,
          returnRate:        returnRate.returnRate,
          totalReturns:      returnRate.returnCount,
          topProducts,
          categoryBreakdown: categories
        }
      },
      { upsert: true }
    );

    console.log('[JOB] Daily analytics snapshot saved for', yesterday.toDateString());
  } catch (err) {
    console.error('[JOB] dailySnapshot error:', err.message);
  }
});
