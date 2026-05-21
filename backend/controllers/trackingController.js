const asyncHandler  = require('express-async-handler');
const UserBehavior  = require('../models/UserBehavior');
const Product       = require('../models/Product');

/**
 * POST /api/track/view
 * Body: { productId, sessionId, userId?, source? }
 * Increments viewCount on the product and logs a UserBehavior record.
 */
const trackView = asyncHandler(async (req, res) => {
  const { productId, sessionId, userId, source } = req.body;
  if (!productId || !sessionId) return res.status(400).json({ success: false, error: 'productId and sessionId required' });

  await Promise.all([
    UserBehavior.create({
      product:   productId,
      sessionId: sessionId,
      user:      userId || null,
      action:    'view',
      category:  source || 'direct'
    }),
    Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } })
  ]);

  res.json({ success: true });
});

/**
 * POST /api/track/cart
 * Body: { type ('add'|'remove'|'abandon'), productId, qty, sessionId, userId? }
 */
const trackCart = asyncHandler(async (req, res) => {
  const { type, productId, qty, sessionId, userId } = req.body;
  if (!productId || !sessionId) return res.status(400).json({ success: false, error: 'productId and sessionId required' });

  const actionMap = { add: 'add_to_cart', remove: 'view', abandon: 'view' };
  await UserBehavior.create({
    product:   productId,
    sessionId: sessionId,
    user:      userId || null,
    action:    actionMap[type] || 'add_to_cart',
    category:  type
  });

  res.json({ success: true });
});

/**
 * POST /api/track/search
 * Body: { query, results, clickedId?, userId?, sessionId }
 * Stored in UserBehavior as a 'click' event when a result is clicked.
 */
const trackSearch = asyncHandler(async (req, res) => {
  const { query, results, clickedId, userId, sessionId } = req.body;
  if (!query) return res.status(400).json({ success: false, error: 'query required' });

  if (clickedId) {
    await UserBehavior.create({
      product:   clickedId,
      sessionId: sessionId || 'anon',
      user:      userId || null,
      action:    'click',
      category:  `search:${query}`
    });
  }

  res.json({ success: true, resultsCount: results });
});

/**
 * POST /api/track/purchase
 * Body: { orderId, sessionId, userId }
 * Logs a purchase behavior event for each item in the order.
 */
const trackPurchase = asyncHandler(async (req, res) => {
  const { items, sessionId, userId } = req.body;
  // items: [{ productId, category }]
  if (!items || !Array.isArray(items)) return res.status(400).json({ success: false, error: 'items array required' });

  const docs = items.map(item => ({
    product:   item.productId,
    sessionId: sessionId || 'anon',
    user:      userId || null,
    action:    'purchase',
    category:  item.category || ''
  }));

  await UserBehavior.insertMany(docs);
  res.json({ success: true });
});

module.exports = { trackView, trackCart, trackSearch, trackPurchase };
