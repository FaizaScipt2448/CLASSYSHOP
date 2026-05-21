import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdSearch } from 'react-icons/md';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { currency } from '../../utils/analyticsFormat';

// ── Dummy data with categories + reasons ─────────────────────────────────────
const DUMMY_RETURNS = [
  { id: 'RET-001', product: 'Nike Air Max 270 White',            category: 'Footwear',    qty: 1, refund: 80000,  reason: 'Size not fit',                  status: 'refunded',  date: '2025-05-18' },
  { id: 'RET-002', product: 'Zara Women Floral Midi Dress',      category: 'Fashion',     qty: 2, refund: 50000,  reason: 'Color not same as shown',       status: 'approved',  date: '2025-05-17' },
  { id: 'RET-003', product: "L'Oreal Paris Revitalift Cream",    category: 'Beauty',      qty: 1, refund: 17000,  reason: 'Product damaged on delivery',   status: 'refunded',  date: '2025-05-16' },
  { id: 'RET-004', product: 'Adidas Ultraboost 22 Black',        category: 'Footwear',    qty: 1, refund: 115000, reason: 'Size not fit',                  status: 'refunded',  date: '2025-05-15' },
  { id: 'RET-005', product: 'Women Tote Leather Bag Tan',        category: 'Bags',        qty: 1, refund: 35000,  reason: 'Quality not as expected',       status: 'approved',  date: '2025-05-14' },
  { id: 'RET-006', product: 'MAC Powder Kiss Lipstick Ruby',     category: 'Beauty',      qty: 3, refund: 30000,  reason: 'Wrong item received',           status: 'refunded',  date: '2025-05-13' },
  { id: 'RET-007', product: 'Samsung Galaxy S24 Ultra 512GB',    category: 'Electronics', qty: 1, refund: 900000, reason: 'Device not turning on',         status: 'refunded',  date: '2025-05-12' },
  { id: 'RET-008', product: 'Hush Puppies Men Leather Loafer',   category: 'Footwear',    qty: 1, refund: 45000,  reason: 'Size not fit',                  status: 'requested', date: '2025-05-11' },
  { id: 'RET-009', product: 'Gold Plated Pearl Drop Earrings',   category: 'Jewellery',   qty: 2, refund: 40000,  reason: 'Color not same as shown',       status: 'approved',  date: '2025-05-10' },
  { id: 'RET-010', product: 'Vitamin C Serum 30ml',              category: 'Wellness',    qty: 1, refund: 22000,  reason: 'Allergic reaction to product',  status: 'requested', date: '2025-05-09' },
  { id: 'RET-011', product: 'Apple Watch Series 9 GPS 45mm',     category: 'Electronics', qty: 1, refund: 125000, reason: 'Changed mind after purchase',   status: 'rejected',  date: '2025-05-08' },
  { id: 'RET-012', product: 'Organic Green Tea 100 Bags',        category: 'Groceries',   qty: 2, refund: 6000,   reason: 'Wrong flavor received',         status: 'refunded',  date: '2025-05-07' },
  { id: 'RET-013', product: 'Levi\'s 511 Slim Fit Jeans Blue',  category: 'Fashion',     qty: 1, refund: 12000,  reason: 'Size not fit',                  status: 'approved',  date: '2025-05-06' },
  { id: 'RET-014', product: 'Converse Chuck Taylor All Star',    category: 'Footwear',    qty: 1, refund: 18000,  reason: 'Color not same as shown',       status: 'refunded',  date: '2025-05-05' },
  { id: 'RET-015', product: 'Nykaa BB Cream SPF 30',            category: 'Beauty',      qty: 2, refund: 17000,  reason: 'Product not as described',      status: 'approved',  date: '2025-05-04' },
];

// ── Category color palette (one distinctive color per category) ───────────────
const CATEGORY_COLORS = {
  Footwear:    '#e94560',
  Fashion:     '#7c3aed',
  Beauty:      '#ec4899',
  Electronics: '#2563eb',
  Bags:        '#d97706',
  Jewellery:   '#f59e0b',
  Wellness:    '#059669',
  Groceries:   '#0891b2',
  Other:       '#94a3b8',
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || '#94a3b8';

// ── Pastel stat box ───────────────────────────────────────────────────────────
const PastelBox = ({ label, value, bg, textColor, subtext }) => (
  <div className="rounded-xl p-5 border" style={{ background: bg, borderColor: textColor + '30' }}>
    <p style={{ color: textColor, fontSize: 13, fontWeight: 600, opacity: 0.75 }}>{label}</p>
    <h3 style={{ color: textColor, fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</h3>
    {subtext && <p style={{ color: textColor, fontSize: 12, opacity: 0.6, marginTop: 4 }}>{subtext}</p>}
  </div>
);

// ── Reason background (very light tint) ──────────────────────────────────────
const REASON_TINTS = {
  'Size not fit':                  { bg: '#fce7f3', color: '#be185d' },
  'Color not same as shown':       { bg: '#ede9fe', color: '#6d28d9' },
  'Product damaged on delivery':   { bg: '#fee2e2', color: '#b91c1c' },
  'Quality not as expected':       { bg: '#fef9c3', color: '#a16207' },
  'Wrong item received':           { bg: '#dbeafe', color: '#1d4ed8' },
  'Device not turning on':         { bg: '#dcfce7', color: '#166534' },
  'Changed mind after purchase':   { bg: '#f1f5f9', color: '#475569' },
  'Allergic reaction to product':  { bg: '#ffedd5', color: '#c2410c' },
  'Wrong flavor received':         { bg: '#ccfbf1', color: '#0f766e' },
  'Product not as described':      { bg: '#fef3c7', color: '#92400e' },
  'Other':                         { bg: '#f8fafc', color: '#64748b' },
};

const STATUS_STYLES = {
  refunded:  { background: '#dcfce7', color: '#15803d' },
  approved:  { background: '#dbeafe', color: '#1d4ed8' },
  rejected:  { background: '#fef2f2', color: '#dc2626' },
  requested: { background: '#fef9c3', color: '#a16207' },
};

// ── Custom pie tooltip ────────────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, color: d.payload.color, marginBottom: 2 }}>{d.name}</p>
      <p style={{ color: '#475569', fontSize: 13 }}>{d.value} return{d.value !== 1 ? 's' : ''}</p>
      <p style={{ color: '#94a3b8', fontSize: 12 }}>{((d.value / d.payload.total) * 100).toFixed(1)}% of total</p>
    </div>
  );
};

const DashboardReturnsDetail = () => {
  const [rows,    setRows]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(
          ['/admin/analytics/return-analytics', '/returns/admin/analytics'],
          {}, 'Returns detail'
        );
        devLog('Returns detail:', res.data);
        const raw = res.data?.data?.topProducts || [];
        setRows(raw.length ? raw : DUMMY_RETURNS);
      } catch (err) {
        apiError('Returns load failed', err);
        setRows(DUMMY_RETURNS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = rows.filter(r =>
    (r.product || r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reason   || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Category breakdown for pie chart ─────────────────────────────────────
  const catCounts = rows.reduce((acc, r) => {
    const cat = r.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const total = rows.length;
  const categoryPieData = Object.entries(catCounts)
    .map(([cat, count]) => ({ name: cat, value: count, color: getCategoryColor(cat), total }))
    .sort((a, b) => b.value - a.value);

  // ── Reason breakdown for bar chart ───────────────────────────────────────
  const reasonCounts = rows.reduce((acc, r) => {
    const reason = r.reason || 'Other';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  const reasonBarData = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason: reason.length > 22 ? reason.slice(0, 22) + '…' : reason, fullReason: reason, count }))
    .sort((a, b) => b.count - a.count);

  const totalRefund  = rows.reduce((s, r) => s + (r.refund || r.totalRefund || 0), 0);
  const approvedRate = total > 0
    ? ((rows.filter(r => r.status !== 'rejected').length / total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#e94560', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">All returned products with details, reasons, and category breakdown</p>
        </div>
      </div>

      {/* ── Pastel Stat Boxes ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <PastelBox
          label="Total Returns"
          value={total.toLocaleString('en-PK')}
          bg="#fce7f3"
          textColor="#be185d"
          subtext={`Across ${Object.keys(catCounts).length} categories`}
        />
        <PastelBox
          label="Total Refunded"
          value={currency(totalRefund)}
          bg="#dbeafe"
          textColor="#1e40af"
          subtext="Approved + refunded"
        />
        <PastelBox
          label="Approval Rate"
          value={`${approvedRate}%`}
          bg="#fef9c3"
          textColor="#a16207"
          subtext="Non-rejected returns"
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Category Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Returns by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Each color represents a product category</p>
          <div className="flex gap-4 items-center">
            {/* Donut */}
            <div style={{ width: 200, height: 200, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2 min-w-0">
              {categoryPieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: d.color, flexShrink: 0, display: 'inline-block'
                    }} />
                    <span className="text-sm text-slate-700 truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div style={{ width: 48, height: 6, borderRadius: 999, background: '#f1f5f9' }}>
                      <div style={{ width: `${(d.value / total) * 100}%`, height: '100%', borderRadius: 999, background: d.color }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900" style={{ minWidth: 20, textAlign: 'right' }}>{d.value}</span>
                    <span className="text-xs text-slate-400" style={{ minWidth: 36 }}>
                      {((d.value / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reason Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Return Reasons</h2>
          <p className="text-xs text-slate-400 mb-4">Most common reasons for product returns</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonBarData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category" dataKey="reason"
                  tick={{ fontSize: 10 }} width={155}
                />
                <Tooltip
                  formatter={(v, _, props) => [v, props.payload.fullReason]}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Returns">
                  {reasonBarData.map((_, i) => (
                    <Cell key={i} fill={Object.values(REASON_TINTS)[i % Object.values(REASON_TINTS).length].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Category Stats Row ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Category Overview</h2>
        <div className="flex flex-wrap gap-3">
          {categoryPieData.map((d) => (
            <div
              key={d.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold"
              style={{ background: d.color + '15', borderColor: d.color + '40', color: d.color }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
              {d.name}
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{ background: d.color, color: '#fff' }}
              >
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Returns Table ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-bold text-slate-900 flex-1">All Returns</h2>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search product, category or reason..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2"
              style={{ width: 280 }}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading returns data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Return ID', 'Product', 'Category', 'Qty', 'Refund Amount', 'Reason', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const cat         = row.category || 'Other';
                  const catColor    = getCategoryColor(cat);
                  const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.requested;
                  const reasonStyle = REASON_TINTS[row.reason] || REASON_TINTS['Other'];
                  return (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        {row.id || `RET-${String(i + 1).padStart(3, '0')}`}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800" style={{ maxWidth: 220 }}>
                        {row.product || row.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: catColor + '18', color: catColor, border: `1px solid ${catColor}30` }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, display: 'inline-block' }} />
                          {cat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {row.qty || row.units || 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {currency(row.refund || row.totalRefund || 0)}
                      </td>
                      <td className="px-4 py-3" style={{ maxWidth: 180 }}>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{ background: reasonStyle.bg, color: reasonStyle.color }}
                        >
                          {row.reason || 'Other'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold" style={statusStyle}>
                          {(row.status || 'requested').charAt(0).toUpperCase() + (row.status || 'requested').slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {row.date || row.createdAt?.slice(0, 10) || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-10 text-center text-slate-400">No returns match your search.</div>
            )}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
              Showing {filtered.length} of {rows.length} returns
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardReturnsDetail;
