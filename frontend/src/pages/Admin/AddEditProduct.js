import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdClose, MdCloudUpload, MdImage, MdAutoFixHigh, MdSearch } from 'react-icons/md';
import { FaBoxOpen, FaTag } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { generateProductContent } from '../../utils/generateProductContent';
import './AddEditProduct.css';

const blank = {
  name: '', description: '', category: '', subcategory: '',
  price: '', originalPrice: '', isFeatured: 'no', isLatest: 'no', isPopular: 'no',
  countInStock: '', brand: '',
  discount: '', size: '',
  weightValue: '', weightUnit: 'g',
  packageWeightValue: '', packageWeightUnit: 'g',
  length: '', width: '', height: '', dimensionUnit: 'cm',
  bannerTitle: '', bannerEnabled: false,
  metaTitle: '', metaDescription: '', metaKeywords: '',
  slug: '',
};

/* ── Google Search Preview ── */
const SearchPreview = ({ title, slug, description, name }) => {
  const displayTitle = title || (name ? `${name} | ClassyShop Mega Store` : 'Product Title | ClassyShop Mega Store');
  const displayUrl   = `classyshop.pk/product/${slug || 'product-url'}`;
  const displayDesc  = description || 'Your product meta description will appear here in Google search results. Make it compelling to improve click-through rate.';
  return (
    <div className="ap-search-preview">
      <div className="ap-search-preview-header">
        <MdSearch style={{ fontSize: 16 }} />
        GOOGLE SEARCH PREVIEW
      </div>
      <div className="ap-search-preview-card">
        <div className="ap-search-preview-title">{displayTitle}</div>
        <div className="ap-search-preview-url">
          <span className="ap-search-preview-site">classyshop.pk</span>
          &nbsp;›&nbsp;
          <span>{slug || 'product'}</span>
        </div>
        <div className="ap-search-preview-desc">{displayDesc}</div>
      </div>
    </div>
  );
};

const AddEditProduct = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { authHeader } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [seoAiLoading, setSeoAiLoading] = useState(false);

  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubCategories, setDbSubCategories] = useState([]);
  const [mainImages, setMainImages] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const mainInputRef = useRef();
  const bannerInputRef = useRef();

  useEffect(() => {
    Promise.all([
      axios.get('/api/categories'),
      axios.get('/api/subcategories')
    ]).then(([catsRes, subsRes]) => {
      setDbCategories(catsRes.data);
      setDbSubCategories(subsRes.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    axios.get(`/api/products/${id}`).then(({ data }) => {
      setForm({
        name: data.name || '', description: data.description || '',
        category: data.category || '', subcategory: data.subcategory || '',
        price: data.price || '', originalPrice: data.originalPrice || '',
        isFeatured: data.isFeatured ? 'yes' : 'no',
        isLatest: data.isLatest ? 'yes' : 'no',
        isPopular: data.isPopular ? 'yes' : 'no',
        countInStock: data.countInStock || '', brand: data.brand || '',
        discount: data.discount || '', size: '',
        weightValue: data.weight?.value || '', weightUnit: data.weight?.unit || 'g',
        packageWeightValue: data.packageWeight?.value || '', packageWeightUnit: data.packageWeight?.unit || 'g',
        length: data.dimensions?.length || '', width: data.dimensions?.width || '',
        height: data.dimensions?.height || '', dimensionUnit: data.dimensions?.unit || 'cm',
        bannerTitle: '', bannerEnabled: false,
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        metaKeywords: data.metaKeywords || '',
        slug: data.slug || '',
      });
      if (data.image) setMainImages([{ preview: data.image, url: data.image }]);
      if (data.images?.length) setBannerImages(data.images.map(u => ({ preview: u, url: u })));
    }).catch(() => toast.error('Product not found'));
  }, [id]); // eslint-disable-line

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v) => {
    setForm(f => {
      const auto = !f.slug
        ? v.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
        : f.slug;
      return { ...f, name: v, slug: auto };
    });
  };

  const handleSlugChange = (v) => {
    set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'));
  };

  /* ── Full AI content (product details + SEO) ── */
  const generateAI = () => {
    if (!form.name.trim()) { toast.error('Enter a product name first'); return; }
    setAiLoading(true);
    try {
      const data = generateProductContent(form.name, form.price);
      setForm(f => ({
        ...f,
        description:        data.description,
        brand:              data.brand,
        category:           data.category,
        subcategory:        data.subcategory,
        originalPrice:      String(data.originalPrice),
        discount:           String(data.discount),
        countInStock:       String(data.countInStock),
        isFeatured:         data.isFeatured,
        isLatest:           data.isLatest,
        isPopular:          data.isPopular,
        weightValue:        String(data.weightValue),
        weightUnit:         data.weightUnit,
        packageWeightValue: String(data.packageWeightValue),
        packageWeightUnit:  data.packageWeightUnit,
        length:             String(data.length),
        width:              String(data.width),
        height:             String(data.height),
        dimensionUnit:      data.dimensionUnit,
        size:               data.size,
        metaTitle:          data.metaTitle,
        metaDescription:    data.metaDescription,
        metaKeywords:       data.metaKeywords,
      }));
      toast.success('AI content generated — review and adjust if needed');
    } catch {
      toast.error('Content generation failed — please try again');
    } finally {
      setAiLoading(false);
    }
  };

  /* ── SEO-only AI generation ── */
  const generateSEO = () => {
    const name = form.name.trim();
    if (!name) { toast.error('Enter a product name in Product Details first'); setActiveTab('details'); return; }
    setSeoAiLoading(true);
    try {
      const brand    = form.brand    || 'ClassyShop';
      const category = form.category || 'product';
      const desc     = form.description?.trim() || '';

      const autoSlug = name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

      const rawTitle = `${name} | ClassyShop Mega Store`;
      const metaTitle = rawTitle.length > 60 ? `${name} | ClassyShop` : rawTitle;

      const metaDescription = desc
        ? `${desc.slice(0, 120)}. Shop at ClassyShop for best prices.`.slice(0, 160)
        : `Buy ${name} online in Pakistan. ${brand} ${category} at best prices with fast delivery. Shop now at ClassyShop Mega Store.`.slice(0, 160);

      const metaKeywords = [
        name.toLowerCase(),
        brand.toLowerCase() !== 'classyshop' ? brand.toLowerCase() : null,
        category.toLowerCase(),
        `buy ${name.toLowerCase()} Pakistan`,
        `${name.toLowerCase()} price`,
        `${category.toLowerCase()} online Pakistan`,
        'ClassyShop', 'online shopping Pakistan',
      ].filter(Boolean).join(', ');

      setForm(f => ({
        ...f,
        slug:            f.slug || autoSlug,
        metaTitle,
        metaDescription,
        metaKeywords,
      }));
      toast.success('SEO fields generated successfully!');
    } catch {
      toast.error('SEO generation failed');
    } finally {
      setSeoAiLoading(false);
    }
  };

  const handleMainImages   = (e) => { const files = Array.from(e.target.files); setMainImages(prev   => [...prev,   ...files.map(f => ({ preview: URL.createObjectURL(f), file: f }))]); };
  const handleBannerImages = (e) => { const files = Array.from(e.target.files); setBannerImages(prev => [...prev,   ...files.map(f => ({ preview: URL.createObjectURL(f), file: f }))]); };
  const removeMainImage   = (i) => setMainImages(prev   => prev.filter((_, idx) => idx !== i));
  const removeBannerImage = (i) => setBannerImages(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.name.trim())      { toast.error('Product name is required');              setActiveTab('details'); return; }
    if (!form.category)         { toast.error('Please select a category');              setActiveTab('details'); return; }
    if (!form.price)            { toast.error('Price is required');                     setActiveTab('details'); return; }
    if (mainImages.length === 0){ toast.error('Please add at least one product image'); setActiveTab('details'); return; }

    setLoading(true);
    try {
      const getImageUrl = (img) => img.url || img.preview;
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand || 'ClassyShop',
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
        discount: Number(form.discount) || 0,
        countInStock: Number(form.countInStock) || 0,
        isFeatured: form.isFeatured === 'yes',
        isLatest:   form.isLatest   === 'yes',
        isPopular:  form.isPopular  === 'yes',
        image:  getImageUrl(mainImages[0]),
        images: mainImages.slice(1).map(getImageUrl),
        tags: [form.size].filter(Boolean),
        weight:         { value: Number(form.weightValue)        || 0, unit: form.weightUnit },
        packageWeight:  { value: Number(form.packageWeightValue) || 0, unit: form.packageWeightUnit },
        dimensions:     { length: Number(form.length) || 0, width: Number(form.width) || 0, height: Number(form.height) || 0, unit: form.dimensionUnit },
        productDetails: [
          form.size              ? { label: 'Size',           value: `${form.size}` }                                        : null,
          form.weightValue       ? { label: 'Weight',         value: `${form.weightValue}${form.weightUnit}` }               : null,
          form.packageWeightValue? { label: 'Package Weight', value: `${form.packageWeightValue}${form.packageWeightUnit}` } : null,
        ].filter(Boolean),
        metaTitle:       form.metaTitle,
        metaDescription: form.metaDescription,
        metaKeywords:    form.metaKeywords,
        slug:            form.slug || '',
      };

      if (isEdit) {
        await axios.put(`/api/products/${id}`, payload, authHeader());
        toast.success('Product updated!');
      } else {
        await axios.post('/api/products', payload, authHeader());
        toast.success('Product added!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const STATIC_SUBCATS = {
    fashion:     ['Men', 'Women', 'Kids'],
    electronics: ['Laptops', 'Watches', 'Mobiles', 'Telephones', 'Accessories', 'Cameras'],
    bags:        ['Men', 'Women'],
    footwear:    ['Women Footwear', 'Men Footwear'],
    wellness:    ['Fitness', 'Yoga', 'Nutrition'],
    jewellery:   ['Necklace', 'Earrings', 'Bracelets'],
    jewelry:     ['Necklace', 'Earrings', 'Bracelets'],
    beauty:      ['Makeup', 'Skincare', 'Haircare'],
    groceries:   ['Fruit & Vegetables', 'Eggs & Dairy', 'Beverages'],
  };

  const subcatOptions = (() => {
    if (!form.category) return [];
    const dbMatches = dbSubCategories.filter(s => {
      const parentSlug = s.parentCategory?.slug || '';
      const parentName = s.parentCategory?.name || '';
      return parentSlug.toLowerCase() === form.category.toLowerCase() ||
             parentName.toLowerCase() === form.category.toLowerCase();
    });
    if (dbMatches.length > 0) return dbMatches;
    const staticList = STATIC_SUBCATS[form.category.toLowerCase()] || [];
    return staticList.map(name => ({
      _id:  name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      name,
    }));
  })();

  return (
    <div className="add-product-page">

      {/* ── Header ── */}
      <div className="ap-header">
        <button className="ap-close" onClick={() => navigate('/admin/products')} title="Close">
          <MdClose />
        </button>
        <h2 className="ap-header-title">
          <span style={{ display: 'inline-block', background: '#059669', color: '#fff', padding: '4px 16px', borderRadius: 6, fontSize: 16, fontWeight: 700 }}>
            {isEdit ? 'Edit Product' : 'Add Product'}
          </span>
        </h2>

        {/* Tab buttons */}
        <div className="ap-tabs">
          <button
            className={`ap-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FaBoxOpen style={{ fontSize: 14 }} />
            Product Details
          </button>
          <button
            className={`ap-tab ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <FaTag style={{ fontSize: 13 }} />
            SEO &amp; Meta
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — PRODUCT DETAILS
      ══════════════════════════════════════ */}
      {activeTab === 'details' && (
        <div className="ap-body">

          {/* Product Name */}
          <div className="ap-field">
            <label>Product Name</label>
            <input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Enter product name" />
          </div>

          {/* AI Generate banner */}
          <div className="ap-ai-banner">
            <div className="ap-ai-banner-text">
              <MdAutoFixHigh style={{ fontSize: 20, color: '#e94560', flexShrink: 0 }} />
              <span>
                <strong>Generate with AI</strong> — enter a product name and price, then click to auto-fill description, brand, category, SEO fields, weight, dimensions, and more.
              </span>
            </div>
            <button type="button" className="ap-ai-btn" onClick={generateAI} disabled={!form.name.trim()}>
              {aiLoading
                ? <><span className="ap-ai-spinner" />Generating...</>
                : <><MdAutoFixHigh style={{ fontSize: 16 }} />Generate AI Content</>}
            </button>
          </div>

          {/* Description */}
          <div className="ap-field">
            <label>Product Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Enter product description..." rows={5} />
          </div>

          {/* Category / SubCategory / Price */}
          <div className="ap-grid-4">
            <div className="ap-field">
              <label>Product Category</label>
              <select value={form.category} onChange={e => { set('category', e.target.value); set('subcategory', ''); }}>
                <option value="">-- Select Category --</option>
                {dbCategories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label>Product Sub Category</label>
              <select value={form.subcategory} onChange={e => set('subcategory', e.target.value)} disabled={!form.category}>
                <option value="">-- Select Sub Category --</option>
                {subcatOptions.map(s => <option key={s._id} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            <div className="ap-field">
              <label>Product Price (Rs.)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" min="0" />
            </div>
          </div>

          {/* Old Price / Featured / Stock / Brand */}
          <div className="ap-grid-4">
            <div className="ap-field">
              <label>Old Price (Rs.)</label>
              <input type="number" value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="ap-field">
              <label>Is Featured?</label>
              <select value={form.isFeatured} onChange={e => set('isFeatured', e.target.value)}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="ap-field">
              <label>Product Stock</label>
              <input type="number" value={form.countInStock} onChange={e => set('countInStock', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="ap-field">
              <label>Product Brand</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
            </div>
          </div>

          {/* Latest / Popular / Discount */}
          <div className="ap-grid-4">
            <div className="ap-field">
              <label>Is Latest?</label>
              <select value={form.isLatest} onChange={e => set('isLatest', e.target.value)}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="ap-field">
              <label>Is Popular?</label>
              <select value={form.isPopular} onChange={e => set('isPopular', e.target.value)}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="ap-field">
              <label>Discount (%)</label>
              <input type="number" value={form.discount} onChange={e => set('discount', e.target.value)} placeholder="0" min="0" max="100" />
            </div>
          </div>

          {/* Weight / Size */}
          <div className="ap-grid-4">
            <div className="ap-field">
              <label>Product Weight</label>
              <input type="number" value={form.weightValue} onChange={e => set('weightValue', e.target.value)} placeholder="500" min="0" />
            </div>
            <div className="ap-field">
              <label>Weight Unit</label>
              <select value={form.weightUnit} onChange={e => set('weightUnit', e.target.value)}>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pcs">pcs</option>
              </select>
            </div>
            <div className="ap-field">
              <label>Product Size</label>
              <input value={form.size} onChange={e => set('size', e.target.value)} placeholder="e.g. M, L, XL" />
            </div>
          </div>

          {/* Package Details */}
          <div className="ap-section">
            <h3>Product Weight &amp; Package Details</h3>
            <div className="ap-grid-4">
              <div className="ap-field">
                <label>Package Weight</label>
                <input type="number" value={form.packageWeightValue} onChange={e => set('packageWeightValue', e.target.value)} placeholder="650" min="0" />
              </div>
              <div className="ap-field">
                <label>Package Unit</label>
                <select value={form.packageWeightUnit} onChange={e => set('packageWeightUnit', e.target.value)}>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
              <div className="ap-field">
                <label>Dimension Unit</label>
                <select value={form.dimensionUnit} onChange={e => set('dimensionUnit', e.target.value)}>
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                </select>
              </div>
            </div>
            <div className="ap-grid-4">
              <div className="ap-field">
                <label>Length</label>
                <input type="number" value={form.length} onChange={e => set('length', e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="ap-field">
                <label>Width</label>
                <input type="number" value={form.width} onChange={e => set('width', e.target.value)} placeholder="0" min="0" />
              </div>
              <div className="ap-field">
                <label>Height</label>
                <input type="number" value={form.height} onChange={e => set('height', e.target.value)} placeholder="0" min="0" />
              </div>
            </div>
          </div>

          {/* Media & Images */}
          <div className="ap-section">
            <h3>Media &amp; Images</h3>
            <div className="ap-images-row">
              {mainImages.map((img, i) => (
                <div key={i} className="ap-image-thumb">
                  <img src={img.preview} alt="" />
                  <button className="ap-img-remove" onClick={() => removeMainImage(i)}>✕</button>
                </div>
              ))}
              <div className="ap-upload-box" onClick={() => mainInputRef.current.click()}>
                <MdImage className="ap-upload-icon" />
                <span>Image Upload</span>
                <input ref={mainInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleMainImages} />
              </div>
            </div>
          </div>

          {/* Banner Images */}
          <div className="ap-section">
            <div className="ap-section-toggle">
              <h3>Banner Images</h3>
              <label className="ap-toggle">
                <input type="checkbox" checked={form.bannerEnabled} onChange={e => set('bannerEnabled', e.target.checked)} />
                <span className="ap-toggle-slider" />
              </label>
            </div>
            {form.bannerEnabled && (
              <div className="ap-images-row">
                {bannerImages.map((img, i) => (
                  <div key={i} className="ap-image-thumb">
                    <img src={img.preview} alt="" />
                    <button className="ap-img-remove" onClick={() => removeBannerImage(i)}>✕</button>
                  </div>
                ))}
                <div className="ap-upload-box" onClick={() => bannerInputRef.current.click()}>
                  <MdImage className="ap-upload-icon" />
                  <span>Image Upload</span>
                  <input ref={bannerInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleBannerImages} />
                </div>
              </div>
            )}
          </div>

          {form.bannerEnabled && (
            <div className="ap-section">
              <h3>Banner Title</h3>
              <input className="ap-banner-title-input" value={form.bannerTitle} onChange={e => set('bannerTitle', e.target.value)} placeholder="Enter banner title..." />
            </div>
          )}

          {/* Next tab hint */}
          <div className="ap-tab-hint" onClick={() => setActiveTab('seo')}>
            <FaTag style={{ fontSize: 13 }} />
            <span>Done with product details? <strong>Add SEO &amp; Meta →</strong></span>
          </div>

          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — SEO & META
      ══════════════════════════════════════ */}
      {activeTab === 'seo' && (
        <div className="ap-body">

          {/* Page heading */}
          <div className="ap-seo-page-header">
            <div className="ap-seo-page-icon"><MdSearch /></div>
            <div>
              <h3 className="ap-seo-page-title">SEO &amp; Meta Details</h3>
              <p className="ap-seo-page-sub">These fields control how search engines display this product. Leaving them blank will fall back to the product name and description.</p>
            </div>
          </div>

          {/* SEO AI banner */}
          <div className="ap-ai-banner ap-seo-ai-banner">
            <div className="ap-ai-banner-text">
              <MdAutoFixHigh style={{ fontSize: 20, color: '#e94560', flexShrink: 0 }} />
              <span>
                <strong>Generate SEO Content</strong> — auto-generate meta title, description, keywords, and URL slug based on your product name and details.
              </span>
            </div>
            <button type="button" className="ap-ai-btn" onClick={generateSEO} disabled={!form.name.trim()}>
              {seoAiLoading
                ? <><span className="ap-ai-spinner" />Generating...</>
                : <><MdAutoFixHigh style={{ fontSize: 16 }} />Generate SEO Content</>}
            </button>
          </div>

          {/* URL Slug */}
          <div className="ap-seo-field-wrap">
            <label className="ap-seo-label">
              URL SLUG
              <span className="ap-seo-label-hint">The clean URL for this product page</span>
            </label>
            <div className="ap-slug-wrap">
              <span className="ap-slug-prefix">/product/</span>
              <input
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-name"
              />
            </div>
            <span className="ap-field-hint">Leave blank to auto-generate. Only lowercase letters, numbers, and hyphens allowed.</span>
          </div>

          {/* Meta Title */}
          <div className="ap-seo-field-wrap">
            <label className="ap-seo-label">
              META TITLE
              <span className="ap-seo-label-hint">(IDEAL: 50–60 CHARACTERS)</span>
            </label>
            <input
              className="ap-seo-input"
              value={form.metaTitle}
              onChange={e => set('metaTitle', e.target.value)}
              placeholder={form.name ? `${form.name} | ClassyShop Mega Store` : 'Page title for search engines'}
              maxLength={70}
            />
            <div className="ap-seo-field-footer">
              <span className="ap-seo-hint-text">Appears in browser tab and Google search results.</span>
              <span className={`ap-char-count ${form.metaTitle.length > 60 ? 'warn' : ''}`}>
                {form.metaTitle.length}/60
              </span>
            </div>
          </div>

          {/* Meta Description */}
          <div className="ap-seo-field-wrap">
            <label className="ap-seo-label">
              META DESCRIPTION
              <span className="ap-seo-label-hint">(IDEAL: 150–160 CHARACTERS)</span>
            </label>
            <textarea
              className="ap-seo-input ap-seo-textarea"
              value={form.metaDescription}
              onChange={e => set('metaDescription', e.target.value)}
              placeholder="Brief description for search engines (150–160 characters recommended)"
              rows={4}
              maxLength={160}
            />
            <div className="ap-seo-field-footer">
              <span className="ap-seo-hint-text">The snippet shown below your URL in search results.</span>
              <span className={`ap-char-count ${form.metaDescription.length > 160 ? 'warn' : ''}`}>
                {form.metaDescription.length}/160
              </span>
            </div>
          </div>

          {/* Meta Keywords */}
          <div className="ap-seo-field-wrap">
            <label className="ap-seo-label">
              META KEYWORDS
              <span className="ap-seo-label-hint">(COMMA-SEPARATED)</span>
            </label>
            <input
              className="ap-seo-input"
              value={form.metaKeywords}
              onChange={e => set('metaKeywords', e.target.value)}
              placeholder="e.g. handbag, leather bag, women bag, fashion accessories"
            />
            <span className="ap-seo-hint-text">While most modern search engines ignore keywords, they're useful for internal site search.</span>
          </div>

          {/* Google Search Preview */}
          <SearchPreview
            title={form.metaTitle}
            slug={form.slug}
            description={form.metaDescription}
            name={form.name}
          />

          <div style={{ height: 24 }} />
        </div>
      )}

      {/* ── Sticky Footer ── */}
      <div className="ap-footer">
        {activeTab === 'details' ? (
          <button className="ap-publish-btn" onClick={handleSubmit} disabled={loading}>
            <MdCloudUpload style={{ fontSize: 20 }} />
            {loading ? 'Saving...' : 'PUBLISH AND VIEW'}
          </button>
        ) : (
          <button className="ap-publish-btn ap-seo-save-btn" onClick={handleSubmit} disabled={loading}>
            <MdCloudUpload style={{ fontSize: 20 }} />
            {loading ? 'Saving...' : 'SAVE SEO DETAILS'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AddEditProduct;
