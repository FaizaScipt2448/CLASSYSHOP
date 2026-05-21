import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { toast } from 'react-toastify';
import './WishlistPage.css';

const WishlistPage = () => {
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get('/api/auth/profile', authHeader());
      setWishlist(data.wishlist || []);
    } catch { toast.error('Error loading wishlist'); }
    finally { setLoading(false); }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`/api/auth/wishlist/${productId}`, authHeader());
      setWishlist(wishlist.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Error removing item'); }
  };

  return (
    <div className="wishlist-page">
      <div className="container">
        <h1>My Wishlist ({wishlist.length} items)</h1>
        {loading ? <div className="loading">Loading...</div> : (
          wishlist.length === 0 ? (
            <div className="empty-wishlist">
              <h3>Your wishlist is empty</h3>
              <Link to="/">Browse Products</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map(product => product && <ProductCard key={product._id} product={product} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
