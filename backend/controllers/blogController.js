const asyncHandler = require('express-async-handler');
const Blog = require('../models/Blog');

const STATIC_BLOGS = [
  { _id: 'blog1', slug: 'top-10-smartphones-to-buy-in-2025', title: "Top 10 Smartphones to Buy in 2025: What's Worth Your Money", excerpt: "From the iPhone 15 Pro Max to the Samsung Galaxy S24 Ultra — we break down specs, camera performance, and value for money.", category: 'Electronics', author: 'Faiza Sattar', date: new Date('2025-05-10'), image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' },
  { _id: 'blog2', slug: 'noise-cancelling-headphones-sony-vs-bose-vs-apple', title: 'Noise-Cancelling Headphones: Sony vs Bose vs Apple', excerpt: "We tested the Sony WH-1000XM5, Bose QuietComfort 45, and Apple AirPods Max in real-world conditions.", category: 'Electronics', author: 'Faiza Sattar', date: new Date('2025-05-07'), image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
  { _id: 'blog3', slug: 'best-laptop-bags-accessories-2025', title: 'Best Laptop Bags & Accessories for 2025', excerpt: "Work-from-anywhere culture means your tech gear needs to look as good as it performs.", category: 'Bags', author: 'Faiza Sattar', date: new Date('2025-05-04'), image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
  { _id: 'blog4', slug: 'smartwatches-2025-apple-watch-vs-samsung-vs-garmin', title: 'Smartwatches in 2025: Apple Watch vs Samsung vs Garmin', excerpt: "Fitness tracking, ECG, sleep monitoring — we put the three biggest smartwatch platforms head-to-head.", category: 'Electronics', author: 'Faiza Sattar', date: new Date('2025-04-30'), image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
  { _id: 'blog5', slug: 'best-wireless-earbuds-under-15000-pakistan', title: 'Best Wireless Earbuds Under Rs. 15,000 in Pakistan', excerpt: "You don't need to spend a fortune for great audio. Our picks for the best TWS earbuds in Pakistan.", category: 'Electronics', author: 'Faiza Sattar', date: new Date('2025-04-25'), image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80' },
  { _id: 'blog6', slug: 'skincare-meets-tech-smart-beauty-devices-2025', title: 'Skincare Meets Tech: Smart Beauty Devices Worth Trying', excerpt: 'From LED face masks to AI-powered skin analyzers — here\'s which gadgets actually work.', category: 'Beauty', author: 'Faiza Sattar', date: new Date('2025-04-20'), image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80' },
  { _id: 'blog7', slug: 'gaming-peripherals-guide-2025', title: 'Gaming Peripherals Guide: Keyboards, Mice & Headsets', excerpt: 'Our picks for the best mechanical keyboards, high-DPI mice, and surround-sound headsets.', category: 'Electronics', author: 'Faiza Sattar', date: new Date('2025-04-15'), image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80' },
  { _id: 'blog8', slug: 'how-to-choose-right-running-shoes', title: 'How to Choose the Right Running Shoes', excerpt: 'Modern running shoes pack carbon-fibre plates and embedded sensors. We explain what the tech means.', category: 'Footwear', author: 'Faiza Sattar', date: new Date('2025-04-10'), image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
];

// Only trust DB blogs that have a valid 24-char MongoDB ObjectId (not old static placeholders)
const isRealDbBlog = (b) => /^[0-9a-f]{24}$/i.test(String(b._id));

const getBlogs = asyncHandler(async (req, res) => {
  const { q } = req.query;

  // Fetch any real admin-added blogs from DB (those with proper MongoDB ObjectIds)
  const dbBlogs = (await Blog.find({}).sort({ date: -1 }).limit(20))
    .filter(isRealDbBlog);

  // Merge: DB blogs first (most recent), then STATIC_BLOGS (deduped by title)
  const dbTitles = new Set(dbBlogs.map(b => b.title.toLowerCase()));
  const merged = [
    ...dbBlogs,
    ...STATIC_BLOGS.filter(b => !dbTitles.has(b.title.toLowerCase())),
  ];

  if (!q) {
    return res.json(merged);
  }

  const ql = q.toLowerCase();
  const filtered = merged.filter(b =>
    b.title.toLowerCase().includes(ql) ||
    (b.category || '').toLowerCase().includes(ql) ||
    (b.excerpt || '').toLowerCase().includes(ql) ||
    (b.content || '').toLowerCase().includes(ql)
  );

  res.json(filtered.length ? filtered : merged);
});

const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Check static blogs by _id or slug
  const staticBlog = STATIC_BLOGS.find(b => b._id === id || b.slug === id);
  if (staticBlog) return res.json(staticBlog);
  // MongoDB ObjectId lookup
  if (/^[0-9a-f]{24}$/i.test(id)) {
    try {
      const blog = await Blog.findById(id);
      if (blog) return res.json(blog);
    } catch (_) {}
  } else {
    // slug-based lookup in DB
    const blog = await Blog.findOne({ slug: id });
    if (blog) return res.json(blog);
  }
  res.status(404);
  throw new Error('Blog not found');
});

const createBlog = asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, image, author, category, status, readTime, metaTitle, metaDescription, tags } = req.body;
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Blog title is required');
  }
  const resolvedStatus = status || 'published';
  const blog = await Blog.create({
    title: title.trim(),
    slug:  slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    excerpt:         excerpt         || '',
    content:         content         || '',
    image:           image           || '',
    author:          author          || 'ClassyShop Team',
    category:        category        || 'General',
    status:          resolvedStatus,
    readTime:        readTime        || '',
    metaTitle:       metaTitle       || '',
    metaDescription: metaDescription || '',
    tags:            Array.isArray(tags) ? tags : [],
    date:            new Date(),
    isFeatured:      req.body.isFeatured || false,
    publishedAt:     resolvedStatus === 'published' ? new Date() : null,
  });
  res.status(201).json(blog);
});

const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  const { title, slug, excerpt, content, image, author, category, status, readTime, metaTitle, metaDescription, tags } = req.body;
  if (title)           blog.title           = title.trim();
  if (slug)            blog.slug            = slug;
  if (excerpt  != null) blog.excerpt        = excerpt;
  if (content  != null) blog.content        = content;
  if (image    != null) blog.image          = image;
  if (author)          blog.author          = author;
  if (category)        blog.category        = category;
  if (status)          blog.status          = status;
  if (readTime != null) blog.readTime       = readTime;
  if (metaTitle != null) blog.metaTitle     = metaTitle;
  if (metaDescription != null) blog.metaDescription = metaDescription;
  if (Array.isArray(tags)) blog.tags        = tags;
  if (req.body.isFeatured !== undefined) blog.isFeatured = req.body.isFeatured;
  if (status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
  const updated = await blog.save();
  res.json(updated);
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) { res.status(404); throw new Error('Blog not found'); }
  await blog.deleteOne();
  res.json({ message: 'Blog deleted' });
});

module.exports = { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
