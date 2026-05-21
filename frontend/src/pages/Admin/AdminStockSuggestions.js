import React, { useEffect, useState } from 'react';
import { apiError, devLog, getFirstAvailable } from '../../api/adminApi';
import { RecommendationBadge, UrgencyBadge } from '../../components/adminAnalytics/Badges';
import DataTable from '../../components/adminAnalytics/DataTable';
import { normalizeStockSuggestions } from '../../utils/adminAnalyticsNormalize';

const AdminStockSuggestions = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        const response = await getFirstAvailable([
          '/admin/analytics/stock/suggestions',
          '/admin/analytics/stock-suggestions',
        ], {
          params: { limit: 100 },
        }, 'Stock suggestions analytics');
        devLog('Stock suggestions response:', response.data);
        setRows(normalizeStockSuggestions(response.data));
      } catch (error) {
        apiError('Failed to load stock suggestions', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1><span style={{ display: 'inline-block', background: '#0891b2', color: '#fff', padding: '5px 20px', borderRadius: 6, fontSize: 22, fontWeight: 800 }}>Stock Suggestions</span></h1>
        <p className="mt-2 text-sm text-slate-500">Reorder guidance based on sales velocity, stock, seasonality, and trend signals.</p>
      </div>
      <DataTable
        loading={loading}
        pageSize={12}
        data={rows}
        emptyText="No data available for selected date range"
        columns={[
          { key: 'productName', header: 'Product' },
          { key: 'sku', header: 'SKU' },
          { key: 'category', header: 'Category', render: (row) => row.product?.category || row.category || '-' },
          { key: 'currentStock', header: 'Stock', sortValue: (row) => row.currentStock || 0 },
          { key: 'avgDailySales', header: 'Avg Daily Sales', sortValue: (row) => row.avgDailySales || 0, render: (row) => Number(row.avgDailySales || 0).toFixed(1) },
          { key: 'daysOfStockRemaining', header: 'Days Remaining', sortValue: (row) => row.daysOfStockRemaining || 0, render: (row) => Number(row.daysOfStockRemaining || 0).toFixed(1) },
          { key: 'reorderPoint', header: 'Reorder Point', sortValue: (row) => row.reorderPoint || 0 },
          { key: 'urgency', header: 'Urgency', render: (row) => <UrgencyBadge value={row.urgency} /> },
          { key: 'recommendation', header: 'Recommendation', render: (row) => <RecommendationBadge value={row.recommendation} /> },
          { key: 'suggestedReorderQty', header: 'Suggested Reorder Qty', sortValue: (row) => row.suggestedReorderQty || 0 },
          { key: 'seasonImpact', header: 'Season Impact' },
          { key: 'supplierLeadTimeDays', header: 'Lead Time', render: (row) => `${row.supplierLeadTimeDays || 0} days` },
          { key: 'reason', header: 'Reason' },
        ]}
      />
    </div>
  );
};

export default AdminStockSuggestions;
