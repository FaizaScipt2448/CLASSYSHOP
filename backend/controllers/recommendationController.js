const asyncHandler = require('express-async-handler');
const Product      = require('../models/Product');
const Order        = require('../models/Order');
const UserBehavior = require('../models/UserBehavior');

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/recommendations/trending
   Most-engaged products in the last 7 days, weighted by action type.
   Falls back to highest sales + rating if behavior data is sparse.
───────────────────────────────────────────────────────────────────────────── */
const getTrending = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Weighted engagement score: add_to_cart(3) > click(2) > view(1)
  const viewCounts = await UserBehavior.aggregate([
    {
      $match: {
        action:    { $in: ['view', 'click', 'add_to_cart'] },
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$product',
        score: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$action', 'add_to_cart'] }, then: 3 },
                { case: { $eq: ['$action', 'click'] },       then: 2 },
                { case: { $eq: ['$action', 'view'] },        then: 1 }
              ],
              default: 1
            }
          }
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: Number(limit) }
  ]);

  let products = [];
  if (viewCounts.length >= 4) {
    const ids      = viewCounts.map(v => v._id);
    const fetched  = await Product.find({ _id: { $in: ids } });
    const scoreMap = {};
    viewCounts.forEach(v => { scoreMap[v._id.toString()] = v.score; });
    products = fetched.sort(
      (a, b) => (scoreMap[b._id.toString()] || 0) - (scoreMap[a._id.toString()] || 0)
    );
  }

  // Fallback
  if (products.length < 4) {
    products = await Product.find({}).sort({ sales: -1, rating: -1, numReviews: -1 }).limit(Number(limit));
  }

  res.json(products.slice(0, Number(limit)));
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/recommendations/personalized?userId=&sessionId=
   Recency-weighted recommendations based on:
     1. User's viewed/clicked categories & brands (last 30 days)
     2. Excludes already-purchased products
   Falls back to popular/featured for anonymous or cold-start users.
───────────────────────────────────────────────────────────────────────────── */
const getPersonalized = asyncHandler(async (req, res) => {
  const { userId, sessionId, limit = 8 } = req.query;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ── Anonymous / cold-start fallback ──
  if (!userId && !sessionId) {
    const products = await Product.find({ $or: [{ isPopular: true }, { isFeatured: true }] })
      .sort({ rating: -1, sales: -1 }).limit(Number(limit));
    return res.json(products);
  }

  // ── Fetch behavior + order history in parallel ──
  const behaviorFilter = userId
    ? { user: userId, createdAt: { $gte: thirtyDaysAgo } }
    : { sessionId, createdAt: { $gte: thirtyDaysAgo } };

  const [recentBehavior, orders] = await Promise.all([
    UserBehavior.find(behaviorFilter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('product', 'category brand'),
    userId ? Order.find({ user: userId }).select('orderItems') : Promise.resolve([])
  ]);

  // ── Score categories and brands by recency + action weight ──
  const categoryScore = {}, brandScore = {};
  recentBehavior.forEach((b, idx) => {
    if (!b.product) return;
    const recencyWeight  = recentBehavior.length - idx; // newer = higher
    const actionWeight   = b.action === 'add_to_cart' ? 3 : b.action === 'click' ? 2 : 1;
    const score          = recencyWeight * actionWeight;

    categoryScore[b.product.category] = (categoryScore[b.product.category] || 0) + score;
    brandScore[b.product.brand]       = (brandScore[b.product.brand]       || 0) + score;
  });

  const topCategories = Object.entries(categoryScore)
    .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat]) => cat);

  // ── Exclude already-purchased products ──
  const purchasedIds = new Set(
    orders.flatMap(o => o.orderItems.map(i => i.product?.toString())).filter(Boolean)
  );

  // ── Build recommendation query ──
  const recQuery = { _id: { $nin: [...purchasedIds] } };
  if (topCategories.length) {
    recQuery.category = {
      $in: topCategories.map(c => new RegExp('^' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'))
    };
  }

  let products = await Product.find(recQuery).sort({ rating: -1, sales: -1 }).limit(Number(limit));

  // ── Fallback if cold start or no matches ──
  if (products.length < 4) {
    products = await Product.find({ $or: [{ isPopular: true }, { isFeatured: true }] })
      .sort({ rating: -1 }).limit(Number(limit));
  }

  res.json(products);
});

/* ─────────────────────────────────────────────────────────────────────────────
   GET /api/recommendations/also-bought?productId=&category=
   True co-purchase recommendations: finds users who bought this product,
   then surfaces other products they also bought (collaborative filtering).
   Falls back to same-category products sorted by sales+rating.
───────────────────────────────────────────────────────────────────────────── */
const getAlsoBought = asyncHandler(async (req, res) => {
  const { productId, category, limit = 4 } = req.query;

  let alsobought = [];

  if (productId) {
    // Step 1: Which orders contain this product?
    const ordersWithProduct = await Order.find({
      'orderItems.product': productId
    }).select('orderItems').limit(100);

    if (ordersWithProduct.length > 0) {
      // Step 2: Count co-purchases of other products in those orders
      const productCount = {};
      ordersWithProduct.forEach(order => {
        order.orderItems.forEach(item => {
          const key = item.product?.toString();
          if (key && key !== productId) {
            productCount[key] = (productCount[key] || 0) + 1;
          }
        });
      });

      // Step 3: Rank by co-purchase frequency
      const topIds = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, Number(limit))
        .map(([id]) => id);

      if (topIds.length > 0) {
        const coProducts = await Product.find({ _id: { $in: topIds } });
        alsobought = coProducts.sort(
          (a, b) => (productCount[b._id.toString()] || 0) - (productCount[a._id.toString()] || 0)
        );
      }
    }
  }

  // ── Fallback: same category, sorted by sales + rating ──
  if (alsobought.length < Number(limit)) {
    const exclude  = [productId, ...alsobought.map(p => p._id.toString())].filter(Boolean);
    const catSafe  = (category || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const extra    = await Product.find({
      _id:      { $nin: exclude },
      category: { $regex: new RegExp('^' + catSafe, 'i') }
    }).sort({ sales: -1, rating: -1 }).limit(Number(limit) - alsobought.length);

    alsobought = [...alsobought, ...extra];
  }

  res.json(alsobought.slice(0, Number(limit)));
});

/* ─────────────────────────────────────────────────────────────────────────────
   POST /api/recommendations/track
   Records a user interaction event (view, click, add_to_cart, purchase).
   Accepts userId (authenticated) or sessionId (anonymous).
───────────────────────────────────────────────────────────────────────────── */
const trackBehavior = asyncHandler(async (req, res) => {
  const { userId, sessionId, productId, action, category } = req.body;

  if (!productId || !action) {
    return res.status(400).json({ message: 'productId and action are required' });
  }

  await UserBehavior.create({
    user:      userId    || null,
    sessionId: sessionId || '',
    product:   productId,
    action,
    category:  category  || ''
  });

  res.json({ success: true });
});

module.exports = { getTrending, getPersonalized, getAlsoBought, trackBehavior };
