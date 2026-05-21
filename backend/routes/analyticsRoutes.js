const express  = require('express');
const router   = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/analyticsController');

// All routes require admin
router.use(protect, admin);

router.get('/dashboard',             getDashboardSummary);
router.get('/dashboard-summary',     getDashboardSummary);
router.get('/sales',                 getSalesAnalytics);
router.get('/sales/category',        getSalesCategory);
router.get('/sales/products',        getSalesProducts);
router.get('/trends',                getProductPerformance);
router.get('/trends/upcoming',       getUpcomingTrends);
router.get('/trends/top-viewed',     getTopViewedTrends);
router.get('/trending-products',     getTrendingProducts);
router.get('/product-hits',          getProductHits);
router.get('/stock',                 getStockSummary);
router.get('/stock-summary',         getStockSummary);
router.get('/stock/low',             getLowStockProducts);
router.get('/stock/out-of-stock',    getOutOfStockProducts);
router.get('/stock/about-to-out-of-stock', getAboutToOutOfStock);
router.get('/low-stock',             getLowStockProducts);
router.get('/out-of-stock',          getOutOfStockProducts);
router.get('/stock/suggestions',     getStockSuggestions);
router.get('/stock-suggestions',     getStockSuggestions);
router.get('/stock/seasonal',        getSeasonalStock);
router.get('/stock/upcoming-season', getUpcomingSeasonStock);
router.get('/hits',                  getHitsAnalytics);
router.get('/hits/products',         getHitsProducts);
router.get('/hits/searches',         getHitsSearches);
router.get('/hits/conversion',       getHitsConversion);
router.get('/return-analytics',      getReturnAnalytics);
router.get('/season-demand',         getSeasonDemand);
router.get('/product-performance',   getProductPerformance);
router.get('/stock-alerts',          getStockAlerts);
router.patch('/stock-alerts/:id/resolve', resolveStockAlert);

module.exports = router;
