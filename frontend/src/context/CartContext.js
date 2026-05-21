import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems,          setCartItems]          = useState([]);
  const [cartSidebarOpen,    setCartSidebarOpen]    = useState(false);
  const [addedNotification,  setAddedNotification]  = useState(false);
  const [updateNotification, setUpdateNotification] = useState(false);

  // Coupon state
  const [appliedCoupon,  setAppliedCoupon]  = useState(null);   // { code, type, value, discountAmount, freeShipping }
  const [couponLoading,  setCouponLoading]  = useState(false);
  const [couponError,    setCouponError]    = useState('');

  // Load cart + coupon from localStorage on mount
  useEffect(() => {
    const saved       = localStorage.getItem('classyshop_cart');
    const savedCoupon = localStorage.getItem('classyshop_coupon');
    if (saved)       setCartItems(JSON.parse(saved));
    if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('classyshop_cart', JSON.stringify(items));
  };

  const addToCart = (product, qty = 1) => {
    const existing = cartItems.find(item => item._id === product._id);
    let updated;
    if (existing) {
      updated = cartItems.map(item =>
        item._id === product._id ? { ...item, qty: item.qty + qty } : item
      );
    } else {
      updated = [...cartItems, { ...product, qty }];
    }
    saveCart(updated);
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 2500);
  };

  const removeFromCart = (productId) => {
    saveCart(cartItems.filter(item => item._id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    saveCart(cartItems.map(item =>
      item._id === productId ? { ...item, qty } : item
    ));
    setUpdateNotification(true);
    setTimeout(() => setUpdateNotification(false), 2000);
  };

  const clearCart = () => saveCart([]);

  /* ── Coupon Functions ── */
  const applyCoupon = useCallback(async (code) => {
    if (!code?.trim()) { setCouponError('Please enter a coupon code'); return false; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await axios.post('/api/cart/apply-coupon', {
        code: code.trim().toUpperCase(),
        cartTotal
      });
      setAppliedCoupon(data);
      localStorage.setItem('classyshop_coupon', JSON.stringify(data));
      toast.success(`Coupon "${data.code}" applied! You save Rs.${data.discountAmount.toLocaleString()}${data.freeShipping ? ' + Free Shipping' : ''}`);
      setCouponLoading(false);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon code';
      setCouponError(msg);
      toast.error(msg);
      setCouponLoading(false);
      return false;
    }
  }, [cartItems]); // eslint-disable-line

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    localStorage.removeItem('classyshop_coupon');
    toast.info('Coupon removed');
  };

  /* ── Computed totals ── */
  const cartCount      = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal      = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingPrice  = (cartTotal > 10000 || appliedCoupon?.freeShipping) ? 0 : 250;
  const discountAmount = appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0;
  const finalTotal     = Math.max(0, cartTotal - discountAmount + shippingPrice);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQty, clearCart,
      cartCount, cartTotal, shippingPrice, discountAmount, finalTotal,
      cartSidebarOpen, setCartSidebarOpen,
      addedNotification, updateNotification,
      // Coupon
      appliedCoupon, couponLoading, couponError,
      applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
