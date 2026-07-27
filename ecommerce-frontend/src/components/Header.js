import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ cartCount = 0, user = null, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-primary-100 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="hidden sm:inline text-xl font-bold font-heading text-primary-600">
              TechStore
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xs mx-8 relative">
            <input
              id="desktop-search-input"
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full px-4 py-2 pr-10 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
            />
            <button
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/products"
              className="text-text-primary hover:text-primary-600 font-medium transition-colors"
            >
              Sản phẩm
            </Link>
            <Link
              to="/faq"
              className="text-text-primary hover:text-primary-600 font-medium transition-colors"
            >
              Hỏi đáp
            </Link>
            <Link
              to="/order-lookup"
              className="text-text-primary hover:text-primary-600 font-medium transition-colors"
            >
              Tra cứu ĐH
            </Link>
            {user ? (
              <>
                <span className="text-text-secondary text-sm">Xin chào, {user.firstName}!</span>
                <Link
                  to="/profile"
                  className="text-text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  Tài khoản
                </Link>
                <Link
                  to="/orders"
                  className="text-text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  Đơn hàng
                </Link>
                <Link
                  to="/wishlist"
                  className="text-text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  Yêu thích
                </Link>
                <Link
                  to="/my-vouchers"
                  className="text-text-primary hover:text-primary-600 font-medium transition-colors"
                >
                  🎟️ Voucher
                </Link>
                <button onClick={onLogout} className="text-text-primary hover:text-primary-600 font-medium transition-colors">
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-text-primary hover:text-primary-600 font-medium transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative text-text-primary hover:text-primary-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m10 0l2-9m-12 9h16m-4-6h-3v3h3v-3z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-primary-100 animate-slideDown">
            <div className="space-y-2">
              <div className="relative">
                <input
                  id="mobile-search-input"
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full px-4 py-2 pr-10 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 mb-4"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-2 top-2.5 text-primary-400 hover:text-primary-600 transition-colors"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              <Link
                to="/products"
                className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
              >
                Sản phẩm
              </Link>
              <Link
                to="/faq"
                className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
              >
                Hỏi đáp
              </Link>
              <Link
                to="/order-lookup"
                className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
              >
                Tra cứu đơn hàng
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Tài khoản của tôi
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Đơn hàng của tôi
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Yêu thích
                  </Link>
                  <Link
                    to="/my-vouchers"
                    className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    🎟️ My Voucher
                  </Link>
                  <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
