import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import { FaTimes, FaShoppingBag, FaShoppingCart, FaStar, FaRegStar, FaTag, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './CartPage.css';

const StarRow = ({ rating }) => (
  <div className="cart-stars">
    {[1,2,3,4,5].map(i => i <= Math.round(rating)
      ? <FaStar key={i} /> : <FaRegStar key={i} />)}
  </div>
);

const CartPage = () => {
  const {
    cartItems, removeFromCart, updateQty,
    cartTotal, shippingPrice, discountAmount, finalTotal,
    appliedCoupon, couponLoading, couponError,
    applyCoupon, removeCoupon
  } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [couponInput, setCouponInput] = useState('');

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to checkout'); navigate('/login'); return; }
    navigate('/checkout');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = await applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <FaShoppingBag className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="continue-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <SEOHead title="Your Shopping Cart" noIndex={true} />
      <div className="container">
        <div className="cart-layout">

          {/* ── Items ── */}
          <div className="cart-items-box">
            <div className="cart-box-header">
              <h2>Your Cart</h2>
              <p>There are <strong>{cartItems.length}</strong> products in your cart</p>
            </div>

            {cartItems.map(item => (
              <div key={item._id} className="cart-item-card">
                <Link to={`/product/${item._id}`} className="cart-item-img-link">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-item-details">
                  <p className="cart-item-brand">{item.brand?.toUpperCase()}</p>
                  <Link to={`/product/${item._id}`} className="cart-item-name">{item.name}</Link>
                  <StarRow rating={item.rating || 4} />
                  <div className="cart-item-meta">
                    <select
                      className="cart-select"
                      value={item.size || 'M'}
                      onChange={e => {
                        const updated = cartItems.map(ci =>
                          ci._id === item._id ? { ...ci, size: e.target.value } : ci
                        );
                        localStorage.setItem('classyshop_cart', JSON.stringify(updated));
                      }}
                    >
                      {['XS','S','M','L','XL','XXL'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      className="cart-select"
                      value={item.qty}
                      onChange={e => updateQty(item._id, Number(e.target.value))}
                    >
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cart-item-pricing">
                    <span className="cart-sale-price">Rs.{item.price.toLocaleString()}</span>
                    {item.originalPrice > item.price && (
                      <span className="cart-orig-price">Rs.{item.originalPrice.toLocaleString()}</span>
                    )}
                    {item.discount > 0 && (
                      <span className="cart-discount">{item.discount}% OFF</span>
                    )}
                  </div>
                </div>
                <button className="cart-remove-x" onClick={() => removeFromCart(item._id)}>
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>

          {/* ── Totals ── */}
          <div className="cart-totals-box">
            <h3>Cart Totals</h3>

            <div className="totals-row">
              <span>Subtotal</span>
              <span className="totals-val red">Rs.{cartTotal.toLocaleString()}.00</span>
            </div>

            {/* Coupon discount row */}
            {appliedCoupon && discountAmount > 0 && (
              <div className="totals-row coupon-applied-row">
                <span>
                  Discount ({appliedCoupon.code})
                  <button className="remove-coupon-x" onClick={removeCoupon} title="Remove coupon">
                    <FaTimes />
                  </button>
                </span>
                <span className="totals-val green">- Rs.{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {appliedCoupon?.freeShipping && (
              <div className="totals-row coupon-applied-row">
                <span>Free Shipping ({appliedCoupon.code})</span>
                <span className="totals-val green">- Rs.{shippingPrice === 0 ? 250 : shippingPrice}</span>
              </div>
            )}

            <div className="totals-row">
              <span>Shipping</span>
              <span className="totals-val">
                {shippingPrice === 0 ? <span className="free-badge">FREE</span> : `Rs.${shippingPrice}`}
              </span>
            </div>
            <div className="totals-row">
              <span>Estimate for</span>
              <span className="totals-val bold">Pakistan</span>
            </div>
            <div className="totals-divider" />
            <div className="totals-row total-row">
              <span>Total</span>
              <span className="totals-val red">Rs.{finalTotal.toLocaleString()}.00</span>
            </div>

            {/* ── Coupon Input ── */}
            <div className="coupon-section">
              <div className="coupon-section-header">
                <FaTag /> <span>Have a coupon code?</span>
              </div>

              {appliedCoupon ? (
                <div className="coupon-applied-banner">
                  <FaCheckCircle className="coupon-check" />
                  <div>
                    <strong>{appliedCoupon.code}</strong>
                    <p>{appliedCoupon.description || `${appliedCoupon.freeShipping ? 'Free shipping applied' : `Rs.${discountAmount.toLocaleString()} saved`}`}</p>
                  </div>
                  <button onClick={removeCoupon} className="coupon-remove-btn">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="coupon-form">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="coupon-input"
                    maxLength={20}
                  />
                  <button
                    type="submit"
                    className="coupon-apply-btn"
                    disabled={couponLoading || !couponInput.trim()}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="coupon-error">{couponError}</p>}
            </div>

            <button className="checkout-big-btn" onClick={handleCheckout}>
              <FaShoppingCart /> CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
