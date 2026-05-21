import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { getBlogById, STATIC_BLOGS } from '../../data/staticBlogs';
import './BlogDetailPage.css';

/* Convert AI-generated markdown to HTML for DB blogs */
const markdownToHtml = (md) => {
  if (!md) return '';
  const lines = md.split('\n');
  const out = [];
  let inUl = false;

  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false; } };

  lines.forEach((raw) => {
    const line = raw.trimEnd();

    if (/^### (.+)/.test(line)) {
      closeUl();
      out.push(`<h3>${line.replace(/^### /, '')}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      closeUl();
      out.push(`<h2>${line.replace(/^## /, '')}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      closeUl();
      out.push(`<h1>${line.replace(/^# /, '')}</h1>`);
    } else if (/^- (.+)/.test(line) || /^\* (.+)/.test(line)) {
      if (!inUl) { out.push('<ul>'); inUl = true; }
      const content = line.replace(/^[-*] /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      out.push(`<li>${content}</li>`);
    } else if (/^\d+\. (.+)/.test(line)) {
      closeUl();
      const content = line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      out.push(`<p><strong>${content}</strong></p>`);
    } else if (line.trim() === '') {
      closeUl();
    } else {
      closeUl();
      const content = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
      out.push(`<p>${content}</p>`);
    }
  });
  closeUl();
  return out.join('\n');
};

/* Detect if content is markdown (DB blogs) or HTML (static blogs) */
const renderContent = (content) => {
  if (!content) return '';
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  return isHtml ? content : markdownToHtml(content);
};

const SITE_URL = 'https://classyshop.pk';

const BlogDetailPage = () => {
  const { id, slug } = useParams();
  const param = slug || id;
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [allBlogs, setAllBlogs] = useState(STATIC_BLOGS);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    setBlog(null);

    // Try static blogs first by id or slug
    const staticFound = getBlogById(param);
    if (staticFound) {
      setBlog(staticFound);
      setLoading(false);
      return;
    }

    // Fetch from API for DB blogs (slug or id)
    axios.get(`/api/blogs/${param}`)
      .then(({ data }) => {
        setBlog({
          id:       data._id || data.id,
          slug:     data.slug || data._id || data.id,
          title:    data.title,
          excerpt:  data.excerpt || '',
          category: data.category || 'General',
          author:   data.author || 'ClassyShop Team',
          date:     data.date || data.createdAt || new Date().toISOString(),
          readTime: data.readTime || '',
          views:    0,
          status:   data.status || 'published',
          image:    data.image || '',
          tags:     data.tags || [],
          content:  data.content || '',
          metaTitle:       data.metaTitle || '',
          metaDescription: data.metaDescription || '',
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [param]);

  /* Fetch all blogs for sidebar/related — merge DB + static */
  useEffect(() => {
    axios.get('/api/blogs').then(({ data }) => {
      const dbBlogs = data
        .filter(b => /^[0-9a-f]{24}$/i.test(String(b._id || b.id)))
        .map(b => ({
          id:       b._id || b.id,
          slug:     b.slug || b._id || b.id,
          title:    b.title,
          excerpt:  b.excerpt || '',
          category: b.category || 'General',
          author:   b.author || 'ClassyShop Team',
          date:     b.date || b.createdAt || '',
          readTime: b.readTime || '',
          image:    b.image || '',
          tags:     b.tags || [],
        }));
      const dbTitles = new Set(dbBlogs.map(b => b.title.toLowerCase()));
      setAllBlogs([
        ...dbBlogs,
        ...STATIC_BLOGS.filter(b => !dbTitles.has(b.title.toLowerCase())),
      ]);
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#e94560', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading article...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bdp-not-found">
        <div className="bdp-not-found-inner">
          <span className="bdp-not-found-icon">📝</span>
          <h2>Blog post not found</h2>
          <p>This article may have been moved or removed.</p>
          <button onClick={() => navigate(-1)} className="bdp-back-btn">← Go Back</button>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const relatedBlogs = allBlogs.filter(
    b => b.id !== blog.id && b.category === blog.category
  ).slice(0, 3);

  const otherBlogs = relatedBlogs.length < 3
    ? [...relatedBlogs, ...allBlogs.filter(b => b.id !== blog.id && b.category !== blog.category).slice(0, 3 - relatedBlogs.length)]
    : relatedBlogs;

  const sidebarBlogs = allBlogs.filter(b => b.id !== blog.id).slice(0, 6);
  const pageUrl  = `${SITE_URL}/blogs/${blog.slug || blog.id}`;
  const metaTitle = blog.metaTitle || `${blog.title} | ClassyShop Blog`;
  const metaDesc  = blog.metaDescription || blog.excerpt || `Read ${blog.title} on ClassyShop Blog`;
  const blogImage = blog.image || `${SITE_URL}/og-image.jpg`;

  /* Article structured data for Google */
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: metaDesc,
    image: blogImage,
    author: { '@type': 'Person', name: blog.author },
    publisher: {
      '@type': 'Organization',
      name: 'ClassyShop',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo192.png` },
    },
    datePublished: blog.date,
    dateModified: blog.date,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    keywords: (blog.tags || []).join(', '),
    articleSection: blog.category,
    url: pageUrl,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${SITE_URL}/blogs` },
      { '@type': 'ListItem', position: 3, name: blog.title, item: pageUrl },
    ],
  };

  return (
    <>
      {/* ── SEO & Structured Data ── */}
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="keywords" content={(blog.tags || []).join(', ')} />
        <meta name="author" content={blog.author} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:image" content={blogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="ClassyShop" />
        <meta property="article:author" content={blog.author} />
        <meta property="article:published_time" content={blog.date} />
        <meta property="article:section" content={blog.category} />
        {(blog.tags || []).map(tag => <meta key={tag} property="article:tag" content={tag} />)}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        <meta name="twitter:image" content={blogImage} />
        <meta name="twitter:site" content="@ClassyShopPK" />

        {/* Structured Data */}
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <div className="bdp-root">
        {/* ── Back button ── */}
        <div className="bdp-topbar">
          <div className="bdp-container">
            <button onClick={() => navigate(-1)} className="bdp-back-link">← Back</button>
            <span className="bdp-breadcrumb">
              <Link to="/">Home</Link> / <Link to="/blogs">Blog</Link> / <span>{blog.category}</span>
            </span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="bdp-hero">
          {blog.image
            ? <img src={blog.image} alt={blog.title} className="bdp-hero-img" />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }} />
          }
          <div className="bdp-hero-overlay" />
          <div className="bdp-hero-content bdp-container">
            <span className="bdp-category-tag">{blog.category}</span>
            <h1 className="bdp-title">{blog.title}</h1>
            <div className="bdp-meta">
              <span className="bdp-author">
                <span className="bdp-avatar">{(blog.author || 'C').charAt(0)}</span>
                {blog.author}
              </span>
              <span className="bdp-dot">·</span>
              <span>{new Date(blog.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {blog.readTime && <><span className="bdp-dot">·</span><span>{blog.readTime}</span></>}
              {blog.views > 0 && <><span className="bdp-dot">·</span><span>{blog.views.toLocaleString()} views</span></>}
            </div>
            {blog.tags && blog.tags.length > 0 && (
              <div className="bdp-tags">
                {blog.tags.map(tag => <span key={tag} className="bdp-tag">#{tag}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* ── Article body ── */}
        <div className="bdp-body">
          <div className="bdp-container bdp-content-grid">

            {/* Main article */}
            <article className="bdp-article" itemScope itemType="https://schema.org/Article">
              <meta itemProp="headline" content={blog.title} />
              <meta itemProp="datePublished" content={blog.date} />
              <meta itemProp="author" content={blog.author} />

              {blog.excerpt && <p className="bdp-excerpt" itemProp="description">{blog.excerpt}</p>}
              {blog.excerpt && <hr className="bdp-divider" />}

              <div
                className="bdp-content"
                itemProp="articleBody"
                dangerouslySetInnerHTML={{ __html: renderContent(blog.content) }}
              />

              {/* Share row */}
              <div className="bdp-share-row">
                <span className="bdp-share-label">Share this article:</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(blog.title + ' ' + pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bdp-share-btn whatsapp">WhatsApp</a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bdp-share-btn twitter">Twitter</a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bdp-share-btn facebook">Facebook</a>
              </div>

              {/* Author footer */}
              <div className="bdp-author-card">
                <div className="bdp-author-avatar">{(blog.author || 'C').charAt(0)}</div>
                <div>
                  <p className="bdp-author-name">{blog.author}</p>
                  <p className="bdp-author-bio">Tech writer &amp; product reviewer at ClassyShop. Passionate about gadgets, fashion, and helping Pakistani shoppers find the best deals.</p>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="bdp-sidebar">
              <div className="bdp-sidebar-card">
                <h3 className="bdp-sidebar-title">More Articles</h3>
                {sidebarBlogs.map(b => (
                  <Link key={b.id} to={`/blogs/${b.slug || b.id}`} className="bdp-sidebar-item">
                    {b.image
                      ? <img src={b.image} alt={b.title} loading="lazy" />
                      : <div style={{ width: 60, height: 50, background: '#f0f0f0', borderRadius: 6, flexShrink: 0 }} />
                    }
                    <div>
                      <p className="bdp-sidebar-item-cat">{b.category}</p>
                      <p className="bdp-sidebar-item-title">{b.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          {/* ── Related posts ── */}
          {otherBlogs.length > 0 && (
            <div className="bdp-related">
              <div className="bdp-container">
                <h2 className="bdp-related-title">You Might Also Like</h2>
                <div className="bdp-related-grid">
                  {otherBlogs.map(b => (
                    <Link key={b.id} to={`/blogs/${b.slug || b.id}`} className="bdp-related-card">
                      <div className="bdp-related-img-wrap">
                        {b.image
                          ? <img src={b.image} alt={b.title} loading="lazy" />
                          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
                        }
                      </div>
                      <div className="bdp-related-info">
                        <span className="bdp-related-cat">{b.category}</span>
                        <p className="bdp-related-card-title">{b.title}</p>
                        <p className="bdp-related-excerpt">{(b.excerpt || '').slice(0, 100)}{(b.excerpt?.length || 0) > 100 ? '...' : ''}</p>
                        {b.readTime && <span className="bdp-related-read">{b.readTime}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogDetailPage;
