import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdRemoveShoppingCart, MdSearch } from 'react-icons/md';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { currency } from '../../utils/analyticsFormat';

const DUMMY_OUT_OF_STOCK = [
  { name: 'Sony WH-1000XM5 Headphones',          category: 'Electronics', brand: 'Sony',       price: 120000, sales: 42, trendScore: 1.9, lastSoldDate: '2025-05-17' },
  { name: 'Levi\'s 511 Slim Fit Jeans Blue',     category: 'Fashion',     brand: 'Levis',      price: 12000,  sales: 98, trendScore: 1.6, lastSoldDate: '2025-05-16' },
  { name: 'Converse Chuck Taylor All Star White', category: 'Footwear',    brand: 'Converse',   price: 18000,  sales: 74, trendScore: 1.4, lastSoldDate: '2025-05-15' },
  { name: 'Nykaa BB Cream SPF 30',               category: 'Beauty',      brand: 'Nykaa',      price: 8500,   sales: 61, trendScore: 1.2, lastSoldDate: '2025-05-14' },
  { name: 'JBL Flip 6 Bluetooth Speaker',        category: 'Electronics', brand: 'JBL',        price: 35000,  sales: 33, trendScore: 1.3, lastSoldDate: '2025-05-13' },
  { name: 'Mango Women Blazer Black',            category: 'Fashion',     brand: 'Mango',      price: 22000,  sales: 27, trendScore: 1.1, lastSoldDate: '2025-05-12' },
  { name: 'Puma Running Shoes White',            category: 'Footwear',    brand: 'Puma',       price: 65000,  sales: 19, trendScore: 0.8, lastSoldDate: '2025-05-10' },
  { name: 'Bioré UV Aqua Rich SPF 50+',          category: 'Beauty',      brand: 'Biore',      price: 6000,   sales: 88, trendScore: 1.7, lastSoldDate: '2025-05-09' },
];

const DashboardOutOfStock = () => {
  const [rows,    setRows]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(
          ['/admin/analytics/stock/out-of-stock', '/admin/analytics/out-of-stock'],
          { params: { limit: 50 } }, 'Out of stock'
        );
        devLog('Out of stock:', res.data);
        const raw = res.data?.data || res.data || [];
        const list = Array.isArray(raw) ? raw : [];
        setRows(list.length ? list : DUMMY_OUT_OF_STOCK);
      } catch (err) {
        apiError('Out of stock load failed', err);
        setRows(DUMMY_OUT_OF_STOCK);
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

  // Group by category for summary
  const catCounts = rows.reduce((acc, r) => {
    acc[r.category || 'Other'] = (acc[r.category || 'Other'] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Out of Stock Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Products with 0 stock — restock immediately to avoid lost sales</p>
        </div>
      </div>

      {/* Alert banner */}
      <div className="rounded-xl p-4 flex gap-3 items-start" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <MdRemoveShoppingCart size={22} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold text-red-800">Out of Stock Alert</p>
          <p className="text-sm text-red-700 mt-0.5">
            {rows.length} product{rows.length !== 1 ? 's' : ''} are completely out of stock.
            {rows.filter(r => (r.trendScore || 0) >= 1.2).length} of these are trending — high revenue risk.
          </p>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Out of Stock',  value: rows.length,                                                                color: '#dc2626' },
          { label: 'Trending (need ASAP)', value: rows.filter(r => (r.trendScore || 0) >= 1.2).length,                      color: '#e94560' },
          { label: 'Prev High Sellers',    value: rows.filter(r => (r.sales || r.salesCount || 0) >= 20).length,            color: '#d97706' },
          { label: 'Categories Affected',  value: Object.keys(catCounts).length,                                            color: '#7c3aed' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-white" style={{ background: s.color }}>
            <p style={{ opacity: 0.8, fontSize: 12, fontWeight: 600 }}>{s.label}</p>
            <h3 style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-3">Out of Stock by Category</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(catCounts).map(([cat, count]) => (
            <span key={cat} className="px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {cat}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 flex-1">All Out of Stock Products</h2>
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
            style={{ background: '#dc2626', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            Reorder Suggestions
          </Link>
        </div>
        {loading ? <div className="p-8 text-center text-slate-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['#', 'Product', 'Category', 'Brand', 'Price', 'Prev Sales', 'Trend', 'Last Sold'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => (b.sales || b.salesCount || 0) - (a.sales || a.salesCount || 0)).map((row, i) => {
                  const trendScore = row.trendScore || 1.0;
                  const trend      = trendScore >= 1.5 ? 'Hot' : trendScore >= 1.2 ? 'Rising' : trendScore < 0.8 ? 'Falling' : 'Stable';
                  const trendColor = { Hot: '#e94560', Rising: '#d97706', Falling: '#94a3b8', Stable: '#0891b2' }[trend];
                  return (
                    <tr key={i} className="border-t border-slate-100 hover:bg-red-50">
                      <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700">
                          {row.category || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.brand || '-'}</td>
                      <td className="px-5 py-3 text-slate-600">{currency(row.price || 0)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-700">{(row.sales || row.salesCount || 0).toLocaleString('en-PK')}</td>
                      <td className="px-5 py-3">
                        <span style={{ color: trendColor, fontWeight: 700, fontSize: 12 }}>{trend}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{row.lastSoldDate || row.updatedAt?.slice(0, 10) || '-'}</td>
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

export default DashboardOutOfStock;
