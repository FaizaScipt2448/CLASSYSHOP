import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShoppingCart, FaHeart, FaUser, FaSearch, FaBars, FaTimes,
  FaRocket, FaMapMarkerAlt, FaBoxOpen, FaSignOutAlt, FaPlus, FaMinus, FaTrash, FaCheckCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

// Per-category pastel pill colors
const CAT_COLORS = {
  fashion:     { bg: '#fce7f3', color: '#be185d', border: '#f9a8d4', dot: '#be185d' },
  electronics: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', dot: '#1d4ed8' },
  bags:        { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', dot: '#d97706' },
  footwear:    { bg: '#dcfce7', color: '#166534', border: '#86efac', dot: '#16a34a' },
  groceries:   { bg: '#ffedd5', color: '#9a3412', border: '#fdba74', dot: '#ea580c' },
  beauty:      { bg: '#fdf4ff', color: '#7e22ce', border: '#d8b4fe', dot: '#9333ea' },
  wellness:    { bg: '#ccfbf1', color: '#065f46', border: '#5eead4', dot: '#0d9488' },
  jewellery:   { bg: '#f5f3ff', color: '#4c1d95', border: '#c4b5fd', dot: '#7c3aed' },
};

// Nav categories with hover dropdowns
const navCategories = [
  {
    name: 'Fashion', slug: 'fashion',
    sub: [
      { name: 'Men',   slug: 'fashion-men' },
      { name: 'Women', slug: 'fashion-women' },
      { name: 'Kids',  slug: 'fashion-kids' }
    ]
  },
  {
    name: 'Electronics', slug: 'electronics',
    sub: [
      { name: 'Mobiles',     slug: 'electronics-mobiles' },
      { name: 'Laptops',     slug: 'electronics-laptops' },
      { name: 'Smart Watch', slug: 'electronics-smartwatch' },
      { name: 'Accessories', slug: 'electronics-accessories' },
      { name: 'Cameras',     slug: 'electronics-cameras' }
    ]
  },
  {
    name: 'Bags', slug: 'bags',
    sub: [
      { name: 'Men Bags',   slug: 'bags-men' },
      { name: 'Women Bags', slug: 'bags-women' }
    ]
  },
  {
    name: 'Footwear', slug: 'footwear',
    sub: [
      { name: 'Men Footwear',   slug: 'footwear-men' },
      { name: 'Women Footwear', slug: 'footwear-women' }
    ]
  },
  {
    name: 'Groceries', slug: 'groceries',
    sub: [
      { name: 'Fruits & Vegetables', slug: 'groceries-fruits' },
      { name: 'Dairy & Eggs',        slug: 'groceries-dairy' },
      { name: 'Beverages',           slug: 'groceries-beverages' }
    ]
  },
  {
    name: 'Beauty', slug: 'beauty',
    sub: [
      { name: 'Skincare', slug: 'beauty-skincare' },
      { name: 'Makeup',   slug: 'beauty-makeup' },
      { name: 'Haircare', slug: 'beauty-haircare' }
    ]
  },
  {
    name: 'Wellness', slug: 'wellness',
    sub: [
      { name: 'Fitness',   slug: 'wellness-fitness' },
      { name: 'Nutrition', slug: 'wellness-nutrition' },
      { name: 'Yoga',      slug: 'wellness-yoga' }
    ]
  },
  {
    name: 'Jewellery', slug: 'jewellery',
    sub: [
      { name: 'Necklaces', slug: 'jewellery-necklaces' },
      { name: 'Earrings',  slug: 'jewellery-earrings' },
      { name: 'Bracelets', slug: 'jewellery-bracelets' }
    ]
  }
];

// Sidebar categories with nested subcategories
const sidebarCategories = [
  {
    name: 'Fashion', slug: 'fashion',
    children: [
      { name: 'Men',   slug: 'fashion-men',   children: [{ name: 'T-shirts', slug: 'fashion-men-tshirts' }, { name: 'Jeans', slug: 'fashion-men-jeans' }] },
      { name: 'Women', slug: 'fashion-women', children: [{ name: 'Kurtas',   slug: 'fashion-women-kurtas' }, { name: 'Tops',  slug: 'fashion-women-tops' }] },
      { name: 'Kids',  slug: 'fashion-kids',  children: [{ name: 'Boys',     slug: 'fashion-kids-boys' },   { name: 'Girls', slug: 'fashion-kids-girls' }] }
    ]
  },
  { name: 'Electronics', slug: 'electronics', children: [{ name: 'Mobiles', slug: 'electronics-mobiles', children: [] }, { name: 'Laptops', slug: 'electronics-laptops', children: [] }, { name: 'Smart Watch', slug: 'electronics-smartwatch', children: [] }, { name: 'Accessories', slug: 'electronics-accessories', children: [] }, { name: 'Cameras', slug: 'electronics-cameras', children: [] }] },
  { name: 'Bags',     slug: 'bags',     children: [{ name: 'Men Bags',   slug: 'bags-men',       children: [] }, { name: 'Women Bags',   slug: 'bags-women',     children: [] }] },
  { name: 'Footwear', slug: 'footwear', children: [{ name: 'Men Footwear', slug: 'footwear-men', children: [] }, { name: 'Women Footwear', slug: 'footwear-women', children: [] }] },
  { name: 'Groceries',slug: 'groceries',children: [{ name: 'Fruits & Vegetables', slug: 'groceries-fruits', children: [] }, { name: 'Dairy & Eggs', slug: 'groceries-dairy', children: [] }, { name: 'Beverages', slug: 'groceries-beverages', children: [] }] },
  { name: 'Beauty',   slug: 'beauty',   children: [{ name: 'Skincare', slug: 'beauty-skincare', children: [] }, { name: 'Makeup', slug: 'beauty-makeup', children: [] }, { name: 'Haircare', slug: 'beauty-haircare', children: [] }] },
  { name: 'Wellness', slug: 'wellness', children: [{ name: 'Fitness', slug: 'wellness-fitness', children: [] }, { name: 'Nutrition', slug: 'wellness-nutrition', children: [] }, { name: 'Yoga', slug: 'wellness-yoga', children: [] }] },
  { name: 'Jewellery',slug: 'jewellery',children: [{ name: 'Necklaces', slug: 'jewellery-necklaces', children: [] }, { name: 'Earrings', slug: 'jewellery-earrings', children: [] }, { name: 'Bracelets', slug: 'jewellery-bracelets', children: [] }] }
];

// Recursive sidebar item
const SidebarItem = ({ item, depth = 0, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const colors = CAT_COLORS[item.slug?.split('-')[0]] || {};

  return (
    <div className={`sidebar-item depth-${depth}`}>
      <div className="sidebar-item-row">
        {depth === 0 && colors.dot && (
          <span className="sidebar-cat-dot" style={{ background: colors.dot }} />
        )}
        <span className="sidebar-item-name" onClick={() => onNavigate(item.slug)}>
          {item.name}
        </span>
        {hasChildren && (
          <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
            {open ? <FaMinus /> : <FaPlus />}
          </button>
        )}
      </div>
      {open && hasChildren && (
        <div className="sidebar-children">
          {item.children.map(child => (
            <SidebarItem key={child.slug} item={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);
  const hoverTimer = useRef(null);

  const { user, logout } = useAuth();
  const { cartItems, cartCount, cartTotal, removeFromCart, updateQty, addedNotification, updateNotification } = useCart();
  const navigate = useNavigate();

  const wishlistCount = user?.wishlist?.length || 0;

  useEffect(() => {
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${searchQuery}`);
  };

  const handleMouseEnterCat = (slug) => {
    clearTimeout(hoverTimer.current);
    setHoveredCat(slug);
  };

  const handleMouseLeaveCat = () => {
    hoverTimer.current = setTimeout(() => setHoveredCat(null), 180);
  };

  const handleSidebarNavigate = (slug) => {
    const base = slug.split('-')[0];
    navigate(`/category/${base}?sub=${slug}`);
    setShowSidebar(false);
  };

  const taxExcl = Math.round(cartTotal * 0.95);

  return (
    <>
      <header className="header">

        {/* ── Announcement Bar ── */}
        <div className="top-bar">
          <div className="top-bar-inner">
            <div className="top-bar-left">
              <span className="top-bar-badge">🏷 50% OFF</span>
              <span className="top-bar-text">Get up to 50% off new season styles · Limited time only</span>
              <span className="top-bar-badge top-bar-badge-green">SHOP NOW</span>
            </div>
            <div className="top-bar-right">
              <Link to="/help">Help Center</Link>
              <span className="top-bar-sep">|</span>
              <Link to="/order-tracking">Order Tracking</Link>
            </div>
          </div>
        </div>

        {/* Added/Update cart notification */}
        {addedNotification && (
          <div className="added-notification"><FaCheckCircle /> Item added successfully</div>
        )}
        {updateNotification && (
          <div className="added-notification"><FaCheckCircle /> Cart updated</div>
        )}

        {/* ── Main Header ── */}
        <div className="main-header">
          <div className="header-inner">
            <Link to="/" className="logo">
              <div className="logo-icon"><FaRocket /></div>
              <div className="logo-text">
                <span className="logo-main">CLASSYSHOP</span>
                <span className="logo-sub">BIG MEGA STORE</span>
              </div>
            </Link>

            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit"><FaSearch /></button>
            </form>

            <div className="header-actions">
              <div className="user-section" onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}>
                <FaUser className="user-icon" />
                <div className="user-info">
                  <span className="user-name">{user ? user.name : 'Sign In'}</span>
                  <span className="user-email">{user ? user.email : 'Sign in to your account'}</span>
                </div>
                {showUserMenu && (
                  <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                    {user ? (
                      <>
                        <Link to="/profile" onClick={() => setShowUserMenu(false)}><FaUser /> My Account</Link>
                        {user.isAdmin && (
                          <Link to="/admin" onClick={() => setShowUserMenu(false)} style={{ color: '#e94560', fontWeight: 700 }}><FaUser /> Admin Panel</Link>
                        )}
                        <Link to="/profile?tab=address" onClick={() => setShowUserMenu(false)}><FaMapMarkerAlt /> Address</Link>
                        <Link to="/profile?tab=orders"  onClick={() => setShowUserMenu(false)}><FaBoxOpen /> Orders</Link>
                        <Link to="/wishlist"            onClick={() => setShowUserMenu(false)}><FaHeart /> My List</Link>
                        <button onClick={() => { logout(); setShowUserMenu(false); navigate('/'); }}><FaSignOutAlt /> Logout</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login"    onClick={() => setShowUserMenu(false)}><FaUser /> Login</Link>
                        <Link to="/register" onClick={() => setShowUserMenu(false)}><FaBoxOpen /> Register</Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Link to="/wishlist" className="icon-btn" title="Wishlist">
                <FaHeart />
                <span className="badge">{wishlistCount}</span>
              </Link>

              <button className="icon-btn cart-icon-btn" title="Cart" onClick={() => setShowCartSidebar(true)}>
                <FaShoppingCart />
                <span className="badge red">{cartCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Nav Bar ── */}
        <nav className="navbar">
          <div className="navbar-inner">

            {/* Shop By Categories pill button */}
            <div className="shop-by-cat" onClick={() => setShowSidebar(true)}>
              <FaBars style={{ fontSize: 13 }} />
              SHOP BY CATEGORIES
              <span className="shop-by-cat-arrow">▾</span>
            </div>

            {/* Home link */}
            <Link to="/" className="nav-home-link">Home</Link>

            {/* Category pill buttons */}
            <div className="nav-links">
              {navCategories.map(cat => {
                const c = CAT_COLORS[cat.slug] || { bg: '#f0f0f0', color: '#444', border: '#ddd', dot: '#888' };
                return (
                  <div
                    key={cat.slug}
                    className="nav-item"
                    onMouseEnter={() => handleMouseEnterCat(cat.slug)}
                    onMouseLeave={handleMouseLeaveCat}
                  >
                    <Link
                      to={`/category/${cat.slug}`}
                      className="nav-pill"
                      style={{ background: c.bg, color: c.color, borderColor: c.border }}
                    >
                      {cat.name}
                    </Link>

                    {/* Premium Dropdown */}
                    {hoveredCat === cat.slug && cat.sub.length > 0 && (
                      <div
                        className="nav-dp-panel"
                        onMouseEnter={() => handleMouseEnterCat(cat.slug)}
                        onMouseLeave={handleMouseLeaveCat}
                      >
                        <div className="nav-dp-header" style={{ color: c.color }}>
                          {cat.name}
                        </div>
                        <div className="nav-dp-list">
                          {cat.sub.map(s => (
                            <Link
                              key={s.slug}
                              to={`/category/${cat.slug}?sub=${s.slug}`}
                              className="nav-dp-item"
                              onClick={() => setHoveredCat(null)}
                            >
                              <span className="nav-dp-dot" style={{ background: c.dot }} />
                              <span className="nav-dp-label">{s.name}</span>
                              <span className="nav-dp-arrow">›</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="free-delivery">
              <FaRocket /> Free International Delivery
            </div>
          </div>
        </nav>
      </header>

      {/* ── Shop By Categories Sidebar ── */}
      {showSidebar && (
        <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}>
          <div className="sidebar-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBars style={{ fontSize: 14 }} />
                <span>Shop By Categories</span>
              </div>
              <button onClick={() => setShowSidebar(false)}><FaTimes /></button>
            </div>
            <div className="sidebar-body">
              {sidebarCategories.map(cat => (
                <SidebarItem key={cat.slug} item={cat} depth={0} onNavigate={handleSidebarNavigate} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ── */}
      {showCartSidebar && (
        <div className="cart-overlay" onClick={() => setShowCartSidebar(false)}>
          <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cart-sidebar-header">
              <span>Shopping Cart ({cartCount})</span>
              <button onClick={() => setShowCartSidebar(false)}><FaTimes /></button>
            </div>
            <div className="cart-sidebar-items">
              {cartItems.length === 0 ? (
                <div className="cart-empty">Your cart is empty</div>
              ) : (
                cartItems.map(item => (
                  <div key={item._id} className="cart-sidebar-item">
                    <img src={item.image} alt={item.name} />
                    <div className="cart-sidebar-item-info">
                      <p className="cart-item-name">{item.name}</p>
                      <div className="cart-item-qty-row">
                        <span>Qty: {item.qty}</span>
                        <span className="cart-item-price">Price: <strong>Rs.{(item.price * item.qty).toLocaleString()}</strong></span>
                      </div>
                      <div className="cart-qty-controls">
                        <button onClick={() => updateQty(item._id, item.qty - 1)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                      </div>
                    </div>
                    <button className="cart-remove-btn" onClick={() => removeFromCart(item._id)}>
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="cart-sidebar-footer">
                <div className="cart-sidebar-totals">
                  <div>
                    <span>{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                    <strong>Rs.{cartTotal.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Total (tax excl.)</span>
                    <strong>Rs.{taxExcl.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="cart-sidebar-btns">
                  <Link to="/cart"     className="cart-sidebar-btn view"     onClick={() => setShowCartSidebar(false)}>VIEW CART</Link>
                  <Link to="/checkout" className="cart-sidebar-btn checkout" onClick={() => setShowCartSidebar(false)}>CHECKOUT</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
