const express = require('express');
const router  = express.Router();
const { applyCoupon, addToCart, removeFromCart } = require('../controllers/cartController');

// POST /api/cart/apply-coupon  { code, cartTotal }
router.post('/apply-coupon', applyCoupon);

// POST /api/cart/add           { productId, qty }
router.post('/add', addToCart);

// POST /api/cart/remove        { productId }
router.post('/remove', removeFromCart);

module.exports = router;
