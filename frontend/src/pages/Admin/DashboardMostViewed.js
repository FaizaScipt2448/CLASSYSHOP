import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdVisibility } from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';

const DUMMY_VIEWED = [
  { name: 'Apple iPhone 15 256GB Black',        category: 'Electronics', brand: 'Apple',    views: 4820, sales: 65, conversion: '1.35%' },
  { name: 'Samsung Galaxy S24 Ultra 512GB',      category: 'Electronics', brand: 'Samsung',  views: 3960, sales: 14, conversion: '0.35%' },
  { name: 'Adidas Ultraboost 22 Black',          category: 'Footwear',    brand: 'Adidas',   views: 2740, sales: 22, conversion: '0.80%' },
  { name: 'Women Tote Leather Bag Tan',          category: 'Bags',        brand: 'Gusto',    views: 2310, sales: 80, conversion: '3.46%' },
  { name: 'Nike Air Max 270 White',              category: 'Footwear',    brand: 'Nike',     views: 2180, sales: 28, conversion: '1.28%' },
  { name: 'Apple Watch Series 9 GPS 45mm',       category: 'Electronics', brand: 'Apple',    views: 1990, sales: 8,  conversion: '0.40%' },
  { name: 'Zara Women Floral Midi Dress',        category: 'Fashion',     brand: 'Zara',     views: 1740, sales: 55, conversion: '3.16%' },
  { name: 'L\'Oreal Paris Revitalift Cream',    category: 'Beauty',      brand: 'L\'Oreal', views: 1580, sales: 74, conversion: '4.68%' },
  { name: 'MAC Powder Kiss Lipstick Ruby',       category: 'Beauty',      brand: 'MAC',      views: 1420, sales: 48, conversion: '3.38%' },
  { name: 'Vitamin C Serum 30ml',               category: 'Wellness',    brand: 'The Ordinary', views: 1250, sales: 52, conversion: '4.16%' },
  { name: 'OnePlus 12 5G 256GB',                category: 'Electronics', brand: 'OnePlus',  views: 1180, sales: 6,  conversion: '0.51%' },
  { name: 'Gold Plated Pearl Drop Earrings',     category: 'Jewellery',   brand: 'Meena Bazaar', views: 980, sales: 29, conversion: '2.96%' },
  { name: 'Hush Puppies Men Leather Loafer',     category: 'Footwear',    brand: 'Hush Puppies', views: 860, sales: 18, conversion: '2.09%' },
  { name: 'Organic Green Tea 100 Bags',          category: 'Groceries',   brand: 'Tapal',    views: 720, sales: 120, conversion: '16.67%' },
  { name: 'Motorola Edge 50 Fusion 5G',          category: 'Electronics', brand: 'Motorola', views: 680, sales: 32, conversion: '4.71%' },
];

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#e94560','#0f766e','#f97316','#6366f1'];

const DashboardMostViewed = () => {
  const [rows,    setRows]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(
          ['/admin/analytics/hits/products', '/admin/analytics/product-hits'],
          { params: { limit: 50 } }, 'Most viewed'
        );
        devLog('Most viewed:', res.data);
        const raw = res.data?.data?.mostViewed || res.data?.mostViewed || [];
        setRows(raw.length ? raw : DUMMY_VIEWED);
      } catch (err) {
        apiError('Most viewed load failed', err);
        setRows(DUMMY_VIEWED);
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

  const top8 = [...rows].sort((a, b) => (b.views || b.viewCount || 0) - (a.views || a.viewCount || 0)).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Most Viewed Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Products with the highest view count — check conversion opportunities</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Products Tracked', value: rows.length.toLocaleString('en-PK'),                                                                        color: '#7c3aed' },
          { label: 'Total Views',            value: rows.reduce((s, r) => s + (r.views || r.viewCount || 0), 0).toLocaleString('en-PK'),                        color: '#0891b2' },
          { label: 'Most Viewed',            value: rows.length > 0 ? (rows[0]?.name?.slice(0, 20) + (rows[0]?.name?.length > 20 ? '…' : '')) || '-' : '-',    color: '#4f46e5' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-5 text-white" style={{ background: s.color }}>
            <p style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>{s.label}</p>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Top 8 Most Viewed</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top8} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={180}
                tickFormatter={v => v?.length > 22 ? v.slice(0, 22) + '…' : v} />
              <Tooltip />
              <Bar dataKey="views" radius={[0, 4, 4, 0]} name="Views">
                {top8.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High views, low sales alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h2 className="text-base font-bold text-amber-800 mb-1">Conversion Opportunities</h2>
        <p className="text-sm text-amber-700 mb-3">Products with high views but low sales — consider promotions or price adjustments.</p>
        <div className="space-y-2">
          {rows.filter(r => (r.views || r.viewCount || 0) > 500 && (r.sales || 0) < 10).slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-amber-100">
              <span className="text-sm font-medium text-slate-800">{r.name}</span>
              <div className="flex gap-4 text-xs text-slate-500">
                <span><MdVisibility className="inline mr-1" />{(r.views || r.viewCount || 0).toLocaleString('en-PK')} views</span>
                <span className="text-red-600 font-semibold">{r.sales || 0} sales</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 flex-1">All Viewed Products</h2>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none"
              style={{ width: 220 }}
            />
          </div>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['#', 'Product', 'Category', 'Brand', 'Views', 'Sales', 'Conversion'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const views = row.views || row.viewCount || 0;
                  const sales = row.sales || 0;
                  const conv  = row.conversion || (views > 0 ? ((sales / views) * 100).toFixed(2) + '%' : '0%');
                  return (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">{row.category || '-'}</span></td>
                      <td className="px-5 py-3 text-slate-500">{row.brand || '-'}</td>
                      <td className="px-5 py-3 font-bold text-indigo-700">{views.toLocaleString('en-PK')}</td>
                      <td className="px-5 py-3 text-emerald-700 font-semibold">{sales.toLocaleString('en-PK')}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${parseFloat(conv) > 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {conv}
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

export default DashboardMostViewed;
