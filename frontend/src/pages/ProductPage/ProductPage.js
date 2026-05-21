import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaHeart, FaExchangeAlt, FaChevronLeft, FaUserCircle } from 'react-icons/fa';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProductCard from '../../components/ProductCard/ProductCard';
import './ProductPage.css';

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) stars.push(<FaStar key={i} />);
    else if (i === Math.ceil(rating) && rating % 1 !== 0) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return <div className="stars">{stars}</div>;
};

const StarPicker = ({ value, onChange }) => (
  <div className="star-picker">
    {[1,2,3,4,5].map(i => (
      <span key={i} onClick={() => onChange(i)} className={i <= value ? 'filled' : ''}>
        {i <= value ? <FaStar /> : <FaRegStar />}
      </span>
    ))}
  </div>
);

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [alsobought, setAlsobought] = useState([]);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(1);
  const { addToCart } = useCart();
  const { user, authHeader } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]); // eslint-disable-line

  const trackView = async (productId) => {
    try {
      let sessionId = sessionStorage.getItem('cs_session');
      if (!sessionId) {
        sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('cs_session', sessionId);
      }
      await axios.post('/api/recommendations/track', {
        userId:    user?._id || null,
        sessionId: user ? null : sessionId,
        productId,
        action:    'view'
      });
    } catch {} // non-critical — fire and forget
  };


  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/products/${id}`);
      setProduct(data);
      trackView(data._id); // use actual MongoDB _id, not the slug from URL
      const rel = await axios.get(`/api/products?category=${data.category}&limit=8`);
      setRelated(rel.data.filter(p => p._id !== data._id).slice(0, 4));
      // "Customers also bought" via co-purchase recommendation engine
      const also = await axios.get(`/api/recommendations/also-bought?productId=${data._id}&category=${data.category}`);
      setAlsobought(also.data);
    } catch {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, qty);
    toast.success('Added to cart!');
    // Track add-to-cart behavior for recommendation engine
    try {
      const sessionId = sessionStorage.getItem('cs_session');
      axios.post('/api/recommendations/track', {
        userId:    user?._id || null,
        sessionId: user ? null : sessionId,
        productId: product._id,
        action:    'add_to_cart',
        category:  product.category
      });
    } catch {}
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login'); return; }
    try {
      await axios.post('/api/auth/wishlist', { productId: product._id }, authHeader());
      toast.success('Added to wishlist!');
    } catch { toast.error('Already in wishlist'); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to submit a review'); return; }
    if (!reviewText.trim()) { toast.error('Please write a review'); return; }
    try {
      await axios.post(`/api/products/${product._id}/reviews`, { rating: reviewRating, comment: reviewText }, authHeader());
      toast.success('Review submitted!');
      setReviewText('');
      setReviewRating(1);
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
  };

  if (loading) return <div className="product-page-loading">Loading...</div>;
  if (!product) return <div className="product-page-loading">Product not found</div>;

  const images = [product.image, ...(product.images || [])];

  return (
    <div className="product-page">
      <SEOHead
        title={product.metaTitle || `${product.name} — ${product.brand}`}
        description={product.metaDescription || product.description?.slice(0, 155)}
        keywords={[
          product.metaKeywords,
          product.tags?.join(', '),
          product.name, product.brand, product.category,
          `buy ${product.name} Pakistan`, `${product.category} Pakistan`,
        ].filter(Boolean).join(', ')}
        image={product.image}
        url={`/product/${product.slug || product._id}`}
        type="product"
        product={product}
        breadcrumbs={[
          { name: product.category, url: `/category/${product.category.toLowerCase()}` },
          { name: product.name,     url: `/product/${product.slug || product._id}` },
        ]}
      />
      <div className="container">
        <Link to="/" className="back-link"><FaChevronLeft /> Back to Home</Link>

        {/* ── Product Detail ── */}
        <div className="product-detail">
          <div className="product-images">
            <div className="main-image">
              <img src={images[selectedImg]} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="thumb-images">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" className={selectedImg === i ? 'active' : ''} onClick={() => setSelectedImg(i)} />
                ))}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <p className="detail-brand">{product.brand}</p>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <StarRating rating={product.rating} />
              <span>({product.numReviews} reviews)</span>
            </div>
            <div className="detail-price">
              {product.originalPrice > product.price && (
                <span className="orig">Rs.{product.originalPrice.toLocaleString()}</span>
              )}
              <span className="sale">Rs.{product.price.toLocaleString()}</span>
              {product.discount > 0 && <span className="disc-badge">{product.discount}% OFF</span>}
            </div>
            <p className="detail-desc">{product.description}</p>
            <div className="detail-stock">
              Status: <strong style={{ color: product.countInStock > 0 ? '#27ae60' : '#e94560' }}>
                {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
              </strong>
            </div>

            {product.countInStock > 0 && (
              <>
                <div className="qty-cart">
                  <div className="qty-control">
                    <input
                      type="number"
                      min={1}
                      max={product.countInStock}
                      value={qty}
                      onChange={e => setQty(Math.max(1, Math.min(product.countInStock, Number(e.target.value))))}
                    />
                    <div className="qty-arrows">
                      <button onClick={() => setQty(q => Math.min(product.countInStock, q + 1))}>▲</button>
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}>▼</button>
                    </div>
                  </div>
                  <button className="add-cart-big" onClick={handleAddToCart}>
                    <FaShoppingCart /> ADD TO CART
                  </button>
                </div>
                <div className="wishlist-compare-row">
                  <button className="wc-btn" onClick={handleWishlist}>
                    <FaHeart /> Add to Wishlist
                  </button>
                  <button className="wc-btn">
                    <FaExchangeAlt /> Add to Compare
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="product-tabs">
          <div className="tab-headers">
            <button
              className={activeTab === 'description' ? 'active' : ''}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={activeTab === 'reviews' ? 'active' : ''}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.reviews?.length || 0})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="desc-text">
                <p>{product.description}</p>
                {(product.tags?.length > 0) && (
                  <div className="product-tags" style={{ marginTop: 16 }}>
                    <strong style={{ fontSize: 13, color: '#555' }}>Tags: </strong>
                    {product.tags.map((tag, i) => (
                      <span key={i} style={{ background: '#f0f0f0', borderRadius: 4, padding: '2px 10px', marginLeft: 6, fontSize: 12, color: '#666' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-panel">
                {product.reviews?.length > 0 && (
                  <>
                    <h3 className="cqa-title">Customer questions &amp; answers</h3>
                    <div className="reviews-list">
                      {product.reviews.map((r, i) => (
                        <div key={i} className="review-item">
                          <FaUserCircle className="review-avatar" />
                          <div className="review-body">
                            <div className="review-header">
                              <strong>{r.name}</strong>
                              <span className="review-date">{new Date(r.createdAt).toISOString().split('T')[0]}</span>
                            </div>
                            <p className="review-comment">{r.comment}</p>
                          </div>
                          <StarRating rating={r.rating} />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="add-review-box">
                  <h3>Add a review</h3>
                  <form onSubmit={handleReview} className="review-form">
                    <textarea
                      placeholder="Write a review..."
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      rows={5}
                    />
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                    <button type="submit" className="submit-review-btn">SUBMIT REVIEW</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Customers Also Bought ── */}
        {alsobought.length > 0 && (
          <div className="related-section">
            <h2>Customers Also Bought</h2>
            <div className="related-grid">
              {alsobought.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="related-section">
            <h2>Related Products</h2>
            <div className="related-grid">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
