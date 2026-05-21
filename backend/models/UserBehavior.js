const mongoose = require('mongoose');

/**
 * Tracks user interactions with products for the recommendation engine.
 * Actions are weighted: view(1) < click(2) < add_to_cart(3) < purchase(5)
 */
const userBehaviorSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sessionId: { type: String, default: '' }, // anonymous users identified by sessionId
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  action:    { type: String, enum: ['view', 'click', 'add_to_cart', 'purchase'], required: true },
  category:  { type: String, default: '' },
  isDemoData: { type: Boolean, default: false }
}, { timestamps: true });

// Compound indexes for fast aggregation queries
userBehaviorSchema.index({ product: 1, action: 1, createdAt: -1 });
userBehaviorSchema.index({ user: 1, action: 1, createdAt: -1 });
userBehaviorSchema.index({ sessionId: 1, createdAt: -1 });
userBehaviorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserBehavior', userBehaviorSchema);
