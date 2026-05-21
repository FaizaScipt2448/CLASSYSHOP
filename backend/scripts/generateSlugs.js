/**
 * One-time migration: generate slugs for all products that don't have one.
 * Run with: node backend/scripts/generateSlugs.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugUtils');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({ $or: [{ slug: null }, { slug: '' }] })
    .select('_id name slug');

  console.log(`Found ${products.length} products without a slug`);

  const used = new Set(
    (await Product.find({ slug: { $ne: null, $ne: '' } }).select('slug').lean())
      .map(p => p.slug)
  );

  let updated = 0;

  for (const product of products) {
    let base = slugify(product.name);
    if (!base) base = product._id.toString();

    let slug = base;
    let counter = 2;
    while (used.has(slug)) {
      slug = `${base}-${counter++}`;
    }
    used.add(slug);

    await Product.updateOne({ _id: product._id }, { $set: { slug } });
    console.log(`  ${product.name} → ${slug}`);
    updated++;
  }

  console.log(`\nDone — ${updated} slugs generated.`);
  await mongoose.disconnect();
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
