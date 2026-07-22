import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';

const AdminLayout = ({ user, children }) => {
  const location = useLocation();

  // Bảo vệ route
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/" replace />;

  const navItems = [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: '📊' },
    { path: '/admin/products', label: 'Sản phẩm', icon: '📦' },
    { path: '/admin/categories', label: 'Danh mục', icon: '🏷️' },
    { path: '/admin/inventory', label: 'Kho', icon: '📦' },
    { path: '/admin/orders', label: 'Đơn hàng', icon: '🛒' },
    { path: '/admin/promo-codes', label: 'Mã khuyến mãi', icon: '🎟️' },
    { path: '/admin/customer-care', label: 'Chăm sóc KH', icon: '💬' },
    { path: '/admin/users', label: 'Người dùng', icon: '👥' },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link to="/admin/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
              A
            </div>
            <div>
              <div className="font-bold text-white text-sm">TechStore</div>
              <div className="text-gray-400 text-xs">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: back to shop + user info */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
          >
            <span>🏪</span>
            <span>Về trang Shop</span>
          </Link>
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.firstName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="text-white text-xs font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-gray-400 text-xs">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-64">
        {/* Top header */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800">
            {navItems.find(n => isActive(n.path))?.label || 'Admin'}
          </h1>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Page content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
