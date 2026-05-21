const asyncHandler       = require('express-async-handler');
const Product            = require('../models/Product');
const Order              = require('../models/Order');
const User               = require('../models/User');
const Return             = require('../models/Return');
const StockSuggestion    = require('../models/StockSuggestion');
const StockAlert         = require('../models/StockAlert');
const AnalyticsSnapshot  = require('../models/AnalyticsSnapshot');
const UserBehavior       = require('../models/UserBehavior');
const salesSvc           = require('../services/salesAnalyticsService');
const returnSvc          = require('../services/returnAnalyticsService');
const trendSvc           = require('../services/productTrendService');
const { success, error } = require('../helpers/apiResponse');

const startOfDayIso = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const endOfDayIso = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const getRange = (req, fallbackDays = 30) => {
  const fromValue = req.query.from || req.query.dateFrom;
  const toValue = req.query.to || req.query.dateTo;
  return {
    from: fromValue ? startOfDayIso(fromValue) : new Date(Date.now() - fallbackDays * 86400000).toISOString(),
    to: toValue ? endOfDayIso(toValue) : new Date().toISOString()
  };
};

const trendStatusFromScore = (score = 0) => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'rising';
  if (score >= 40) return 'stable';
  if (score >= 20) return 'falling';
  return 'dead';
};

const productBaseSelect = 'name category brand price countInStock sales soldCount viewCount searchCount addToCartCount returnCount trendScore trendStatus primarySeason seasonalDemandScore upcomingSeasonPriority lowStockThreshold';

// ─── Dashboard Summary ────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/dashboard-summary
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const from30     = new Date(now - 30 * 86400000);

  const [
    salesSummary,
    salesTrend,
    ordersTrend,
    totalProducts,
    outOfStockCount,
    newCustomers,
    returnRate,
    criticalAlerts,
    topProducts,
    lowStockCount,
    mostViewed,
    topViewedProducts,
    lowStockAlerts,
    stockSuggestions,
    trendingCount
  ] = await Promise.all([
    salesSvc.getDashboardSummary(),
    salesSvc.getSalesTrend(from30.toISOString(), now.toISOString(), 'day'),
    salesSvc.getSalesTrend(from30.toISOString(), now.toISOString(), 'day'),
    Product.countDocuments(),
    Product.countDocuments({ countInStock: 0 }),
    User.countDocuments({ isAdmin: false, createdAt: { $gte: monthStart } }),
    returnSvc.getReturnRate(monthStart.toISOString(), now.toISOString()),
    StockAlert.countDocuments({ isResolved: false, type: { $in: ['out_of_stock', 'low_stock'] } }),
    salesSvc.getTopProducts(from30.toISOString(), now.toISOString(), 5),
    Product.countDocuments({ countInStock: { $lte: 5, $gt: 0 } }),
    Product.findOne().select(productBaseSelect).sort({ viewCount: -1 }),
    Product.find().select(productBaseSelect).sort({ viewCount: -1 }).limit(5),
    Product.find({ countInStock: { $gt: 0, $lte: 10 } }).select(productBaseSelect).sort({ countInStock: 1 }).limit(5),
    StockSuggestion.find().populate('product', 'name category brand countInStock price').sort({ urgency: 1, daysOfStockRemaining: 1 }).limit(5),
    Product.countDocuments({ $or: [{ trendStatus: { $in: ['hot', 'rising'] } }, { trendScore: { $gte: 60 } }] })
  ]);

  success(res, {
    ...salesSummary,
    salesTrend,
    ordersTrend,
    totalProducts,
    totalProductsSold: topProducts.reduce((sum, item) => sum + (item.units || 0), 0),
    outOfStockCount,
    newCustomers,
    returnRate:    returnRate.returnRate,
    criticalAlerts,
    lowStockCount,
    topProducts,
    topViewedProducts,
    lowStockAlerts,
    mostViewedProduct: mostViewed,
    stockSuggestions,
    trendingCount
  });
});

// ─── Sales Analytics ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/sales?dateFrom&dateTo&groupBy
 */
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const { from: fromQuery, to: toQuery, dateFrom, dateTo, groupBy = 'day' } = req.query;
  const fromValue = fromQuery || dateFrom;
  const toValue = toQuery || dateTo;
  const from = fromValue ? startOfDayIso(fromValue) : new Date(Date.now() - 30 * 86400000).toISOString();
  const to   = toValue   ? endOfDayIso(toValue)    : new Date().toISOString();

  const [trend, categories, topProducts, slowProducts] = await Promise.all([
    salesSvc.getSalesTrend(from, to, groupBy),
    salesSvc.getCategoryBreakdown(from, to),
    salesSvc.getTopProducts(from, to, 10),
    Product.find({ sales: { $lte: 2 } }).select(productBaseSelect).sort({ sales: 1, viewCount: -1 }).limit(10)
  ]);

  const totalRevenue = trend.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = trend.reduce((sum, item) => sum + (item.orders || 0), 0);
  const totalSales = topProducts.reduce((sum, item) => sum + (item.units || 0), 0);

  success(res, {
    totalRevenue,
    revenue: totalRevenue,
    totalOrders,
    orders: totalOrders,
    totalSales,
    productsSold: totalSales,
    averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    avgOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    trend,
    categories,
    topProducts,
    slowProducts
  });
});

const getSalesCategory = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  success(res, await salesSvc.getCategoryBreakdown(from, to));
});

const getSalesProducts = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  const [topProducts, slowProducts] = await Promise.all([
    salesSvc.getTopProducts(from, to, 20),
    Product.find({ sales: { $lte: 2 } }).select(productBaseSelect).sort({ sales: 1, viewCount: -1 }).limit(20)
  ]);
  success(res, { topProducts, slowProducts });
});

// ─── Product Trends ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/trending-products?limit&filter
 */
const getTrendingProducts = asyncHandler(async (req, res) => {
  const { limit = 20, filter } = req.query;

  const products = await Product.find({}).select('_id name category brand trendScore viewCount sales');
  const ids      = products.map(p => p._id);
  const scores   = await trendSvc.getTrendScores(ids);

  let result = scores;
  if (filter && ['hot', 'rising', 'falling', 'stable'].includes(filter)) {
    result = scores.filter(s => s.trend === filter);
  }

  // Merge product info
  const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
  const enriched = result.slice(0, +limit).map(s => ({
    ...s,
    name:     productMap[s.productId.toString()]?.name,
    category: productMap[s.productId.toString()]?.category,
    brand:    productMap[s.productId.toString()]?.brand,
    stock:    productMap[s.productId.toString()]?.countInStock
  }));

  success(res, enriched);
});

// ─── Product Hits / Views ─────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/product-hits?limit
 */
const getProductHits = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const from30 = new Date(Date.now() - 30 * 86400000);

  const [mostViewed, highViewLowSale, topSearched] = await Promise.all([
    // Most viewed products from UserBehavior
    UserBehavior.aggregate([
      { $match: { action: 'view', createdAt: { $gte: from30 } } },
      { $group: { _id: '$product', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: +limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $project: { views: 1, name: { $first: '$product.name' }, category: { $first: '$product.category' } } }
    ]),
    // High views but 0 recent sales
    Product.find({ viewCount: { $gt: 50 }, sales: 0 })
      .select('name category viewCount sales countInStock')
      .sort({ viewCount: -1 })
      .limit(+limit),
    // Most add-to-carts
    UserBehavior.aggregate([
      { $match: { action: 'add_to_cart', createdAt: { $gte: from30 } } },
      { $group: { _id: '$product', carts: { $sum: 1 } } },
      { $sort: { carts: -1 } },
      { $limit: +limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $project: { carts: 1, name: { $first: '$product.name' } } }
    ])
  ]);

  success(res, { mostViewed, highViewLowSale, topSearched });
});

// ─── Stock Analytics ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/stock-summary
 */
const getStockSummary = asyncHandler(async (req, res) => {
  const [outOfStock, lowStock, overstock, totalProducts] = await Promise.all([
    Product.countDocuments({ countInStock: 0 }),
    Product.countDocuments({ countInStock: { $gt: 0, $lte: 10 } }),
    StockSuggestion.countDocuments({ recommendation: 'reduce' }),
    Product.countDocuments()
  ]);

  success(res, { outOfStock, lowStock, overstock, totalProducts });
});

/**
 * GET /api/admin/analytics/low-stock?limit
 */
const getLowStockProducts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const products = await Product.find({ countInStock: { $gt: 0, $lte: 10 } })
    .select('name category brand countInStock sales trendScore')
    .sort({ countInStock: 1 })
    .limit(+limit);
  success(res, products);
});

/**
 * GET /api/admin/analytics/out-of-stock?limit
 */
const getOutOfStockProducts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const products = await Product.find({ countInStock: 0 })
    .select('name category brand sales trendScore')
    .sort({ sales: -1 })
    .limit(+limit);
  success(res, products);
});

// ─── Stock Suggestions ────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/stock-suggestions?recommendation&urgency&page&limit
 */
const getStockSuggestions = asyncHandler(async (req, res) => {
  const { recommendation, urgency, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (recommendation) filter.recommendation = recommendation;
  if (urgency)        filter.urgency = urgency;

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const [data, total] = await Promise.all([
    StockSuggestion.find(filter)
      .populate('product', 'name category brand images countInStock price')
      .sort({ urgency: 1, daysOfStockRemaining: 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    StockSuggestion.countDocuments(filter)
  ]);

  // Sort by urgency rank since mongo sorts string alphabetically
  const sorted = data.sort((a, b) =>
    (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9)
  );

  success(res, sorted, { page: +page, limit: +limit, total });
});

// ─── Return Analytics ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/return-analytics?dateFrom&dateTo&groupBy
 */
const getReturnAnalytics = asyncHandler(async (req, res) => {
  const { from: fromQuery, to: toQuery, dateFrom, dateTo, groupBy = 'day' } = req.query;
  const fromValue = fromQuery || dateFrom;
  const toValue = toQuery || dateTo;
  const from = fromValue ? startOfDayIso(fromValue) : new Date(Date.now() - 30 * 86400000).toISOString();
  const to   = toValue   ? endOfDayIso(toValue)    : new Date().toISOString();

  const [rate, trend, topProducts, reasons] = await Promise.all([
    returnSvc.getReturnRate(from, to),
    returnSvc.getReturnTrend(from, to, groupBy),
    returnSvc.getMostReturnedProducts(10),
    returnSvc.getReturnReasonBreakdown(from, to)
  ]);

  success(res, { rate, trend, topProducts, reasons });
});

// ─── Season Analytics ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/season-demand
 */
const getSeasonDemand = asyncHandler(async (req, res) => {
  const Season = require('../models/Season');
  const seasons = await Season.find({ isActive: true });

  // For each season, find top-selling categories/products in that season's months
  const results = await Promise.all(seasons.map(async season => {
    const pipeline = [
      {
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $month: '$createdAt' }, season.startMonth] },
              { $lte: [{ $month: '$createdAt' }, season.endMonth] }
            ]
          },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'prod'
        }
      },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:     { $ifNull: ['$prod.category', 'Unknown'] },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
          units:   { $sum: '$orderItems.qty' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ];

    const categoryData = await Order.aggregate(pipeline);
    return {
      season:     season.name,
      multiplier: season.demandMultiplier,
      topCategories: categoryData
    };
  }));

  success(res, results);
});

// ─── Product Performance Table ────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/product-performance?page&limit&sort&category
 */
const getProductPerformance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'sales', category, season, status } = req.query;
  const filter = {};
  if (category && category !== 'all') filter.category = category;
  if (season && season !== 'all') filter.primarySeason = { $regex: season, $options: 'i' };

  const sortMap = {
    sales:     { sales: -1 },
    views:     { viewCount: -1 },
    trend:     { trendScore: -1 },
    stock:     { countInStock: 1 },
    price:     { price: -1 }
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(productBaseSelect + ' rating numReviews')
      .sort(sortMap[sortBy] || { sales: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    Product.countDocuments(filter)
  ]);

  // Enrich with trend label and stock suggestion
  const ids         = products.map(p => p._id);
  const suggestions = await StockSuggestion.find({ product: { $in: ids } }).select('product recommendation urgency daysOfStockRemaining');
  const suggMap     = Object.fromEntries(suggestions.map(s => [s.product.toString(), s]));

  const enriched = products.map(p => ({
    _id:          p._id,
    name:         p.name,
    category:     p.category,
    brand:        p.brand,
    price:        p.price,
    stock:        p.countInStock,
    sales:        p.sales,
    views:        p.viewCount,
    trendScore:   p.trendScore,
    trend:        p.trendStatus || trendStatusFromScore(p.trendScore),
    addToCartCount: p.addToCartCount || 0,
    searchCount: p.searchCount || 0,
    conversionRate: p.viewCount > 0 ? Number((((p.sales || p.soldCount || 0) / p.viewCount) * 100).toFixed(2)) : 0,
    returnRate: p.sales > 0 ? Number((((p.returnCount || 0) / p.sales) * 100).toFixed(2)) : 0,
    rating:       p.rating,
    reviews:      p.numReviews,
    suggestion:   suggMap[p._id.toString()]?.recommendation || 'watch',
    urgency:      suggMap[p._id.toString()]?.urgency || 'low',
    daysOfStock:  suggMap[p._id.toString()]?.daysOfStockRemaining || 9999
  }));

  const filtered = status && status !== 'all' ? enriched.filter(p => p.trend === status) : enriched;
  success(res, filtered, { page: +page, limit: +limit, total });
});

const getUpcomingTrends = asyncHandler(async (req, res) => {
  const { season } = req.query;
  const filter = season ? { primarySeason: { $regex: season, $options: 'i' } } : {};
  const products = await Product.find(filter).select(productBaseSelect).sort({ upcomingSeasonPriority: -1, trendScore: -1, viewCount: -1 }).limit(20);
  success(res, products);
});

const getTopViewedTrends = asyncHandler(async (req, res) => {
  const products = await Product.find().select(productBaseSelect).sort({ viewCount: -1 }).limit(20);
  success(res, products);
});

const getAboutToOutOfStock = asyncHandler(async (req, res) => {
  const products = await Product.find({ countInStock: { $gt: 0, $lte: 15 } }).select(productBaseSelect).sort({ countInStock: 1, sales: -1 }).limit(30);
  success(res, products);
});

const getSeasonalStock = asyncHandler(async (req, res) => {
  const { season, category, stockStatus } = req.query;
  const filter = {};
  if (season && season !== 'all') filter.primarySeason = { $regex: season, $options: 'i' };
  if (category && category !== 'all') filter.category = category;
  if (stockStatus === 'understocked') filter.countInStock = { $gt: 0, $lte: 10 };
  if (stockStatus === 'overstocked') filter.countInStock = { $gte: 50 };
  if (stockStatus === 'out') filter.countInStock = 0;

  const [products, orderRows] = await Promise.all([
    Product.find(filter).select(productBaseSelect).sort({ primarySeason: 1, countInStock: 1 }).limit(100),
    Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped', 'processing'] } } },
      { $unwind: '$orderItems' },
      { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$product.primarySeason', 'All Season'] },
          soldQuantity: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } }
        }
      }
    ])
  ]);

  const seasonStockMap = products.reduce((acc, product) => {
    const name = product.primarySeason || 'All Season';
    if (!acc[name]) {
      acc[name] = {
        season: name,
        totalProducts: 0,
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
    acc[name].totalStock += product.countInStock || 0;
    acc[name].totalProducts += 1;
    if ((product.countInStock || 0) === 0) acc[name].outOfStockCount += 1;
    if ((product.countInStock || 0) > 0 && (product.countInStock || 0) <= (product.lowStockThreshold || 5)) acc[name].lowStockCount += 1;
    return acc;
  }, {});

  const stockBySeason = Object.values(seasonStockMap);
  const maxSold = Math.max(...orderRows.map(row => row.soldQuantity || 0), 1);
  const maxRevenue = Math.max(...orderRows.map(row => row.revenue || 0), 1);
  const maxViews = Math.max(...products.map(product => product.viewCount || 0), 1);

  const seasonDemand = stockBySeason.map(stock => {
    const order = orderRows.find(row => row._id === stock.season) || {};
    const seasonProducts = products.filter(product => (product.primarySeason || 'All Season') === stock.season);
    const views = seasonProducts.reduce((sum, product) => sum + (product.viewCount || 0), 0);
    const avgTrend = seasonProducts.length
      ? seasonProducts.reduce((sum, product) => sum + (product.trendScore || 0), 0) / seasonProducts.length
      : 0;
    const soldScore = ((order.soldQuantity || 0) / maxSold) * 100;
    const revenueScore = ((order.revenue || 0) / maxRevenue) * 100;
    const viewsScore = (views / maxViews) * 100;
    const demandScore = Math.round(soldScore * 0.40 + revenueScore * 0.25 + viewsScore * 0.20 + avgTrend * 0.15);

    return {
      season: stock.season,
      demand: demandScore,
      demandScore,
      sold: order.soldQuantity || 0,
      soldQuantity: order.soldQuantity || 0,
      revenue: order.revenue || 0,
      views
    };
  });

  const productRows = products.map(product => {
    const stock = product.countInStock || 0;
    const sales = product.sales || product.soldCount || 0;
    const views = product.viewCount || 0;
    const returnRate = sales ? ((product.returnCount || 0) / sales) * 100 : 0;

    let recommendation = 'Watch Closely';
    let urgency = 'Low';
    if (stock === 0) {
      recommendation = 'Reorder';
      urgency = 'Critical';
    } else if (stock <= (product.lowStockThreshold || 5) && (product.trendScore || 0) >= 60) {
      recommendation = 'Reorder immediately';
      urgency = 'High';
    } else if ((product.upcomingSeasonPriority || 0) >= 75) {
      recommendation = 'Prepare for Upcoming Season';
      urgency = 'Medium';
    } else if (views >= 50 && sales <= 2) {
      recommendation = 'Promote';
      urgency = 'Medium';
    } else if (stock >= 50 && sales <= 2) {
      recommendation = 'Reduce Stock';
      urgency = 'Medium';
    } else if (returnRate >= 15) {
      recommendation = 'Watch Closely';
      urgency = 'Medium';
    } else if (!views && !sales) {
      recommendation = 'Discontinue';
      urgency = 'Low';
    }

    return {
      _id: product._id,
      product: product.name,
      name: product.name,
      category: product.category,
      season: product.primarySeason || 'All Season',
      stock,
      trendScore: product.trendScore || 0,
      recommendation,
      urgency
    };
  });

  success(res, {
    seasonStock: stockBySeason,
    seasonDemand,
    products: productRows,
    summary: stockBySeason,
    demand: seasonDemand
  });
});

const getUpcomingSeasonStock = asyncHandler(async (req, res) => {
  const { season } = req.query;
  const filter = season ? { primarySeason: { $regex: season, $options: 'i' } } : {};
  const products = await Product.find(filter).select(productBaseSelect).sort({ upcomingSeasonPriority: -1, countInStock: 1 }).limit(30);
  success(res, products.map(product => ({
    _id: product._id,
    name: product.name,
    category: product.category,
    primarySeason: product.primarySeason,
    stock: product.countInStock,
    trendScore: product.trendScore,
    recommendation: product.countInStock <= 10 ? 'prepare_season' : 'watch',
    urgency: product.countInStock <= 5 ? 'critical' : product.countInStock <= 15 ? 'high' : 'low'
  })));
});

const getHitsAnalytics = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  const match = { createdAt: { $gte: new Date(from), $lte: new Date(to) } };
  const [trend, products, searches, conversion] = await Promise.all([
    UserBehavior.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, views: { $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] } }, carts: { $sum: { $cond: [{ $eq: ['$action', 'add_to_cart'] }, 1, 0] } }, purchases: { $sum: { $cond: [{ $eq: ['$action', 'purchase'] }, 1, 0] } } } },
      { $project: { _id: 0, date: '$_id', views: 1, carts: 1, purchases: 1 } },
      { $sort: { date: 1 } }
    ]),
    getHitsProductsData(from, to),
    UserBehavior.aggregate([{ $match: { ...match, action: 'click' } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }]),
    getHitsConversionData(from, to)
  ]);
  success(res, { trend, products, searches, conversion });
});

const getHitsProducts = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  success(res, await getHitsProductsData(from, to));
});

const getHitsSearches = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  const data = await UserBehavior.aggregate([
    { $match: { createdAt: { $gte: new Date(from), $lte: new Date(to) }, action: 'click' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { _id: 0, term: '$_id', count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 30 }
  ]);
  success(res, data);
});

const getHitsConversion = asyncHandler(async (req, res) => {
  const { from, to } = getRange(req);
  success(res, await getHitsConversionData(from, to));
});

const getHitsProductsData = async (from, to) => UserBehavior.aggregate([
  { $match: { createdAt: { $gte: new Date(from), $lte: new Date(to) } } },
  { $group: { _id: '$product', views: { $sum: { $cond: [{ $eq: ['$action', 'view'] }, 1, 0] } }, carts: { $sum: { $cond: [{ $eq: ['$action', 'add_to_cart'] }, 1, 0] } }, purchases: { $sum: { $cond: [{ $eq: ['$action', 'purchase'] }, 1, 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$action', 'click'] }, 1, 0] } } } },
  { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
  { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
  { $project: { productId: '$_id', name: '$product.name', category: '$product.category', views: 1, carts: 1, purchases: 1, clicks: 1, sales: '$product.sales', conversionRate: { $cond: [{ $gt: ['$views', 0] }, { $multiply: [{ $divide: ['$purchases', '$views'] }, 100] }, 0] }, cartRate: { $cond: [{ $gt: ['$views', 0] }, { $multiply: [{ $divide: ['$carts', '$views'] }, 100] }, 0] } } },
  { $sort: { views: -1 } },
  { $limit: 30 }
]);

const getHitsConversionData = async (from, to) => {
  const rows = await UserBehavior.aggregate([
    { $match: { createdAt: { $gte: new Date(from), $lte: new Date(to) } } },
    { $group: { _id: '$action', count: { $sum: 1 } } }
  ]);
  return rows.map(row => ({ stage: row._id, count: row.count }));
};

const getSeasonDemandData = async () => {
  const Season = require('../models/Season');
  const seasons = await Season.find({ isActive: true });
  return seasons.map(season => ({ season: season.name, multiplier: season.demandMultiplier }));
};

// ─── Stock Alerts ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics/stock-alerts?type&page&limit
 */
const getStockAlerts = asyncHandler(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const filter = { isResolved: false };
  if (type) filter.type = type;

  const [data, total] = await Promise.all([
    StockAlert.find(filter)
      .populate('product', 'name category brand countInStock')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit),
    StockAlert.countDocuments(filter)
  ]);

  success(res, data, { page: +page, limit: +limit, total });
});

/**
 * PATCH /api/admin/analytics/stock-alerts/:id/resolve
 */
const resolveStockAlert = asyncHandler(async (req, res) => {
  const alert = await StockAlert.findByIdAndUpdate(
    req.params.id,
    { isResolved: true, resolvedAt: new Date() },
    { new: true }
  );
  if (!alert) { res.status(404); throw new Error('Alert not found'); }
  success(res, alert);
});

module.exports = {
  getDashboardSummary,
  getSalesAnalytics,
  getSalesCategory,
  getSalesProducts,
  getTrendingProducts,
  getUpcomingTrends,
  getTopViewedTrends,
  getProductHits,
  getStockSummary,
  getLowStockProducts,
  getOutOfStockProducts,
  getAboutToOutOfStock,
  getStockSuggestions,
  getSeasonalStock,
  getUpcomingSeasonStock,
  getHitsAnalytics,
  getHitsProducts,
  getHitsSearches,
  getHitsConversion,
  getReturnAnalytics,
  getSeasonDemand,
  getProductPerformance,
  getStockAlerts,
  resolveStockAlert
};
