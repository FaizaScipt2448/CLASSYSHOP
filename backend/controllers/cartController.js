const asyncHandler = require('express-async-handler');
const Product      = require('../models/Product');

/* ──────────────────────────────────────────────────────
   Shared coupon definitions (single source of truth).
   These same codes are referenced by the chatbot.
────────────────────────────────────────────────────── */
const COUPONS = [
  {
    code:        'SAVE10',
    type:        'percent',        // 'percent' | 'flat'
    value:       10,               // 10% off
    minOrder:    2000,
    description: '10% off on orders above Rs.2,000',
    expiry:      new Date('2026-04-30')
  },
  {
    code:        'FLAT200',
    type:        'flat',
    value:       200,              // Rs.200 off
    minOrder:    3000,
    description: 'Flat Rs.200 off on orders above Rs.3,000',
    expiry:      new Date('2026-04-30')
  },
  {
    code:        'FREESHIP',
    type:        'shipping',       // zeroes out shipping charge
    value:       0,
    minOrder:    0,
    description: 'Free delivery on your next order',
    expiry:      new Date('2026-04-15')
  },
  {
    code:        'NEWUSER15',
    type:        'percent',
    value:       15,
    minOrder:    0,
    description: '15% off for new customers',
    expiry:      new Date('2026-06-30')
  }
];

/**
 * @desc  Validate a coupon code and return discount info
 * @route POST /api/cart/apply-coupon
 * @body  { code, cartTotal }
 * @access Public
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal = 0 } = req.body;

  if (!code?.trim()) {
    return res.status(400).json({ message: 'Please enter a coupon code' });
  }

  const coupon = COUPONS.find(c => c.code === code.trim().toUpperCase());

  if (!coupon) {
    return res.status(404).json({ message: `Coupon "${code.toUpperCase()}" not found` });
  }

  if (new Date() > coupon.expiry) {
    return res.status(400).json({ message: `Coupon "${coupon.code}" has expired` });
  }

  if (cartTotal < coupon.minOrder) {
    return res.status(400).json({
      message: `Minimum order of Rs.${coupon.minOrder.toLocaleString()} required for this coupon`
    });
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.type === 'percent') {
    discountAmount = Math.round((cartTotal * coupon.value) / 100);
  } else if (coupon.type === 'flat') {
    discountAmount = coupon.value;
  } else if (coupon.type === 'shipping') {
    discountAmount = 0; // handled as free shipping flag on frontend
  }

  res.json({
    code:           coupon.code,
    type:           coupon.type,
    value:          coupon.value,
    discountAmount,
    description:    coupon.description,
    freeShipping:   coupon.type === 'shipping'
  });
});

/**
 * @desc  Validate product + qty, return cart-ready product object
 * @route POST /api/cart/add
 * @body  { productId, qty }
 * @access Public
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  const product = await Product.findById(productId).select(
    'name brand price originalPrice discount image countInStock category rating'
  );

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (product.countInStock === 0) {
    return res.status(400).json({ message: `"${product.name}" is out of stock` });
  }

  const safeQty = Math.min(Number(qty), product.countInStock);

  res.json({
    ...product.toObject(),
    qty: safeQty
  });
});

/**
 * @desc  Validate removal (product exists check)
 * @route POST /api/cart/remove
 * @body  { productId }
 * @access Public
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required' });
  // Cart lives in frontend localStorage — just acknowledge
  res.json({ success: true, productId });
});

module.exports = { applyCoupon, addToCart, removeFromCart, COUPONS };
