import { format, parseISO } from 'date-fns';

export const unwrapPayload = (raw) => raw?.data ?? raw?.result ?? raw?.analytics ?? raw ?? {};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.analytics)) return value.analytics;
  return [];
};

const numberFrom = (...values) => {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  const number = Number(found);
  return Number.isFinite(number) ? number : 0;
};

const rawDateFrom = (item = {}) => item.date || item._id || item.day || item.createdAt || item.period || item.month;

export const formatChartDate = (value) => {
  if (!value) return '';
  const text = String(value);
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return format(parseISO(text.slice(0, 10)), 'dd MMM');
    return text;
  } catch {
    return text;
  }
};

export const normalizeSalesData = (payload) => {
  const data = unwrapPayload(payload);
  const trend = toArray(data.trend || data.sales || data.revenueTrend || data.ordersTrend || data);
  const categories = toArray(data.categories || data.categoryBreakdown || data.categoryRevenue);
  const topProducts = toArray(data.topProducts || data.products);
  const slowProducts = toArray(data.slowProducts || data.slowSellingProducts);

  return {
    totalRevenue: numberFrom(data.totalRevenue, data.revenue),
    totalOrders: numberFrom(data.totalOrders, data.orders),
    totalSales: numberFrom(data.totalSales, data.salesCount, data.soldUnits),
    avgOrderValue: numberFrom(data.avgOrderValue, data.averageOrderValue),
    trend: trend.map((item) => ({
      ...item,
      date: formatChartDate(rawDateFrom(item)),
      revenue: numberFrom(item.revenue, item.totalRevenue, item.salesAmount, item.amount),
      orders: numberFrom(item.orders, item.totalOrders, item.orderCount, item.count),
    })),
    categories: categories.map((item) => ({
      ...item,
      category: item.category || item.name || item._id || 'Unknown',
      revenue: numberFrom(item.revenue, item.totalRevenue, item.salesAmount, item.amount),
      units: numberFrom(item.units, item.qty, item.quantity, item.count),
    })),
    topProducts,
    slowProducts,
  };
};

export const normalizeDashboardData = (payload) => {
  const data = unwrapPayload(payload);
  return {
    totalRevenue: numberFrom(data.totalRevenue, data.revenue, data.salesAmount, data.amount),
    totalOrders: numberFrom(data.totalOrders, data.orders, data.orderCount, data.count),
    totalProducts: numberFrom(data.totalProducts),
    totalProductsSold: numberFrom(data.totalProductsSold, data.totalSales, data.soldItems, data.soldUnits),
    returnRate: numberFrom(data.returnRate, data.returnsRate, data.rate?.returnRate),
    lowStockCount: numberFrom(data.lowStockCount, data.lowStock, data.stock?.lowStock),
    outOfStockCount: numberFrom(data.outOfStockCount, data.outOfStock, data.stock?.outOfStock),
    trendingCount: numberFrom(data.trendingCount),
    revenueGrowth: numberFrom(data.revenueGrowth, data.growth),
    topProducts: toArray(data.topProducts || data.products),
    topViewedProducts: toArray(data.topViewedProducts || data.mostViewedProducts),
    lowStockAlerts: toArray(data.lowStockAlerts || data.alerts),
    stockSuggestions: toArray(data.stockSuggestions || data.suggestions),
    mostViewedProduct: data.mostViewedProduct || null,
  };
};

export const normalizeTrendProducts = (payload) =>
  toArray(unwrapPayload(payload)).map((item) => ({
    ...item,
    _id: item._id || item.productId || item.id,
    name: item.name || item.product?.name || item.title || '-',
    brand: item.brand || item.product?.brand || '-',
    category: item.category || item.product?.category || '-',
    sales: numberFrom(item.sales, item.unitsSold, item.totalSold),
    views: numberFrom(item.views, item.viewCount, item.hits),
    addToCartCount: numberFrom(item.addToCartCount, item.carts, item.cartCount),
    searchCount: numberFrom(item.searchCount, item.searches),
    conversionRate: numberFrom(item.conversionRate),
    returnRate: numberFrom(item.returnRate),
    trendScore: numberFrom(item.trendScore, item.score),
    trend: item.trend || item.trendLabel || item.status,
  }));

export const normalizeStockSuggestions = (payload) =>
  toArray(unwrapPayload(payload)).map((item) => ({
    ...item,
    productName: item.product?.name || item.productName || item.name || '-',
    sku: item.sku || item.product?.sku || item.product?._id?.slice(-8)?.toUpperCase() || item._id?.slice(-8)?.toUpperCase() || '-',
    currentStock: numberFrom(item.currentStock, item.stock, item.product?.countInStock),
    daysOfStockRemaining: numberFrom(item.daysOfStockRemaining, item.daysRemaining, item.daysLeft),
    recommendation: item.recommendation || item.action || 'watch',
    urgency: item.urgency || item.priority || 'low',
    suggestedReorderQty: numberFrom(item.suggestedReorderQty, item.reorderQty, item.quantity),
    avgDailySales: numberFrom(item.avgDailySales),
    reorderPoint: numberFrom(item.reorderPoint),
    reason: item.reason || item.seasonImpact || item.recommendation || 'Based on stock and demand signals',
    seasonImpact: item.seasonImpact || (item.seasonalMultiplier ? `${item.seasonalMultiplier}x demand` : '-'),
    supplierLeadTimeDays: numberFrom(item.supplierLeadTimeDays, item.leadTimeDays),
  }));

export const normalizeReturnAnalytics = (payload) => {
  const data = unwrapPayload(payload);
  const trend = toArray(data.trend || data.returnTrend || data.returns || data);
  return {
    rate: data.rate || { returnRate: numberFrom(data.returnRate) },
    totalReturnedProducts: numberFrom(data.totalReturnedProducts, data.rate?.returnedUnits),
    returnRate: numberFrom(data.returnRate, data.rate?.returnRate),
    trend: trend.map((item) => ({
      ...item,
      date: formatChartDate(rawDateFrom(item)),
      count: numberFrom(item.count, item.returns, item.totalReturns),
      refund: numberFrom(item.refund, item.totalRefund, item.amount),
    })),
    topProducts: toArray(data.topProducts || data.mostReturnedProducts || data.products),
    highReturnRiskProducts: toArray(data.highReturnRiskProducts || data.riskProducts),
    reasons: toArray(data.reasons || data.reasonBreakdown || data.returnReasons).map((item) => ({
      ...item,
      reason: item.reason || item.name || item._id || 'Unknown',
      count: numberFrom(item.count, item.total, item.value),
    })),
  };
};

export const normalizeSeasonalStock = (payload) => {
  const data = unwrapPayload(payload);
  return {
    seasonStock: toArray(data.seasonStock || data.summary || data.seasons).map((item) => ({
      season: item.season || item.name || item._id || 'All Season',
      totalStock: numberFrom(item.totalStock, item.stock),
      totalProducts: numberFrom(item.totalProducts, item.products, item.productCount, item.count),
      lowStockCount: numberFrom(item.lowStockCount, item.understocked),
      outOfStockCount: numberFrom(item.outOfStockCount),
      revenue: numberFrom(item.revenue, item.totalRevenue),
    })),
    seasonDemand: toArray(data.seasonDemand || data.demand || data.seasonDemandData).map((item) => ({
      season: item.season || item.name || item._id || 'All Season',
      demand: numberFrom(item.demand, item.demandScore),
      demandScore: numberFrom(item.demandScore, item.demand),
      revenue: numberFrom(item.revenue, item.totalRevenue),
      sold: numberFrom(item.sold, item.soldQuantity, item.units),
      soldQuantity: numberFrom(item.soldQuantity, item.sold, item.units),
      views: numberFrom(item.views, item.totalViews, item.viewCount),
    })),
    products: toArray(data.products || data.stock || data).map((item) => ({
      ...item,
      product: item.product?.name || item.product || item.name || '-',
      name: item.product?.name || item.product || item.name || '-',
      category: item.category || item.product?.category || '-',
      season: item.primarySeason || item.season || 'All Season',
      stock: numberFrom(item.stock, item.countInStock, item.currentStock),
      trendScore: numberFrom(item.trendScore),
      seasonalDemandScore: numberFrom(item.seasonalDemandScore),
      recommendation: item.recommendation || 'watch',
      urgency: item.urgency || 'low',
    })),
  };
};

export const normalizeHitsAnalytics = (payload) => {
  const data = unwrapPayload(payload);
  return {
    trend: toArray(data.trend || data.hitsTrend || data).map((item) => ({
      ...item,
      date: formatChartDate(rawDateFrom(item)),
      views: numberFrom(item.views, item.totalViews, item.viewCount),
      carts: numberFrom(item.carts, item.addToCarts, item.cartCount),
      purchases: numberFrom(item.purchases, item.orders, item.sales),
    })),
    products: toArray(data.products || data.mostViewed || data).map((item) => ({
      ...item,
      name: item.name || item.product?.name || '-',
      category: item.category || item.product?.category || '-',
      views: numberFrom(item.views, item.totalViews, item.viewCount),
      clicks: numberFrom(item.clicks, item.clickCount),
      carts: numberFrom(item.carts, item.addToCarts, item.cartCount),
      purchases: numberFrom(item.purchases, item.sales, item.soldCount),
      conversionRate: numberFrom(item.conversionRate),
      cartRate: numberFrom(item.cartRate, item.viewToCartRate),
    })),
    searches: toArray(data.searches || data.searchTerms || data.topSearched).map((item) => ({
      term: item.term || item.search || item.keyword || item._id || 'Unknown',
      count: numberFrom(item.count, item.searchCount, item.total),
    })),
    conversion: toArray(data.conversion || data.funnel).map((item) => ({
      stage: item.stage || item.action || item._id || 'Unknown',
      count: numberFrom(item.count, item.total),
    })),
  };
};
