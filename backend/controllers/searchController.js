const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

/**
 * @desc    Full-featured product search with NLP-parsed filters
 * @route   GET /api/search?q=&category=&brand=&minPrice=&maxPrice=&rating=&color=&sort=&page=&limit=
 * @access  Public
 */
const searchProducts = asyncHandler(async (req, res) => {
  const {
    q        = '',
    category = '',
    brand    = '',
    minPrice,
    maxPrice,
    rating,
    color    = '',
    sort     = 'relevance',
    page     = 1,
    limit    = 12
  } = req.query;

  const query = { isActive: { $ne: false } };

  // ── Full-text search ──
  if (q.trim()) {
    // Escape special regex chars for safety
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name:        { $regex: safe, $options: 'i' } },
      { brand:       { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { category:    { $regex: safe, $options: 'i' } },
      { tags:        { $in: [new RegExp(safe, 'i')] } }
    ];
  }

  // ── Category (exact, case-insensitive) ──
  if (category) {
    const safe = category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.category = { $regex: new RegExp('^' + safe + '$', 'i') };
  }

  // ── Brand (partial match, case-insensitive) ──
  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }

  // ── Price range ──
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  // ── Minimum star rating ──
  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  // ── Color filter — searches name, description, tags ──
  if (color.trim()) {
    const colorSafe = color.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const colorRegex = new RegExp(colorSafe, 'i');
    const colorConditions = [
      { name:        colorRegex },
      { description: colorRegex },
      { tags:        { $in: [colorRegex] } }
    ];
    // Merge with existing $or using $and to avoid overwriting
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: colorConditions }];
      delete query.$or;
    } else {
      query.$or = colorConditions;
    }
  }

  // ── Sort ──
  const sortMap = {
    relevance:  { createdAt: -1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { rating: -1, numReviews: -1 },
    popular:    { sales: -1, rating: -1 },
    newest:     { createdAt: -1 },
    discount:   { discount: -1 }
  };
  const sortOption = sortMap[sort] || sortMap.relevance;

  const skip = (Number(page) - 1) * Number(limit);

  // Build base query for brand/price aggregation (without text search, just category)
  const facetBase = {
    isActive: { $ne: false },
    ...(category ? { category: { $regex: new RegExp('^' + category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } } : {}),
  };

  // ── Run all queries in parallel ──
  const [products, total, brandsRaw, priceRange] = await Promise.all([
    Product.find(query).sort(sortOption).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
    Product.distinct('brand', facetBase),
    Product.aggregate([
      { $match: facetBase },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ])
  ]);

  res.json({
    products,
    total,
    page:       Number(page),
    pages:      Math.ceil(total / Number(limit)),
    brands:     brandsRaw.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    priceRange: priceRange[0]
      ? { min: Math.floor(priceRange[0].min), max: Math.ceil(priceRange[0].max) }
      : { min: 0, max: 100000 }
  });
});

module.exports = { searchProducts };
