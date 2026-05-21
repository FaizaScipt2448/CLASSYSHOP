import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaHeart, FaShoppingBag, FaSignOutAlt, FaEllipsisV, FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import ProductCard from '../../components/ProductCard/ProductCard';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ORDERS_PER_PAGE = 5;

const ProfilePage = () => {
  const { user, authHeader, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'profile');
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [wishlist, setWishlist] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwSection, setShowPwSection] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddrPanel, setShowAddrPanel] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);
  const [addrForm, setAddrForm] = useState({
    fullName: '', phone: '', addressLine1: '', city: '',
    state: '', pincode: '', country: 'Pakistan', landmark: '', type: 'Home'
  });
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    fetchOrders();
    fetchAddresses();
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data } = await axios.get('/api/auth/profile', authHeader());
      setWishlist(data.wishlist || []);
    } catch { console.error('Error fetching wishlist'); }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(`/api/auth/wishlist/${productId}`, authHeader());
      setWishlist(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch { toast.error('Error removing item'); }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders/myorders', authHeader());
      setOrders(data);
    } catch { console.error('Error fetching orders'); }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get('/api/auth/addresses', authHeader());
      setAddresses(data);
    } catch { console.error('Error fetching addresses'); }
  };

  const openAddPanel = () => {
    setEditingAddr(null);
    setAddrForm({ fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', country: 'Pakistan', landmark: '', type: 'Home' });
    setShowAddrPanel(true);
    setOpenMenu(null);
  };

  const openEditPanel = (addr) => {
    setEditingAddr(addr._id);
    setAddrForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'Pakistan',
      landmark: addr.landmark || '',
      type: addr.type || 'Home'
    });
    setShowAddrPanel(true);
    setOpenMenu(null);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddr) {
        const { data } = await axios.put(`/api/auth/addresses/${editingAddr}`, addrForm, authHeader());
        setAddresses(data);
        toast.success('Address updated!');
      } else {
        const { data } = await axios.post('/api/auth/addresses', addrForm, authHeader());
        setAddresses(data);
        toast.success('Address saved!');
      }
      setShowAddrPanel(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving address');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const { data } = await axios.delete(`/api/auth/addresses/${addrId}`, authHeader());
      setAddresses(data);
      toast.success('Address deleted');
      setOpenMenu(null);
    } catch { toast.error('Error deleting address'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put('/api/auth/profile', form, authHeader());
      toast.success('Profile updated!');
      // update stored user
      const updated = { ...user, name: data.name, email: data.email, phone: data.phone };
      localStorage.setItem('classyshop_user', JSON.stringify(updated));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await axios.put('/api/auth/change-password', {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword
      }, authHeader());
      toast.success('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    }
  };

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const pagedOrders = orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE);

  const navItems = [
    { key: 'profile', label: 'My Profile', icon: <FaUser /> },
    { key: 'address', label: 'Address', icon: <FaMapMarkerAlt /> },
    { key: 'wishlist', label: 'My List', icon: <FaHeart /> },
    { key: 'orders', label: 'My Orders', icon: <FaShoppingBag /> },
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Left Sidebar */}
          <div className="profile-sidebar">
            <div className="profile-avatar-box">
              <img
                src="https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=100&h=100&fit=crop"
                alt="avatar"
                className="profile-avatar-img"
              />
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
            <nav className="profile-nav">
              {navItems.map(item => (
                <button
                  key={item.key}
                  className={tab === item.key ? 'active' : ''}
                  onClick={() => setTab(item.key)}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>
                <FaSignOutAlt /> Logout
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-content">

            {/* MY PROFILE TAB */}
            {tab === 'profile' && (
              <div className="profile-section">
                <div className="profile-section-header">
                  <h2>My Profile</h2>
                  <button className="change-pw-link" onClick={() => setShowPwSection(!showPwSection)}>
                    CHANGE PASSWORD
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="profile-form">
                  <div className="form-row">
                    <div className="form-floating">
                      <input
                        id="fname"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder=" "
                      />
                      <label htmlFor="fname">Full Name</label>
                    </div>
                    <div className="form-floating">
                      <input
                        id="femail"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder=" "
                      />
                      <label htmlFor="femail">Email</label>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="phone-input-wrap">
                      <span className="phone-flag">🇵🇰 +92</span>
                      <input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="Phone number"
                        className="phone-input"
                      />
                    </div>
                  </div>
                  <button type="submit" className="update-btn">UPDATE PROFILE</button>
                </form>

                {showPwSection && (
                  <div className="change-pw-section">
                    <h3>Change Password</h3>
                    <form onSubmit={handleChangePassword} className="pw-form">
                      <div className="form-row">
                        <div className="form-floating">
                          <input
                            id="oldpw"
                            type="password"
                            value={pwForm.oldPassword}
                            onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                            placeholder=" "
                            required
                          />
                          <label htmlFor="oldpw">Old Password</label>
                        </div>
                        <div className="form-floating">
                          <input
                            id="newpw"
                            type="password"
                            value={pwForm.newPassword}
                            onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                            placeholder=" "
                            required
                          />
                          <label htmlFor="newpw">New Password</label>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-floating">
                          <input
                            id="confpw"
                            type="password"
                            value={pwForm.confirmPassword}
                            onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                            placeholder=" "
                            required
                          />
                          <label htmlFor="confpw">Confirm Password</label>
                        </div>
                      </div>
                      <button type="submit" className="update-btn">CHANGE PASSWORD</button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ADDRESS TAB */}
            {tab === 'address' && (
              <div className="profile-section">
                <div className="addr-section-header">
                  <h2>My Addresses</h2>
                  <button className="add-addr-btn" onClick={openAddPanel}>
                    <FaPlus /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <p style={{ color: '#888', fontSize: 14 }}>No addresses saved yet.</p>
                ) : (
                  <div className="addr-cards-grid">
                    {addresses.map(addr => (
                      <div key={addr._id} className="addr-card">
                        <div className="addr-card-top">
                          <span className={`addr-type-badge ${addr.type === 'Office' ? 'office' : ''}`}>{addr.type}</span>
                          <div className="addr-menu-wrap">
                            <button className="addr-menu-btn" onClick={() => setOpenMenu(openMenu === addr._id ? null : addr._id)}>
                              <FaEllipsisV />
                            </button>
                            {openMenu === addr._id && (
                              <div className="addr-dropdown">
                                <button onClick={() => openEditPanel(addr)}>Edit</button>
                                <button onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="addr-card-name">{addr.fullName}</p>
                        <p className="addr-card-phone">{addr.phone}</p>
                        <p className="addr-card-address">
                          {[addr.addressLine1, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')}
                        </p>
                        {addr.landmark && <p className="addr-card-landmark">Near: {addr.landmark}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Slide-in Panel */}
                {showAddrPanel && (
                  <div className="addr-panel-overlay" onClick={() => setShowAddrPanel(false)}>
                    <div className="addr-panel" onClick={e => e.stopPropagation()}>
                      <div className="addr-panel-header">
                        <h3>Add Delivery Address</h3>
                        <button className="addr-panel-close" onClick={() => setShowAddrPanel(false)}>
                          <FaTimes />
                        </button>
                      </div>
                      <form onSubmit={handleSaveAddress} className="addr-panel-form">
                        <div className="addr-field">
                          <label>Address Line 1</label>
                          <input
                            value={addrForm.addressLine1}
                            onChange={e => setAddrForm({ ...addrForm, addressLine1: e.target.value })}
                            placeholder="House / Flat / Block No., Street"
                            required
                          />
                        </div>
                        <div className="addr-row">
                          <div className="addr-field">
                            <label>City</label>
                            <input value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" required />
                          </div>
                          <div className="addr-field">
                            <label>State</label>
                            <input value={addrForm.state} onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="State / Province" />
                          </div>
                        </div>
                        <div className="addr-row">
                          <div className="addr-field">
                            <label>Pincode</label>
                            <input value={addrForm.pincode} onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="Postal Code" />
                          </div>
                          <div className="addr-field">
                            <label>Country</label>
                            <input value={addrForm.country} onChange={e => setAddrForm({ ...addrForm, country: e.target.value })} placeholder="Country" />
                          </div>
                        </div>
                        <div className="addr-field">
                          <label>Phone</label>
                          <div className="addr-phone-wrap">
                            <span className="addr-phone-flag">🇵🇰 +92</span>
                            <input
                              value={addrForm.phone}
                              onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })}
                              placeholder="Phone number"
                              className="addr-phone-input"
                            />
                          </div>
                        </div>
                        <div className="addr-field">
                          <label>Full Name</label>
                          <input value={addrForm.fullName} onChange={e => setAddrForm({ ...addrForm, fullName: e.target.value })} placeholder="Full name" required />
                        </div>
                        <div className="addr-field">
                          <label>Landmark (Optional)</label>
                          <input value={addrForm.landmark} onChange={e => setAddrForm({ ...addrForm, landmark: e.target.value })} placeholder="Nearby landmark" />
                        </div>
                        <div className="addr-field">
                          <label>Address Type</label>
                          <div className="addr-type-radio">
                            {['Home', 'Office'].map(t => (
                              <label key={t} className={`addr-radio-label ${addrForm.type === t ? 'selected' : ''}`}>
                                <input
                                  type="radio"
                                  name="addrType"
                                  value={t}
                                  checked={addrForm.type === t}
                                  onChange={() => setAddrForm({ ...addrForm, type: t })}
                                />
                                {t}
                              </label>
                            ))}
                          </div>
                        </div>
                        <button type="submit" className="addr-save-btn">SAVE</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {tab === 'wishlist' && (
              <div className="profile-section">
                <div className="profile-section-header">
                  <h2>My Wishlist ({wishlist.length})</h2>
                </div>
                {wishlist.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <FaHeart style={{ fontSize: 40, color: '#e0e0e0', marginBottom: 12 }} />
                    <p style={{ color: '#aaa', fontSize: 14 }}>Your wishlist is empty.</p>
                    <button className="update-btn" onClick={() => navigate('/')} style={{ marginTop: 12 }}>
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="wishlist-inline-grid">
                    {wishlist.map(product => product && (
                      <div key={product._id} className="wishlist-inline-item">
                        <div className="wishlist-remove-wrap">
                          <button
                            className="wishlist-remove-btn"
                            title="Remove from wishlist"
                            onClick={() => removeFromWishlist(product._id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MY ORDERS TAB */}
            {tab === 'orders' && (
              <div className="profile-section">
                <h2>My Orders</h2>
                <p className="orders-count">There are <strong>{orders.length}</strong> orders</p>
                {orders.length === 0 ? (
                  <p className="no-orders">No orders yet.</p>
                ) : (
                  <>
                    <div className="orders-table-wrap">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>ORDER ID</th>
                            <th>PAYMANT ID</th>
                            <th>NAME</th>
                            <th>PHONE NUMBER</th>
                            <th>ADDRESS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedOrders.map(order => (
                            <OrderRow key={order._id} order={order} navigate={navigate} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div className="orders-pagination">
                        <button onClick={() => setOrdersPage(1)} disabled={ordersPage === 1}>|&lt;</button>
                        <button onClick={() => setOrdersPage(p => Math.max(1, p - 1))} disabled={ordersPage === 1}>&lt;</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            className={ordersPage === p ? 'active' : ''}
                            onClick={() => setOrdersPage(p)}
                          >{p}</button>
                        ))}
                        <button onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))} disabled={ordersPage === totalPages}>&gt;</button>
                        <button onClick={() => setOrdersPage(totalPages)} disabled={ordersPage === totalPages}>&gt;|</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderRow = ({ order, navigate }) => {
  const [expanded, setExpanded] = useState(false);
  const addr = order.shippingAddress;
  const addrStr = addr ? `${addr.address}, ${addr.city}` : '-';
  const addrLabel = order.addressLabel || 'Home';
  const paymentId = order.isPaid ? (order.paymentResult?.id || 'PAID') : (order.paymentMethod?.toUpperCase() || 'CASH ON DELIVERY');

  return (
    <>
      <tr className="order-row" onClick={() => setExpanded(!expanded)}>
        <td><button className="expand-btn">{expanded ? '∧' : '∨'}</button></td>
        <td><span className="order-id-link" onClick={e => { e.stopPropagation(); navigate(`/order/${order._id}`); }}>{order._id}</span></td>
        <td><span className="payment-id">{paymentId}</span></td>
        <td>{order.shippingAddress?.fullName || '-'}</td>
        <td>{order.shippingAddress?.phone || '-'}</td>
        <td>
          <span className="addr-label">{addrLabel}</span>
          <span className="addr-text">{addrStr}</span>
        </td>
      </tr>
      {expanded && (
        <tr className="order-expanded-row">
          <td colSpan={6}>
            <div className="order-items-list">
              {order.orderItems?.map((item, i) => (
                <div key={i} className="order-exp-item">
                  <img src={item.image} alt={item.name} />
                  <span>{item.name}</span>
                  <span>x{item.qty}</span>
                  <span>Rs.{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="order-exp-total">
                Total: <strong>Rs.{order.totalPrice?.toLocaleString()}</strong>
                &nbsp;|&nbsp; Status: <strong className={`status-${order.status}`}>{order.status}</strong>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ProfilePage;
