import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaCreditCard, FaLock, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

const PAYMENT_METHODS = ['Cash on Delivery', 'EasyPaisa', 'JazzCash', 'Bank Transfer', 'Credit/Debit Card (Sandbox)'];

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '', address: '', city: '',
    postalCode: '', phone: '', country: 'Pakistan'
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [placedOrderId, setPlacedOrderId] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
    }
  }, [user, navigate]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && step === 'form') {
      navigate('/cart');
    }
  }, [cartItems, step, navigate]);

  const shippingPrice = cartTotal > 10000 ? 0 : 250;
  const taxPrice = Math.round(cartTotal * 0.05);
  const totalPrice = cartTotal + shippingPrice + taxPrice;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateCardForm = () => {
    if (!cardForm.number || cardForm.number.replace(/\s/g, '').length < 16) {
      toast.error('Enter a valid 16-digit card number'); return false;
    }
    if (!cardForm.expiry || !/^\d{2}\/\d{2}$/.test(cardForm.expiry)) {
      toast.error('Enter expiry in MM/YY format'); return false;
    }
    if (!cardForm.cvv || cardForm.cvv.length < 3) {
      toast.error('Enter a valid CVV'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'Credit/Debit Card (Sandbox)' && !validateCardForm()) return;

    setLoading(true);
    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name, qty: item.qty,
          image: item.image, price: item.price, product: item._id
        })),
        shippingAddress: form,
        paymentMethod,
        itemsPrice: cartTotal,
        shippingPrice,
        taxPrice,
        totalPrice
      };

      const { data: order } = await axios.post('/api/orders', orderData, authHeader());

      // Simulate card payment for Sandbox
      if (paymentMethod === 'Credit/Debit Card (Sandbox)') {
        setStep('processing');
        await new Promise(r => setTimeout(r, 2000)); // Simulate processing
        await axios.put(`/api/orders/${order._id}/pay`, {
          id: `sandbox_${Date.now()}`,
          status: 'COMPLETED',
          update_time: new Date().toISOString(),
          email_address: user.email
        }, authHeader());
        setPlacedOrderId(order._id);
        clearCart();
        setStep('success');
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/order/${order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  // Sandbox processing animation
  if (step === 'processing') {
    return (
      <div className="checkout-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="sandbox-processing">
            <div className="sandbox-spinner" />
            <h2 style={{ marginTop: 24, color: '#1565c0' }}>Processing Payment...</h2>
            <p style={{ color: '#888' }}>Please wait while we process your card payment securely.</p>
            <div style={{ marginTop: 16, fontSize: 13, color: '#aaa' }}>
              <FaLock style={{ marginRight: 6 }} /> 256-bit SSL encrypted
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment success
  if (step === 'success') {
    return (
      <div className="checkout-page">
        <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="sandbox-success">
            <FaCheckCircle style={{ fontSize: 64, color: '#2e7d32' }} />
            <h2 style={{ marginTop: 20, color: '#2e7d32' }}>Payment Successful!</h2>
            <p style={{ color: '#555', marginBottom: 24 }}>Your order has been placed and payment confirmed.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to={`/order/${placedOrderId}`} className="place-order-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px' }}>
                View Order
              </Link>
              <Link to="/" className="place-order-btn" style={{ background: '#555', textDecoration: 'none', display: 'inline-block', padding: '12px 24px' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {/* Shipping Address */}
            <div className="checkout-section">
              <h3>Shipping Address</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required />
                </div>
                <div className="form-group full">
                  <label>Address</label>
                  <input name="address" value={form.address} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input name="postalCode" value={form.postalCode} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input name="country" value={form.country} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="checkout-section">
              <h3>Payment Method</h3>
              <div className="payment-options">
                {PAYMENT_METHODS.map(method => (
                  <label key={method} className={`payment-option ${paymentMethod === method ? 'selected' : ''}`}>
                    <input
                      type="radio" name="payment" value={method}
                      checked={paymentMethod === method}
                      onChange={e => setPaymentMethod(e.target.value)}
                    />
                    {method === 'Credit/Debit Card (Sandbox)' && <FaCreditCard style={{ marginRight: 6 }} />}
                    {method}
                  </label>
                ))}
              </div>

              {/* Sandbox Card Form */}
              {paymentMethod === 'Credit/Debit Card (Sandbox)' && (
                <div className="sandbox-card-form">
                  <div className="sandbox-test-banner">
                    <FaLock /> <strong>Sandbox Mode</strong> — Use test card: <code>4111 1111 1111 1111</code> | Exp: <code>12/27</code> | CVV: <code>123</code>
                  </div>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label>Card Number</label>
                      <input
                        placeholder="4111 1111 1111 1111"
                        value={cardForm.number}
                        onChange={e => setCardForm({ ...cardForm, number: e.target.value })}
                        maxLength={19}
                      />
                    </div>
                    <div className="form-group full">
                      <label>Cardholder Name</label>
                      <input
                        placeholder="Name on card"
                        value={cardForm.holder}
                        onChange={e => setCardForm({ ...cardForm, holder: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Expiry (MM/YY)</label>
                      <input
                        placeholder="MM/YY"
                        value={cardForm.expiry}
                        onChange={e => setCardForm({ ...cardForm, expiry: e.target.value })}
                        maxLength={5}
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        placeholder="123"
                        value={cardForm.cvv}
                        onChange={e => setCardForm({ ...cardForm, cvv: e.target.value })}
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="place-order-btn" disabled={loading}>
              {loading ? 'Processing...' : (
                paymentMethod === 'Credit/Debit Card (Sandbox)'
                  ? `Pay Rs.${totalPrice.toLocaleString()} — Sandbox`
                  : `Place Order — Rs.${totalPrice.toLocaleString()}`
              )}
            </button>
          </form>

          {/* Order Summary */}
          <div className="checkout-summary">
            <h3>Order Summary</h3>
            {cartItems.map(item => (
              <div key={item._id} className="checkout-item">
                <img src={item.image} alt={item.name} />
                <div>
                  <p>{item.name}</p>
                  <span>Qty: {item.qty} &times; Rs.{item.price.toLocaleString()}</span>
                </div>
                <strong>Rs.{(item.qty * item.price).toLocaleString()}</strong>
              </div>
            ))}
            <div className="checkout-totals">
              <div><span>Subtotal:</span><span>Rs.{cartTotal.toLocaleString()}</span></div>
              <div><span>Shipping:</span><span>{shippingPrice === 0 ? 'FREE' : `Rs.${shippingPrice}`}</span></div>
              <div><span>Tax (5%):</span><span>Rs.{taxPrice.toLocaleString()}</span></div>
              <div className="checkout-grand">
                <span>Total:</span><span>Rs.{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
