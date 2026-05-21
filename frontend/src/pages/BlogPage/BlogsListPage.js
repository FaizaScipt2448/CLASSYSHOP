import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { STATIC_BLOGS } from '../../data/staticBlogs';

const CATEGORY_COLORS = {
  Electronics: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  Bags:        { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Beauty:      { bg: '#fdf4ff', color: '#7e22ce', border: '#d8b4fe' },
  Footwear:    { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  Fashion:     { bg: '#fce7f3', color: '#be185d', border: '#f9a8d4' },
  Wellness:    { bg: '#ccfbf1', color: '#065f46', border: '#5eead4' },
  Jewellery:   { bg: '#f5f3ff', color: '#4c1d95', border: '#c4b5fd' },
  Groceries:   { bg: '#ffedd5', color: '#9a3412', border: '#fdba74' },
  General:     { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

const BlogsListPage = () => {
  const [dbBlogs, setDbBlogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    axios.get('/api/blogs').then(({ data }) => {
      const real = data
        .filter(b => /^[0-9a-f]{24}$/i.test(String(b._id || b.id)))
        .map(b => ({
          id:       b._id || b.id,
          slug:     b.slug || b._id || b.id,
          title:    b.title,
          excerpt:  b.excerpt || '',
          category: b.category || 'General',
          author:   b.author || 'ClassyShop Team',
          date:     b.date || b.createdAt || new Date().toISOString(),
          readTime: b.readTime || '',
          image:    b.image || '',
          tags:     b.tags || [],
          status:   b.status || 'published',
          isNew:    true,
        }));
      setDbBlogs(real);
    }).catch(() => {});
  }, []);

  const dbTitles = new Set(dbBlogs.map(b => b.title.toLowerCase()));
  const allBlogs = [
    ...dbBlogs,
    ...STATIC_BLOGS
      .filter(b => b.status !== 'draft' && !dbTitles.has(b.title.toLowerCase()))
      .map(b => ({ ...b })),
  ];

  const categories = ['all', ...new Set(allBlogs.map(b => b.category))];

  const filtered = allBlogs.filter(b => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || b.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <>
      <Helmet>
        <title>Blog — ClassyShop | Tech Reviews, Buying Guides & More</title>
        <meta name="description" content="Read the latest tech reviews, buying guides, fashion tips, and product spotlights from ClassyShop Pakistan's expert team." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://classyshop.pk/blog" />
        <meta property="og:title" content="Blog — ClassyShop | Tech Reviews, Buying Guides & More" />
        <meta property="og:description" content="Latest articles, reviews and guides from ClassyShop Pakistan." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'ClassyShop Blog',
          url: 'https://classyshop.pk/blog',
          description: 'Tech reviews, buying guides, fashion tips, and product spotlights for Pakistani shoppers.',
          publisher: { '@type': 'Organization', name: 'ClassyShop', url: 'https://classyshop.pk' },
        })}</script>
      </Helmet>

      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)', padding: '48px 0 36px', color: '#fff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>ClassyShop Blog</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>Guides, Reviews &amp; Insights</h1>
            <p style={{ fontSize: 15, opacity: 0.75, maxWidth: 520, margin: 0 }}>Expert tech reviews, buying guides, and product spotlights to help you shop smarter in Pakistan.</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 0' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', background: '#fff' }}
            />
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              style={{ padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer' }}
            >
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, paddingBottom: 60 }}>
            {filtered.map(blog => {
              const c = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS.General;
              return (
                <Link
                  key={blog.id}
                  to={`/blogs/${blog.slug || blog.id}`}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0', transition: 'box-shadow 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Cover */}
                  <div style={{ height: 180, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                    {blog.image
                      ? <img src={blog.image} alt={blog.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
                    }
                    <span style={{ position: 'absolute', top: 10, left: 10, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                      {blog.category}
                    </span>
                    {blog.isNew && (
                      <span style={{ position: 'absolute', top: 10, right: 10, background: '#4f46e5', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>NEW</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.4, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {blog.title}
                    </h2>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, flex: 1, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {blog.excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                      <span style={{ fontWeight: 600 }}>{blog.author}</span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {blog.readTime && <span>{blog.readTime}</span>}
                        <span>{new Date(blog.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <p style={{ fontSize: 15 }}>No articles found for "{search || filterCat}".</p>
              <button onClick={() => { setSearch(''); setFilterCat('all'); }} style={{ marginTop: 12, background: '#e94560', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogsListPage;
