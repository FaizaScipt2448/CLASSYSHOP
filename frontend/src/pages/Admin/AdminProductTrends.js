import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import DataTable from '../../components/adminAnalytics/DataTable';
import { TrendBadge } from '../../components/adminAnalytics/Badges';
import GlobalFilters from '../../components/adminAnalytics/GlobalFilters';
import { ChartCard, ChartSkeleton, EmptyChart } from '../../components/adminAnalytics/ChartState';
import { useAdminFiltersStore } from '../../store/adminFiltersStore';
import { titleCase } from '../../utils/analyticsFormat';
import { normalizeTrendProducts } from '../../utils/adminAnalyticsNormalize';

const inferTrend = (row) => {
  if (row.trend) return row.trend;
  if (Number(row.trendScore) <= 0) return 'dead';
  if (Number(row.trendScore) >= 1.5) return 'hot';
  if (Number(row.trendScore) >= 1.2) return 'rising';
  if (Number(row.trendScore) < 0.8) return 'falling';
  return 'stable';
};

const DUMMY_TRENDS = [
  { name: 'Sony WH-1000XM5',         brand: 'Sony',        category: 'Electronics', sales: 212, views: 3840, addToCartCount: 310, searchCount: 520, conversionRate: 8.9,  returnRate: 1.8, trendScore: 1.92, trend: 'hot'     },
  { name: 'Nike Air Max 270 White',   brand: 'Nike',        category: 'Footwear',    sales: 174, views: 2990, addToCartCount: 241, searchCount: 410, conversionRate: 7.7,  returnRate: 2.1, trendScore: 1.76, trend: 'hot'     },
  { name: "Bioré UV Aqua Rich SPF",   brand: 'Biore',       category: 'Beauty',      sales: 148, views: 2475, addToCartCount: 198, searchCount: 360, conversionRate: 7.2,  returnRate: 1.2, trendScore: 1.65, trend: 'hot'     },
  { name: "Levi's 511 Slim Fit",      brand: "Levi's",      category: 'Fashion',     sales: 139, views: 2910, addToCartCount: 215, searchCount: 390, conversionRate: 6.8,  returnRate: 3.4, trendScore: 1.58, trend: 'rising'  },
  { name: 'JBL Flip 6 Speaker',       brand: 'JBL',         category: 'Electronics', sales: 103, views: 1980, addToCartCount: 162, searchCount: 270, conversionRate: 6.2,  returnRate: 2.0, trendScore: 1.43, trend: 'rising'  },
  { name: 'Michael Kors Tote Black',  brand: 'Michael Kors',category: 'Bags',        sales:  87, views: 1650, addToCartCount: 134, searchCount: 215, conversionRate: 6.0,  returnRate: 2.5, trendScore: 1.31, trend: 'rising'  },
  { name: 'Nykaa BB Cream SPF 30',    brand: 'Nykaa',       category: 'Beauty',      sales:  74, views: 1420, addToCartCount: 118, searchCount: 188, conversionRate: 5.8,  returnRate: 1.5, trendScore: 1.22, trend: 'rising'  },
  { name: 'Zara Floral Midi Dress',   brand: 'Zara',        category: 'Fashion',     sales:  62, views: 1180, addToCartCount:  97, searchCount: 152, conversionRate: 5.3,  returnRate: 4.1, trendScore: 1.12, trend: 'stable'  },
  { name: 'Vitamin C Serum 30ml',     brand: 'The Ordinary',category: 'Wellness',    sales:  58, views: 1060, addToCartCount:  88, searchCount: 141, conversionRate: 5.1,  returnRate: 1.0, trendScore: 1.08, trend: 'stable'  },
  { name: 'Organic Green Tea 100 Bags',brand: 'Tapal',      category: 'Groceries',   sales:  44, views:  820, addToCartCount:  63, searchCount: 108, conversionRate: 4.7,  returnRate: 0.5, trendScore: 0.98, trend: 'stable'  },
  { name: 'Ceramic Vase White',       brand: 'HomeDecor',   category: 'Jewellery',   sales:  12, views:  340, addToCartCount:  24, searchCount:  38, conversionRate: 3.1,  returnRate: 3.0, trendScore: 0.74, trend: 'falling' },
  { name: 'Herbal Shampoo 500ml',     brand: 'Herbal Essences',category: 'Wellness', sales:   8, views:  210, addToCartCount:  15, searchCount:  22, conversionRate: 2.4,  returnRate: 1.8, trendScore: 0.61, trend: 'falling' },
];

const AdminProductTrends = () => {
  const [products, setProducts] = useState([]);
  const [trendStatus, setTrendStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const { category, season } = useAdminFiltersStore();

  useEffect(() => {
    const loadTrends = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable([
          '/admin/analytics/trends',
          '/admin/analytics/trending-products',
          '/admin/analytics/product-performance',
        ], {
          params: { sortBy: 'trend', limit: 100, category: category || 'all', season: season || 'all', status: trendStatus },
        }, 'Product trends analytics');
        devLog('Product trends response:', response.data);
        const normalized = normalizeTrendProducts(response.data);
        setProducts(normalized.length ? normalized : DUMMY_TRENDS);
      } catch (error) {
        apiError('Failed to load product trends', error);
        setProducts(DUMMY_TRENDS);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, [category, season, trendStatus]);

  return (
    <div className="space-y-5">
      <div>
        <h1><span style={{ display: 'inline-block', background: '#f97316', color: '#fff', padding: '5px 20px', borderRadius: 6, fontSize: 22, fontWeight: 800 }}>Product Trends</span></h1>
        <p className="mt-2 text-sm text-slate-500">Sortable trend score view with movement badges.</p>
      </div>
      <GlobalFilters />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex max-w-xs flex-col gap-1 text-xs font-bold uppercase text-slate-500">
          Trend Status
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand" value={trendStatus} onChange={(event) => setTrendStatus(event.target.value)}>
            <option value="all">All trends</option>
            <option value="hot">Hot</option>
            <option value="rising">Rising</option>
            <option value="stable">Stable</option>
            <option value="falling">Falling</option>
            <option value="dead">Dead</option>
          </select>
        </label>
      </div>
      <ChartCard title="Trending Products By Score">
        <div className="h-80">
          {loading ? <ChartSkeleton /> : products.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="trendScore" fill="#e94560" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </ChartCard>
      <DataTable
        loading={loading}
        pageSize={12}
        data={products}
        emptyText="No data available for selected date range"
        columns={[
          { key: 'name', header: 'Product' },
          { key: 'brand', header: 'Brand', render: (row) => row.brand || '-' },
          { key: 'category', header: 'Category', render: (row) => titleCase(row.category || '-') },
          { key: 'sales', header: 'Sales', sortValue: (row) => row.sales || 0 },
          { key: 'views', header: 'Views', sortValue: (row) => row.views || 0 },
          { key: 'addToCartCount', header: 'Carts', sortValue: (row) => row.addToCartCount || 0 },
          { key: 'searchCount', header: 'Searches', sortValue: (row) => row.searchCount || 0 },
          { key: 'conversionRate', header: 'Conversion', render: (row) => `${Number(row.conversionRate || 0).toFixed(1)}%`, sortValue: (row) => row.conversionRate || 0 },
          { key: 'returnRate', header: 'Return Rate', render: (row) => `${Number(row.returnRate || 0).toFixed(1)}%`, sortValue: (row) => row.returnRate || 0 },
          { key: 'trendScore', header: 'Trend Score', sortValue: (row) => Number(row.trendScore || 0), render: (row) => Number(row.trendScore || 0).toFixed(2) },
          { key: 'trend', header: 'Trend', sortValue: (row) => Number(row.trendScore || 0), render: (row) => <TrendBadge value={inferTrend(row)} /> },
        ]}
      />
    </div>
  );
};

export default AdminProductTrends;
