import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaCheckCircle, FaClock, FaTruck, FaBoxOpen, FaBan,
  FaMotorcycle, FaCalendarAlt, FaMapMarkerAlt, FaCreditCard
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './OrderPage.css';

/* ── 5-Step tracking pipeline ── */
const TRACKING_STEPS = [
  {
    key:   'pending',
    label: 'Order Placed',
    desc:  'Your order has been received',
    icon:  <FaClock />
  },
  {
    key:   'processing',
    label: 'Packed & Ready',
    desc:  'Your order is packed and ready for dispatch',
    icon:  <FaBoxOpen />
  },
  {
    key:   'shipped',
    label: 'Shipped',
    desc:  'Your order is on the way',
    icon:  <FaTruck />
  },
  {
    key:   'out_for_delivery',
    label: 'Out for Delivery',
    desc:  'Arriving today!',
    icon:  <FaMotorcycle />
  },
  {
    key:   'delivered',
    label: 'Delivered',
    desc:  'Package delivered successfully',
    icon:  <FaCheckCircle />
  }
];

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_CONFIG = {
  pending:          { color: '#f59e0b', bg: '#fffbeb', label: 'Order Placed'     },
  processing:       { color: '#3b82f6', bg: '#eff6ff', label: 'Packed & Ready'   },
  shipped:          { color: '#8b5cf6', bg: '#f5f3ff', label: 'Shipped'          },
  out_for_delivery: { color: '#f97316', bg: '#fff7ed', label: 'Out for Delivery' },
  delivered:        { color: '#10b981', bg: '#ecfdf5', label: 'Delivered'        },
  cancelled:        { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled'        },
};

const fmt = (date) => date
  ? new Date(date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
  : null;

const fmtTime = (date) => date
  ? new Date(date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
  : null;

const OrderPage = () => {
  const { id }          = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authHeader } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        // Try the rich tracking endpoint first; fall back to regular order endpoint
        const { data } = await axios.get(`/api/orders/${id}`, authHeader());
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line

  if (loading) return <div className="order-loading"><div className="order-spinner" />Loading order...</div>;
  if (!order)  return <div className="order-loading">Order not found</div>;

  const isCancelled = order.status === 'cancelled';
  const cfg         = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const currentStep = STATUS_ORDER.indexOf(order.status);

  // Build a lookup of timestamps from statusHistory
  const historyMap = {};
  (order.statusHistory || []).forEach(h => { historyMap[h.status] = h; });

  // Estimated delivery
  const estimated = order.estimatedDelivery ? new Date(order.estimatedDelivery) : null;
  const isToday   = estimated && new Date().toDateString() === estimated.toDateString();
  const isPast    = estimated && estimated < new Date() && !order.isDelivered;

  return (
    <div className="order-page">
      <div className="container">

        {/* ── Title ── */}
        <div className="order-top-row">
          <div>
            <h1>Order Tracking</h1>
            <p className="order-id">
              Order <span className="order-id-mono">#{order._id}</span>
              &nbsp;·&nbsp; Placed on {fmt(order.createdAt)}
            </p>
          </div>
          <span className="order-status-pill" style={{ color: cfg.color, background: cfg.bg }}>
            {cfg.label}
          </span>
        </div>

        {/* ── Estimated Delivery Banner ── */}
        {!isCancelled && order.status !== 'delivered' && estimated && (
          <div className={`est-delivery-banner ${isToday ? 'today' : isPast ? 'late' : ''}`}>
            <FaCalendarAlt />
            <div>
              <strong>
                {isToday
                  ? '🚚 Arriving Today!'
                  : isPast
                  ? '⚠️ Delayed — Expected soon'
                  : `Estimated Delivery: ${estimated.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
              </strong>
              {order.shippingAddress?.city && (
                <span>&nbsp;to {order.shippingAddress.city}</span>
              )}
            </div>
          </div>
        )}
        {order.status === 'delivered' && order.deliveredAt && (
          <div className="est-delivery-banner delivered">
            <FaCheckCircle />
            <strong>Delivered on {fmt(order.deliveredAt)} at {fmtTime(order.deliveredAt)}</strong>
          </div>
        )}

        {/* ── 5-Step Visual Tracker ── */}
        {!isCancelled && (
          <div className="order-tracker-card">
            <div className="order-tracker">
              {TRACKING_STEPS.map((step, i) => {
                const done   = i <= currentStep;
                const active = i === currentStep;
                const hist   = historyMap[step.key];
                return (
                  <React.Fragment key={step.key}>
                    <div className={`tracker-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                      <div className="tracker-icon-wrap">
                        <div className="tracker-icon">{step.icon}</div>
                        {active && <div className="tracker-pulse" />}
                      </div>
                      <div className="tracker-info">
                        <span className="tracker-label">{step.label}</span>
                        {done && hist?.timestamp && (
                          <span className="tracker-time">{fmt(hist.timestamp)}</span>
                        )}
                        {active && !hist && (
                          <span className="tracker-time" style={{ color: '#e94560' }}>In Progress</span>
                        )}
                        {!done && !active && (
                          <span className="tracker-time">Pending</span>
                        )}
                      </div>
                    </div>
                    {i < TRACKING_STEPS.length - 1 && (
                      <div className={`tracker-line ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                        {i < currentStep && <div className="tracker-line-fill" />}
                        {i === currentStep && <div className="tracker-line-partial" />}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Status history timeline (detail) */}
            {order.statusHistory?.length > 0 && (
              <div className="status-history">
                <h4>Status Timeline</h4>
                <div className="history-list">
                  {[...order.statusHistory].reverse().map((h, i) => {
                    const hcfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
                    return (
                      <div key={i} className="history-item">
                        <div className="history-dot" style={{ background: hcfg.color }} />
                        <div className="history-body">
                          <span className="history-status" style={{ color: hcfg.color }}>{hcfg.label}</span>
                          {h.note && <span className="history-note">{h.note}</span>}
                          <span className="history-ts">
                            {fmt(h.timestamp)} {fmtTime(h.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Cancelled Banner ── */}
        {isCancelled && (
          <div className="cancelled-banner">
            <FaBan />
            <div>
              <strong>Order Cancelled</strong>
              <p>This order has been cancelled. If you were charged, a refund will be issued within 3–5 business days.</p>
            </div>
          </div>
        )}

        {/* ── Detail Grid ── */}
        <div className="order-layout">
          <div>
            {/* Shipping */}
            <div className="order-card">
              <h3><FaMapMarkerAlt /> Shipping Address</h3>
              <p><strong>{order.shippingAddress.name}</strong></p>
              <p>{order.shippingAddress.address}, {order.shippingAddress.city}</p>
              <p>{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
              <p>📞 {order.shippingAddress.phone}</p>
            </div>

            {/* Payment */}
            <div className="order-card">
              <h3><FaCreditCard /> Payment</h3>
              <p>Method: <strong>{order.paymentMethod}</strong></p>
              <p>
                Status:&nbsp;
                <span style={{ color: order.isPaid ? '#10b981' : '#e94560', fontWeight: 700 }}>
                  {order.isPaid ? '✓ Paid' : '⏳ Payment Pending'}
                </span>
              </p>
              {order.isPaid && order.paidAt && (
                <p style={{ fontSize: 12, color: '#888' }}>
                  Paid on: {fmt(order.paidAt)} at {fmtTime(order.paidAt)}
                </p>
              )}
            </div>

            {/* Order Items */}
            <div className="order-card">
              <h3>Order Items ({order.orderItems.length})</h3>
              {order.orderItems.map((item, i) => (
                <div key={i} className="order-item-row">
                  <img src={item.image} alt={item.name} />
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-qty">×{item.qty}</span>
                  <span className="order-item-price">Rs.{(item.qty * item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>
            <div><span>Items:</span><span>Rs.{order.itemsPrice?.toLocaleString()}</span></div>
            <div><span>Shipping:</span><span>{order.shippingPrice === 0 ? 'FREE' : `Rs.${order.shippingPrice}`}</span></div>
            <div><span>Tax (5%):</span><span>Rs.{order.taxPrice?.toLocaleString()}</span></div>
            <div className="order-total">
              <span>Total:</span>
              <span>Rs.{order.totalPrice?.toLocaleString()}</span>
            </div>
            <div className="order-action-btns">
              <Link to="/profile?tab=orders" className="track-btn">All My Orders</Link>
              <Link to="/" className="continue-btn">Continue Shopping</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderPage;
