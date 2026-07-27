import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderLookupPage from './pages/OrderLookupPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import MyVoucherPage from './pages/MyVoucherPage';
import MomoReturnPage from './pages/MomoReturnPage';
import FAQPage from './pages/FAQPage';
import Chatbot from './components/Chatbot';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsAdminPage from './pages/admin/ProductsAdminPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import OrdersAdminPage from './pages/admin/OrdersAdminPage';
import UsersAdminPage from './pages/admin/UsersAdminPage';
import CategoriesAdminPage from './pages/admin/CategoriesAdminPage';
import InventoryAdminPage from './pages/admin/InventoryAdminPage';
import PromoCodesAdminPage from './pages/admin/PromoCodesAdminPage';
import VoucherTemplatesAdminPage from './pages/admin/VoucherTemplatesAdminPage';
import CustomerCareAdminPage from './pages/admin/CustomerCareAdminPage';
import { cartApi } from './utils/api';
import './App.css';

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchCart();
    }
    setLoading(false);
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await cartApi.get();
      setCartItems(res.data.items || []);
      setCartCount(res.data.itemCount || 0);
    } catch (err) {
      console.log('Cart fetch failed (not logged in?)');
    }
  }, []);

  const addToCart = async (product) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }
    try {
      const res = await cartApi.addItem(product.id || product.productId, 1);
      setCartItems(res.data.items || []);
      setCartCount(res.data.itemCount || 0);
    } catch (err) {
      alert(err.response?.data?.error || 'Thêm vào giỏ hàng thất bại');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await cartApi.removeItem(itemId);
      setCartItems(res.data.items || []);
      setCartCount(res.data.itemCount || 0);
    } catch (err) {
      console.error('Remove failed', err);
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      const res = await cartApi.updateItem(itemId, quantity);
      setCartItems(res.data.items || []);
      setCartCount(res.data.itemCount || 0);
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleLogin = (loginData) => {
    localStorage.setItem('token', loginData.token);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    setUser(loginData.user);
    fetchCart();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartItems([]);
    setCartCount(0);
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* Admin routes – no Header/Footer */}
        <Route path="/admin" element={<AdminLayout user={user}><Navigate to="/admin/dashboard" replace /></AdminLayout>} />
        <Route path="/admin/dashboard" element={<AdminLayout user={user}><DashboardPage /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout user={user}><ProductsAdminPage /></AdminLayout>} />
        <Route path="/admin/products/new" element={<AdminLayout user={user}><ProductFormPage /></AdminLayout>} />
        <Route path="/admin/products/:id/edit" element={<AdminLayout user={user}><ProductFormPage /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout user={user}><CategoriesAdminPage /></AdminLayout>} />
        <Route path="/admin/inventory" element={<AdminLayout user={user}><InventoryAdminPage /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout user={user}><OrdersAdminPage /></AdminLayout>} />
        <Route path="/admin/promo-codes" element={<AdminLayout user={user}><PromoCodesAdminPage /></AdminLayout>} />
        <Route path="/admin/voucher-templates" element={<AdminLayout user={user}><VoucherTemplatesAdminPage /></AdminLayout>} />
        <Route path="/admin/customer-care" element={<AdminLayout user={user}><CustomerCareAdminPage /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout user={user}><UsersAdminPage /></AdminLayout>} />

        {/* Public/Customer routes */}
        <Route path="/*" element={
          <div className="flex flex-col min-h-screen">
            <Header cartCount={cartCount} user={user} onLogout={handleLogout} />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage addToCart={addToCart} user={user} />} />
                <Route path="/products" element={<ProductsPage addToCart={addToCart} />} />
                <Route path="/products/:id" element={<ProductDetailPage addToCart={addToCart} user={user} />} />
                <Route path="/cart" element={
                  <CartPage
                    cartItems={cartItems}
                    removeFromCart={removeFromCart}
                    updateCartQuantity={updateCartQuantity}
                    user={user}
                  />
                } />
                <Route path="/checkout" element={<CheckoutPage cartItems={cartItems} user={user} onOrderPlaced={fetchCart} />} />
                <Route path="/order-confirmation/:id" element={<OrderConfirmationPage user={user} />} />
                <Route path="/orders" element={user ? <OrderHistoryPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/order-lookup" element={<OrderLookupPage />} />
                <Route path="/order-tracking/:id" element={user ? <OrderTrackingPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/momo-return" element={<MomoReturnPage />} />
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} />
                <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage onLogin={handleLogin} />} />
                <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPasswordPage />} />
                <Route path="/reset-password" element={user ? <Navigate to="/" /> : <ResetPasswordPage />} />
                <Route path="/wishlist" element={user ? <WishlistPage user={user} addToCart={addToCart} /> : <Navigate to="/login" />} />
                <Route path="/profile" element={user ? <ProfilePage user={user} onUserUpdate={setUser} /> : <Navigate to="/login" />} />
                <Route path="/my-vouchers" element={user ? <MyVoucherPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/faq" element={<FAQPage />} />
              </Routes>
            </main>
            <Footer />
            <Chatbot />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
