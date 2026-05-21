import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import { FaChevronLeft, FaChevronRight, FaTruck, FaChevronDown, FaFire, FaThumbsUp } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './HomePage.css';

// Hero slides data
const heroSlides = [
  {
    tag: 'EXCLUSIVE OFFER',
    discount: '-40% OFF',
    title: 'Quality Freshness\nGuaranteed!',
    subtitle: "Only this week. Don't miss...",
    price: 'Rs.850',
    btnText: 'Shop Now',
    link: '/category/groceries',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
    bg: '#f0f7f4'
  },
  {
    tag: 'NEW ARRIVAL',
    discount: '-30% OFF',
    title: 'Latest Fashion\nTrends 2024',
    subtitle: 'Limited time offer. Shop now!',
    price: 'Rs.1,299',
    btnText: 'Shop Now',
    link: '/category/fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
    bg: '#fff8f0'
  },
  {
    tag: 'HOT DEALS',
    discount: '-25% OFF',
    title: 'Premium Electronics\nAt Best Price',
    subtitle: "Don't miss these amazing deals!",
    price: 'Rs.15,000',
    btnText: 'Shop Now',
    link: '/category/electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop',
    bg: '#f0f4ff'
  }
];

// Fallback static categories if DB is empty
const FALLBACK_CATEGORIES = [
  { name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=120&h=120&fit=crop' },
  { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=120&h=120&fit=crop' },
  { name: 'Bags', slug: 'bags', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&h=120&fit=crop' },
  { name: 'Footwear', slug: 'footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&h=120&fit=crop' },
  { name: 'Groceries', slug: 'groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop' },
  { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop' },
  { name: 'Wellness', slug: 'wellness', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=120&h=120&fit=crop' },
  { name: 'Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&h=120&fit=crop' }
];

const POPULAR_TABS = ['Fashion', 'Electronics', 'Bags', 'Footwear', 'Groceries', 'Beauty', 'Wellness'];

const CAT_PASTEL = {
  fashion:     { bg: '#fce7f3', border: '#f9a8d4', text: '#be185d' },
  electronics: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  bags:        { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  footwear:    { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  groceries:   { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  beauty:      { bg: '#fdf4ff', border: '#d8b4fe', text: '#7e22ce' },
  wellness:    { bg: '#ccfbf1', border: '#5eead4', text: '#065f46' },
  jewellery:   { bg: '#f5f3ff', border: '#c4b5fd', text: '#4c1d95' },
};

const TAB_COLORS = {
  Fashion:     { bg: '#fce7f3', color: '#be185d', activeBg: '#db2777' },
  Electronics: { bg: '#dbeafe', color: '#1d4ed8', activeBg: '#2563eb' },
  Bags:        { bg: '#fef3c7', color: '#92400e', activeBg: '#d97706' },
  Footwear:    { bg: '#dcfce7', color: '#166534', activeBg: '#16a34a' },
  Groceries:   { bg: '#ffedd5', color: '#9a3412', activeBg: '#ea580c' },
  Beauty:      { bg: '#fdf4ff', color: '#7e22ce', activeBg: '#9333ea' },
  Wellness:    { bg: '#ccfbf1', color: '#065f46', activeBg: '#0d9488' },
};

const getProductCategory = (product = {}) => {
  const category = product.category;
  if (typeof category === 'string') return category;
  return category?.name || category?.slug || '';
};

const getProductKey = (product = {}) => {
  if (product._id) return product._id;
  return [
    product.name,
    product.brand,
    product.price,
    product.image
  ].map(value => String(value || '').trim().toLowerCase()).join('|');
};

const uniqueProducts = (products = []) => {
  const seen = new Set();
  return products.filter(product => {
    const key = getProductKey(product);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const dealBanners = [
  { bg: '#1a3c5e', title: 'Smart Deals Trending Smartphones', sub: 'Exchange Available!', price: 'from Rs.6,299', btn: 'Shop Now', link: '/category/electronics', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&h=140&fit=crop' },
  { bg: '#f5a623', title: 'Cold Drinks & Snacks', sub: 'Up to 33% OFF', price: '', btn: 'Shop Now', link: '/category/groceries', image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=200&h=140&fit=crop' },
  { bg: '#4a90d9', title: 'Best Deals On Fashion', sub: 'Min. 50% Off', price: '', btn: 'Shop Now', link: '/category/fashion', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&h=140&fit=crop' },
  { bg: '#1e5c8a', title: 'Winter Savings Carnival', sub: 'Up to 50% OFF', price: '', btn: 'Shop Now', link: '/category/fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=140&fit=crop' }
];

const blogs = [
  { title: 'Shaping sustainable growth for the future solutions', excerpt: "We are excited to hear from you! Whether you're looking for strategic insights, customized solu...", date: '2025-01-17', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&h=200&fit=crop' },
  { title: 'Empowering change, delivering every single time success', excerpt: "We are excited to hear from you! Whether you're looking for strategic insights, customized solu...", date: '2025-01-17', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&h=200&fit=crop' },
  { title: 'Delivering measurable results and precision through proven', excerpt: "We are excited to hear from you! Whether you're looking for strategic insights, customized solu...", date: '2025-01-17', image: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=300&h=200&fit=crop' },
  { title: 'Shaping sustainable growth for the future solutions', excerpt: "We are excited to hear from you! Whether you're looking for strategic insights, customized solu...", date: '2025-01-17', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop' }
];

const HomePage = () => {
  const { user } = useAuth();
  const [heroIdx, setHeroIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('Fashion');
  const [popularProducts, setPopularProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [midSlideIdx, setMidSlideIdx] = useState(0);

  // Mid section slides data
  const midSlides = [
    {
      image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=500&h=380&fit=crop',
      title: 'Buy New Trend Women Black Cotton Blend Top | top for women | women top...',
      subtitle: 'Big saving days sale',
      price: 'Rs.1,500.00',
      link: '/category/fashion',
      bg: '#f5ede0'
    },
    {
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b984b?w=500&h=380&fit=crop',
      title: 'Exclusive Women Embroidered Rayon Anarkali Kurti Collection',
      subtitle: 'Special weekend sale',
      price: 'Rs.1,600.00',
      link: '/category/fashion',
      bg: '#f0f0f8'
    },
    {
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=380&fit=crop',
      title: 'Premium Men Collection Regular Fit Designer Shirts & Jackets',
      subtitle: 'Trending this season',
      price: 'Rs.850.00',
      link: '/category/fashion',
      bg: '#f0f7f4'
    }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const [pop, lat, feat, cats, trending, all] = await Promise.all([
        axios.get('/api/products?popular=true&limit=24'),
        axios.get('/api/products?latest=true&limit=24'),
        axios.get('/api/products?featured=true&limit=24'),
        axios.get('/api/categories'),
        axios.get('/api/recommendations/trending?limit=8'),
        axios.get('/api/products?limit=100')
      ]);
      const products = Array.isArray(all.data) ? all.data : [];
      setAllProducts(products);
      setPopularProducts(pop.data.length ? pop.data : products);
      setLatestProducts(lat.data.length ? lat.data : products);
      setFeaturedProducts(feat.data.length ? feat.data : products);
      setDbCategories(cats.data.length > 0 ? cats.data : []);
      setTrendingProducts(trending.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch personalized recommendations after user context is available
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const params = user ? `?userId=${user._id}&limit=8` : '?limit=8';
        const { data } = await axios.get(`/api/recommendations/personalized${params}`);
        setRecommendedProducts(data);
      } catch {}
    };
    fetchRecs();
  }, [user]);

  const categoryIcons = dbCategories.length > 0 ? dbCategories : FALLBACK_CATEGORIES;

  const activeCategoryProducts = allProducts.filter(p =>
    getProductCategory(p).toLowerCase() === activeTab.toLowerCase()
  );

  const filteredPopular = popularProducts.filter(p =>
    getProductCategory(p).toLowerCase() === activeTab.toLowerCase()
  );

  const popularCategoryProducts = uniqueProducts([
    ...filteredPopular,
    ...activeCategoryProducts,
  ]);
  const popularFallbackProducts = uniqueProducts([
    ...popularProducts,
    ...allProducts,
    ...latestProducts,
    ...featuredProducts,
  ]).filter(product => !popularCategoryProducts.some(item => getProductKey(item) === getProductKey(product)));
  const popularDisplayProducts = uniqueProducts([
    ...popularCategoryProducts,
    ...popularFallbackProducts,
  ]).slice(0, 12);

  const slide = heroSlides[heroIdx];

  return (
    <div className="home-page">
      <SEOHead
        title="Online Shopping Pakistan — Fashion, Electronics, Beauty & More"
        description="Shop the latest Fashion, Electronics, Bags, Footwear, Beauty, Wellness, Jewellery & Groceries at ClassyShop Pakistan. Best prices, fast delivery, and exclusive deals."
        keywords="online shopping Pakistan, buy fashion online, electronics Pakistan, beauty products, bags Pakistan, footwear sale, groceries online, jewellery Pakistan"
        url="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'ClassyShop Product Categories',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Fashion', url: 'https://classyshop.pk/category/fashion' },
            { '@type': 'ListItem', position: 2, name: 'Electronics', url: 'https://classyshop.pk/category/electronics' },
            { '@type': 'ListItem', position: 3, name: 'Bags', url: 'https://classyshop.pk/category/bags' },
            { '@type': 'ListItem', position: 4, name: 'Footwear', url: 'https://classyshop.pk/category/footwear' },
            { '@type': 'ListItem', position: 5, name: 'Beauty', url: 'https://classyshop.pk/category/beauty' },
            { '@type': 'ListItem', position: 6, name: 'Wellness', url: 'https://classyshop.pk/category/wellness' },
            { '@type': 'ListItem', position: 7, name: 'Jewellery', url: 'https://classyshop.pk/category/jewellery' },
            { '@type': 'ListItem', position: 8, name: 'Groceries', url: 'https://classyshop.pk/category/groceries' },
          ],
        }}
      />
      {/* Hero Slider */}
      <div className="hero-slider" style={{ background: slide.bg }}>
        <button className="hero-btn prev" onClick={() => setHeroIdx((heroIdx - 1 + heroSlides.length) % heroSlides.length)}>
          <FaChevronLeft />
        </button>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-tags">
              <span className="exclusive-tag">{slide.tag}</span>
              <span className="discount-tag">{slide.discount}</span>
            </div>
            <h1>{slide.title.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}</h1>
            <p>{slide.subtitle}</p>
            <div className="hero-price">from <strong>{slide.price}</strong></div>
            <Link to={slide.link} className="hero-shop-btn">{slide.btnText} &rarr;</Link>
          </div>
          <div className="hero-image">
            <img src={slide.image} alt="hero" />
          </div>
        </div>
        <button className="hero-btn next" onClick={() => setHeroIdx((heroIdx + 1) % heroSlides.length)}>
          <FaChevronRight />
        </button>
        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <span key={i} className={`dot ${i === heroIdx ? 'active' : ''}`} onClick={() => setHeroIdx(i)} />
          ))}
        </div>
      </div>

      {/* Category Icons */}
      <div className="section category-icons-section">
        <div className="container">
          <div className="category-icons-grid">
            {categoryIcons.map(cat => {
              const cp = CAT_PASTEL[cat.slug] || CAT_PASTEL.fashion;
              return (
                <Link key={cat.slug} to={`/category/${cat.slug}`} className="cat-icon-item"
                  style={{ background: cp.bg, borderColor: cp.border }}>
                  <div className="cat-icon-img">
                    <img src={cat.image} alt={cat.name} />
                  </div>
                  <span style={{ color: cp.text, fontWeight: 700 }}>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Products */}
      <div className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>
                <span style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>Popular Products</span>
              </h2>
              <p style={{ marginTop: 8 }}>
                <span style={{ display: 'inline-block', background: '#eff6ff', color: '#3b82f6', padding: '3px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Do not miss the current offers until the end of March.</span>
              </p>
            </div>
            <div className="tab-bar" style={{ border: 'none', gap: 6 }}>
              {POPULAR_TABS.map(tab => {
                const tc = TAB_COLORS[tab] || { bg: '#f1f5f9', color: '#475569', activeBg: '#64748b' };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    className="tab-btn"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: isActive ? tc.activeBg : tc.bg,
                      color: isActive ? '#fff' : tc.color,
                      border: 'none',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: 0,
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                );
              })}
              <button className="tab-more"><FaChevronDown /></button>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="products-slider-container">
              <div className="products-grid">
                {popularDisplayProducts.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trending Now */}
      {trendingProducts.length > 0 && (
        <div className="section">
          <div className="container">
            <div className="section-header simple">
              <h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f97316', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>
                  <FaFire /> Trending Now
                </span>
              </h2>
              <Link to="/search?sort=popular" className="view-all-link">View All →</Link>
            </div>
            <div className="products-grid">
              {trendingProducts.slice(0, 6).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommended For You */}
      {recommendedProducts.length > 0 && (
        <div className="section" style={{ background: '#fff8f9' }}>
          <div className="container">
            <div className="section-header simple">
              <h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0ea5e9', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>
                  <FaThumbsUp />
                  {user ? `Recommended for You, ${user.name.split(' ')[0]}` : 'Recommended for You'}
                </span>
              </h2>
              <Link to={user ? `/search?sort=rating` : '/search'} className="view-all-link">View All →</Link>
            </div>
            <div className="products-grid">
              {recommendedProducts.slice(0, 6).map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mid Promo Section */}
      <div className="section mid-promo-section">
        <div className="container">
          <div className="mid-promo-layout">
            {/* Left: Big Slider */}
            <div className="mid-slider" style={{ background: midSlides[midSlideIdx].bg }}>
              <button className="mid-btn prev" onClick={() => setMidSlideIdx((midSlideIdx - 1 + midSlides.length) % midSlides.length)}>
                <FaChevronLeft />
              </button>
              <div className="mid-slide-content">
                <img src={midSlides[midSlideIdx].image} alt="promo" />
                <div className="mid-slide-text">
                  <span className="mid-sub">{midSlides[midSlideIdx].subtitle}</span>
                  <h3>{midSlides[midSlideIdx].title}</h3>
                  <p>Starting At Only <strong className="mid-price">{midSlides[midSlideIdx].price}</strong></p>
                  <Link to={midSlides[midSlideIdx].link} className="mid-shop-btn">SHOP NOW</Link>
                </div>
              </div>
              <button className="mid-btn next" onClick={() => setMidSlideIdx((midSlideIdx + 1) % midSlides.length)}>
                <FaChevronRight />
              </button>
              <div className="mid-dots">
                {midSlides.map((_, i) => (
                  <span key={i} className={`dot ${i === midSlideIdx ? 'active' : ''}`} onClick={() => setMidSlideIdx(i)} />
                ))}
              </div>
            </div>
            {/* Right: Small Banners */}
            <div className="mid-banners">
              <div className="mini-banner">
                <div className="mini-banner-text">
                  <p>Buy Men Bags with very low price</p>
                  <span className="mini-price">Rs.1500</span>
                  <Link to="/category/bags" className="mini-shop">SHOP NOW</Link>
                </div>
                <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=140&h=110&fit=crop" alt="bag" />
              </div>
              <div className="mini-banner">
                <div className="mini-banner-text">
                  <p>Buy women items with low price</p>
                  <span className="mini-price">Rs.485</span>
                  <Link to="/category/fashion" className="mini-shop">SHOP NOW</Link>
                </div>
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=140&h=110&fit=crop" alt="women" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Shipping Banner */}
      <div className="section">
        <div className="container">
          <div className="free-shipping-banner">
            <FaTruck className="shipping-icon" />
            <div className="shipping-text">
              <strong>FREE SHIPPING</strong>
              <span>Free Delivery Now On Your First Order and over Rs.10,000</span>
            </div>
            <div className="shipping-price">- Only Rs.10,000*</div>
          </div>
        </div>
      </div>

      {/* 3 Promo Banners */}
      <div className="section">
        <div className="container">
          <div className="promo-banners-3">
            <div className="promo-banner-item" style={{ background: '#e8f5f0' }}>
              <div>
                <h4>Buy Apple iPhone 15 256GB Black</h4>
                <span className="promo-price">Rs.65,000</span>
                <Link to="/category/electronics" className="promo-shop">SHOP NOW</Link>
              </div>
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=160&h=120&fit=crop" alt="iphone" />
            </div>
            <div className="promo-banner-item" style={{ background: '#f5f0f8' }}>
              <div>
                <h4>Buy women items with low price</h4>
                <span className="promo-price">Rs.485</span>
                <Link to="/category/fashion" className="promo-shop">SHOP NOW</Link>
              </div>
              <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=160&h=120&fit=crop" alt="fashion" />
            </div>
            <div className="promo-banner-item" style={{ background: '#f0f4fa' }}>
              <div>
                <h4>Buy Men Bags with very low price</h4>
                <span className="promo-price">Rs.1,500</span>
                <Link to="/category/bags" className="promo-shop">SHOP NOW</Link>
              </div>
              <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=160&h=120&fit=crop" alt="bag" />
            </div>
          </div>
        </div>
      </div>

      {/* Latest Products */}
      <div className="section">
        <div className="container">
          <div className="section-header simple">
            <h2>
              <span style={{ display: 'inline-block', background: '#0d9488', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>Latest Products</span>
            </h2>
          </div>
          <div className="products-grid">
            {latestProducts.slice(0, 6).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="section">
        <div className="container">
          <div className="section-header simple">
            <h2>
              <span style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>Featured Products</span>
            </h2>
          </div>
          <div className="products-grid">
            {featuredProducts.slice(0, 6).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Deal Banners */}
      <div className="section">
        <div className="container">
          <div className="deal-banners">
            {dealBanners.map((b, i) => (
              <div key={i} className="deal-banner" style={{ background: b.bg }}>
                <div className="deal-text">
                  <h4>{b.title}</h4>
                  <p>{b.sub}</p>
                  {b.price && <span className="deal-price">{b.price}</span>}
                  <Link to={b.link} className="deal-btn">{b.btn}</Link>
                </div>
                <img src={b.image} alt={b.title} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* From The Blog */}
      <div className="section">
        <div className="container">
          <div className="section-header simple">
            <h2>
              <span style={{ display: 'inline-block', background: '#8b5cf6', color: '#fff', padding: '5px 20px', borderRadius: 6, fontWeight: 700, fontSize: 18 }}>From The Blog</span>
            </h2>
          </div>
          <div className="blog-grid">
            {blogs.map((blog, i) => (
              <div key={i} className="blog-card">
                <div className="blog-img">
                  <img src={blog.image} alt={blog.title} />
                  <span className="blog-date">&#128336; {blog.date}</span>
                </div>
                <div className="blog-content">
                  <h4>{blog.title}</h4>
                  <p>{blog.excerpt}</p>
                  <Link to="/blog" className="read-more">Read More &gt;</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
