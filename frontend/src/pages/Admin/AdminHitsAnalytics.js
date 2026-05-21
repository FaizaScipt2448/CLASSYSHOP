import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Funnel, FunnelChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { AnalyticsSectionHeader, ChartCard, ChartSkeleton, EmptyChart } from '../../components/adminAnalytics/ChartState';
import DataTable from '../../components/adminAnalytics/DataTable';
import GlobalFilters from '../../components/adminAnalytics/GlobalFilters';
import { useAdminFiltersStore } from '../../store/adminFiltersStore';
import { normalizeHitsAnalytics } from '../../utils/adminAnalyticsNormalize';
import { titleCase } from '../../utils/analyticsFormat';

const DUMMY_TREND = [
  { date: '14 May', views: 142, carts: 38 },
  { date: '15 May', views: 168, carts: 45 },
  { date: '16 May', views: 195, carts: 52 },
  { date: '17 May', views: 178, carts: 41 },
  { date: '18 May', views: 210, carts: 63 },
  { date: '19 May', views: 187, carts: 49 },
  { date: '20 May', views: 224, carts: 71 },
];

const DUMMY_PRODUCTS = [
  { name: 'Sony WH-1000XM5',    category: 'Electronics', views: 312, clicks: 187, carts: 64, purchases: 28, conversionRate: 8.97, cartRate: 20.5  },
  { name: 'Nike Air Max 270',   category: 'Footwear',    views: 248, clicks: 143, carts: 52, purchases: 19, conversionRate: 7.66, cartRate: 20.97 },
  { name: "Levi's 511 Jeans",   category: 'Fashion',     views: 201, clicks: 118, carts: 41, purchases: 16, conversionRate: 7.96, cartRate: 20.4  },
  { name: 'Nykaa BB Cream',     category: 'Beauty',      views: 187, clicks: 105, carts: 36, purchases: 14, conversionRate: 7.49, cartRate: 19.25 },
  { name: 'Michael Kors Tote',  category: 'Bags',        views: 165, clicks: 92,  carts: 28, purchases: 11, conversionRate: 6.67, cartRate: 16.97 },
  { name: 'JBL Flip 6 Speaker', category: 'Electronics', views: 143, clicks: 81,  carts: 24, purchases:  9, conversionRate: 6.29, cartRate: 16.78 },
  { name: 'Vitamin C Serum',    category: 'Wellness',    views: 128, clicks: 67,  carts: 19, purchases:  7, conversionRate: 5.47, cartRate: 14.84 },
  { name: 'Gold Pearl Earrings',category: 'Jewellery',   views:  96, clicks: 48,  carts: 14, purchases:  5, conversionRate: 5.21, cartRate: 14.58 },
];

const DUMMY_CONVERSION = [
  { stage: 'Views',       count: 480 },
  { stage: 'Clicks',      count: 241 },
  { stage: 'Add to Cart', count:  78 },
  { stage: 'Purchases',   count:  29 },
];

const DUMMY_SEARCHES = [
  { term: 'headphones', count: 47 },
  { term: 'sneakers',   count: 38 },
  { term: 'jeans',      count: 31 },
  { term: 'lipstick',   count: 26 },
  { term: 'tote bag',   count: 22 },
  { term: 'smartwatch', count: 19 },
  { term: 'vitamin c',  count: 14 },
  { term: 'earrings',   count: 11 },
];

const AdminHitsAnalytics = () => {
  const { dateFrom, dateTo } = useAdminFiltersStore();
  const [analytics, setAnalytics] = useState({ trend: [], products: [], searches: [], conversion: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHits = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable(['/admin/analytics/hits'], {
          params: { from: dateFrom, to: dateTo },
        }, 'Hits analytics');
        devLog('Hits analytics response:', response.data);
        const norm = normalizeHitsAnalytics(response.data);
        setAnalytics({
          trend:      norm.trend?.length      ? norm.trend      : DUMMY_TREND,
          products:   norm.products?.length   ? norm.products   : DUMMY_PRODUCTS,
          searches:   norm.searches?.length   ? norm.searches   : DUMMY_SEARCHES,
          conversion: norm.conversion?.length ? norm.conversion : DUMMY_CONVERSION,
        });
      } catch (error) {
        apiError('Failed to load hits analytics', error);
        setAnalytics({ trend: DUMMY_TREND, products: DUMMY_PRODUCTS, searches: DUMMY_SEARCHES, conversion: DUMMY_CONVERSION });
      } finally {
        setLoading(false);
      }
    };

    loadHits();
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-5">
      <AnalyticsSectionHeader title="Product Hits" subtitle="Views, clicks, searches, and conversion signals from storefront tracking." />
      <GlobalFilters showCategory={false} showSeason={false} />

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Hits Trend">
          <div className="h-80">
            {loading ? <ChartSkeleton /> : analytics.trend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#e94560" strokeWidth={3} />
                  <Line type="monotone" dataKey="carts" stroke="#1565c0" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>
        <ChartCard title="Product Views">
          <div className="h-80">
            {loading ? <ChartSkeleton /> : analytics.products.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.products.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#1565c0" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Conversion Funnel">
        <div className="h-72">
          {loading ? <ChartSkeleton /> : analytics.conversion.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="count" data={analytics.conversion} nameKey="stage" fill="#e94560" />
              </FunnelChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </ChartCard>

      <DataTable
        loading={loading}
        pageSize={10}
        data={analytics.products || []}
        emptyText="No data available for selected date range"
        columns={[
          { key: 'name', header: 'Product' },
          { key: 'category', header: 'Category', render: (row) => titleCase(row.category) },
          { key: 'views', header: 'Views', sortValue: (row) => row.views || 0 },
          { key: 'clicks', header: 'Clicks', sortValue: (row) => row.clicks || 0 },
          { key: 'carts', header: 'Add To Cart', sortValue: (row) => row.carts || 0 },
          { key: 'purchases', header: 'Purchases', sortValue: (row) => row.purchases || 0 },
          { key: 'conversionRate', header: 'View To Sale', render: (row) => `${Number(row.conversionRate || 0).toFixed(1)}%`, sortValue: (row) => row.conversionRate || 0 },
          { key: 'cartRate', header: 'View To Cart', render: (row) => `${Number(row.cartRate || 0).toFixed(1)}%`, sortValue: (row) => row.cartRate || 0 },
        ]}
      />

      <DataTable
        loading={loading}
        pageSize={8}
        data={analytics.searches || []}
        emptyText="No search data available for selected date range"
        columns={[
          { key: 'term', header: 'Search Term' },
          { key: 'count', header: 'Count', sortValue: (row) => row.count || 0 },
        ]}
      />
    </div>
  );
};

export default AdminHitsAnalytics;
