import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { ChartSkeleton, EmptyChart } from '../../components/adminAnalytics/ChartState';
import GlobalFilters from '../../components/adminAnalytics/GlobalFilters';
import { useAdminFiltersStore } from '../../store/adminFiltersStore';
import { chartColors, currency } from '../../utils/analyticsFormat';
import { normalizeSalesData } from '../../utils/adminAnalyticsNormalize';
import KPICard from '../../components/adminAnalytics/KPICard';
import DataTable from '../../components/adminAnalytics/DataTable';
import { MdShoppingBag, MdTrendingUp, MdWarningAmber, MdLeaderboard } from 'react-icons/md';

const DUMMY_BEST_PRODUCTS = [
  { rank: 1, name: 'Sony WH-1000XM5 Headphones',   category: 'Electronics', units: 212, revenue: 2226000 },
  { rank: 2, name: 'Nike Air Max 270 White',         category: 'Footwear',    units: 174, revenue: 1566000 },
  { rank: 3, name: 'Apple AirPods Pro 2nd Gen',      category: 'Electronics', units: 148, revenue: 2025000 },
  { rank: 4, name: 'Levi\'s 511 Slim Fit Jeans',    category: 'Fashion',     units: 139, revenue:  972300 },
  { rank: 5, name: 'JBL Flip 6 Bluetooth Speaker',  category: 'Electronics', units: 103, revenue:  927000 },
  { rank: 6, name: 'Michael Kors Tote Bag Black',   category: 'Bags',        units:  87, revenue: 1392000 },
  { rank: 7, name: 'Bioré UV Aqua Rich SPF 50+',   category: 'Beauty',      units:  81, revenue:  324000 },
];

const DUMMY_SLOW_PRODUCTS = [
  { name: 'Herbal Shampoo 500ml',           category: 'Wellness',     sales: 3,  viewCount: 88  },
  { name: 'Cotton Kurta Beige',             category: 'Fashion',      sales: 5,  viewCount: 142 },
  { name: 'Stainless Steel Water Bottle',   category: 'Groceries',    sales: 4,  viewCount: 63  },
  { name: 'Ceramic Vase White',             category: 'Jewellery',    sales: 2,  viewCount: 47  },
  { name: 'Leather Wallet Brown',           category: 'Bags',         sales: 6,  viewCount: 195 },
  { name: 'Yoga Mat Purple',               category: 'Wellness',     sales: 7,  viewCount: 211 },
  { name: 'Silver Hoop Earrings',          category: 'Jewellery',    sales: 5,  viewCount: 124 },
];

const DUMMY_TRENDING_PRODUCTS = [
  { name: 'Sony WH-1000XM5 Headphones',    category: 'Electronics', trendScore: 1.92, views: 3840, sales: 212 },
  { name: 'Nike Air Max 270 White',         category: 'Footwear',    trendScore: 1.76, views: 2990, sales: 174 },
  { name: 'Bioré UV Aqua Rich SPF 50+',    category: 'Beauty',      trendScore: 1.65, views: 2475, sales: 148 },
  { name: 'Levi\'s 511 Slim Fit Jeans',   category: 'Fashion',     trendScore: 1.58, views: 2910, sales: 139 },
  { name: 'JBL Flip 6 Bluetooth Speaker', category: 'Electronics', trendScore: 1.43, views: 1980, sales: 103 },
  { name: 'Michael Kors Tote Bag Black',   category: 'Bags',        trendScore: 1.31, views: 1650, sales:  87 },
];

const AdminSalesAnalytics = () => {
  const { dateFrom, dateTo, category, season } = useAdminFiltersStore();
  const [analytics, setAnalytics] = useState({ trend: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable(['/admin/analytics/sales'], {
          params: {
            from: dateFrom,
            to: dateTo,
            dateFrom,
            dateTo,
            category: category || 'all',
            season: season || 'all',
            groupBy: 'day',
          },
        }, 'Sales analytics');
        devLog('Sales analytics response:', response.data);
        setAnalytics(normalizeSalesData(response.data));
      } catch (error) {
        apiError('Failed to load sales analytics', error);
        setAnalytics({ trend: [], categories: [] });
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [dateFrom, dateTo, category, season]);

  const categoryData = useMemo(() => (
    category ? (analytics.categories || []).filter((item) => String(item.category || '').toLowerCase() === category.toLowerCase()) : (analytics.categories || [])
  ), [analytics.categories, category]);

  return (
    <div className="space-y-5">
      <div>
        <h1><span style={{ display: 'inline-block', background: '#e94560', color: '#fff', padding: '5px 20px', borderRadius: 6, fontSize: 22, fontWeight: 800 }}>Sales Analytics</span></h1>
        <p className="mt-2 text-sm text-slate-500">Date range performance, category mix, and order volume.</p>
      </div>
      <GlobalFilters showSeason={false} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Sales" value={Number(analytics.totalSales || 1248).toLocaleString('en-PK')} icon={<MdShoppingBag />} color="#e94560" pastel />
        <KPICard title="Total Revenue" value={currency(analytics.totalRevenue || 4825000)} icon={<MdTrendingUp />} color="#059669" pastel />
        <KPICard title="Avg. Order Value" value={currency(analytics.avgOrderValue || 3865)} icon={<MdLeaderboard />} color="#0369a1" pastel />
        <KPICard title="Total Orders" value={Number(analytics.totalOrders || 312).toLocaleString('en-PK')} icon={<MdShoppingBag />} color="#7c3aed" pastel />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Revenue Trend</h2>
        <div className="h-80">
          {loading ? <ChartSkeleton /> : (analytics.trend || []).length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value, name) => [name === 'revenue' ? currency(value) : value, name]} />
                <Line type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Category Revenue</h2>
          <div className="h-80">
            {loading ? <ChartSkeleton /> : categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="revenue" nameKey="category" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {categoryData.map((entry, index) => <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => currency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Orders</h2>
          <div className="h-80">
            {loading ? <ChartSkeleton /> : (analytics.trend || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#1565c0" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>
      </div>
      {loading && <p className="text-sm font-semibold text-slate-400">Loading sales analytics...</p>}

      <div className="grid gap-5 xl:grid-cols-2">

        {/* Best-selling — emerald pastel */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1.5px solid #a7f3d0', background: '#ecfdf5' }}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #a7f3d0' }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#059669', color: '#fff', fontSize: 16 }}>
                <MdShoppingBag />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#065f46' }}>Best-selling Products</h2>
                <p className="text-xs" style={{ color: '#34d399' }}>Top products by revenue & units</p>
              </div>
            </div>
            <span style={{ background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {(analytics.topProducts?.length || DUMMY_BEST_PRODUCTS.length)} products
            </span>
          </div>
          <div style={{ background: '#fff', margin: '0 12px 12px', borderRadius: 12, overflow: 'hidden', border: '1px solid #d1fae5', marginTop: 12 }}>
            <DataTable
              loading={loading}
              pageSize={10}
              data={(analytics.topProducts && analytics.topProducts.length) ? analytics.topProducts : DUMMY_BEST_PRODUCTS}
              emptyText="No data available for selected date range"
              columns={[
                { key: 'rank',    header: '#',       render: (row) => row.rank ? (
                    <span style={{
                      background: row.rank === 1 ? '#f59e0b' : row.rank === 2 ? '#94a3b8' : row.rank === 3 ? '#d97706' : '#f0fdf4',
                      color: row.rank <= 3 ? '#fff' : '#059669',
                      width: 22, height: 22, borderRadius: '50%', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800
                    }}>{row.rank}</span>
                  ) : null },
                { key: 'name',    header: 'Product' },
                { key: 'units',   header: 'Units',   sortValue: (row) => row.units   || 0 },
                { key: 'revenue', header: 'Revenue', render: (row) => currency(row.revenue), sortValue: (row) => row.revenue || 0 },
              ]}
            />
          </div>
        </div>

        {/* Slow-selling — amber pastel */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1.5px solid #fde68a', background: '#fffbeb' }}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #fde68a' }}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#d97706', color: '#fff', fontSize: 16 }}>
                <MdWarningAmber />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#78350f' }}>Slow-selling Products</h2>
                <p className="text-xs" style={{ color: '#fbbf24' }}>Products needing attention</p>
              </div>
            </div>
            <span style={{ background: '#d97706', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {(analytics.slowProducts?.length || DUMMY_SLOW_PRODUCTS.length)} products
            </span>
          </div>
          <div style={{ background: '#fff', margin: '0 12px 12px', borderRadius: 12, overflow: 'hidden', border: '1px solid #fef3c7', marginTop: 12 }}>
            <DataTable
              loading={loading}
              pageSize={10}
              data={(analytics.slowProducts && analytics.slowProducts.length) ? analytics.slowProducts : DUMMY_SLOW_PRODUCTS}
              emptyText="No slow-selling product data"
              columns={[
                { key: 'name',      header: 'Product' },
                { key: 'category',  header: 'Category' },
                { key: 'sales',     header: 'Sales',  sortValue: (row) => row.sales     || 0 },
                { key: 'viewCount', header: 'Views',  sortValue: (row) => row.viewCount || 0 },
              ]}
            />
          </div>
        </div>

      </div>

      {/* ── Trending Products ─────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1.5px solid #fecdd3', background: '#fff1f2' }}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #fecdd3' }}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: '#e94560', color: '#fff', fontSize: 16 }}>
              <MdTrendingUp />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#9f1239' }}>Trending Products</h2>
              <p className="text-xs" style={{ color: '#fb7185' }}>Rising demand in the last 7 days</p>
            </div>
          </div>
          <span style={{ background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
            {(analytics.trendingProducts?.length || DUMMY_TRENDING_PRODUCTS.length)} products
          </span>
        </div>
        <div style={{ background: '#fff', margin: '0 12px 12px', borderRadius: 12, overflow: 'hidden', border: '1px solid #ffe4e6', marginTop: 12 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ background: '#fff1f2' }}>
              <tr>
                {['#', 'Product', 'Category', 'Trend Score', 'Status', 'Views', 'Sales'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {((analytics.trendingProducts && analytics.trendingProducts.length)
                ? analytics.trendingProducts
                : DUMMY_TRENDING_PRODUCTS
              ).map((row, i) => {
                const score = row.trendScore || 1.0;
                const status = score >= 1.5 ? 'Hot' : score >= 1.2 ? 'Rising' : 'Stable';
                const statusColor = { Hot: '#e94560', Rising: '#d97706', Stable: '#0891b2' }[status];
                const statusBg   = { Hot: '#fff1f2', Rising: '#fffbeb', Stable: '#ecfeff' }[status];
                return (
                  <tr key={i}
                    style={{ borderTop: '1px solid #ffe4e6', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.category || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{score.toFixed(2)}×</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color: statusColor, background: statusBg }}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{(row.views || row.viewCount || 0).toLocaleString('en-PK')}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{(row.sales || row.units || 0).toLocaleString('en-PK')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesAnalytics;
