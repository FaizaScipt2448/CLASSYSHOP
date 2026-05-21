const cron       = require('node-cron');
const Product    = require('../models/Product');
const StockAlert = require('../models/StockAlert');

const LOW_STOCK_THRESHOLD = 10;

// Runs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  try {
    const products = await Product.find({}).select('_id name countInStock');
    let created = 0;

    for (const product of products) {
      const stock = product.countInStock;
      let alertType = null;

      if (stock === 0)                              alertType = 'out_of_stock';
      else if (stock <= LOW_STOCK_THRESHOLD)        alertType = 'low_stock';

      if (!alertType) continue;

      // Avoid duplicate unresolved alerts
      const existing = await StockAlert.findOne({ product: product._id, type: alertType, isResolved: false });
      if (!existing) {
        await StockAlert.create({
          product:      product._id,
          type:         alertType,
          currentStock: stock,
          threshold:    LOW_STOCK_THRESHOLD
        });
        created++;
      }
    }

    // Auto-resolve alerts where stock is now above threshold
    const resolved = await StockAlert.updateMany(
      {
        isResolved: false,
        type:       { $in: ['low_stock', 'out_of_stock'] },
        product:    { $in: products.filter(p => p.countInStock > LOW_STOCK_THRESHOLD).map(p => p._id) }
      },
      { isResolved: true, resolvedAt: new Date() }
    );

    console.log(`[JOB] Stock alerts: ${created} created, ${resolved.modifiedCount} resolved`);
  } catch (err) {
    console.error('[JOB] stockAlert error:', err.message);
  }
});
