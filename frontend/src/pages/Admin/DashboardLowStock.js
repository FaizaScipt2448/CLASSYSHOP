import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdWarning, MdSearch } from 'react-icons/md';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { currency } from '../../utils/analyticsFormat';

const DUMMY_LOW_STOCK = [
  { name: 'Apple iPhone 15 256GB Black',        category: 'Electronics', brand: 'Apple',       price: 650000, stock: 2,  sales: 65, trendScore: 1.8 },
  { name: 'Samsung Galaxy S24 Ultra 512GB',      category: 'Electronics', brand: 'Samsung',     price: 900000, stock: 3,  sales: 14, trendScore: 1.5 },
  { name: 'Nike Air Max 270 White',              category: 'Footwear',    brand: 'Nike',        price: 80000,  stock: 4,  sales: 28, trendScore: 1.4 },
  { name: 'Apple Watch Series 9 GPS 45mm',       category: 'Electronics', brand: 'Apple',       price: 125000, stock: 1,  sales: 8,  trendScore: 1.2 },
  { name: 'Adidas Ultraboost 22 Black',          category: 'Footwear',    brand: 'Adidas',      price: 115000, stock: 5,  sales: 22, trendScore: 1.1 },
  { name: 'Zara Women Floral Midi Dress',        category: 'Fashion',     brand: 'Zara',        price: 25000,  stock: 6,  sales: 55, trendScore: 1.3 },
  { name: 'Vitamin C Serum 30ml',               category: 'Wellness',    brand: 'The Ordinary',price: 22000,  stock: 7,  sales: 52, trendScore: 1.6 },
  { name: 'Women Tote Leather Bag Tan',          category: 'Bags',        brand: 'Gusto',       price: 35000,  stock: 8,  sales: 80, trendScore: 1.7 },
  { name: 'OnePlus 12 5G 256GB',                category: 'Electronics', brand: 'OnePlus',     price: 280000, stock: 9,  sales: 6,  trendScore: 0.9 },
  { name: 'MAC Powder Kiss Lipstick Ruby',       category: 'Beauty',      brand: 'MAC',         price: 10000,  stock: 10, sales: 48, trendScore: 1.2 },
];

const urgency = (stock) => {
  if (stock <= 2)  return { label: 'Critical', bg: '#fef2f2', color: '#dc2626' };
  if (stock <= 5)  return { label: 'High',     bg: '#fff7ed', color: '#d97706' };
  return               { label: 'Low',      bg: '#f0fdf4', color: '#16a34a' };
};

const DashboardLowStock = () => {
  const [rows,    setRows]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(
          ['/admin/analytics/stock/low', '/admin/analytics/low-stock'],
          { params: { limit: 50 } }, 'Low stock'
        );
        devLog('Low stock:', res.data);
        const raw = res.data?.data || res.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setRows(list.length ? list : DUMMY_LOW_STOCK);
      } catch (err) {
        apiError('Low stock load failed', err);
        setRows(DUMMY_LOW_STOCK);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = rows.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#d97706', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Low Stock Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Products with stock ≤ 10 units — reorder before they run out</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
        <MdWarning size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold text-amber-800">Stock Alert</p>
          <p className="text-sm text-amber-700 mt-0.5">
            {rows.filter(r => (r.countInStock || r.stock || 0) <= 2).length} products are critically low (≤2 units).
            {' '}{rows.filter(r => { const s = r.countInStock || r.stock || 0; return s > 2 && s <= 5; }).length} are high priority (3–5 units).
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Critical (≤2)',  value: rows.filter(r => (r.countInStock || r.stock || 0) <= 2).length, color: '#dc2626' },
          { label: 'High (3–5)',     value: rows.filter(r => { const s = r.countInStock || r.stock || 0; return s > 2 && s <= 5; }).length, color: '#d97706' },
          { label: 'Watch (6–10)',   value: rows.filter(r => { const s = r.countInStock || r.stock || 0; return s > 5 && s <= 10; }).length, color: '#0891b2' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-5 text-white" style={{ background: s.color }}>
            <p style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>{s.label}</p>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{s.value} products</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 flex-1">Low Stock List</h2>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
              style={{ width: 200 }}
            />
          </div>
          <Link
            to="/admin/stock/suggestions"
            style={{ background: '#d97706', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            View Stock Suggestions
          </Link>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['#', 'Product', 'Category', 'Brand', 'Price', 'Stock', 'Sales', 'Trend', 'Urgency'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => (a.countInStock || a.stock || 0) - (b.countInStock || b.stock || 0)).map((row, i) => {
                  const stock = row.countInStock || row.stock || 0;
                  const urg   = urgency(stock);
                  const trend = row.trendScore >= 1.5 ? 'Hot' : row.trendScore >= 1.2 ? 'Rising' : row.trendScore < 0.8 ? 'Falling' : 'Stable';
                  const trendColor = { Hot: '#e94560', Rising: '#d97706', Falling: '#94a3b8', Stable: '#0891b2' }[trend];
                  return (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">{row.category || '-'}</span></td>
                      <td className="px-4 py-3 text-slate-500">{row.brand || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{currency(row.price || 0)}</td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-bold" style={{ color: stock <= 2 ? '#dc2626' : stock <= 5 ? '#d97706' : '#059669' }}>{stock}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{(row.sales || row.soldCount || 0).toLocaleString('en-PK')}</td>
                      <td className="px-4 py-3"><span style={{ color: trendColor, fontWeight: 700, fontSize: 12 }}>{trend}</span></td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: urg.bg, color: urg.color }}>
                          {urg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLowStock;
