import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { RecommendationBadge, UrgencyBadge } from '../../components/adminAnalytics/Badges';
import { AnalyticsSectionHeader, ChartCard, ChartSkeleton, EmptyChart } from '../../components/adminAnalytics/ChartState';
import DataTable from '../../components/adminAnalytics/DataTable';
import GlobalFilters from '../../components/adminAnalytics/GlobalFilters';
import { useAdminFiltersStore } from '../../store/adminFiltersStore';
import { normalizeSeasonalStock } from '../../utils/adminAnalyticsNormalize';
import { currency, titleCase } from '../../utils/analyticsFormat';

const DUMMY_SEASON_STOCK = [
  { season: 'Spring', totalStock: 450, lowStockCount: 12, outOfStockCount: 3  },
  { season: 'Summer', totalStock: 620, lowStockCount: 8,  outOfStockCount: 2  },
  { season: 'Eid',    totalStock: 380, lowStockCount: 22, outOfStockCount: 8  },
  { season: 'Autumn', totalStock: 510, lowStockCount: 15, outOfStockCount: 4  },
  { season: 'Winter', totalStock: 690, lowStockCount: 6,  outOfStockCount: 1  },
];

const DUMMY_SEASON_DEMAND = [
  { season: 'Spring', demand: 340, sold: 290 },
  { season: 'Summer', demand: 510, sold: 480 },
  { season: 'Eid',    demand: 820, sold: 760 },
  { season: 'Autumn', demand: 410, sold: 375 },
  { season: 'Winter', demand: 580, sold: 540 },
];

const DUMMY_PRODUCTS = [
  { product: 'Nike Therma Jacket Grey',         category: 'Fashion',     season: 'Winter', stock: 5,   trendScore: 1.9, recommendation: 'reorder',        urgency: 'critical' },
  { product: 'Gold Pearl Necklace Set',         category: 'Jewellery',   season: 'Eid',    stock: 3,   trendScore: 2.1, recommendation: 'reorder',        urgency: 'critical' },
  { product: 'Philips Air Purifier 3000i',      category: 'Electronics', season: 'Winter', stock: 8,   trendScore: 1.8, recommendation: 'reorder',        urgency: 'critical' },
  { product: 'Puma Running Shoes White',        category: 'Footwear',    season: 'Summer', stock: 0,   trendScore: 0.9, recommendation: 'reorder',        urgency: 'critical' },
  { product: 'Coach Pebble Leather Tote Bag',   category: 'Bags',        season: 'Eid',    stock: 12,  trendScore: 1.7, recommendation: 'reorder',        urgency: 'high'     },
  { product: 'Sunscreen SPF 60+ 150ml',         category: 'Wellness',    season: 'Summer', stock: 7,   trendScore: 1.7, recommendation: 'reorder',        urgency: 'high'     },
  { product: 'Mango Seasonal Fruit Basket',     category: 'Groceries',   season: 'Summer', stock: 22,  trendScore: 1.5, recommendation: 'reorder',        urgency: 'high'     },
  { product: 'Uniqlo HEATTECH Inner Wear',      category: 'Fashion',     season: 'Winter', stock: 45,  trendScore: 1.6, recommendation: 'prepare_season', urgency: 'medium'   },
  { product: 'Kiehl\'s Ultra Facial Cream',    category: 'Beauty',      season: 'Winter', stock: 18,  trendScore: 1.4, recommendation: 'prepare_season', urgency: 'medium'   },
  { product: 'Nike Dri-FIT Running Shorts',     category: 'Fashion',     season: 'Summer', stock: 120, trendScore: 1.4, recommendation: 'prepare_season', urgency: 'medium'   },
  { product: 'Portable Mini Fan USB',           category: 'Electronics', season: 'Summer', stock: 30,  trendScore: 1.3, recommendation: 'watch',          urgency: 'low'      },
  { product: 'Organic Honey 500g',              category: 'Groceries',   season: 'Winter', stock: 85,  trendScore: 1.2, recommendation: 'watch',          urgency: 'low'      },
];

const AdminSeasonalStock = () => {
  const { dateFrom, dateTo, category, season } = useAdminFiltersStore();
  const [stockStatus, setStockStatus] = useState('all');
  const [analytics, setAnalytics] = useState({ seasonStock: [], seasonDemand: [], products: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasonal = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable(['/admin/analytics/stock/seasonal'], {
          params: {
            from: dateFrom,
            to: dateTo,
            category: category || 'all',
            season: season || 'all',
            stockStatus,
          },
        }, 'Seasonal stock analytics');
        devLog('Seasonal stock response:', response.data);
        const normalized = normalizeSeasonalStock(response.data);
        setAnalytics({
          seasonStock:  normalized.seasonStock?.length  ? normalized.seasonStock  : DUMMY_SEASON_STOCK,
          seasonDemand: normalized.seasonDemand?.length ? normalized.seasonDemand : DUMMY_SEASON_DEMAND,
          products:     normalized.products?.length     ? normalized.products     : DUMMY_PRODUCTS,
        });
      } catch (error) {
        apiError('Failed to load seasonal stock analytics', error);
        setAnalytics({ seasonStock: DUMMY_SEASON_STOCK, seasonDemand: DUMMY_SEASON_DEMAND, products: DUMMY_PRODUCTS });
      } finally {
        setLoading(false);
      }
    };

    loadSeasonal();
  }, [dateFrom, dateTo, category, season, stockStatus]);

  const stockChartData = useMemo(() => analytics.seasonStock || [], [analytics.seasonStock]);
  const demandChartData = useMemo(() => analytics.seasonDemand || [], [analytics.seasonDemand]);

  return (
    <div className="space-y-5">
      <AnalyticsSectionHeader title="Seasonal Stock" subtitle="Season-wise stock, demand, and upcoming preparation signals." color="#7c3aed" />
      <GlobalFilters />
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex max-w-xs flex-col gap-1 text-xs font-bold uppercase text-slate-500">
          Stock Status
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium normal-case text-slate-800 outline-none focus:border-brand" value={stockStatus} onChange={(event) => setStockStatus(event.target.value)}>
            <option value="all">All stock</option>
            <option value="understocked">Understocked</option>
            <option value="overstocked">Overstocked</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Season-wise Stock">
          <div className="h-80">
            {loading ? <ChartSkeleton /> : stockChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="totalStock" fill="#1565c0" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="lowStockCount" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="outOfStockCount" fill="#e94560" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>
        <ChartCard title="Season Demand">
          <div className="h-80">
            {loading ? <ChartSkeleton /> : demandChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demandChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => [name === 'revenue' ? currency(value) : value, name]} />
                  <Line type="monotone" dataKey="demand" stroke="#e94560" strokeWidth={3} />
                  <Line type="monotone" dataKey="sold" stroke="#1565c0" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </ChartCard>
      </div>

      <DataTable
        loading={loading}
        pageSize={12}
        data={analytics.products || []}
        emptyText="No data available for selected date range"
        columns={[
          { key: 'product', header: 'Product' },
          { key: 'category', header: 'Category', render: (row) => titleCase(row.category) },
          { key: 'season', header: 'Season' },
          { key: 'stock', header: 'Stock', sortValue: (row) => row.stock || 0 },
          { key: 'trendScore', header: 'Trend Score', sortValue: (row) => row.trendScore || 0 },
          { key: 'recommendation', header: 'Recommendation', render: (row) => <RecommendationBadge value={row.recommendation} /> },
          { key: 'urgency', header: 'Urgency', render: (row) => <UrgencyBadge value={row.urgency} /> },
        ]}
      />
    </div>
  );
};

export default AdminSeasonalStock;
