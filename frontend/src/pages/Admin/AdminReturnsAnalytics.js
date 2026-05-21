import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { ChartSkeleton, EmptyChart } from '../../components/adminAnalytics/ChartState';
import DataTable from '../../components/adminAnalytics/DataTable';
import GlobalFilters from '../../components/adminAnalytics/GlobalFilters';
import { useAdminFiltersStore } from '../../store/adminFiltersStore';
import { chartColors, currency, percent, titleCase } from '../../utils/analyticsFormat';
import { normalizeReturnAnalytics } from '../../utils/adminAnalyticsNormalize';
import KPICard from '../../components/adminAnalytics/KPICard';
import { MdAssignmentReturn, MdWarning } from 'react-icons/md';

const AdminReturnsAnalytics = () => {
  const { dateFrom, dateTo } = useAdminFiltersStore();
  const [analytics, setAnalytics] = useState({ trend: [], topProducts: [], reasons: [], rate: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReturns = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable([
          '/admin/returns/analytics',
          '/returns/admin/analytics',
          '/admin/analytics/return-analytics',
        ], {
          params: { from: dateFrom, to: dateTo, dateFrom, dateTo, groupBy: 'day' },
        }, 'Return analytics');
        devLog('Return analytics response:', response.data);
        setAnalytics(normalizeReturnAnalytics(response.data));
      } catch (error) {
        apiError('Failed to load return analytics', error);
        setAnalytics({ trend: [], topProducts: [], reasons: [], rate: {} });
      } finally {
        setLoading(false);
      }
    };

    loadReturns();
  }, [dateFrom, dateTo]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Returns Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Return rate, most returned products, and reason breakdown.</p>
      </div>
      <GlobalFilters showCategory={false} showSeason={false} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Returned Products" value={Number(analytics.totalReturnedProducts || 0).toLocaleString('en-PK')} icon={<MdAssignmentReturn />} />
        <KPICard title="Return Rate" value={percent(analytics.returnRate || analytics.rate?.returnRate)} icon={<MdAssignmentReturn />} />
        <KPICard title="High Risk Products" value={Number((analytics.highReturnRiskProducts || []).length).toLocaleString('en-PK')} icon={<MdWarning />} />
        <KPICard title="Return Reasons" value={Number((analytics.reasons || []).length).toLocaleString('en-PK')} icon={<MdWarning />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Return Rate</h2>
            <span className="text-sm font-bold text-brand">{percent(analytics.rate?.returnRate)}</span>
          </div>
          <div className="h-80">
            {loading ? <ChartSkeleton /> : (analytics.trend || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => [name === 'refund' ? currency(value) : value, name]} />
                  <Area type="monotone" dataKey="count" stroke="#e94560" fill="#ffe4e9" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Reasons</h2>
          <div className="h-80">
            {loading ? <ChartSkeleton /> : (analytics.reasons || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.reasons || []} dataKey="count" nameKey="reason" outerRadius={110}>
                    {(analytics.reasons || []).map((entry, index) => <Cell key={entry.reason} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value, name, item) => [value, titleCase(item?.payload?.reason || 'Reason')]} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">High Return Risk Products</h2>
        <DataTable
          loading={loading}
          pageSize={8}
          data={analytics.highReturnRiskProducts || []}
          emptyText="No high return risk products"
          columns={[
            { key: 'name', header: 'Product' },
            { key: 'units', header: 'Returned Qty', sortValue: (row) => row.units || 0 },
            { key: 'count', header: 'Return Count', sortValue: (row) => row.count || 0 },
          ]}
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Most Returned Products</h2>
        <DataTable
          loading={loading}
          pageSize={10}
          data={analytics.topProducts || []}
          emptyText="No data available for selected date range"
          columns={[
            { key: 'name', header: 'Product' },
            { key: 'units', header: 'Returned Units', sortValue: (row) => row.units || 0 },
            { key: 'count', header: 'Return Count', sortValue: (row) => row.count || 0 },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminReturnsAnalytics;
