import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import {
  FaRobot, FaTimes, FaPaperPlane, FaShoppingCart, FaCopy,
  FaBoxOpen, FaCheckCircle, FaClock, FaTruck, FaSearch,
  FaThumbsUp, FaBan, FaChevronRight, FaMotorcycle
} from 'react-icons/fa';
import { MdExpandMore } from 'react-icons/md';
import './Chatbot.css';

/* ─── Greeting based on time ─── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─── Format markdown-like text ─── */
const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
};

/* ─── Status badge ─── */
const STATUS_CONFIG = {
  pending:          { color: '#f59e0b', bg: '#fffbeb', icon: <FaClock />,        label: 'Order Placed'     },
  processing:       { color: '#3b82f6', bg: '#eff6ff', icon: <FaBoxOpen />,      label: 'Packed & Ready'   },
  shipped:          { color: '#8b5cf6', bg: '#f5f3ff', icon: <FaTruck />,        label: 'Shipped'          },
  out_for_delivery: { color: '#f97316', bg: '#fff7ed', icon: <FaMotorcycle />,   label: 'Out for Delivery' },
  delivered:        { color: '#10b981', bg: '#ecfdf5', icon: <FaCheckCircle />,  label: 'Delivered'        },
  cancelled:        { color: '#ef4444', bg: '#fef2f2', icon: <FaBan />,          label: 'Cancelled'        },
};

/* ─── Product Mini Card in Chat ─── */
const ChatProductCard = ({ product, onAddToCart }) => (
  <div className="chat-product-card">
    <Link to={`/product/${product.slug || product._id}`} className="chat-product-img-wrap">
      <img src={product.image} alt={product.name} />
      {product.discount > 0 && <span className="chat-disc-badge">{product.discount}%</span>}
    </Link>
    <div className="chat-product-info">
      <p className="chat-product-brand">{product.brand}</p>
      <Link to={`/product/${product.slug || product._id}`} className="chat-product-name">{product.name}</Link>
      <div className="chat-product-price">
        {product.originalPrice > product.price && (
          <span className="chat-orig-price">Rs.{product.originalPrice?.toLocaleString()}</span>
        )}
        <span className="chat-sale-price">Rs.{product.price?.toLocaleString()}</span>
      </div>
      <button className="chat-add-btn" onClick={() => onAddToCart(product)}>
        <FaShoppingCart /> Add to Cart
      </button>
    </div>
  </div>
);

/* ─── Order Mini Card in Chat ─── */
const ChatOrderCard = ({ order }) => {
  const cfg       = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const estimated = order.estimatedDelivery ? new Date(order.estimatedDelivery) : null;
  const isToday   = estimated && new Date().toDateString() === estimated.toDateString();
  return (
    <Link to={`/order/${order._id}`} className="chat-order-card">
      <div className="chat-order-header">
        <span className="chat-order-id">#{order._id.slice(-8).toUpperCase()}</span>
        <span className="chat-order-badge" style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <div className="chat-order-details">
        <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
        <span className="chat-order-total">Rs.{order.totalPrice?.toLocaleString()}</span>
      </div>
      <div className="chat-order-date">
        Placed: {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
      {estimated && order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className={`chat-order-est ${isToday ? 'today' : ''}`}>
          <FaTruck style={{ fontSize: 10 }} />
          {isToday ? '🚚 Arriving Today!' : `Est: ${estimated.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
        </div>
      )}
      {order.items?.map((item, i) => (
        <div key={i} className="chat-order-item-row">
          <img src={item.image} alt={item.name} />
          <span>{item.name} ×{item.qty}</span>
        </div>
      ))}
      <div className="chat-order-footer">
        View Full Tracking <FaChevronRight style={{ fontSize: 10 }} />
      </div>
    </Link>
  );
};

/* ─── Coupon Card ─── */
const CouponCard = ({ coupon }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      toast.success(`Coupon "${coupon.code}" copied!`);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="chat-coupon-card">
      <div className="coupon-left">
        <span className="coupon-code">{coupon.code}</span>
        <span className="coupon-discount">{coupon.discount}</span>
      </div>
      <div className="coupon-right">
        <p className="coupon-desc">{coupon.description}</p>
        <p className="coupon-min">Min. order: {coupon.minOrder}</p>
        <p className="coupon-expiry">Expires: {coupon.expiry}</p>
        <button className="coupon-copy-btn" onClick={handleCopy}>
          {copied ? <FaCheckCircle /> : <FaCopy />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
};

/* ─── Blog Mini Card in Chat ─── */
const ChatBlogCard = ({ blog }) => (
  <a href={`/blogs/${blog.slug || blog._id || blog.id}`} className="chat-blog-card" target="_self" rel="noopener noreferrer">
    <div className="chat-blog-img">
      {blog.image
        ? <img src={blog.image} alt={blog.title} />
        : <div className="chat-blog-img-placeholder">📝</div>
      }
    </div>
    <div className="chat-blog-info">
      <p className="chat-blog-category">{blog.category || 'Article'}</p>
      <p className="chat-blog-title">{blog.title}</p>
      <p className="chat-blog-excerpt">{(blog.excerpt || '').slice(0, 90)}{blog.excerpt?.length > 90 ? '...' : ''}</p>
      <div className="chat-blog-meta">
        <span>{blog.author || 'ClassyShop Team'}</span>
        <span>{blog.date ? new Date(blog.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : ''}</span>
      </div>
    </div>
  </a>
);

/* ─── Cart Summary Card ─── */
const CartSummaryCard = ({ cartItems, cartTotal, navigate }) => {
  if (cartItems.length === 0) {
    return (
      <div className="chat-cart-empty">
        <FaShoppingCart style={{ fontSize: 28, color: '#e0e0e0' }} />
        <p>Your cart is empty</p>
        <button onClick={() => navigate('/')} className="chat-action-btn">Browse Products</button>
      </div>
    );
  }
  return (
    <div className="chat-cart-summary">
      <div className="chat-cart-items">
        {cartItems.slice(0, 3).map(item => (
          <div key={item._id} className="chat-cart-item">
            <img src={item.image} alt={item.name} />
            <div>
              <p>{item.name}</p>
              <span>×{item.qty} · Rs.{(item.price * item.qty).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {cartItems.length > 3 && <p className="chat-cart-more">+{cartItems.length - 3} more items</p>}
      </div>
      <div className="chat-cart-total">
        <span>Total:</span>
        <strong>Rs.{cartTotal.toLocaleString()}</strong>
      </div>
      <div className="chat-cart-actions">
        <button onClick={() => navigate('/cart')} className="chat-action-btn outline">View Cart</button>
        <button onClick={() => navigate('/checkout')} className="chat-action-btn primary">Checkout</button>
      </div>
    </div>
  );
};

/* ═══════════════════════════ MAIN CHATBOT ═══════════════════════════ */

const INITIAL_MESSAGE = {
  id: 1,
  role: 'bot',
  type: 'text',
  message: null, // set dynamically
  quickReplies: ['Show trending products', 'Track my order', 'Get coupons', 'Show blogs'],
  time: new Date()
};

const QUICK_ACTIONS = [
  { label: '🔥 Trending',    msg: 'Show trending products'   },
  { label: '📦 My Orders',   msg: 'Where is my order?'       },
  { label: '🎁 Coupons',     msg: 'Any discount coupons?'    },
  { label: '📝 Blogs',       msg: 'blogs'                     },
  { label: '👗 Fashion',     msg: 'Show me fashion products'  },
  { label: '📱 Electronics', msg: 'Show electronics'          },
  { label: '🚚 Shipping',    msg: 'Shipping information'      },
  { label: '🤖 Ask AI',      msg: 'What can you answer?'      },
];

let msgIdCounter = 2;

const Chatbot = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, addToCart, removeFromCart, applyCoupon } = useCart();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [abandonedReminded, setAbandonedReminded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const suggestTimer = useRef(null);

  /* ── Initialize chat ── */
  useEffect(() => {
    const saved = sessionStorage.getItem('classyshop_chat');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map(m => ({ ...m, time: new Date(m.time) })));
        return;
      } catch {}
    }
    const greeting = `${getGreeting()}${user ? `, ${user.name.split(' ')[0]}` : ''}! 👋 Welcome to **ClassyShop**!\n\nI'm your AI assistant — I can help with **shopping**, **general questions**, and more:\n\n🛍️ Search products & deals\n📦 Track orders\n📝 Show latest blogs\n🧠 Answer any general question\n\nAsk me anything!`;
    setMessages([{ ...INITIAL_MESSAGE, message: greeting, time: new Date() }]);
  }, []); // eslint-disable-line

  /* ── Save messages to session ── */
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('classyshop_chat', JSON.stringify(messages));
    }
  }, [messages]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  /* ── Unread count ── */
  useEffect(() => {
    if (!open) {
      const botMsgs = messages.filter(m => m.role === 'bot');
      if (botMsgs.length > 1) setUnread(1);
    } else {
      setUnread(0);
    }
  }, [messages, open]);

  /* ── Abandoned cart reminder ── */
  useEffect(() => {
    if (open && cartItems.length > 0 && !abandonedReminded) {
      const lastUserMsg = messages.findLast?.(m => m.role === 'user');
      if (!lastUserMsg) {
        const timer = setTimeout(() => {
          addBotMessage({
            type: 'text',
            message: `🛒 **Psst!** You have **${cartItems.length} item${cartItems.length > 1 ? 's' : ''}** worth **Rs.${cartTotal.toLocaleString()}** waiting in your cart!\n\nWant to complete your purchase?`,
            quickReplies: ['View my cart', 'Checkout now', 'Continue browsing']
          });
          setAbandonedReminded(true);
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [open]); // eslint-disable-line

  const addBotMessage = useCallback((data) => {
    setMessages(prev => [...prev, {
      id: msgIdCounter++,
      role: 'bot',
      time: new Date(),
      ...data
    }]);
  }, []);

  /* ── Autocomplete suggestions ── */
  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const { data } = await axios.get(`/api/chatbot/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch { setSuggestions([]); }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  /* ── Send message ── */
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);

    const userMsg = { id: msgIdCounter++, role: 'user', type: 'text', message: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // ── Local intercepts (no API needed) ──
    if (/view\s*cart|view my cart/i.test(msg)) {
      setTyping(false);
      addBotMessage({ type: 'cart_summary', message: '🛒 Here\'s your current cart:', quickReplies: ['Checkout', 'Continue shopping'] });
      return;
    }

    // ── Blog intercept — fetch directly from /api/blog ──
    if (/\bblogs?\b/i.test(msg) || /\b(articles?|blog\s*posts?)\b/i.test(msg)) {
      try {
        // Extract a keyword: strip "show", "me", "latest", "blog(s)", "post(s)", "article(s)"
        const keyword = msg
          .replace(/\b(show|me|latest|recent|new|our|website|list|find|any|read)\b/gi, '')
          .replace(/\bblogs?\b/gi, '')
          .replace(/\barticles?\b/gi, '')
          .replace(/\bposts?\b/gi, '')
          .replace(/[^\w\s]/g, '')
          .trim();
        const url = keyword ? `/api/blogs?q=${encodeURIComponent(keyword)}` : '/api/blogs';
        const { data: blogs } = await axios.get(url);
        setTyping(false);
        addBotMessage({
          type: 'blogs',
          message: keyword
            ? `📝 Blog posts about **"${keyword}"**:`
            : '📝 Here are our latest blog posts:',
          data: blogs,
          quickReplies: ['Electronics blogs', 'Beauty blogs', 'Footwear blogs', 'Browse products']
        });
      } catch {
        setTyping(false);
        addBotMessage({ type: 'text', message: "Sorry, couldn't load blog posts right now.", quickReplies: ['Browse products'] });
      }
      return;
    }

    try {
      const { data } = await axios.post('/api/chatbot/message', {
        message: msg,
        userId: user?._id || null
      });

      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

      // ── Handle apply_coupon action ──
      if (data.type === 'apply_coupon' && data.couponCode) {
        setTyping(false);
        const ok = await applyCoupon(data.couponCode);
        addBotMessage({
          type: 'text',
          message: ok
            ? `✅ Coupon **${data.couponCode}** applied to your cart!\n\n${data.message.replace('Applying it to your cart now...', '')}`
            : `❌ Could not apply coupon **${data.couponCode}**. Check if your cart meets the minimum order requirement.`,
          quickReplies: ok ? ['View my cart', 'Checkout'] : ['Get coupons', 'View cart']
        });
        return;
      }

      // ── Handle remove_cart action ──
      if (data.type === 'remove_cart' && data.removeQuery) {
        setTyping(false);
        const query  = data.removeQuery.toLowerCase();
        const toRemove = cartItems.find(
          item => item.name.toLowerCase().includes(query) ||
                  item.category?.toLowerCase().includes(query) ||
                  item.brand?.toLowerCase().includes(query)
        );
        if (toRemove) {
          removeFromCart(toRemove._id);
          addBotMessage({
            type: 'text',
            message: `✅ **"${toRemove.name}"** has been removed from your cart!`,
            quickReplies: ['View my cart', 'Continue shopping']
          });
        } else {
          addBotMessage({
            type: 'cart_summary',
            message: `I couldn't find "${data.removeQuery}" in your cart. Here's what's in there — click ✕ to remove any item:`,
            quickReplies: ['View cart page', 'Continue shopping']
          });
        }
        return;
      }

      if (data.action === 'redirect_login') {
        setTyping(false);
        addBotMessage({ ...data, action: 'redirect_login' });
        return;
      }

      setTyping(false);
      addBotMessage(data);
    } catch {
      setTyping(false);
      addBotMessage({
        type: 'text',
        message: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 😔",
        quickReplies: ['Try again', 'Browse products']
      });
    }
  }, [input, user, cartItems, addToCart, removeFromCart, applyCoupon, addBotMessage]); // eslint-disable-line

  const handleAddToCart = useCallback((product) => {
    addToCart(product, 1);
    toast.success(`"${product.name}" added to cart!`);
  }, [addToCart]);

  const handleQuickReply = (reply) => {
    if (reply === 'Login' || reply === 'Login to track') {
      navigate('/login');
      setOpen(false);
      return;
    }
    if (reply === 'View cart' || reply === 'View my cart') {
      addBotMessage({ type: 'cart_summary', message: '🛒 Your current cart:', quickReplies: ['Checkout', 'Continue shopping'] });
      return;
    }
    if (reply === 'Checkout' || reply === 'Checkout now') {
      navigate('/checkout');
      setOpen(false);
      return;
    }
    if (reply === 'View all orders') {
      navigate('/profile?tab=orders');
      setOpen(false);
      return;
    }
    if (reply === 'View cart page') {
      navigate('/cart');
      setOpen(false);
      return;
    }
    if (reply === 'Browse products') {
      navigate('/');
      setOpen(false);
      return;
    }
    // Category blog quick replies — e.g. "Electronics blogs", "Beauty blogs"
    const catBlogMatch = reply.match(/^(\w+)\s+blogs?$/i);
    if (catBlogMatch) {
      const cat = catBlogMatch[1];
      sendMessage(`${cat} blogs`);
      return;
    }
    sendMessage(reply);
  };

  const handleSuggestionClick = (product) => {
    setShowSuggestions(false);
    sendMessage(product.name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const clearChat = () => {
    sessionStorage.removeItem('classyshop_chat');
    const greeting = `${getGreeting()}${user ? `, ${user.name.split(' ')[0]}` : ''}! 👋 Chat cleared.\n\nAsk me anything — products, orders, blogs, or any general question!`;
    setMessages([{ ...INITIAL_MESSAGE, id: msgIdCounter++, message: greeting, time: new Date() }]);
  };

  /* ── Render a single message ── */
  const renderMessage = (msg) => {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className="chat-msg user">
          <div className="chat-bubble user">
            {msg.message}
          </div>
          <span className="chat-time">{msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      );
    }

    return (
      <div key={msg.id} className="chat-msg bot">
        <div className="chat-bot-avatar"><FaRobot /></div>
        <div className="chat-bot-content">
          {/* Text message */}
          {(msg.type === 'text' || !msg.type) && (
            <div className="chat-bubble bot">
              <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              {msg.action === 'redirect_login' && (
                <button className="chat-login-btn" onClick={() => { navigate('/login'); setOpen(false); }}>
                  Sign In Now →
                </button>
              )}
            </div>
          )}

          {/* Products */}
          {msg.type === 'products' && (
            <div className="chat-products-block">
              <div className="chat-bubble bot" style={{ marginBottom: 8 }}>
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              </div>
              <div className="chat-products-grid">
                {msg.data?.map(p => (
                  <ChatProductCard key={p._id} product={p} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {msg.type === 'orders' && (
            <div className="chat-orders-block">
              <div className="chat-bubble bot" style={{ marginBottom: 8 }}>
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              </div>
              {msg.data?.map(o => <ChatOrderCard key={o._id} order={o} />)}
            </div>
          )}

          {/* Coupons */}
          {msg.type === 'coupons' && (
            <div className="chat-coupons-block">
              <div className="chat-bubble bot" style={{ marginBottom: 8 }}>
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              </div>
              {msg.data?.map((c, i) => <CouponCard key={i} coupon={c} />)}
            </div>
          )}

          {/* Cart summary */}
          {msg.type === 'cart_summary' && (
            <div>
              <div className="chat-bubble bot" style={{ marginBottom: 8 }}>
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              </div>
              <CartSummaryCard cartItems={cartItems} cartTotal={cartTotal} navigate={navigate} />
            </div>
          )}

          {/* Blogs */}
          {msg.type === 'blogs' && (
            <div className="chat-blogs-block">
              <div className="chat-bubble bot" style={{ marginBottom: 8 }}>
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              </div>
              <div className="chat-blogs-list">
                {msg.data?.map(b => <ChatBlogCard key={b._id} blog={b} />)}
              </div>
            </div>
          )}

          {/* Cart redirect */}
          {msg.type === 'cart_redirect' && (
            <div className="chat-bubble bot">
              <span dangerouslySetInnerHTML={{ __html: formatText(msg.message) }} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="chat-action-btn outline" onClick={() => navigate('/cart')}>View Cart</button>
                <button className="chat-action-btn primary" onClick={() => navigate('/checkout')}>Checkout</button>
              </div>
            </div>
          )}

          {/* Quick replies */}
          {msg.quickReplies?.length > 0 && (
            <div className="chat-quick-replies">
              {msg.quickReplies.map((r, i) => (
                <button key={i} className="chat-quick-reply-btn" onClick={() => handleQuickReply(r)}>
                  {r}
                </button>
              ))}
            </div>
          )}

          <span className="chat-time">{msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ── FAQ + Chatbot Structured Data for SEO ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How do I track my order on ClassyShop?', acceptedAnswer: { '@type': 'Answer', text: 'You can track your order by going to your Profile > My Orders, or ask our AI Assistant by typing "track my order".' } },
          { '@type': 'Question', name: 'Does ClassyShop offer free delivery in Pakistan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes! ClassyShop offers free international and domestic delivery. Ask our AI Assistant for current delivery promotions.' } },
          { '@type': 'Question', name: 'What categories does ClassyShop sell?', acceptedAnswer: { '@type': 'Answer', text: 'ClassyShop sells Fashion, Electronics, Bags, Footwear, Groceries, Beauty, Wellness and Jewellery.' } },
          { '@type': 'Question', name: 'How do I return a product?', acceptedAnswer: { '@type': 'Answer', text: 'You can initiate a return from My Orders or contact our AI Assistant for step-by-step return help.' } },
          { '@type': 'Question', name: 'What payment methods does ClassyShop accept?', acceptedAnswer: { '@type': 'Answer', text: 'We accept Cash on Delivery, Credit/Debit Cards, and Online Bank Transfer across Pakistan.' } },
        ],
      })}} />

      {/* ── Floating Button ── */}
      <button
        className={`chatbot-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open ClassyShop AI Shopping Assistant"
        title="Chat with our AI Shopping Assistant"
        role="button"
      >
        {open ? <FaTimes /> : <FaRobot />}
        {!open && unread > 0 && <span className="chatbot-fab-badge" aria-label={`${unread} unread messages`}>{unread}</span>}
        {!open && <span className="chatbot-fab-label">AI Assistant</span>}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="chatbot-window" role="dialog" aria-label="ClassyShop AI Shopping Assistant" aria-modal="true">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">
                <FaRobot />
                <span className="chatbot-online-dot" />
              </div>
              <div>
                <h4>ClassyShop Assistant</h4>
                <span>Always online · AI-powered</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button title="Clear chat" onClick={clearChat} className="chatbot-hdr-btn">
                <FaThumbsUp style={{ fontSize: 13 }} />
              </button>
              <button title="Close" onClick={() => setOpen(false)} className="chatbot-hdr-btn">
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Quick action chips */}
          <div className="chatbot-chips-bar">
            <div className="chatbot-chips">
              {QUICK_ACTIONS.map((a, i) => (
                <button key={i} className="chatbot-chip" onClick={() => sendMessage(a.msg)}>
                  {a.label}
                </button>
              ))}
            </div>
            <button className="chatbot-chips-toggle" onClick={() => setShowQuickActions(s => !s)}>
              <MdExpandMore style={{ transform: showQuickActions ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(renderMessage)}

            {/* Typing indicator */}
            {typing && (
              <div className="chat-msg bot">
                <div className="chat-bot-avatar"><FaRobot /></div>
                <div className="chat-typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-area">
            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="chatbot-suggestions">
                {suggestions.map(s => (
                  <button key={s._id} className="chatbot-suggestion-item" onClick={() => handleSuggestionClick(s)}>
                    <img src={s.image} alt={s.name} />
                    <div>
                      <p>{s.name}</p>
                      <span>{s.category} · Rs.{s.price?.toLocaleString()}</span>
                    </div>
                    <FaSearch style={{ color: '#aaa', fontSize: 12 }} />
                  </button>
                ))}
              </div>
            )}

            <div className="chatbot-input-row">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => input.length >= 2 && setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ask me anything..."
                maxLength={200}
              />
              <button
                className="chatbot-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
              >
                <FaPaperPlane />
              </button>
            </div>
            <p className="chatbot-footer-note">
              <FaRobot style={{ fontSize: 10 }} /> AI-powered · ClassyShop · Type or click a chip above
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
