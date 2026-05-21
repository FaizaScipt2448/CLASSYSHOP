const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { generateUniqueSlug } = require('../utils/slugUtils');

const getProducts = asyncHandler(async (req, res) => {
  const { category, subcategory, search, featured, latest, popular, limit } = req.query;
  let query = {};
  let sort = { createdAt: -1 };
  if (category) query.category = { $regex: new RegExp('^' + category + '$', 'i') };
  if (subcategory) query.subcategory = { $regex: new RegExp('^' + subcategory + '$', 'i') };
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { brand: { $regex: search, $options: 'i' } },
    { category: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
  if (featured === 'true') {
    query.isFeatured = true;
    sort = { updatedAt: -1, createdAt: -1 };
  }
  if (latest === 'true') {
    query.isLatest = true;
    sort = { createdAt: -1 };
  }
  if (popular === 'true') {
    query.isPopular = true;
    sort = { sales: -1, soldCount: -1, viewCount: -1, updatedAt: -1 };
  }
  const lim = parseInt(limit) || 0;
  const products = await Product.find(query).sort(sort).limit(lim);
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let product = null;

  // Try MongoDB ObjectId first (24 hex chars)
  if (/^[0-9a-f]{24}$/i.test(id)) {
    product = await Product.findById(id);
  }

  // Fallback to slug lookup
  if (!product) {
    product = await Product.findOne({ slug: id });
  }

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };

  if (body.slug) {
    // Validate uniqueness of explicit slug
    const taken = await Product.findOne({ slug: body.slug });
    if (taken) {
      res.status(400);
      throw new Error('A product with this slug already exists.');
    }
  } else {
    // Auto-generate from product name
    body.slug = await generateUniqueSlug(body.name);
  }

  const product = new Product(body);
  const created = await product.save();
  res.status(201).json(created);
});

const updateProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const { id } = req.params;

  if (body.slug !== undefined) {
    if (!body.slug) {
      // Empty slug → regenerate from name
      body.slug = await generateUniqueSlug(body.name || 'product', id);
    } else {
      // Explicit new slug → check uniqueness excluding this product
      const taken = await Product.findOne({ slug: body.slug, _id: { $ne: id } });
      if (taken) {
        res.status(400);
        throw new Error('A product with this slug already exists.');
      }
    }
  }

  const product = await Product.findByIdAndUpdate(id, body, { new: true });
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (product) {
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }
    const review = { user: req.user._id, name: req.user.name, rating: Number(rating), comment };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview };
