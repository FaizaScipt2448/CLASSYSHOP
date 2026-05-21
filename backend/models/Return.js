const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:    { type: String, required: true },
  qty:     { type: Number, required: true },
  price:   { type: Number, required: true },
  reason:  {
    type: String,
    enum: ['defective', 'wrong_item', 'not_as_described', 'sizing_issue', 'changed_mind', 'other'],
    required: true
  }
});

const returnSchema = new mongoose.Schema({
  order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  items:   [returnItemSchema],
  status:  {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'refunded'],
    default: 'requested'
  },
  totalRefund: { type: Number, default: 0 },
  notes:       { type: String, default: '' },
  processedAt: { type: Date, default: null },
  isDemoData:  { type: Boolean, default: false }
}, { timestamps: true });

returnSchema.index({ order: 1 });
returnSchema.index({ user: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Return', returnSchema);
