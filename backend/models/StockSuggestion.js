const mongoose = require('mongoose');

const stockSuggestionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  calculatedAt:         { type: Date, default: Date.now },
  avgDailySales:        { type: Number, default: 0 },
  totalSoldLast30d:     { type: Number, default: 0 },
  daysOfStockRemaining: { type: Number, default: 9999 },
  reorderPoint:         { type: Number, default: 0 },
  suggestedReorderQty:  { type: Number, default: 0 },
  seasonalMultiplier:   { type: Number, default: 1.0 },
  trendScore:           { type: Number, default: 1.0 },
  returnRiskScore:      { type: Number, default: 0 },
  currentStock:         { type: Number, default: 0 },
  recommendation: {
    type: String,
    enum: ['reorder', 'promote', 'reduce', 'discontinue', 'watch', 'prepare_season'],
    default: 'watch'
  },
  reason: { type: String, default: '' },
  seasonImpact: { type: String, default: '' },
  supplierLeadTimeDays: { type: Number, default: 7 },
  urgency: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'low'
  },
  isDemoData: { type: Boolean, default: false }
}, { timestamps: true });

stockSuggestionSchema.index({ recommendation: 1, urgency: 1 });
stockSuggestionSchema.index({ daysOfStockRemaining: 1 });

module.exports = mongoose.model('StockSuggestion', stockSuggestionSchema);
