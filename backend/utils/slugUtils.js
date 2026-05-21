const Product = require('../models/Product');

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = slugify(name);
  if (!base) return null;

  let slug = base;
  let counter = 2;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Product.findOne(query).select('_id').lean();
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
};

module.exports = { slugify, generateUniqueSlug };
