const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Return = require('../models/Return');
const User = require('../models/User');
const UserBehavior = require('../models/UserBehavior');
const StockSuggestion = require('../models/StockSuggestion');
const StockAlert = require('../models/StockAlert');
const AnalyticsSnapshot = require('../models/AnalyticsSnapshot');
const Season = require('../models/Season');

dotenv.config();

const KEEP_OLD_DEMO = process.argv.includes('--keep-demo');
const DAY = 24 * 60 * 60 * 1000;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const sample = (arr, count) => [...arr].sort(() => Math.random() - 0.5).slice(0, count);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dateDaysAgo = (days, hour = rand(9, 22)) => {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, rand(0, 59), rand(0, 59), 0);
  return date;
};

const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Sialkot'];
const customerNames = ['Ayesha Khan', 'Hassan Ali', 'Fatima Noor', 'Usman Ahmed', 'Mariam Shah', 'Bilal Raza', 'Zainab Malik'];
const seasonsSeed = [
  { name: 'Summer', startMonth: 4, endMonth: 8, demandMultiplier: 1.35 },
  { name: 'Winter', startMonth: 11, endMonth: 2, demandMultiplier: 1.3 },
  { name: 'Eid', startMonth: 3, endMonth: 4, demandMultiplier: 1.8 },
  { name: 'Wedding', startMonth: 10, endMonth: 2, demandMultiplier: 1.55 },
  { name: 'Spring', startMonth: 2, endMonth: 4, demandMultiplier: 1.15 },
  { name: 'Autumn', startMonth: 9, endMonth: 11, demandMultiplier: 1.1 },
  { name: 'All Season', startMonth: 1, endMonth: 12, demandMultiplier: 1.0 },
];
const returnReasons = ['sizing_issue', 'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other'];
const searchTerms = [
  'summer clothes', 'winter collection', 'eid dress', 'wedding wear', 'casual shirts',
  'shoes', 'bags', 'accessories', 'beauty products', 'smart watch', 'laptop', 'jewellery'
];

const getWeightedProduct = (products, hotSet, risingSet, highViewLowSaleSet) => {
  const roll = Math.random();
  if (roll < 0.45 && hotSet.length) return pick(hotSet);
  if (roll < 0.70 && risingSet.length) return pick(risingSet);
  if (roll < 0.82 && highViewLowSaleSet.length) return pick(highViewLowSaleSet);
  return pick(products);
};

const statusForScore = (score) => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'rising';
  if (score >= 40) return 'stable';
  if (score >= 20) return 'falling';
  return 'dead';
};

const normalizeScore = (value, max) => (max > 0 ? (value / max) * 100 : 0);

const clearDemoData = async () => {
  // Optional safety switch:
  // By default this script clears only previous demo records that it created.
  // Run `npm run seed:analytics -- --keep-demo` if you intentionally want to append demo data.
  if (KEEP_OLD_DEMO) return;

  await Promise.all([
    Order.deleteMany({ isDemoData: true }),
    Return.deleteMany({ isDemoData: true }),
    UserBehavior.deleteMany({ isDemoData: true }),
    StockSuggestion.deleteMany({ isDemoData: true }),
    StockAlert.deleteMany({ isDemoData: true }),
    AnalyticsSnapshot.deleteMany({ isDemoData: true }),
  ]);
};

const ensureDemoUser = async () => {
  let user = await User.findOne({ email: 'analytics.demo@classyshop.local' });
  if (user) return user;

  user = await User.create({
    name: 'Analytics Demo Customer',
    email: 'analytics.demo@classyshop.local',
    password: 'demo123456',
    phone: '03001234567',
    isAdmin: false,
  });
  return user;
};

const ensureSeasons = async () => {
  const seasonDocs = [];
  for (const season of seasonsSeed) {
    const doc = await Season.findOneAndUpdate(
      { name: season.name },
      { ...season, isActive: true },
      { upsert: true, new: true }
    );
    seasonDocs.push(doc);
  }
  return seasonDocs;
};

const updateProductStockAndSeasons = async (products, seasons) => {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const lowStart = Math.floor(shuffled.length * 0.60);
  const outStart = Math.floor(shuffled.length * 0.85);
  const hotCount = Math.min(5, shuffled.length);
  const risingCount = Math.min(5, Math.max(0, shuffled.length - hotCount));

  const hotSet = shuffled.slice(0, hotCount);
  const risingSet = shuffled.slice(hotCount, hotCount + risingCount);
  const highViewLowSaleSet = shuffled.slice(hotCount + risingCount, hotCount + risingCount + Math.min(4, shuffled.length));

  for (let index = 0; index < shuffled.length; index += 1) {
    const product = shuffled[index];
    const season = seasons[index % seasons.length];
    const isLow = index >= lowStart && index < outStart;
    const isOut = index >= outStart;
    const stock = isOut ? 0 : isLow ? rand(1, 5) : rand(18, 120);
    const baseScore = hotSet.includes(product)
      ? rand(82, 96)
      : risingSet.includes(product)
        ? rand(62, 78)
        : index % 5 === 0
          ? rand(8, 19)
          : index % 4 === 0
            ? rand(24, 38)
            : rand(42, 58);

    product.countInStock = stock;
    product.lowStockThreshold = rand(5, 10);
    product.primarySeason = season.name;
    product.seasons = [season._id];
    product.seasonalDemandScore = rand(35, 100);
    product.upcomingSeasonPriority = rand(20, 100);
    product.trendScore = baseScore;
    product.trendStatus = statusForScore(baseScore);
    product.viewCount = 0;
    product.searchCount = 0;
    product.addToCartCount = 0;
    product.soldCount = 0;
    product.returnCount = 0;
    product.sales = 0;
    await product.save();
  }

  return { products: shuffled, hotSet, risingSet, highViewLowSaleSet };
};

const createOrders = async (products, user, hotSet, risingSet, highViewLowSaleSet) => {
  const orderCount = rand(28, 38);
  const soldMap = new Map();
  const orders = [];

  for (let i = 0; i < orderCount; i += 1) {
    const daysAgo = Math.round(Math.pow(Math.random(), 1.5) * 29);
    const createdAt = dateDaysAgo(daysAgo);
    const itemCount = rand(3, 5);
    const selected = sample(
      Array.from({ length: itemCount }, () => getWeightedProduct(products, hotSet, risingSet, highViewLowSaleSet)),
      itemCount
    );

    const orderItems = selected.map((product) => {
      const qty = hotSet.includes(product) ? rand(3, 8) : rand(2, 7);
      soldMap.set(product._id.toString(), (soldMap.get(product._id.toString()) || 0) + qty);
      return {
        name: product.name,
        qty,
        image: product.image,
        price: product.price,
        product: product._id,
      };
    });

    const itemsPrice = orderItems.reduce((sum, item) => sum + item.qty * item.price, 0);
    const shippingPrice = itemsPrice > 5000 ? 0 : 250;
    const taxPrice = Math.round(itemsPrice * 0.02);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;
    const statusRoll = Math.random();
    const status = statusRoll < 0.78 ? 'delivered' : statusRoll < 0.90 ? 'shipped' : statusRoll < 0.98 ? 'processing' : 'pending';
    const isDelivered = status === 'delivered';
    const isPaid = ['delivered', 'shipped', 'processing'].includes(status);
    const rawDeliveredAt = new Date(createdAt.getTime() + rand(2, 5) * DAY);
    const deliveredAt = isDelivered ? (rawDeliveredAt > new Date() ? new Date() : rawDeliveredAt) : null;

    orders.push({
      user: user._id,
      orderItems,
      shippingAddress: {
        name: pick(customerNames),
        address: `House ${rand(10, 499)}, Street ${rand(1, 25)}`,
        city: pick(cities),
        postalCode: String(rand(54000, 79999)),
        country: 'Pakistan',
        phone: `03${rand(10, 49)}${rand(1000000, 9999999)}`,
      },
      paymentMethod: Math.random() > 0.35 ? 'COD' : 'Card',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid,
      paidAt: isPaid ? createdAt : null,
      isDelivered,
      deliveredAt,
      status,
      statusHistory: [{ status: 'pending', timestamp: createdAt, note: 'Order received' }],
      estimatedDelivery: new Date(createdAt.getTime() + 5 * DAY),
      isDemoData: true,
      createdAt,
      updatedAt: deliveredAt || createdAt,
    });
  }

  const createdOrders = await Order.insertMany(orders);
  return { orders: createdOrders, soldMap };
};

const createReturns = async (orders) => {
  const delivered = orders.filter(order => order.status === 'delivered');
  const returnOrders = sample(delivered, Math.max(3, Math.floor(delivered.length * (rand(5, 15) / 100))));
  const returnCountMap = new Map();
  const returnDocs = [];

  for (const order of returnOrders) {
    const item = pick(order.orderItems);
    const qty = Math.min(item.qty, 1);
    returnCountMap.set(item.product.toString(), (returnCountMap.get(item.product.toString()) || 0) + qty);
    const createdAt = new Date((order.deliveredAt || order.createdAt).getTime() + rand(1, 7) * DAY);
    returnDocs.push({
      order: order._id,
      user: order.user,
      items: [{
        product: item.product,
        name: item.name,
        qty,
        price: item.price,
        reason: pick(returnReasons),
      }],
      status: Math.random() > 0.25 ? pick(['approved', 'refunded']) : 'requested',
      totalRefund: item.price * qty,
      notes: 'Analytics demo return',
      processedAt: Math.random() > 0.35 ? createdAt : null,
      isDemoData: true,
      createdAt,
      updatedAt: createdAt,
    });
  }

  const createdReturns = await Return.insertMany(returnDocs);
  return { returns: createdReturns, returnCountMap };
};

const createBehaviors = async (products, user, hotSet, risingSet, highViewLowSaleSet) => {
  const docs = [];
  const counts = new Map();
  const inc = (id, key) => {
    const current = counts.get(id) || { views: 0, carts: 0, searches: 0, purchases: 0 };
    current[key] += 1;
    counts.set(id, current);
  };

  const viewCount = rand(850, 1400);
  for (let i = 0; i < viewCount; i += 1) {
    const product = getWeightedProduct(products, hotSet, risingSet, highViewLowSaleSet);
    const createdAt = dateDaysAgo(rand(0, 30));
    docs.push({
      user: Math.random() > 0.6 ? user._id : null,
      sessionId: `demo-session-${rand(1, 260)}`,
      product: product._id,
      action: 'view',
      category: product.category || 'direct',
      isDemoData: true,
      createdAt,
      updatedAt: createdAt,
    });
    inc(product._id.toString(), 'views');
  }

  const cartCount = rand(280, 560);
  for (let i = 0; i < cartCount; i += 1) {
    const product = getWeightedProduct(products, hotSet, risingSet, highViewLowSaleSet);
    const createdAt = dateDaysAgo(rand(0, 30));
    docs.push({
      user: Math.random() > 0.55 ? user._id : null,
      sessionId: `demo-session-${rand(1, 260)}`,
      product: product._id,
      action: 'add_to_cart',
      category: 'add',
      isDemoData: true,
      createdAt,
      updatedAt: createdAt,
    });
    inc(product._id.toString(), 'carts');
  }

  const searchCount = rand(240, 520);
  for (let i = 0; i < searchCount; i += 1) {
    const product = getWeightedProduct(products, hotSet, risingSet, highViewLowSaleSet);
    const term = Math.random() > 0.45 ? product.name.split(' ').slice(0, 2).join(' ') : pick(searchTerms);
    const createdAt = dateDaysAgo(rand(0, 30));
    docs.push({
      user: Math.random() > 0.55 ? user._id : null,
      sessionId: `demo-session-${rand(1, 260)}`,
      product: product._id,
      action: 'click',
      category: `search:${term}`,
      isDemoData: true,
      createdAt,
      updatedAt: createdAt,
    });
    inc(product._id.toString(), 'searches');
  }

  await UserBehavior.insertMany(docs);
  return { behaviorCount: docs.length, viewCount, cartCount, searchCount, behaviorMap: counts };
};

const updateProductAnalytics = async (products, soldMap, returnCountMap, behaviorMap) => {
  const maxViews = Math.max(...products.map(p => behaviorMap.get(p._id.toString())?.views || 0), 1);
  const maxSales = Math.max(...products.map(p => soldMap.get(p._id.toString()) || 0), 1);
  const maxCarts = Math.max(...products.map(p => behaviorMap.get(p._id.toString())?.carts || 0), 1);
  const maxSearch = Math.max(...products.map(p => behaviorMap.get(p._id.toString())?.searches || 0), 1);
  const calculated = [];

  for (const product of products) {
    const id = product._id.toString();
    const behavior = behaviorMap.get(id) || { views: 0, carts: 0, searches: 0 };
    const sold = soldMap.get(id) || 0;
    const returned = returnCountMap.get(id) || 0;
    const viewsScore = normalizeScore(behavior.views, maxViews);
    const salesScore = normalizeScore(sold, maxSales);
    const cartScore = normalizeScore(behavior.carts, maxCarts);
    const searchScore = normalizeScore(behavior.searches, maxSearch);
    const returnPenalty = sold > 0 ? (returned / sold) * 100 : 0;
    const trendScore = clamp(Math.round(
      viewsScore * 0.30 +
      salesScore * 0.35 +
      cartScore * 0.20 +
      searchScore * 0.10 -
      returnPenalty * 0.05
    ), 0, 100);

    calculated.push({
      product,
      behavior,
      sold,
      returned,
      trendScore
    });
  }

  calculated.sort((a, b) => b.trendScore - a.trendScore);
  calculated.forEach((item, index) => {
    if (products.length >= 10 && index < 5) item.trendScore = Math.max(item.trendScore, rand(82, 96));
    if (products.length >= 10 && index >= 5 && index < 10) item.trendScore = clamp(Math.max(item.trendScore, rand(62, 78)), 60, 79);
    if (products.length >= 15 && index >= calculated.length - 5) item.trendScore = Math.min(item.trendScore, rand(4, 19));
  });

  let trendingCount = 0;
  for (const item of calculated) {
    const trendStatus = statusForScore(item.trendScore);
    if (['hot', 'rising'].includes(trendStatus)) trendingCount += 1;
    await Product.findByIdAndUpdate(item.product._id, {
      viewCount: item.behavior.views,
      searchCount: item.behavior.searches,
      addToCartCount: item.behavior.carts,
      soldCount: item.sold,
      sales: item.sold,
      returnCount: item.returned,
      trendScore: item.trendScore,
      trendStatus,
    });
  }

  return { trendingCount };
};

const createStockSuggestionsAndAlerts = async (products, soldMap, returnCountMap) => {
  let suggestionsCreated = 0;
  let alertsCreated = 0;
  const suggestionProducts = products.filter(p => p.countInStock <= 20 || (soldMap.get(p._id.toString()) || 0) <= 2).slice(0, Math.max(15, Math.floor(products.length * 0.45)));

  for (const product of suggestionProducts) {
    const sold = soldMap.get(product._id.toString()) || 0;
    const returned = returnCountMap.get(product._id.toString()) || 0;
    const avgDailySales = Number((sold / 30).toFixed(2));
    const daysRemaining = avgDailySales > 0 ? Number((product.countInStock / avgDailySales).toFixed(1)) : 9999;
    const supplierLeadTimeDays = rand(5, 14);
    const safetyStock = rand(3, 8);
    const reorderPoint = Math.ceil(avgDailySales * supplierLeadTimeDays + safetyStock);
    const expectedDemand = Math.ceil(avgDailySales * 30 * (product.seasonalDemandScore > 70 ? 1.35 : 1));
    const suggestedReorderQty = Math.max(0, expectedDemand - product.countInStock);
    const returnRate = sold > 0 ? (returned / sold) * 100 : 0;

    let recommendation = 'watch';
    let urgency = 'low';
    let reason = 'Stock is healthy. Watch closely.';
    if (product.countInStock === 0) {
      recommendation = 'reorder'; urgency = 'critical'; reason = 'Product is out of stock. Reorder immediately.';
    } else if (daysRemaining <= 7) {
      recommendation = 'reorder'; urgency = 'critical'; reason = 'Stock may finish within 7 days.';
    } else if (daysRemaining <= 15) {
      recommendation = 'reorder'; urgency = 'high'; reason = 'Stock may finish within 15 days.';
    } else if (returnRate >= 15) {
      recommendation = 'watch'; urgency = 'medium'; reason = 'High return risk. Review quality and sizing.';
    } else if (sold <= 1 && product.countInStock >= 50) {
      recommendation = 'reduce'; urgency = 'medium'; reason = 'Low sales and high stock. Reduce stock or promote.';
    } else if (product.upcomingSeasonPriority >= 75) {
      recommendation = 'prepare_season'; urgency = 'high'; reason = 'Prepare for upcoming seasonal demand.';
    } else if ((product.viewCount || 0) > 80 && sold < 4) {
      recommendation = 'promote'; urgency = 'medium'; reason = 'High views but low sales. Promote or review pricing.';
    }

    const existingSuggestion = await StockSuggestion.findOne({ product: product._id });
    if (existingSuggestion && !existingSuggestion.isDemoData) continue;

    await StockSuggestion.findOneAndUpdate(
      { product: product._id },
      {
        product: product._id,
        avgDailySales,
        totalSoldLast30d: sold,
        daysOfStockRemaining: daysRemaining,
        reorderPoint,
        suggestedReorderQty,
        seasonalMultiplier: product.seasonalDemandScore >= 70 ? 1.35 : 1,
        trendScore: product.trendScore || 0,
        returnRiskScore: returnRate,
        currentStock: product.countInStock,
        recommendation,
        urgency,
        reason,
        seasonImpact: `${product.primarySeason || 'All Season'} demand`,
        supplierLeadTimeDays,
        isDemoData: true,
      },
      { upsert: true, new: true }
    );
    suggestionsCreated += 1;

    const alertType = product.countInStock === 0 ? 'out_of_stock' : product.countInStock <= product.lowStockThreshold ? 'low_stock' : daysRemaining <= 15 ? 'reorder_point' : null;
    if (alertType) {
      await StockAlert.create({
        product: product._id,
        type: alertType,
        currentStock: product.countInStock,
        threshold: product.lowStockThreshold || 5,
        isResolved: false,
        isDemoData: true,
      });
      alertsCreated += 1;
    }
  }

  return { suggestionsCreated, alertsCreated };
};

const createSnapshots = async (orders, returns, products) => {
  let created = 0;
  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = dateDaysAgo(daysAgo, 0);
    date.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOrders = orders.filter(order => order.createdAt >= date && order.createdAt <= dayEnd && ['delivered', 'shipped', 'processing'].includes(order.status));
    const dayReturns = returns.filter(ret => ret.createdAt >= date && ret.createdAt <= dayEnd);
    const revenue = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const productsSold = dayOrders.reduce((sum, order) => sum + order.orderItems.reduce((itemSum, item) => itemSum + item.qty, 0), 0);
    const lowStockCount = products.filter(product => product.countInStock > 0 && product.countInStock <= (product.lowStockThreshold || 5)).length;
    const outOfStockCount = products.filter(product => product.countInStock === 0).length;
    const trendingProductsCount = products.filter(product => ['hot', 'rising'].includes(product.trendStatus)).length;
    const totalViews = products.reduce((sum, product) => sum + (product.viewCount || 0), 0);

    const existingSnapshot = await AnalyticsSnapshot.findOne({ date, type: 'daily' });
    if (existingSnapshot && !existingSnapshot.isDemoData) continue;

    await AnalyticsSnapshot.findOneAndUpdate(
      { date, type: 'daily' },
      {
        date,
        type: 'daily',
        data: {
          totalRevenue: revenue,
          totalOrders: dayOrders.length,
          totalReturns: dayReturns.length,
          returnRate: productsSold ? Number(((dayReturns.length / productsSold) * 100).toFixed(2)) : 0,
          avgOrderValue: dayOrders.length ? Math.round(revenue / dayOrders.length) : 0,
          topProducts: [],
          categoryBreakdown: [],
          stockSummary: {
            productsSold,
            lowStockCount,
            outOfStockCount,
            trendingProductsCount,
            totalViews,
          },
        },
        isDemoData: true,
      },
      { upsert: true, new: true }
    );
    created += 1;
  }
  return created;
};

const main = async () => {
  await connectDB();
  await clearDemoData();

  const products = await Product.find({});
  if (!products.length) {
    console.log('No products found. Please add products first.');
    await mongoose.disconnect();
    return;
  }

  const [user, seasons] = await Promise.all([ensureDemoUser(), ensureSeasons()]);
  const { products: preparedProducts, hotSet, risingSet, highViewLowSaleSet } = await updateProductStockAndSeasons(products, seasons);
  const { orders, soldMap } = await createOrders(preparedProducts, user, hotSet, risingSet, highViewLowSaleSet);
  const { returns, returnCountMap } = await createReturns(orders);
  const { behaviorCount, viewCount, cartCount, searchCount, behaviorMap } = await createBehaviors(preparedProducts, user, hotSet, risingSet, highViewLowSaleSet);
  const { trendingCount } = await updateProductAnalytics(preparedProducts, soldMap, returnCountMap, behaviorMap);
  const { suggestionsCreated, alertsCreated } = await createStockSuggestionsAndAlerts(await Product.find({}), soldMap, returnCountMap);
  const snapshotsCreated = await createSnapshots(orders, returns, await Product.find({}));

  const finalProducts = await Product.find({});
  const lowStockCount = finalProducts.filter(product => product.countInStock > 0 && product.countInStock <= (product.lowStockThreshold || 5)).length;
  const outOfStockCount = finalProducts.filter(product => product.countInStock === 0).length;

  console.log('\nClassyShop analytics demo data seeded successfully');
  console.log('------------------------------------------------');
  console.log(`Products processed: ${finalProducts.length}`);
  console.log(`Orders created: ${orders.length}`);
  console.log(`Returns created: ${returns.length}`);
  console.log(`Product views created: ${viewCount}`);
  console.log(`Cart events created: ${cartCount}`);
  console.log(`Searches created: ${searchCount}`);
  console.log(`UserBehavior records created: ${behaviorCount}`);
  console.log(`Stock suggestions created/updated: ${suggestionsCreated}`);
  console.log(`Stock alerts created: ${alertsCreated}`);
  console.log(`Analytics snapshots created/updated: ${snapshotsCreated}`);
  console.log(`Low stock products count: ${lowStockCount}`);
  console.log(`Out-of-stock products count: ${outOfStockCount}`);
  console.log(`Trending products count: ${trendingCount}`);
  console.log('\nTip: this script clears only previous demo analytics records by default. Use `npm run seed:analytics -- --keep-demo` only if you want to append demo data.');

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error('Analytics seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
