import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import { FaTh, FaList, FaChevronUp, FaChevronDown, FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import ProductCard from '../../components/ProductCard/ProductCard';
import { useCart } from '../../context/CartContext';
import './CategoryPage.css';

const ALL_CATEGORIES = ['Fashion', 'Electronics', 'Bags', 'Footwear', 'Groceries', 'Beauty', 'Wellness', 'Jewellery'];

const StarDisplay = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push(<FaStar key={i} />);
    else if (i === Math.ceil(rating) && rating % 1) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return <span className="filter-stars">{stars}</span>;
};

// List view product row
const ProductListItem = ({ product }) => {
  const { addToCart, cartItems, updateQty, removeFromCart } = useCart();
  const cartItem = cartItems.find(i => i._id === product._id);
  const inCart = !!cartItem;

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };
  const handleQty = (e, delta) => {
    e.preventDefault();
    const nq = (cartItem?.qty || 0) + delta;
    if (nq < 1) removeFromCart(product._id);
    else updateQty(product._id, nq);
  };

  return (
    <Link to={`/product/${product.slug || product._id}`} className="list-product-item">
      <div className="list-product-img">
        {product.discount > 0 && <span className="list-discount-badge">{product.discount}%</span>}
        <img src={product.image} alt={product.name} />
      </div>
      <div className="list-product-info">
        <p className="list-brand">{product.brand}</p>
        <h3 className="list-name">{product.name}</h3>
        <p className="list-desc">{product.description}</p>
        <div className="list-stars">
          {[1,2,3,4,5].map(i => i <= Math.round(product.rating)
            ? <FaStar key={i} /> : <FaRegStar key={i} />)}
        </div>
        <div className="list-price-row">
          {product.originalPrice > product.price && (
            <span className="list-orig">Rs.{product.originalPrice.toLocaleString()}</span>
          )}
          <span className="list-sale">Rs.{product.price.toLocaleString()}</span>
        </div>
        {inCart ? (
          <div className="list-qty-ctrl" onClick={e => e.preventDefault()}>
            <button onClick={e => handleQty(e, -1)}>−</button>
            <span>{cartItem.qty}</span>
            <button onClick={e => handleQty(e, 1)}>+</button>
          </div>
        ) : (
          <button className="list-add-btn" onClick={handleAdd}>
            <FaShoppingCart /> ADD TO CART
          </button>
        )}
      </div>
    </Link>
  );
};

const CategoryPage = () => {
  const { slug } = useParams();
  const location = useLocation();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('name-az');
  const [catOpen, setCatOpen] = useState(true);

  // Filters
  const [checkedCats, setCheckedCats] = useState([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(60000);
  const [maxPossible, setMaxPossible] = useState(60000);
  const [checkedRatings, setCheckedRatings] = useState([]);

  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const subSlug = new URLSearchParams(location.search).get('sub') || '';

  useEffect(() => {
    setCheckedCats([categoryName]);
    fetchProducts(categoryName, subSlug);
  }, [slug, subSlug]);

  const fetchProducts = async (cat, sub) => {
    setLoading(true);
    try {
      const url = sub
        ? `/api/products?category=${cat}&subcategory=${sub}`
        : `/api/products?category=${cat}`;
      const { data } = await axios.get(url);
      setAllProducts(data);
      if (data.length > 0) {
        const max = Math.max(...data.map(p => p.price));
        setMaxPossible(max);
        setPriceMax(max);
      }
    } catch { console.error('Error'); }
    finally { setLoading(false); }
  };

  const fetchByCategories = useCallback(async (cats) => {
    setLoading(true);
    try {
      const requests = cats.map(c => axios.get(`/api/products?category=${c}`));
      const results = await Promise.all(requests);
      const combined = results.flatMap(r => r.data);
      setAllProducts(combined);
      if (combined.length > 0) {
        const max = Math.max(...combined.map(p => p.price));
        setMaxPossible(max);
        setPriceMax(prev => Math.min(prev, max));
      }
    } catch { console.error('Error'); }
    finally { setLoading(false); }
  }, []);

  const toggleCat = (cat) => {
    let updated;
    if (checkedCats.includes(cat)) {
      updated = checkedCats.filter(c => c !== cat);
    } else {
      updated = [...checkedCats, cat];
    }
    setCheckedCats(updated);
    if (updated.length > 0) fetchByCategories(updated);
    else setAllProducts([]);
  };

  const toggleRating = (r) => {
    setCheckedRatings(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  // Apply filters + sort
  const filtered = allProducts.filter(p => {
    if (p.price < priceMin || p.price > priceMax) return false;
    if (checkedRatings.length > 0 && !checkedRatings.some(r => Math.round(p.rating) >= r)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name-az') return a.name.localeCompare(b.name);
    if (sortBy === 'name-za') return b.name.localeCompare(a.name);
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const handleMinPrice = (e) => {
    const v = Number(e.target.value);
    if (v < priceMax) setPriceMin(v);
  };
  const handleMaxPrice = (e) => {
    const v = Number(e.target.value);
    if (v > priceMin) setPriceMax(v);
  };

  const CAT_KEYWORDS = {
    Fashion:     'fashion online Pakistan, clothes, dresses, kurta, jeans, shirts Pakistan',
    Electronics: 'electronics Pakistan, mobiles, headphones, smartwatch, laptop accessories',
    Bags:        'bags Pakistan, handbags, tote bags, leather bags, women bags online',
    Footwear:    'shoes Pakistan, sneakers, heels, sandals, running shoes online',
    Groceries:   'groceries online Pakistan, organic food, household essentials, supermarket',
    Beauty:      'beauty products Pakistan, makeup, skincare, lipstick, foundation online',
    Wellness:    'wellness products Pakistan, vitamins, supplements, health products',
    Jewellery:   'jewellery Pakistan, gold earrings, necklace, rings, bracelets online',
  };

  return (
    <div className="cat-page">
      <SEOHead
        title={`${categoryName} — Shop Online in Pakistan`}
        description={`Buy ${categoryName} products online in Pakistan at ClassyShop. Browse the latest ${categoryName} collection with best prices and fast delivery.`}
        keywords={CAT_KEYWORDS[categoryName] || `${categoryName} Pakistan, buy ${categoryName} online`}
        url={`/category/${slug}`}
        breadcrumbs={[{ name: categoryName, url: `/category/${slug}` }]}
      />
      <div className="cat-layout">
        {/* ── Left Sidebar ── */}
        <aside className="cat-sidebar">

          {/* Shop by Category */}
          <div className="filter-block">
            <div className="filter-block-header" onClick={() => setCatOpen(!catOpen)}>
              <span>Shop by Category</span>
              <button className="collapse-btn">{catOpen ? <FaChevronUp /> : <FaChevronDown />}</button>
            </div>
            {catOpen && (
              <div className="filter-block-body">
                {ALL_CATEGORIES.map(cat => (
                  <label key={cat} className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={checkedCats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      style={{ accentColor: '#e94560' }}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Filter by Price */}
          <div className="filter-block">
            <div className="filter-block-header">
              <span>Filter By Price</span>
            </div>
            <div className="filter-block-body price-filter">
              <div className="price-slider-wrap">
                <input
                  type="range"
                  min={0}
                  max={maxPossible}
                  value={priceMin}
                  onChange={handleMinPrice}
                  className="price-range range-min"
                />
                <input
                  type="range"
                  min={0}
                  max={maxPossible}
                  value={priceMax}
                  onChange={handleMaxPrice}
                  className="price-range range-max"
                />
              </div>
              <div className="price-labels">
                <span>From: <strong>Rs: {priceMin.toLocaleString()}</strong></span>
                <span>From: <strong>Rs: {priceMax.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Filter by Rating */}
          <div className="filter-block">
            <div className="filter-block-header">
              <span>Filter By Rating</span>
            </div>
            <div className="filter-block-body">
              {[5, 4, 3, 2, 1].map(r => (
                <label key={r} className="filter-checkbox-row">
                  <input
                    type="checkbox"
                    checked={checkedRatings.includes(r)}
                    onChange={() => toggleRating(r)}
                    style={{ accentColor: '#e94560' }}
                  />
                  <StarDisplay rating={r} />
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="cat-main">
          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="toolbar-left">
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaList />
              </button>
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FaTh />
              </button>
              <span className="product-count">
                There are <strong>{sorted.length}</strong> products.
              </span>
            </div>
            <div className="toolbar-right">
              <span className="sort-label">Sort By</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="name-az">Name, A to Z</option>
                <option value="name-za">Name, Z to A</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className="cat-loading">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="cat-empty">
              <p>No products found matching your filters.</p>
              <button onClick={() => { setPriceMin(0); setPriceMax(maxPossible); setCheckedRatings([]); }}>
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="cat-grid">
              {sorted.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          ) : (
            <div className="cat-list">
              {sorted.map(p => <ProductListItem key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
