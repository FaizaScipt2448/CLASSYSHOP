import React, { useState, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdExpandMore, MdExpandLess, MdShoppingBag, MdLocalShipping, MdPendingActions, MdCheckCircle } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending:    { bg: '#fff3e0', color: '#e65100' },
  processing: { bg: '#e3f2fd', color: '#1565c0' },
  shipped:    { bg: '#f3e5f5', color: '#6a1b9a' },
  delivered:  { bg: '#e8f5e9', color: '#2e7d32' },
  cancelled:  { bg: '#fdecea', color: '#c62828' },
};

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '14px 14px', color: '#fff', fontSize: 11,
    fontWeight: 800, letterSpacing: 0.9, textAlign: 'left',
    whiteSpace: 'nowrap', borderBottom: 'none', ...style
  }}>
    {children}
  </th>
);

const AdminOrders = () => {
  const { authHeader } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});
  const ROWS = 15;

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get('/api/orders', authHeader());
      setOrders(data);
    } catch { toast.error('Failed to load orders'); }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/admin/orders/${orderId}/status`, { status }, authHeader());
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success('Status updated');
    } catch { toast.error('Update failed'); }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o._id.toLowerCase().includes(q) ||
      (o.shippingAddress?.name || o.user?.name || '').toLowerCase().includes(q) ||
      (o.user?.email || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ROWS);
  const paged = filtered.slice((page - 1) * ROWS, page * ROWS);

  // KPI stats
  const totalRevenue  = orders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const deliveredCnt  = orders.filter(o => o.status === 'delivered').length;
  const pendingCnt    = orders.filter(o => o.status === 'pending').length;
  const processingCnt = orders.filter(o => ['processing', 'shipped'].includes(o.status)).length;

  const kpis = [
    { label: 'Total Orders',  value: orders.length,                           icon: <MdShoppingBag size={22} />,    color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
    { label: 'Total Revenue', value: `Rs.${totalRevenue.toLocaleString('en-PK')}`, icon: <MdCheckCircle size={22} />, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Delivered',     value: deliveredCnt,                            icon: <MdLocalShipping size={22} />,  color: '#2e7d32', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Pending',       value: pendingCnt + processingCnt,              icon: <MdPendingActions size={22} />, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

  return (
    <div className="space-y-5">

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl flex items-center gap-4 p-4"
            style={{ background: k.bg, border: `1.5px solid ${k.border}` }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
              style={{ background: k.color + '20', color: k.color }}>
              {k.icon}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: 0.8, margin: 0 }}>{k.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: k.color, margin: 0, lineHeight: 1.2 }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1.5px solid #e2e8f0', background: '#fff' }}>

        {/* Card header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
          padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Orders</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '3px 0 0' }}>
              {filtered.length} order{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search by order ID, name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                padding: '9px 16px 9px 36px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13,
                outline: 'none', width: 300, backdropFilter: 'blur(8px)',
              }}
            />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>⌕</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)' }}>
                <TH style={{ width: 40 }}></TH>
                <TH>ORDER ID</TH>
                <TH>PAYMENT ID</TH>
                <TH>NAME</TH>
                <TH>PHONE NUMBER</TH>
                <TH>ADDRESS</TH>
                <TH>PINCODE</TH>
                <TH>TOTAL AMOUNT</TH>
                <TH>EMAIL</TH>
                <TH>USER ID</TH>
                <TH>ORDER STATUS</TH>
                <TH>DATE</TH>
              </tr>
            </thead>
            <tbody>
              {paged.map((order, rowIdx) => {
                const addr = order.shippingAddress;
                const name = addr?.name || order.user?.name || '-';
                const phone = addr?.phone || '-';
                const addrStr = [addr?.address, addr?.city, addr?.country].filter(Boolean).join(', ') || '-';
                const pincode = addr?.postalCode || '-';
                const email = order.user?.email || '-';
                const userId = order.user?._id || order.user || '-';
                const payId = order.isPaid
                  ? (order.paymentResult?.id || 'PAID')
                  : (order.paymentMethod?.toUpperCase() || 'CASH ON DELIVERY');
                const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                const isEven = rowIdx % 2 === 0;

                return (
                  <React.Fragment key={order._id}>
                    <tr style={{
                      background: expanded[order._id] ? '#eff6ff' : isEven ? '#fafbff' : '#fff',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { if (!expanded[order._id]) e.currentTarget.style.background = '#f0f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = expanded[order._id] ? '#eff6ff' : isEven ? '#fafbff' : '#fff'; }}
                    >
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8', display: 'flex', padding: 0 }}
                          onClick={() => toggleExpand(order._id)}
                        >
                          {expanded[order._id] ? <MdExpandLess /> : <MdExpandMore />}
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, color: '#1d4ed8', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                          {order._id}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, color: '#e94560', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                        {payId}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', color: '#1e293b' }}>{name}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{phone}</td>
                      <td style={{ padding: '12px 14px', minWidth: 170 }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, background: '#f0f4ff',
                          color: '#4f46e5', padding: '2px 8px', borderRadius: 4, marginBottom: 3,
                          fontWeight: 700, border: '1px solid #c7d2fe'
                        }}>
                          {order.addressLabel || 'Home'}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{addrStr}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>{pincode}</td>
                      <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        Rs.{order.totalPrice?.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>{email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, color: '#7c3aed', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 600 }}>
                          {typeof userId === 'object' ? userId.toString() : userId}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select
                          value={order.status || 'pending'}
                          onChange={e => updateStatus(order._id, e.target.value)}
                          style={{
                            padding: '5px 10px', borderRadius: 20,
                            border: `1.5px solid ${statusStyle.color}`,
                            fontSize: 12, background: statusStyle.bg,
                            color: statusStyle.color, cursor: 'pointer',
                            outline: 'none', fontWeight: 700,
                          }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                    </tr>

                    {expanded[order._id] && (
                      <tr>
                        <td colSpan={12} style={{ background: '#f0f4ff', padding: 0 }}>
                          <div style={{ padding: '16px 22px' }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#3730a3', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                              Order Items
                            </p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)' }}>
                                  {['Product ID', 'Product Title', 'Image', 'Qty', 'Price'].map(h => (
                                    <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Image' || h === 'Qty' ? 'center' : h === 'Price' ? 'right' : 'left', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: 0.6 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderItems?.map((item, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #e0e7ff', background: i % 2 === 0 ? '#fff' : '#f8f9ff' }}>
                                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: '#7c3aed' }}>
                                      {item.product || '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>{item.name}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e0e7ff' }}
                                        onError={e => e.target.style.display = 'none'}
                                      />
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>×{item.qty}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#1d4ed8', fontSize: 14 }}>
                                      Rs.{(item.price * item.qty).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{ marginTop: 12, fontSize: 13, display: 'flex', gap: 28, paddingTop: 12, borderTop: '1px solid #c7d2fe' }}>
                              <span style={{ color: '#64748b' }}>Items: <strong style={{ color: '#1e293b' }}>Rs.{order.itemsPrice?.toLocaleString()}</strong></span>
                              <span style={{ color: '#64748b' }}>Shipping: <strong style={{ color: '#1e293b' }}>Rs.{order.shippingPrice?.toLocaleString() || '0'}</strong></span>
                              <span style={{ color: '#64748b' }}>Total: <strong style={{ color: '#e94560', fontSize: 15 }}>Rs.{order.totalPrice?.toLocaleString()}</strong></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbff' }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            {filtered.length === 0 ? '0' : `${(page - 1) * ROWS + 1}–${Math.min(page * ROWS, filtered.length)}`} of {filtered.length} orders
          </span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e0e7ff', background: page === 1 ? '#f8fafc' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center' }}
            >
              <MdChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', borderColor: page === p ? '#4f46e5' : '#e0e7ff', background: page === p ? '#4f46e5' : '#fff', color: page === p ? '#fff' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e0e7ff', background: page >= totalPages ? '#f8fafc' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center' }}
            >
              <MdChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminOrders;
