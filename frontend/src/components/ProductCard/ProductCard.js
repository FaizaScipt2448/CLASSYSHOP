import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaShoppingCart, FaHeart, FaStar, FaStarHalfAlt, FaRegStar,
  FaTimes, FaExpand, FaExchangeAlt
} from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import QuickViewModal from '../QuickViewModal/QuickViewModal';
import './ProductCard.css';

const SIZES = ['S', 'M', 'L', 'XXL'];
const FASHION_CATEGORIES = ['fashion', 'Fashion'];

const CATEGORY_FALLBACKS = {
  Fashion:     'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&h=600&fit=crop&q=80',
  Electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=600&fit=crop&q=80',
  Beauty:      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=600&fit=crop&q=80',
  Jewellery:   'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=600&fit=crop&q=80',
  Bags:        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop&q=80',
  Footwear:    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop&q=80',
  Groceries:   'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=600&fit=crop&q=80',
  Wellness:    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=600&fit=crop&q=80',
  default:     'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&h=600&fit=crop&q=80',
};

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push(<FaStar key={i} />);
    else if (i === Math.ceil(rating) && rating % 1 !== 0) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return <div className="stars">{stars}</div>;
};

const ProductCard = ({ product }) => {
  const { addToCart, cartItems, updateQty, removeFromCart } = useCart();
  const { user, authHeader } = useAuth();

  const [showSizes, setShowSizes] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const isFashion = FASHION_CATEGORIES.includes(product.category);
  const cartItem = cartItems.find(item => item._id === product._id);
  const inCart = !!cartItem;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFashion && !inCart) {
      setShowSizes(true);
      return;
    }
    addToCart(product, 1);
  };

  const handleSelectSize = (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
    setShowSizes(false);
    addToCart({ ...product, size }, 1);
  };

  const handleCloseSizes = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizes(false);
  };

  const handleQtyChange = (e, delta) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = (cartItem?.qty || 0) + delta;
    if (newQty < 1) removeFromCart(product._id);
    else updateQty(product._id, newQty);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login first'); return; }
    try {
      await axios.post('/api/auth/wishlist', { productId: product._id }, authHeader());
      setWishlisted(true);
      toast.success('Added to wishlist!');
    } catch {
      setWishlisted(true);
      toast.info('Already in wishlist');
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <Link
        to={`/product/${product.slug || product._id}`}
        className="product-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowSizes(false); }}
      >
        {product.discount > 0 && (
          <span className="discount-badge">{product.discount}%</span>
        )}

        <div className="product-img-wrap">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = CATEGORY_FALLBACKS[product.category] || CATEGORY_FALLBACKS.default;
            }}
          />

          {/* 3 action icons on hover (right side) */}
          {hovered && !showSizes && (
            <div className="card-action-icons">
              <button className="card-action-icon" onClick={handleQuickView} title="Quick View">
                <FaExpand />
              </button>
              <button className="card-action-icon" title="Compare" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast.info('Added to compare'); }}>
                <FaExchangeAlt />
              </button>
              <button
                className={`card-action-icon wishlist-icon ${wishlisted ? 'wishlisted' : ''}`}
                onClick={handleWishlist}
                title="Add to Wishlist"
              >
                <FaHeart />
              </button>
            </div>
          )}

          {/* Size picker popup */}
          {showSizes && (
            <div className="size-picker" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <button className="size-close" onClick={handleCloseSizes}><FaTimes /></button>
              <div className="size-options">
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={(e) => handleSelectSize(e, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="product-brand">{product.brand}</p>
          <h3 className="product-name">{product.name}</h3>
          <StarRating rating={product.rating} />
          <div className="product-price">
            {product.originalPrice > product.price && (
              <span className="original-price">Rs.{product.originalPrice.toLocaleString()}</span>
            )}
            <span className="sale-price">Rs.{product.price.toLocaleString()}</span>
          </div>

          {inCart ? (
            <div className="card-qty-control" onClick={(e) => e.preventDefault()}>
              <button onClick={(e) => handleQtyChange(e, -1)}>−</button>
              <span>{cartItem.qty}</span>
              <button onClick={(e) => handleQtyChange(e, 1)}>+</button>
            </div>
          ) : (
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <FaShoppingCart /> ADD TO CART
            </button>
          )}
        </div>
      </Link>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
    </>
  );
};

export default ProductCard;
