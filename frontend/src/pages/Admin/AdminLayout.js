import React, { useState } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import {
  MdDashboard, MdCategory, MdInventory, MdPeople, MdShoppingBag,
  MdArticle, MdLogout, MdMenu,
  MdExpandMore, MdExpandLess, MdShowChart, MdTrendingUp, MdAssignmentReturn, MdVisibility, MdEventAvailable
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <MdDashboard />, to: '/admin/dashboard' },
  { key: 'sales', label: 'Sales Analytics', icon: <MdShowChart />, to: '/admin/sales' },
  {
    key: 'category', label: 'Category', icon: <MdCategory />, children: [
      { label: 'Category List', to: '/admin/categories' },
      { label: 'Add A Category', to: '/admin/categories/add' },
      { label: 'Sub Category List', to: '/admin/subcategories' },
      { label: 'Add A Sub Category', to: '/admin/subcategories/add' },
    ]
  },
  {
    key: 'products', label: 'Products', icon: <MdInventory />, children: [
      { label: 'Product List', to: '/admin/products' },
      { label: 'Product Trends', to: '/admin/products/trends' },
      { label: 'Product Upload', to: '/admin/products/add' },
      { label: 'Add Product WEIGHT', to: '/admin/products/weight' },
    ]
  },
  { key: 'users', label: 'Users', icon: <MdPeople />, to: '/admin/users' },
  { key: 'orders', label: 'Orders', icon: <MdShoppingBag />, to: '/admin/orders' },
  {
    key: 'blogs', label: 'Blogs', icon: <MdArticle />, children: [
      { label: 'All Blogs', to: '/admin/blogs' },
      { label: 'Add Blog', to: '/admin/blogs/add' }
    ]
  },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (key) =>
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={`admin-wrap ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Brand — clicking goes to dashboard */}
        <Link to="/" className="admin-brand" style={{ textDecoration: 'none' }}>
          <div className="admin-brand-logo">
            <MdShoppingBag style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <span className="admin-brand-text">
            <strong>CLASSYSHOP</strong>
            <small>BIG MEGA STORE</small>
          </span>
        </Link>

        <nav className="admin-nav">
          {navItems.map(item => (
            <div key={item.key} className="admin-nav-group">
              {item.to ? (
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    `admin-nav-item${isActive ? ' active' : ''}`
                  }
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label">{item.label}</span>
                </NavLink>
              ) : (
                <>
                  <button
                    className="admin-nav-item admin-nav-expandable"
                    onClick={() => toggleMenu(item.key)}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                    <span className="admin-nav-arrow">
                      {openMenus[item.key] ? <MdExpandLess /> : <MdExpandMore />}
                    </span>
                  </button>
                  {openMenus[item.key] && (
                    <div className="admin-nav-children">
                      {item.children.map(child => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `admin-nav-child${isActive ? ' active' : ''}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          <button className="admin-nav-item admin-logout" onClick={handleLogout}>
            <span className="admin-nav-icon"><MdLogout /></span>
            <span className="admin-nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-toggle"
            onClick={() => setCollapsed(c => !c)}
            title="Toggle sidebar"
          >
            <MdMenu />
          </button>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">{user?.name}</span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
