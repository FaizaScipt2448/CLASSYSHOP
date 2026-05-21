import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdAdd, MdSearch, MdAccessTime, MdPerson, MdVisibility, MdEdit, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DUMMY_BLOGS = [
  {
    id: 1,
    title: 'Top 10 Smartphones to Buy in 2025: What\'s Worth Your Money',
    excerpt: 'From the iPhone 15 Pro Max to the Samsung Galaxy S24 Ultra — we break down specs, camera performance, and value for money to help you pick the right phone this year.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: '2025-05-10',
    readTime: '6 min read',
    status: 'published',
    views: 4812,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    tags: ['Smartphones', 'Tech Reviews', 'Buying Guide'],
  },
  {
    id: 2,
    title: 'Noise-Cancelling Headphones: Sony vs Bose vs Apple — The Ultimate Showdown',
    excerpt: 'We tested the Sony WH-1000XM5, Bose QuietComfort 45, and Apple AirPods Max in real-world conditions. Here\'s how they compare on sound, comfort, and battery life.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: '2025-05-07',
    readTime: '8 min read',
    status: 'published',
    views: 3290,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    tags: ['Headphones', 'Audio', 'Comparison'],
  },
  {
    id: 3,
    title: 'How to Style Your Tech: The Best Laptop Bags & Accessories for 2025',
    excerpt: 'Work-from-anywhere culture means your tech gear needs to look as good as it performs. We\'ve curated the best sleeves, totes, and backpacks that blend fashion with function.',
    category: 'Bags',
    author: 'Faiza Sattar',
    date: '2025-05-04',
    readTime: '5 min read',
    status: 'published',
    views: 2105,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    tags: ['Accessories', 'Style', 'Laptop Bags'],
  },
  {
    id: 4,
    title: 'Smartwatches in 2025: Apple Watch vs Samsung Galaxy Watch vs Garmin',
    excerpt: 'Fitness tracking, ECG, sleep monitoring, and LTE connectivity — we put the three biggest smartwatch platforms head-to-head to find out which one deserves your wrist.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: '2025-04-30',
    readTime: '7 min read',
    status: 'published',
    views: 3877,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    tags: ['Smartwatch', 'Wearables', 'Fitness Tech'],
  },
  {
    id: 5,
    title: 'The Best Wireless Earbuds Under Rs. 15,000 in Pakistan',
    excerpt: 'You don\'t need to spend a fortune for great audio. We\'ve tested dozens of TWS earbuds available in Pakistan and picked the ones that give you the best bang for your rupee.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: '2025-04-25',
    readTime: '5 min read',
    status: 'published',
    views: 5631,
    image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&q=80',
    tags: ['Earbuds', 'Budget Tech', 'Pakistan'],
  },
  {
    id: 6,
    title: 'Skincare Meets Tech: Smart Beauty Devices Worth Trying in 2025',
    excerpt: 'From LED face masks to ultrasonic cleansers and AI-powered skin analyzers, beauty technology is booming. Here\'s our guide to which gadgets actually work.',
    category: 'Beauty',
    author: 'Faiza Sattar',
    date: '2025-04-20',
    readTime: '6 min read',
    status: 'published',
    views: 2944,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    tags: ['Beauty Tech', 'Skincare', 'Gadgets'],
  },
  {
    id: 7,
    title: 'Gaming Peripherals Guide: Best Keyboards, Mice & Headsets for 2025',
    excerpt: 'Level up your gaming setup with our picks for the best mechanical keyboards, high-DPI mice, and surround-sound headsets — across budget, mid-range, and premium tiers.',
    category: 'Electronics',
    author: 'Faiza Sattar',
    date: '2025-04-15',
    readTime: '9 min read',
    status: 'draft',
    views: 0,
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&q=80',
    tags: ['Gaming', 'Peripherals', 'PC Setup'],
  },
  {
    id: 8,
    title: 'How to Choose the Right Running Shoes: A Tech-Driven Approach',
    excerpt: 'Modern running shoes pack carbon-fibre plates, energy-return foam, and embedded sensors. We explain what the tech actually means and which shoes are worth the investment.',
    category: 'Footwear',
    author: 'Faiza Sattar',
    date: '2025-04-10',
    readTime: '5 min read',
    status: 'published',
    views: 1788,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    tags: ['Running', 'Footwear Tech', 'Sports'],
  },
];

const CATEGORY_COLORS = {
  Electronics: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Bags:        { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Beauty:      { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
  Footwear:    { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  Fashion:     { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
};

const AdminBlogs = () => {
  const navigate = useNavigate();
  const { authHeader } = useAuth();
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [apiBlogs, setApiBlogs]     = useState([]);

  const fetchBlogs = () => {
    axios.get('/api/admin/blogs', authHeader()).then(({ data }) => {
      const realDbBlogs = data.filter(b => /^[0-9a-f]{24}$/i.test(String(b._id || b.id)));
      const normalized = realDbBlogs.map(b => ({
        id:       b._id || b.id,
        slug:     b.slug || b._id || b.id,
        title:    b.title,
        excerpt:  b.excerpt || '',
        category: b.category || 'General',
        author:   b.author || 'ClassyShop Team',
        date:     b.date || b.createdAt || new Date().toISOString(),
        readTime: b.readTime || '',
        status:   b.status || 'published',
        views:    0,
        image:    b.image || '',
        tags:     b.tags || [],
        isReal:   true,
      }));
      setApiBlogs(normalized);
    }).catch(() => {});
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await axios.delete(`/api/admin/blogs/${id}`, authHeader());
      toast.success('Blog deleted');
      fetchBlogs();
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  // Merge: real DB blogs first (newest), then DUMMY_BLOGS
  const allBlogs = [
    ...apiBlogs,
    ...DUMMY_BLOGS.filter(d => !apiBlogs.some(a => a.title.toLowerCase() === d.title.toLowerCase())),
  ];

  const categories = ['all', ...new Set(allBlogs.map(b => b.category))];

  const filtered = allBlogs.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === 'all'    || b.category === filterCat;
    const matchStatus = filterStatus === 'all' || b.status   === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const published  = allBlogs.filter(b => b.status === 'published').length;
  const totalViews = allBlogs.reduce((s, b) => s + (b.views || 0), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1><span style={{ display: 'inline-block', background: '#8b5cf6', color: '#fff', padding: '5px 20px', borderRadius: 6, fontSize: 22, fontWeight: 800 }}>Blogs</span></h1>
          <p className="text-sm text-slate-500 mt-2">Tech articles, buying guides, and product spotlights</p>
        </div>
        <Link
          to="/admin/blogs/create"
          style={{ background: '#4f46e5', color: '#fff', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <MdAdd size={18} /> Add Blog
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Posts',    value: allBlogs.length,    color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Published',      value: published,          color: '#059669', bg: '#ecfdf5' },
          { label: 'Total Views',    value: totalViews.toLocaleString('en-PK'), color: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-4" style={{ background: s.bg, border: `1.5px solid ${s.color}30` }}>
            <div>
              <p className="text-xs font-semibold uppercase" style={{ color: s.color, opacity: 0.75 }}>{s.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search blogs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white"
        >
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <span className="text-sm text-slate-400 font-medium">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Blog Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(blog => {
          const catStyle = CATEGORY_COLORS[blog.category] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
          return (
            <div key={blog.id} className="rounded-2xl overflow-hidden shadow-sm flex flex-col"
              style={{ border: '1.5px solid #e2e8f0', background: '#fff', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Cover image */}
              <div style={{ height: 155, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                <img
                  src={blog.image}
                  alt={blog.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                {/* Status badge */}
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  background: blog.status === 'published' ? '#059669' : '#f59e0b',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  padding: '3px 10px', borderRadius: 20,
                }}>
                  {blog.status === 'published' ? 'Published' : 'Draft'}
                </span>
                {blog.isReal && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: '#4f46e5', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                    NEW
                  </span>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Category + tags */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}>
                    {blog.category}
                  </span>
                  {blog.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 leading-snug mb-2" style={{ fontSize: 15 }}>
                  {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1" style={{
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {blog.excerpt}
                </p>

                {/* Meta row */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><MdPerson size={14} />{blog.author}</span>
                    <span className="flex items-center gap-1"><MdAccessTime size={14} />{blog.readTime}</span>
                    {blog.views > 0 && (
                      <span className="flex items-center gap-1"><MdVisibility size={14} />{blog.views.toLocaleString('en-PK')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{new Date(blog.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {blog.isReal && (
                      <button
                        onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <MdEdit size={14} />
                      </button>
                    )}
                    {blog.isReal && (
                      <button
                        onClick={() => handleDelete(blog.id)}
                        style={{ background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <MdDelete size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-400 text-sm font-medium">No blogs found matching your filters.</p>
        </div>
      )}

    </div>
  );
};

export default AdminBlogs;
