import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaUndo, FaLock, FaGift, FaHeadset, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaCommentDots } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please agree to terms'); return; }
    try {
      await axios.post('/api/newsletter/subscribe', { email });
      toast.success('Subscribed successfully!');
      setEmail('');
      setAgreed(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed');
    }
  };

  return (
    <footer className="footer">
      {/* Features Bar */}
      <div className="features-bar">
        <div className="features-inner">
          <div className="feature-item" style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 30, padding: '10px 20px' }}>
            <FaTruck style={{ color: '#166534', fontSize: 18 }} />
            <span style={{ color: '#166534', fontWeight: 700 }}>Free Delivery Over Rs.5,000</span>
          </div>
          <div className="feature-item" style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 30, padding: '10px 20px' }}>
            <FaUndo style={{ color: '#92400e', fontSize: 18 }} />
            <span style={{ color: '#92400e', fontWeight: 700 }}>30 Days Easy Returns</span>
          </div>
          <div className="feature-item" style={{ background: '#dbeafe', border: '1.5px solid #93c5fd', borderRadius: 30, padding: '10px 20px' }}>
            <FaLock style={{ color: '#1d4ed8', fontSize: 18 }} />
            <span style={{ color: '#1d4ed8', fontWeight: 700 }}>100% Secure Payment</span>
          </div>
          <div className="feature-item" style={{ background: '#fdf4ff', border: '1.5px solid #d8b4fe', borderRadius: 30, padding: '10px 20px' }}>
            <FaGift style={{ color: '#7e22ce', fontSize: 18 }} />
            <span style={{ color: '#7e22ce', fontWeight: 700 }}>Gift On Every First Order</span>
          </div>
          <div className="feature-item" style={{ background: '#ffedd5', border: '1.5px solid #fdba74', borderRadius: 30, padding: '10px 20px' }}>
            <FaHeadset style={{ color: '#9a3412', fontSize: 18 }} />
            <span style={{ color: '#9a3412', fontWeight: 700 }}>24/7 Customer Support</span>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-inner">
          <div className="footer-col">
            <h3>Contact us</h3>
            <p><FaMapMarkerAlt /> ClassyShop — Mega Super Store<br />Shop #12, Tariq Road, Karachi, Pakistan</p>
            <p><FaEnvelope /> faizasattar007@gmail.com</p>
            <p className="footer-phone"><FaPhoneAlt /> (+92) 300-1234567</p>
            <div className="online-chat">
              <FaCommentDots />
              <div>
                <strong>Online Chat</strong>
                <span>Get Expert Help</span>
              </div>
            </div>
          </div>

          <div className="footer-col">
            <h3>Products</h3>
            <ul>
              <li><Link to="/category/sale">Prices drop</Link></li>
              <li><Link to="/search?filter=new">New products</Link></li>
              <li><Link to="/search?filter=bestseller">Best sales</Link></li>
              <li><Link to="/contact">Contact us</Link></li>
              <li><Link to="/sitemap">Sitemap</Link></li>
              <li><Link to="/stores">Stores</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Our company</h3>
            <ul>
              <li><Link to="/delivery">Delivery</Link></li>
              <li><Link to="/legal">Legal Notice</Link></li>
              <li><Link to="/terms">Terms and conditions of use</Link></li>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/secure-payment">Secure payment</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Subscribe to newsletter</h3>
            <p>Subscribe to our latest newsletter to get news about special discounts.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">SUBSCRIBE</button>
              <label className="agree-label">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                I agree to the terms and conditions and the privacy policy
              </label>
            </form>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ClassyShop - All Rights Reserved</p>
      </div>
    </footer>
  );
};

export default Footer;
