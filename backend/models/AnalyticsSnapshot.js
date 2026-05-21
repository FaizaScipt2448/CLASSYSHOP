const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  data: {
    totalRevenue:      { type: Number, default: 0 },
    totalOrders:       { type: Number, default: 0 },
    totalReturns:      { type: Number, default: 0 },
    returnRate:        { type: Number, default: 0 },
    newCustomers:      { type: Number, default: 0 },
    avgOrderValue:     { type: Number, default: 0 },
    topProducts:       { type: Array,  default: [] },
    categoryBreakdown: { type: Array,  default: [] },
    stockSummary:      { type: Object, default: {} }
  },
  isDemoData: { type: Boolean, default: false }
}, { timestamps: true });

analyticsSnapshotSchema.index({ date: -1, type: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
