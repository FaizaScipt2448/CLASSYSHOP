const cron    = require('node-cron');
const stockSvc = require('../services/stockSuggestionService');

// Runs every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  try {
    const count = await stockSvc.calculateSuggestions();
    console.log(`[JOB] Stock suggestions recalculated for ${count} products`);
  } catch (err) {
    console.error('[JOB] stockSuggestion error:', err.message);
  }
});
