const express  = require('express');
const router   = express.Router();
const { trackView, trackCart, trackSearch, trackPurchase } = require('../controllers/trackingController');

// No auth required — called from storefront
router.post('/view',     trackView);
router.post('/cart',     trackCart);
router.post('/search',   trackSearch);
router.post('/purchase', trackPurchase);
router.post('/product-view',        trackView);
router.post('/product-search',      trackSearch);
router.post('/add-to-cart',         trackCart);
router.post('/purchase-conversion', trackPurchase);

module.exports = router;
