const cron     = require('node-cron');
const trendSvc = require('../services/productTrendService');

// Runs every 12 hours
cron.schedule('0 */12 * * *', async () => {
  try {
    const count = await trendSvc.refreshAllTrendScores();
    console.log(`[JOB] Trend scores refreshed for ${count} products`);
  } catch (err) {
    console.error('[JOB] trendRecalc error:', err.message);
  }
});
