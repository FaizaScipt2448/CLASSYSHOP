const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "Eid", "Winter", "Summer"
  startMonth: { type: Number, required: true, min: 1, max: 12 },
  endMonth:   { type: Number, required: true, min: 1, max: 12 },
  demandMultiplier: { type: Number, default: 1.0 }, // 1.8 = 80% more demand
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Season', seasonSchema);
