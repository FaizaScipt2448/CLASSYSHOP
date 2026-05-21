import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdArrowBack, MdSearch } from 'react-icons/md';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { currency } from '../../utils/analyticsFormat';

const DUMMY_PRODUCTS = [
  { name: 'Apple iPhone 15 256GB Black',        category: 'Electronics', units: 65,  revenue: 42250000, brand: 'Apple',    price: 650000 },
  { name: 'Women Tote Leather Bag Tan',          category: 'Bags',        units: 80,  revenue: 2800000,  brand: 'Gusto',    price: 35000 },
  { name: 'Motorola Edge 50 Fusion 5G',          category: 'Electronics', units: 32,  revenue: 4992000,  brand: 'Motorola', price: 156000 },
  { name: 'Nike Air Max 270 White',              category: 'Footwear',    units: 28,  revenue: 2240000,  brand: 'Nike',     price: 80000 },
  { name: 'L\'Oreal Paris Revitalift Cream',    category: 'Beauty',      units: 74,  revenue: 1258000,  brand: 'L\'Oreal', price: 17000 },
  { name: 'Samsung Galaxy S24 Ultra 512GB',      category: 'Electronics', units: 14,  revenue: 12600000, brand: 'Samsung',  price: 900000 },
  { name: 'Adidas Ultraboost 22 Black',          category: 'Footwear',    units: 22,  revenue: 2530000,  brand: 'Adidas',   price: 115000 },
  { name: 'Apple Watch Series 9 GPS 45mm',       category: 'Electronics', units: 8,   revenue: 1000000,  brand: 'Apple',    price: 125000 },
  { name: 'Zara Women Floral Midi Dress',        category: 'Fashion',     units: 55,  revenue: 1375000,  brand: 'Zara',     price: 25000 },
  { name: 'OnePlus 12 5G 256GB',                category: 'Electronics', units: 6,   revenue: 1680000,  brand: 'OnePlus',  price: 280000 },
  { name: 'MAC Powder Kiss Lipstick Ruby',       category: 'Beauty',      units: 48,  revenue: 480000,   brand: 'MAC',      price: 10000 },
  { name: 'Hush Puppies Men Leather Loafer',     category: 'Footwear',    units: 18,  revenue: 810000,   brand: 'Hush Puppies', price: 45000 },
  { name: 'Organic Green Tea 100 Bags',          category: 'Groceries',   units: 120, revenue: 360000,   brand: 'Tapal',    price: 3000 },
  { name: 'Gold Plated Pearl Drop Earrings',     category: 'Jewellery',   units: 29,  revenue: 580000,   brand: 'Meena Bazaar', price: 20000 },
  { name: 'Vitamin C Serum 30ml',               category: 'Wellness',    units: 52,  revenue: 1144000,  brand: 'The Ordinary', price: 22000 },
];

const DashboardProductsSold = () => {
  const [rows,    setRows]    = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('units');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFirstAvailable(['/admin/analytics/sales/products', '/admin/analytics/sales'], { params: { limit: 100 } }, 'Products sold');
        devLog('Products sold:', res.data);
        const raw = res.data?.data?.topProducts || res.data?.topProducts || [];
        setRows(raw.length ? raw : DUMMY_PRODUCTS);
      } catch (err) {
        apiError('Products sold load failed', err);
        setRows(DUMMY_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...rows]
    .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.category?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] || 0, bv = b[sortKey] || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const totalUnits   = rows.reduce((s, r) => s + (r.units   || 0), 0);
  const totalRevenue = rows.reduce((s, r) => s + (r.revenue || 0), 0);

  const SortIcon = ({ k }) => sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" style={{ color: '#059669', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <MdArrowBack size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products Sold</h1>
          <p className="text-sm text-slate-500 mt-0.5">All products with sales — sorted by units sold</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Products',   value: rows.length.toLocaleString('en-PK'),       color: '#059669' },
          { label: 'Total Units Sold', value: totalUnits.toLocaleString('en-PK'),        color: '#0891b2' },
          { label: 'Total Revenue',    value: currency(totalRevenue),                    color: '#4f46e5' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-5 text-white" style={{ background: s.color }}>
            <p style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>{s.label}</p>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-900 flex-1">All Sold Products</h2>
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search product or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              style={{ width: 240 }}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Brand</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer" onClick={() => toggleSort('price')}>
                    Price<SortIcon k="price" />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer" onClick={() => toggleSort('units')}>
                    Units Sold<SortIcon k="units" />
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer" onClick={() => toggleSort('revenue')}>
                    Revenue<SortIcon k="revenue" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-800 max-w-xs">{row.name || row.productName || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {row.category || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{row.brand || '-'}</td>
                    <td className="px-5 py-3 text-slate-600">{currency(row.price || 0)}</td>
                    <td className="px-5 py-3 font-bold text-emerald-700">{(row.units || 0).toLocaleString('en-PK')}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{currency(row.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="p-8 text-center text-slate-400">No products match your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProductsSold;
