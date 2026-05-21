import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import { FaStar, FaRegStar, FaFilter, FaTimes, FaSearch, FaChevronDown, FaChevronUp, FaSlidersH } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from '../../components/ProductCard/ProductCard';
import './SearchPage.css';

/* ── Inline star renderer ── */
const StarRow = ({ value, onChange }) => (
  <div className="sp-star-row">
    {[1, 2, 3, 4, 5].map(n => (
      <span
        key={n}
        className={`sp-star ${n <= value ? 'filled' : ''}`}
        onClick={() => onChange(n === value ? 0 : n)}
      >
        {n <= value ? <FaStar /> : <FaRegStar />}
      </span>
    ))}
    {value > 0 && <span className="sp-star-label">&amp; up</span>}
  </div>
);

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'popular',   label: 'Most Popular' },
  { value: 'newest',    label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc',label: 'Price: High → Low' },
  { value: 'rating',    label: 'Highest Rated' },
  { value: 'discount',  label: 'Biggest Discount' },
];

const CATEGORIES = [
  'Fashion', 'Electronics', 'Bags', 'Footwear',
  'Groceries', 'Beauty', 'Wellness', 'Jewellery'
];

const SearchPage = () => {
  const { search: locSearch } = useLocation();
  const navigate = useNavigate();
  const params   = new URLSearchParams(locSearch);

  /* ── URL-driven filter state ── */
  const [q,        setQ]        = useState(params.get('q')        || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [brand,    setBrand]    = useState(params.get('brand')    || '');
  const [minPrice, setMinPrice] = useState(Number(params.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(params.get('maxPrice')) || 100000);
  const [rating,   setRating]   = useState(Number(params.get('rating'))   || 0);
  const [color,    setColor]    = useState(params.get('color')    || '');
  const [sort,     setSort]     = useState(params.get('sort')     || 'relevance');
  const [page,     setPage]     = useState(Number(params.get('page')) || 1);

  /* ── Results state ── */
  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [brands,     setBrands]     = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [loading,    setLoading]    = useState(false);

  /* ── UI state ── */
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState({
    category: true, price: true, brand: true, rating: true
  });
  const [inputQ, setInputQ] = useState(q);

  const debounceRef = useRef(null);

  /* ── Fetch results ── */
  const fetchResults = useCallback(async (overrides = {}) => {
    setLoading(true);
    const active = {
      q, category, brand, minPrice, maxPrice, rating, color, sort, page,
      ...overrides
    };

    try {
      const { data } = await axios.get('/api/search', {
        params: {
          ...(active.q        && { q: active.q }),
          ...(active.category && { category: active.category }),
          ...(active.brand    && { brand: active.brand }),
          ...(active.minPrice > 0         && { minPrice: active.minPrice }),
          ...(active.maxPrice < 100000    && { maxPrice: active.maxPrice }),
          ...(active.rating > 0           && { rating: active.rating }),
          ...(active.color                && { color: active.color }),
          sort:  active.sort,
          page:  active.page,
          limit: 12
        }
      });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
      if (data.brands.length) setBrands(data.brands);
      setPriceRange(data.priceRange);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [q, category, brand, minPrice, maxPrice, rating, color, sort, page]);

  /* ── Run search whenever filter state changes ── */
  useEffect(() => {
    fetchResults();
    // Sync URL params
    const p = new URLSearchParams();
    if (q)        p.set('q', q);
    if (category) p.set('category', category);
    if (brand)    p.set('brand', brand);
    if (minPrice > 0)      p.set('minPrice', minPrice);
    if (maxPrice < 100000) p.set('maxPrice', maxPrice);
    if (rating > 0)        p.set('rating', rating);
    if (color)    p.set('color', color);
    if (sort !== 'relevance') p.set('sort', sort);
    if (page > 1) p.set('page', page);
    navigate(`/search?${p.toString()}`, { replace: true });
  }, [q, category, brand, minPrice, maxPrice, rating, color, sort, page]); // eslint-disable-line

  /* ── Debounced search input ── */
  const handleSearchInput = (val) => {
    setInputQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQ(val);
      setCategory('');
      setPage(1);
    }, 400);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    setQ(inputQ);
    setCategory('');
    setPage(1);
  };

  const applyFilter = (key, value) => {
    const setters = { category: setCategory, brand: setBrand, rating: setRating, color: setColor, sort: setSort };
    setters[key]?.(value);
    setPage(1);
  };

  const clearAllFilters = () => {
    setQ(''); setInputQ('');
    setCategory(''); setBrand('');
    setMinPrice(0); setMaxPrice(100000);
    setRating(0); setColor(''); setSort('relevance');
    setPage(1);
  };

  const toggleSection = (key) =>
    setFiltersExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  /* ── Active filter chips ── */
  const activeFilters = [
    ...(q        ? [{ label: `"${q}"`,          key: 'q',        clear: () => { setQ(''); setInputQ(''); setPage(1); } }] : []),
    ...(category ? [{ label: category,            key: 'category', clear: () => applyFilter('category', '') }] : []),
    ...(brand    ? [{ label: brand,               key: 'brand',    clear: () => applyFilter('brand', '') }] : []),
    ...(rating   ? [{ label: `${rating}★ & up`,  key: 'rating',   clear: () => applyFilter('rating', 0) }] : []),
    ...(color    ? [{ label: color,               key: 'color',    clear: () => applyFilter('color', '') }] : []),
    ...((minPrice > 0 || maxPrice < 100000) ? [{
      label: `Rs.${minPrice.toLocaleString()} – Rs.${maxPrice.toLocaleString()}`,
      key: 'price',
      clear: () => { setMinPrice(0); setMaxPrice(100000); setPage(1); }
    }] : [])
  ];

  const searchTitle  = q ? `"${q}" Search Results` : 'Search Products';
  const searchDesc   = q
    ? `Search results for "${q}" on ClassyShop Pakistan. Find ${total > 0 ? total + ' products' : 'products'} across Fashion, Electronics, Bags, Footwear, Beauty and more.`
    : 'Search millions of products on ClassyShop Pakistan — Fashion, Electronics, Bags, Footwear, Groceries, Beauty, Wellness, Jewellery.';

  return (
    <div className="sp-page">
      <SEOHead
        title={searchTitle}
        description={searchDesc}
        keywords={q ? `${q}, ${q} Pakistan, buy ${q} online, ClassyShop ${q}` : undefined}
        url={`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`}
        noIndex={!q}
      />
      <div className="container">

        {/* ── Search bar ── */}
        <form className="sp-search-bar" onSubmit={handleSearchSubmit}>
          <FaSearch className="sp-search-icon" />
          <input
            type="text"
            value={inputQ}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="sp-search-input"
          />
          {inputQ && (
            <button type="button" className="sp-clear-input" onClick={() => handleSearchInput('')}>
              <FaTimes />
            </button>
          )}
          <button type="submit" className="sp-search-btn">Search</button>
        </form>

        {/* ── Mobile filter toggle ── */}
        <button className="sp-mobile-filter-btn" onClick={() => setSidebarOpen(true)}>
          <FaSlidersH /> Filters {activeFilters.length > 0 && <span className="sp-filter-count">{activeFilters.length}</span>}
        </button>

        <div className="sp-layout">

          {/* ═══════════ SIDEBAR ═══════════ */}
          <aside className={`sp-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sp-sidebar-header">
              <h3><FaFilter /> Filters</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {activeFilters.length > 0 && (
                  <button className="sp-clear-all-btn" onClick={clearAllFilters}>Clear All</button>
                )}
                <button className="sp-sidebar-close" onClick={() => setSidebarOpen(false)}><FaTimes /></button>
              </div>
            </div>

            {/* Category */}
            <div className="sp-filter-section">
              <button className="sp-filter-section-header" onClick={() => toggleSection('category')}>
                <span>Category</span>
                {filtersExpanded.category ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {filtersExpanded.category && (
                <div className="sp-filter-body">
                  <label className={`sp-radio-label ${category === '' ? 'active' : ''}`}>
                    <input type="radio" name="category" value="" checked={category === ''}
                      onChange={() => applyFilter('category', '')} />
                    All Categories
                  </label>
                  {CATEGORIES.map(cat => (
                    <label key={cat} className={`sp-radio-label ${category === cat ? 'active' : ''}`}>
                      <input type="radio" name="category" value={cat} checked={category === cat}
                        onChange={() => applyFilter('category', cat)} />
                      {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="sp-filter-section">
              <button className="sp-filter-section-header" onClick={() => toggleSection('price')}>
                <span>Price Range</span>
                {filtersExpanded.price ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {filtersExpanded.price && (
                <div className="sp-filter-body">
                  <div className="sp-price-display">
                    <span>Rs.{minPrice.toLocaleString()}</span>
                    <span>Rs.{maxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    className="sp-range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={minPrice}
                    onChange={e => { setMinPrice(Number(e.target.value)); setPage(1); }}
                  />
                  <input
                    type="range"
                    className="sp-range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={maxPrice}
                    onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                  />
                  <div className="sp-price-inputs">
                    <input
                      type="number" placeholder="Min" value={minPrice || ''}
                      onChange={e => { setMinPrice(Number(e.target.value) || 0); setPage(1); }}
                      className="sp-price-input"
                    />
                    <span>–</span>
                    <input
                      type="number" placeholder="Max" value={maxPrice === 100000 ? '' : maxPrice}
                      onChange={e => { setMaxPrice(Number(e.target.value) || 100000); setPage(1); }}
                      className="sp-price-input"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Brand */}
            {brands.length > 0 && (
              <div className="sp-filter-section">
                <button className="sp-filter-section-header" onClick={() => toggleSection('brand')}>
                  <span>Brand</span>
                  {filtersExpanded.brand ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {filtersExpanded.brand && (
                  <div className="sp-filter-body sp-brand-list">
                    <label className={`sp-radio-label ${brand === '' ? 'active' : ''}`}>
                      <input type="radio" name="brand" value="" checked={brand === ''}
                        onChange={() => applyFilter('brand', '')} />
                      All Brands
                    </label>
                    {brands.slice(0, 10).map(b => (
                      <label key={b} className={`sp-radio-label ${brand === b ? 'active' : ''}`}>
                        <input type="radio" name="brand" value={b} checked={brand === b}
                          onChange={() => applyFilter('brand', b)} />
                        {b}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Rating */}
            <div className="sp-filter-section">
              <button className="sp-filter-section-header" onClick={() => toggleSection('rating')}>
                <span>Minimum Rating</span>
                {filtersExpanded.rating ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {filtersExpanded.rating && (
                <div className="sp-filter-body">
                  {[4, 3, 2, 1].map(r => (
                    <button
                      key={r}
                      className={`sp-rating-btn ${rating === r ? 'active' : ''}`}
                      onClick={() => applyFilter('rating', rating === r ? 0 : r)}
                    >
                      <StarRow value={r} onChange={() => {}} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="sp-filter-section">
              <div className="sp-filter-section-header" style={{ cursor: 'default' }}>
                <span>Color</span>
              </div>
              <div className="sp-filter-body">
                <div className="sp-color-swatches">
                  {['Red','Blue','Green','Black','White','Pink','Purple','Yellow','Orange','Brown','Navy','Grey'].map(c => (
                    <button
                      key={c}
                      title={c}
                      className={`sp-swatch ${color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
                      style={{ background: c.toLowerCase() === 'white' ? '#f5f5f5' : c.toLowerCase() }}
                      onClick={() => applyFilter('color', color.toLowerCase() === c.toLowerCase() ? '' : c)}
                    />
                  ))}
                </div>
                {color && (
                  <button className="sp-clear-color" onClick={() => applyFilter('color', '')}>
                    <FaTimes /> {color}
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Sidebar overlay (mobile) */}
          {sidebarOpen && <div className="sp-overlay" onClick={() => setSidebarOpen(false)} />}

          {/* ═══════════ MAIN CONTENT ═══════════ */}
          <div className="sp-main">

            {/* Results header */}
            <div className="sp-results-header">
              <div className="sp-results-count">
                {loading ? 'Searching...' : (
                  total > 0
                    ? <>{total} product{total !== 1 ? 's' : ''} found{q ? <> for <strong>"{q}"</strong></> : ''}</>
                    : 'No products found'
                )}
              </div>
              <div className="sp-sort-bar">
                <label>Sort by:</label>
                <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="sp-sort-select">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="sp-active-filters">
                {activeFilters.map(f => (
                  <span key={f.key} className="sp-filter-chip">
                    {f.label}
                    <button onClick={f.clear}><FaTimes /></button>
                  </span>
                ))}
                <button className="sp-clear-all-inline" onClick={clearAllFilters}>Clear all</button>
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="sp-loading-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="sp-skeleton" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="sp-no-results">
                <FaSearch className="sp-no-icon" />
                <h3>No products found</h3>
                <p>Try adjusting your filters or search with different keywords</p>
                <button className="sp-reset-btn" onClick={clearAllFilters}>Reset All Filters</button>
              </div>
            ) : (
              <div className="sp-grid">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="sp-pagination">
                <button
                  className="sp-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >← Prev</button>

                {[...Array(pages)].map((_, i) => {
                  const pg = i + 1;
                  if (pages > 7 && Math.abs(pg - page) > 2 && pg !== 1 && pg !== pages) {
                    if (pg === 2 || pg === pages - 1) return <span key={pg} className="sp-page-dots">…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={pg}
                      className={`sp-page-btn ${page === pg ? 'active' : ''}`}
                      onClick={() => setPage(pg)}
                    >{pg}</button>
                  );
                })}

                <button
                  className="sp-page-btn"
                  disabled={page === pages}
                  onClick={() => setPage(p => p + 1)}
                >Next →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
