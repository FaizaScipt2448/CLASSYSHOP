const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:           { type: String, required: true },
  slug:            { type: String, default: '' },
  excerpt:         { type: String, default: '' },
  content:         { type: String, default: '' },
  image:           { type: String, default: '' },
  author:          { type: String, default: 'ClassyShop Team' },
  category:        { type: String, default: 'General' },
  status:          { type: String, enum: ['draft', 'published', 'scheduled'], default: 'published' },
  readTime:        { type: String, default: '' },
  metaTitle:       { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  tags:            { type: [String], default: [] },
  date:            { type: Date, default: Date.now },
  isFeatured:      { type: Boolean, default: false },
  publishedAt:     { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
