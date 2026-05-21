const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,        // e.g. https://classyshop.vercel.app
  process.env.CUSTOM_DOMAIN_URL,   // e.g. https://classyshop.pk
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SEO routes (root level — must come before /api routes)
app.use('/', require('./routes/seoRoutes'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/subcategories', require('./routes/subCategoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/blog',  require('./routes/blogRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai',    require('./routes/aiRoutes'));
app.use('/api/admin/blogs',   require('./routes/adminBlogRoutes'));
app.use('/api/admin/returns', require('./routes/adminReturnRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/cart',   require('./routes/cartRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

// Analytics & tracking routes
app.use('/api/track',           require('./routes/trackRoutes'));
app.use('/api/returns',         require('./routes/returnRoutes'));
app.use('/api/admin/analytics', require('./routes/analyticsRoutes'));

// Error handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({ message: err.message });
});

// Background jobs
require('./jobs/dailySnapshot');
require('./jobs/stockSuggestion');
require('./jobs/stockAlert');
require('./jobs/trendRecalc');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
