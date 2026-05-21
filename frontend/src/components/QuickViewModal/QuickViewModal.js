import React, { useState, useRef, useCallback } from 'react';
import { FaTimes, FaStar, FaStarHalfAlt, FaRegStar, FaHeart, FaExchangeAlt, FaSearch, FaCheck, FaShippingFast } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import './QuickViewModal.css';

const SIZES = ['S', 'M', 'L', 'XXL'];

const StarRating = ({ rating, numReviews }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push(<FaStar key={i} />);
    else if (i === Math.ceil(rating) && rating % 1 !== 0) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <div className="qv-rating">
      <div className="qv-stars">{stars}</div>
      <span className="qv-review-count">Review ({numReviews || 0})</span>
    </div>
  );
};

const QuickViewModal = ({ product, onClose }) => {
  const images = [product.image, ...(product.images || [])];
  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const imgRef = useRef(null);

  const { addToCart, cartItems, updateQty } = useCart();
  const { user, authHeader } = useAuth();

  const isFashion = ['Fashion', 'fashion'].includes(product.category);
  const cartItem = cartItems.find(item => item._id === product._id);
  const inCart = !!cartItem;

  // Image zoom tracking
  const handleMouseMove = useCallback((e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.2)',
    });
  }, []);

  const handleMouseEnterImg = () => setZooming(true);
  const handleMouseLeaveImg = () => {
    setZooming(false);
    setZoomStyle({});
  };

  const handleAddToCart = () => {
    if (isFashion && !selectedSize) {
      toast.warning('Please select a size');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (inCart) {
        updateQty(product._id, (cartItem?.qty || 0) + qty);
      } else {
        addToCart({ ...product, size: selectedSize }, qty);
      }
      setLoading(false);
    }, 600);
  };

  const handleWishlist = async () => {
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

  const handleQtyChange = (delta) => {
    setQty(prev => Math.max(1, prev + delta));
  };

  return (
    <div className="qv-overlay" onClick={onClose}>
      <div className="qv-modal" onClick={e => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose}><FaTimes /></button>

        {/* Left: Image section */}
        <div className="qv-images">
          {/* Thumbnails */}
          <div className="qv-thumbs">
            {images.map((img, i) => (
              <div
                key={i}
                className={`qv-thumb ${selectedImg === i ? 'active' : ''}`}
                onClick={() => setSelectedImg(i)}
              >
                <img src={img} alt={`thumb-${i}`} />
              </div>
            ))}
          </div>

          {/* Main image with zoom */}
          <div
            className={`qv-main-img-wrap ${zooming ? 'zooming' : ''}`}
            onMouseEnter={handleMouseEnterImg}
            onMouseLeave={handleMouseLeaveImg}
            onMouseMove={handleMouseMove}
          >
            <img
              ref={imgRef}
              src={images[selectedImg]}
              alt={product.name}
              style={zooming ? zoomStyle : {}}
              className="qv-main-img"
            />
            <div className="qv-zoom-icon">
              <FaSearch />
            </div>
            {/* Zoom lens cursor indicator */}
            {zooming && (
              <div
                className="zoom-lens"
                style={{ left: `${zoomPos.x}%`, top: `${zoomPos.y}%` }}
              />
            )}
          </div>
        </div>

        {/* Right: Product info */}
        <div className="qv-info">
          <h2 className="qv-title">{product.name}</h2>

          <div className="qv-brand-rating">
            <span className="qv-brand-label">Brands : <strong>{product.brand}</strong></span>
            <StarRating rating={product.rating} numReviews={product.numReviews} />
          </div>

          <div className="qv-price-row">
            <span className="qv-orig-price">Rs.{product.originalPrice?.toLocaleString()}</span>
            <span className="qv-sale-price">Rs.{product.price?.toLocaleString()}</span>
            <span className="qv-stock">
              Available In Stock: <strong>{product.countInStock} Items</strong>
            </span>
          </div>

          <p className="qv-desc">{product.description}</p>

          {/* Size selector (for fashion) */}
          {isFashion && (
            <div className="qv-size-row">
              <span className="qv-size-label">SIZE:</span>
              <div className="qv-sizes">
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`qv-size-btn ${selectedSize === s ? 'active' : ''}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="qv-shipping">
            <FaShippingFast /> Free Shipping (Est. Delivery Time 2-3 Days)
          </p>

          {/* Qty + Add to Cart */}
          <div className="qv-cart-row">
            <div className="qv-qty-spinner">
              <input
                type="number"
                min="1"
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value)))}
                readOnly
              />
              <div className="qv-qty-arrows">
                <button onClick={() => handleQtyChange(1)}>▲</button>
                <button onClick={() => handleQtyChange(-1)}>▼</button>
              </div>
            </div>

            <button
              className={`qv-add-btn ${inCart ? 'added' : ''} ${loading ? 'loading' : ''}`}
              onClick={handleAddToCart}
            >
              {loading ? (
                <span className="qv-spinner" />
              ) : inCart ? (
                <><FaCheck /> ADDED</>
              ) : (
                'ADD TO CART'
              )}
            </button>
          </div>

          {/* Wishlist + Compare */}
          <div className="qv-actions">
            <button
              className={`qv-action-btn ${wishlisted ? 'wishlisted' : ''}`}
              onClick={handleWishlist}
            >
              <FaHeart /> Add to Wishlist
            </button>
            <button className="qv-action-btn">
              <FaExchangeAlt /> Add to Compare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
