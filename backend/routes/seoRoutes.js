const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');

const SITE_URL = (process.env.SITE_URL || 'https://classyshop.pk').replace(/\/$/, '');

/* ── GET /sitemap.xml ── */
router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [products, categories] = await Promise.all([
    Product.find({ isActive: true })
      .select('slug _id updatedAt')
      .lean(),
    Category.find({})
      .select('slug updatedAt')
      .lean(),
  ]);

  const esc = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const urlEntry = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const staticUrls = [
    { loc: `${SITE_URL}/`,        lastmod: today, changefreq: 'daily',   priority: '1.0' },
    { loc: `${SITE_URL}/search`,  lastmod: today, changefreq: 'weekly',  priority: '0.7' },
  ];

  const categoryUrls = categories.map(cat => ({
    loc:        `${SITE_URL}/category/${cat.slug}`,
    lastmod:    cat.updatedAt ? cat.updatedAt.toISOString().split('T')[0] : today,
    changefreq: 'weekly',
    priority:   '0.8',
  }));

  const productUrls = products.map(p => ({
    loc:        `${SITE_URL}/product/${p.slug || p._id}`,
    lastmod:    p.updatedAt ? p.updatedAt.toISOString().split('T')[0] : today,
    changefreq: 'weekly',
    priority:   '0.7',
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">${
  [...staticUrls, ...categoryUrls, ...productUrls].map(urlEntry).join('')
}
</urlset>`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
}));

/* ── GET /robots.txt ── */
router.get('/robots.txt', (req, res) => {
  const content = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /register
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /order/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(content);
});

module.exports = router;
