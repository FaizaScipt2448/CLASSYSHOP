const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  image: { type: String, required: true },
  images: [String],
  countInStock: { type: Number, required: true, default: 0 },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isLatest: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  tags: [String],
  weight: {
    value: { type: Number, default: 0 },
    unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'pcs'], default: 'g' }
  },
  packageWeight: {
    value: { type: Number, default: 0 },
    unit: { type: String, enum: ['g', 'kg'], default: 'g' }
  },
  dimensions: {
    length: { type: Number, default: 0 },
    width:  { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    unit:   { type: String, enum: ['cm', 'inch'], default: 'cm' }
  },
  productDetails: [{
    label: { type: String, default: '' },
    value: { type: String, default: '' }
  }],
  slug: { type: String, default: null, trim: true },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords: { type: String, default: '' },
  // Analytics fields
  viewCount:   { type: Number, default: 0 },
  searchCount: { type: Number, default: 0 },
  addToCartCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 },
  returnCount: { type: Number, default: 0 },
  trendScore:  { type: Number, default: 1.0 },
  trendStatus: { type: String, enum: ['hot', 'rising', 'stable', 'falling', 'dead'], default: 'stable' },
  primarySeason: { type: String, default: 'All Season' },
  seasonalDemandScore: { type: Number, default: 0 },
  upcomingSeasonPriority: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  isActive: { type: Boolean, default: true },
  seasons:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Season' }]
}, { timestamps: true });

// Sparse + unique so null slugs (old products) are excluded from uniqueness check
productSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);
