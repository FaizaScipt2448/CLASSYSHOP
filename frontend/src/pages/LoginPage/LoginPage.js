import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AuthPages.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // forgot-password form state
  const [fpEmail, setFpEmail] = useState('');
  const [fpNew, setFpNew] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      toast.success('Login successful!');
      // redirect admin users to admin panel
      if (userData?.isAdmin) navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (fpNew !== fpConfirm) { toast.error('Passwords do not match'); return; }
    if (fpNew.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setFpLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email: fpEmail, newPassword: fpNew });
      toast.success('Password reset! You can now log in.');
      setShowForgot(false);
      setEmail(fpEmail);
      setFpEmail(''); setFpNew(''); setFpConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed — check your email');
    } finally {
      setFpLoading(false);
    }
  };

  /* ── Forgot-password panel ── */
  if (showForgot) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p>Enter your email and choose a new password</p>
          </div>
          <form onSubmit={handleForgotPassword} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={fpEmail}
                onChange={e => setFpEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={fpNew}
                onChange={e => setFpNew(e.target.value)}
                placeholder="New password (min 6 chars)"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={fpConfirm}
                onChange={e => setFpConfirm(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={fpLoading}>
              {fpLoading ? 'Resetting...' : 'RESET PASSWORD'}
            </button>
          </form>
          <p className="auth-switch">
            <button
              style={{ background:'none', border:'none', color:'#e94560', fontWeight:600, cursor:'pointer', fontSize:14 }}
              onClick={() => setShowForgot(false)}
            >
              ← Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── Login panel ── */
  return (
    <div className="auth-page">
      <SEOHead title="Sign In to ClassyShop" noIndex={true} />
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your ClassyShop account</p>
        </div>
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="faizasattar007@gmail.com"
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label>Password</label>
              <button
                type="button"
                style={{ background:'none', border:'none', color:'#e94560', fontSize:12, fontWeight:600, cursor:'pointer', padding:0 }}
                onClick={() => { setShowForgot(true); setFpEmail(email); }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
