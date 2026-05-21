import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MdArrowBack, MdAdd, MdClose, MdImage, MdSave, MdPublish, MdAutoFixHigh } from 'react-icons/md';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Electronics', 'Fashion', 'Bags', 'Footwear', 'Beauty', 'Wellness', 'Jewellery', 'Groceries', 'General'];
const SUGGESTED_TAGS = ['Tech Review', 'Buying Guide', 'Tips & Tricks', 'New Arrival', 'Trending', 'Sale', 'How-To', 'Comparison', 'Top 10', 'Pakistan'];

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AddEditBlog = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { authHeader } = useAuth();

  const [form, setForm] = useState({
    title:           '',
    slug:            '',
    category:        '',
    author:          'Faiza Sattar',
    status:          'draft',
    publishDate:     new Date().toISOString().slice(0, 10),
    readTime:        '',
    coverImage:      '',
    excerpt:         '',
    content:         '',
    metaTitle:       '',
    metaDescription: '',
  });
  const [tags, setTags]             = useState([]);
  const [tagInput, setTagInput]     = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [blogAiLoading, setBlogAiLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    axios.get(`/api/admin/blogs/${id}`, authHeader()).then(({ data }) => {
      setForm({
        title:           data.title || '',
        slug:            data.slug  || '',
        category:        data.category || '',
        author:          data.author || 'Faiza Sattar',
        status:          data.status || 'draft',
        publishDate:     (data.date || data.createdAt || new Date().toISOString()).slice(0, 10),
        readTime:        data.readTime || '',
        coverImage:      data.image || '',
        excerpt:         data.excerpt || '',
        content:         data.content || '',
        metaTitle:       data.metaTitle || '',
        metaDescription: data.metaDescription || '',
      });
      setTags(data.tags || []);
    }).catch(() => toast.error('Failed to load blog'));
  }, [id, isEdit]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleTitle = (e) => {
    const val = e.target.value;
    set('title', val);
    set('slug', slugify(val));
    if (!form.metaTitle) set('metaTitle', val);
  };

  const addTag = (tag) => {
    const t = tag.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  const handleSave = async (status) => {
    if (!form.title.trim()) { toast.error('Blog title is required'); return; }
    setSaveLoading(true);
    try {
      const payload = {
        title:           form.title.trim(),
        slug:            form.slug || slugify(form.title),
        excerpt:         form.excerpt,
        content:         form.content,
        image:           form.coverImage,
        author:          form.author,
        category:        form.category || 'General',
        status,
        readTime:        form.readTime,
        metaTitle:       form.metaTitle,
        metaDescription: form.metaDescription,
        tags,
      };
      if (isEdit) {
        await axios.put(`/api/admin/blogs/${id}`, payload, authHeader());
      } else {
        await axios.post('/api/admin/blogs', payload, authHeader());
      }
      toast.success(status === 'published' ? 'Blog published successfully!' : 'Blog saved as draft!');
      navigate('/admin/blogs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setSaveLoading(false);
    }
  };

  const generateBlogAI = () => {
    const title = form.title.trim();
    if (!title) { toast.error('Enter a blog title first'); return; }
    setBlogAiLoading(true);
    setTimeout(() => {
      try {
        const cat = form.category || 'General';
        const topicBase = title
          .replace(/^(top \d+\s+|best\s+|how to\s+|guide to\s+|the\s+)/i, '')
          .replace(/(\s+in \d{4}|\s+guide|\s+review)$/i, '')
          .trim();

        const catTagMap = {
          Electronics: ['Tech Review', 'Buying Guide', 'Top 10', 'Trending', 'Pakistan'],
          Fashion:     ['Style Guide', 'Fashion Tips', 'Trending', 'New Arrival', 'Pakistan'],
          Beauty:      ['Skincare Tips', 'Buying Guide', 'Beauty Hacks', 'Trending', 'Pakistan'],
          Bags:        ['Style Guide', 'Buying Guide', 'Top 10', 'Trending', 'Pakistan'],
          Footwear:    ['Shoe Guide', 'Buying Guide', 'Top 10', 'Trending', 'Pakistan'],
          Wellness:    ['Health Tips', 'Wellness', 'Fitness', 'Nutrition', 'Pakistan'],
          Jewellery:   ['Jewellery Guide', 'Style Tips', 'Buying Guide', 'Trending', 'Pakistan'],
          Groceries:   ['Food Guide', 'Healthy Living', 'Tips & Tricks', 'Pakistan'],
        };
        const suggestedTags = catTagMap[cat] || ['Buying Guide', 'Tips & Tricks', 'Top 10', 'Pakistan'];

        const excerpt = `Looking for the best ${topicBase.toLowerCase()}? This expert guide covers everything you need to know — from top picks to buying tips — so you can shop smarter at ClassyShop.`;
        const metaTitle = title.length <= 50
          ? `${title} — Expert Guide | ClassyShop`
          : `${title} | ClassyShop Blog`;
        const metaDescription = `${excerpt}`.slice(0, 160);

        const content = `## Introduction

${excerpt} Whether you're a first-time buyer or looking to upgrade, this guide has everything covered.

## What Makes a Great ${topicBase}?

When shopping for ${topicBase.toLowerCase()}, keep these key factors in mind:

- **Quality & Durability** — Check materials, build quality, and brand reputation.
- **Value for Money** — Compare prices across different options before deciding.
- **Customer Reviews** — Real reviews from verified buyers tell the full story.
- **After-Sale Support** — Choose products backed by warranty and good service.

## Our Top Picks

Here are some of the best ${topicBase.toLowerCase()} available at ClassyShop right now:

### 1. Best Overall
A top-rated option that balances quality and price perfectly. Loved by thousands of customers across Pakistan.

### 2. Best Budget Pick
Great value without compromising on quality. Perfect for shoppers looking to save while getting a reliable product.

### 3. Premium Choice
If budget isn't a concern, this is the one to go for — premium build, exceptional performance, outstanding satisfaction.

## Tips Before You Buy

1. **Set a budget** — Know your price range before browsing to avoid overspending.
2. **Read the specs** — Don't rely on marketing alone; check the actual specifications.
3. **Check return policy** — Make sure you can return or exchange if the product doesn't meet expectations.
4. **Watch for deals** — ClassyShop regularly runs sales, discount codes, and seasonal offers.

## Why Shop at ClassyShop?

ClassyShop is Pakistan's leading online mega store, offering:
- Genuine products from top brands
- Fast nationwide delivery
- Easy returns and exchanges
- Secure payment options including Cash on Delivery

## Conclusion

Finding the right ${topicBase.toLowerCase()} doesn't have to be complicated. With the right information and a trusted store like ClassyShop, you can shop confidently and get exactly what you need. Browse our ${cat} collection today and take advantage of the best deals in Pakistan.`;

        setForm(f => ({ ...f, excerpt, content, metaTitle, metaDescription }));
        setTags(suggestedTags);
        toast.success('AI content generated! Review and customize as needed.');
      } catch {
        toast.error('Generation failed, please try again');
      } finally {
        setBlogAiLoading(false);
      }
    }, 700);
  };

  const fieldClass = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white";
  const labelClass = "block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/blogs" style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <MdArrowBack size={22} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Blog' : 'Add New Blog'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? 'Update your blog post below' : 'Fill in all fields and publish or save as draft'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saveLoading}
            style={{ background: '#f1f5f9', color: '#475569', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saveLoading ? 0.7 : 1 }}
          >
            <MdSave size={16} /> {saveLoading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saveLoading}
            style={{ background: '#4f46e5', color: '#fff', padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: saveLoading ? 0.7 : 1 }}
          >
            <MdPublish size={16} /> {saveLoading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>


      <div className="grid gap-6 xl:grid-cols-3">

        {/* ── Left (main content) ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* AI Banner */}
          <div className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf4ff 100%)', border: '1.5px solid #fecdd3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e94560', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdAutoFixHigh style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#9f1239', margin: 0 }}>Generate with AI</p>
                <p style={{ fontSize: 12, color: '#fb7185', margin: 0 }}>Enter a title &amp; category, then click to auto-fill excerpt, full article, SEO fields, and tags.</p>
              </div>
            </div>
            <button
              onClick={generateBlogAI}
              disabled={!form.title.trim() || blogAiLoading}
              style={{
                background: !form.title.trim() ? '#fecdd3' : 'linear-gradient(135deg, #e94560 0%, #c0392b 100%)',
                color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px',
                fontSize: 13, fontWeight: 700, cursor: !form.title.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                boxShadow: form.title.trim() ? '0 4px 14px rgba(233,69,96,0.35)' : 'none',
              }}
            >
              {blogAiLoading ? (
                <><span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />Generating...</>
              ) : (
                <><MdAutoFixHigh style={{ fontSize: 16 }} />Generate AI Content</>
              )}
            </button>
          </div>

          {/* Basic info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Basic Information</h2>

            <div>
              <label className={labelClass}>Blog Title *</label>
              <input
                type="text"
                placeholder="e.g. Top 10 Smartphones to Buy in 2025"
                value={form.title}
                onChange={handleTitle}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Slug (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 whitespace-nowrap">/blogs/</span>
                <input
                  type="text"
                  placeholder="auto-generated-from-title"
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                  className={fieldClass}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Auto-filled from title. Edit if needed.</p>
            </div>

            <div>
              <label className={labelClass}>Excerpt / Short Summary *</label>
              <textarea
                rows={3}
                placeholder="A brief 2–3 sentence description shown in blog cards and search results..."
                value={form.excerpt}
                onChange={e => set('excerpt', e.target.value)}
                className={fieldClass}
                style={{ resize: 'vertical' }}
              />
              <p className="text-xs text-slate-400 mt-1">{form.excerpt.length} / 200 characters recommended</p>
            </div>
          </div>

          {/* Main content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Blog Content</h2>
            <div>
              <label className={labelClass}>Full Article Body *</label>
              <textarea
                rows={18}
                placeholder={`Write your full blog post here...\n\nYou can use:\n## Headings\n**Bold text**\n- Bullet points\n\nAdd sections, subheadings, product links, and any relevant content.`}
                value={form.content}
                onChange={e => set('content', e.target.value)}
                className={fieldClass}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 }}
              />
              <p className="text-xs text-slate-400 mt-1">{form.content.split(/\s+/).filter(Boolean).length} words</p>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">SEO Settings</h2>

            <div>
              <label className={labelClass}>Meta Title</label>
              <input
                type="text"
                placeholder="SEO title (defaults to blog title if empty)"
                value={form.metaTitle}
                onChange={e => set('metaTitle', e.target.value)}
                className={fieldClass}
              />
              <p className="text-xs mt-1" style={{ color: form.metaTitle.length > 60 ? '#dc2626' : '#94a3b8' }}>
                {form.metaTitle.length}/60 characters {form.metaTitle.length > 60 && '— too long, may be cut off in search results'}
              </p>
            </div>

            <div>
              <label className={labelClass}>Meta Description</label>
              <textarea
                rows={3}
                placeholder="Short description for search engines (150–160 characters ideal)..."
                value={form.metaDescription}
                onChange={e => set('metaDescription', e.target.value)}
                className={fieldClass}
                style={{ resize: 'none' }}
              />
              <p className="text-xs mt-1" style={{ color: form.metaDescription.length > 160 ? '#dc2626' : '#94a3b8' }}>
                {form.metaDescription.length}/160 characters {form.metaDescription.length > 160 && '— too long'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right (sidebar settings) ─────────────────────────────── */}
        <div className="space-y-5">

          {/* Publish settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Publish Settings</h2>

            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={fieldClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Publish Date</label>
              <input
                type="date"
                value={form.publishDate}
                onChange={e => set('publishDate', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>Estimated Read Time</label>
              <input
                type="text"
                placeholder="e.g. 5 min read"
                value={form.readTime}
                onChange={e => set('readTime', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Category & Author */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Category & Author</h2>

            <div>
              <label className={labelClass}>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={fieldClass}>
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Author Name</label>
              <input
                type="text"
                value={form.author}
                onChange={e => set('author', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Cover image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Cover Image</h2>

            <div>
              <label className={labelClass}>Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.coverImage}
                onChange={e => set('coverImage', e.target.value)}
                className={fieldClass}
              />
            </div>

            {form.coverImage ? (
              <div className="rounded-xl overflow-hidden" style={{ height: 150 }}>
                <img
                  src={form.coverImage}
                  alt="Cover preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="rounded-xl flex flex-col items-center justify-center gap-2"
                style={{ height: 120, background: '#f8fafc', border: '2px dashed #e2e8f0' }}>
                <MdImage size={28} style={{ color: '#cbd5e1' }} />
                <p className="text-xs text-slate-400">Preview will appear here</p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tags</h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type tag + Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                className={fieldClass}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => addTag(tagInput)}
                style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', cursor: 'pointer' }}
              >
                <MdAdd size={18} />
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                    #{tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', display: 'flex', padding: 0, marginLeft: 2 }}>
                      <MdClose size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 mb-2">Suggested tags:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(t => (
                  <button key={t} onClick={() => addTag(t)}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 bg-white"
                    style={{ cursor: 'pointer' }}>
                    +{t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleSave('published')}
              disabled={saveLoading}
              style={{ background: saveLoading ? '#818cf8' : '#4f46e5', color: '#fff', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <MdPublish size={18} /> {saveLoading ? 'Publishing...' : 'Publish Post'}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saveLoading}
              style={{ background: '#f1f5f9', color: '#475569', padding: '11px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <MdSave size={18} /> {saveLoading ? 'Saving...' : 'Save as Draft'}
            </button>
            <Link
              to="/admin/blogs"
              style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddEditBlog;
