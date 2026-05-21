import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';

// Store pages
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ProductPage from './pages/ProductPage/ProductPage';
import CategoryPage from './pages/CategoryPage/CategoryPage';
import CartPage from './pages/CartPage/CartPage';
import CheckoutPage from './pages/CheckoutPage/CheckoutPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import OrderPage from './pages/OrderPage/OrderPage';
import SearchPage from './pages/SearchPage/SearchPage';
import WishlistPage from './pages/WishlistPage/WishlistPage';

// Admin pages
import AdminLayout from './pages/Admin/AdminLayout';
import './pages/Admin/AdminLayout.css';
import Dashboard from './pages/Admin/Dashboard';
import AdminProducts from './pages/Admin/AdminProducts';
import AddEditProduct from './pages/Admin/AddEditProduct';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminSalesAnalytics from './pages/Admin/AdminSalesAnalytics';
import AdminProductTrends from './pages/Admin/AdminProductTrends';
import AdminStockSuggestions from './pages/Admin/AdminStockSuggestions';
import AdminReturnsAnalytics from './pages/Admin/AdminReturnsAnalytics';
import AdminProductWeight from './pages/Admin/AdminProductWeight';
import AdminSeasonalStock from './pages/Admin/AdminSeasonalStock';
import AdminHitsAnalytics from './pages/Admin/AdminHitsAnalytics';
import AdminCategories from './pages/Admin/AdminCategories';
import AddEditCategory from './pages/Admin/AddEditCategory';
import AdminSubCategories from './pages/Admin/AdminSubCategories';
import AddEditSubCategory from './pages/Admin/AddEditSubCategory';
import Chatbot from './components/Chatbot/Chatbot';
import DashboardRevenue from './pages/Admin/DashboardRevenue';
import DashboardProductsSold from './pages/Admin/DashboardProductsSold';
import DashboardReturnsDetail from './pages/Admin/DashboardReturnsDetail';
import DashboardMostViewed from './pages/Admin/DashboardMostViewed';
import DashboardLowStock from './pages/Admin/DashboardLowStock';
import DashboardOutOfStock from './pages/Admin/DashboardOutOfStock';
import AdminBlogs from './pages/Admin/AdminBlogs';
import AddEditBlog from './pages/Admin/AddEditBlog';
import AdminProductSize from './pages/Admin/AdminProductSize';
import BlogDetailPage from './pages/BlogPage/BlogDetailPage';
import BlogsListPage from './pages/BlogPage/BlogsListPage';

function App() {
  return (
    <HelmetProvider>
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />
            {/* ── Admin routes (no Header/Footer) ── */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/revenue" element={<DashboardRevenue />} />
              <Route path="dashboard/products-sold" element={<DashboardProductsSold />} />
              <Route path="dashboard/returns" element={<DashboardReturnsDetail />} />
              <Route path="dashboard/most-viewed" element={<DashboardMostViewed />} />
              <Route path="dashboard/low-stock" element={<DashboardLowStock />} />
              <Route path="dashboard/out-of-stock" element={<DashboardOutOfStock />} />
              <Route path="sales" element={<AdminSalesAnalytics />} />
              <Route path="products/trends" element={<AdminProductTrends />} />
              <Route path="stock/suggestions" element={<AdminStockSuggestions />} />
              <Route path="stock/seasonal" element={<AdminSeasonalStock />} />
              <Route path="analytics/hits" element={<AdminHitsAnalytics />} />
              <Route path="returns" element={<AdminReturnsAnalytics />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/add" element={<AddEditProduct />} />
              <Route path="products/edit/:id" element={<AddEditProduct />} />
              <Route path="products/weight" element={<AdminProductWeight />} />
              <Route path="products/size" element={<AdminProductSize />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="categories/add" element={<AddEditCategory />} />
              <Route path="categories/edit/:id" element={<AddEditCategory />} />
              <Route path="subcategories" element={<AdminSubCategories />} />
              <Route path="subcategories/add" element={<AddEditSubCategory />} />
              <Route path="subcategories/edit/:id" element={<AddEditSubCategory />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="blogs/create" element={<AddEditBlog />} />
              <Route path="blogs/add" element={<AddEditBlog />} />
              <Route path="blogs/edit/:id" element={<AddEditBlog />} />
            </Route>

            {/* ── Store routes (with Header/Footer) ── */}
            <Route path="/*" element={<StoreLayout />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
    </HelmetProvider>
  );
}

const StoreLayout = () => (
  <>
    <Header />
    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/blog" element={<BlogsListPage />} />
        <Route path="/blogs" element={<BlogsListPage />} />
        <Route path="/blog/:id" element={<BlogDetailPage />} />
        <Route path="/blogs/:slug" element={<BlogDetailPage />} />
      </Routes>
    </main>
    <Footer />
    {/* AI Chatbot — visible on all store pages */}
    <Chatbot />
  </>
);

/* Redirects to /admin/login if not logged in, to / if not admin */
const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div style={{ padding: 32, fontWeight: 700, color: '#777' }}>Loading admin...</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
};

const PlaceholderPage = ({ title }) => (
  <div className="admin-card">
    <div className="admin-section-title">{title}</div>
    <p style={{ color: '#888', fontSize: 14, padding: '20px 0' }}>
      {title} management coming soon.
    </p>
  </div>
);

export default App;
