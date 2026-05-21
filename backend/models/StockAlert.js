const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: {
    type: String,
    enum: ['low_stock', 'out_of_stock', 'reorder_point', 'overstock'],
    required: true
  },
  currentStock: { type: Number, required: true },
  threshold:    { type: Number, required: true },
  isResolved:   { type: Boolean, default: false },
  resolvedAt:   { type: Date, default: null },
  isDemoData:   { type: Boolean, default: false }
}, { timestamps: true });

stockAlertSchema.index({ isResolved: 1, type: 1 });
stockAlertSchema.index({ product: 1, isResolved: 1 });

module.exports = mongoose.model('StockAlert', stockAlertSchema);
