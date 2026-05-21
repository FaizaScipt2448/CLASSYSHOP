import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdTrendingUp } from 'react-icons/md';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, Sector
} from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { currency } from '../../utils/analyticsFormat';
import { normalizeSalesData } from '../../utils/adminAnalyticsNormalize';

const DUMMY_TREND = [
  { date: '01 May', revenue: 1200000, orders: 8 },
  { date: '02 May', revenue: 980000,  orders: 6 },
  { date: '03 May', revenue: 2100000, orders: 14 },
  { date: '04 May', revenue: 17800000, orders: 3 },
  { date: '05 May', revenue: 450000,  orders: 3 },
  { date: '06 May', revenue: 760000,  orders: 5 },
  { date: '07 May', revenue: 1340000, orders: 9 },
  { date: '08 May', revenue: 890000,  orders: 6 },
  { date: '09 May', revenue: 1100000, orders: 7 },
  { date: '10 May', revenue: 3400000, orders: 12 },
  { date: '11 May', revenue: 2200000, orders: 10 },
  { date: '12 May', revenue: 1750000, orders: 8 },
];

const DUMMY_CATEGORIES = [
  { category: 'Electronics',  revenue: 18500000, units: 48 },
  { category: 'Fashion',      revenue: 4200000,  units: 112 },
  { category: 'Bags',         revenue: 3100000,  units: 67 },
  { category: 'Footwear',     revenue: 2800000,  units: 88 },
  { category: 'Beauty',       revenue: 1900000,  units: 95 },
  { category: 'Groceries',    revenue: 870000,   units: 143 },
  { category: 'Wellness',     revenue: 650000,   units: 52 },
  { category: 'Jewellery',    revenue: 420000,   units: 29 },
];

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#e94560','#0f766e'];

const StatBox = ({ label, value, color }) => (
  <div className="rounded-xl p-5 text-white" style={{ background: color }}>
    <p style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>{label}</p>
    <h3 style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</h3>
  </div>
);

const DashboardRevenue = () => {
  const [trend,      setTrend]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(['/admin/analytics/sales'], { params: { groupBy: 'day' } }, 'Revenue analytics');
        devLog('Revenue detail:', res.data);
        const normalized = normalizeSalesData(res.data);
        setTrend(normalized.trend?.length ? normalized.trend : DUMMY_TREND);
        setCategories(res.data?.data?.categories?.length ? res.data.data.categories : DUMMY_CATEGORIES);
      } catch (err) {
        apiError('Revenue load failed', err);
        setTrend(DUMMY_TREND);
        setCategories(DUMMY_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalRevenue = trend.reduce((s, d) => s + (d.revenue || 0), 0);
  const totalOrders  = trend.reduce((s, d) => s + (d.orders  || 0), 0);
  const avgOrder     = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#4f46e5', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Detailed revenue breakdown for the last 30 days</p>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="Total Revenue"      value={currency(totalRevenue)} color="#4f46e5" />
        <StatBox label="Total Orders"       value={totalOrders.toLocaleString('en-PK')}     color="#0891b2" />
        <StatBox label="Avg Order Value"    value={currency(avgOrder)}     color="#059669" />
      </div>

      {/* Revenue trend chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Daily Revenue Trend</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v, name) => [name === 'revenue' ? currency(v) : v, name]} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="orders"  stroke="#0891b2" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Revenue by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={v => currency(v)} />
                <Bar dataKey="revenue" radius={[0,4,4,0]}>
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Category Share</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={3}
                >
                  {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => currency(v)} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category table */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1.5px solid #c7d2fe', background: '#f8f7ff' }}>
        <div className="p-5" style={{ borderBottom: '1px solid #c7d2fe', background: '#eef2ff' }}>
          <span style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '5px 18px', borderRadius: 6, fontSize: 15, fontWeight: 700 }}>Category Revenue Breakdown</span>
        </div>
        <table className="w-full text-sm" style={{ background: '#fff' }}>
          <thead style={{ background: '#f0f0ff' }}>
            <tr>
              {['Category', 'Revenue', 'Units Sold', 'Share'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: '#4338ca' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((row, i) => {
              const share = totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100).toFixed(1) : 0;
              const ROW_PASTELS = ['#eff6ff','#f5f3ff','#fef3c7','#dcfce7','#fdf4ff','#ffedd5','#ccfbf1','#f0fdf4'];
              return (
                <tr key={i}
                  style={{ borderTop: '1px solid #e0e7ff', transition: 'background 0.15s', cursor: 'default', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = ROW_PASTELS[i % ROW_PASTELS.length]}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 8 }} />
                    {row.category}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{currency(row.revenue)}</td>
                  <td className="px-5 py-3 text-slate-600">{(row.units || 0).toLocaleString('en-PK')}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div style={{ width: `${share}%`, background: COLORS[i % COLORS.length], height: '100%', borderRadius: 999 }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{share}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardRevenue;
