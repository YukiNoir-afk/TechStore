import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { formatPrice } from '../utils/formatPrice';

const CartPage = ({ cartItems, removeFromCart, updateCartQuantity, user }) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const shipping = subtotal > 500000 ? 0 : subtotal > 0 ? 30000 : 0;
  const total = subtotal + tax + shipping;

  if (!cartItems.length) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold font-heading text-text-primary mb-4">Giỏ hàng của bạn trống</h1>
            <p className="text-text-secondary text-lg mb-8">Có vẻ bạn chưa thêm sản phẩm nào vào giỏ.</p>
            <Link to="/products"><Button size="lg" variant="primary">Mua sắm ngay</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold font-heading text-text-primary mb-8">Giỏ hàng ({cartItems.length})</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4 hover:shadow-lg transition-shadow">
                <Link to={`/products/${item.productId}`}>
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                </Link>
                <div className="flex-grow">
                  <Link to={`/products/${item.productId}`} className="font-bold text-text-primary hover:text-primary-600 transition-colors">{item.name}</Link>
                  <p className="text-sm text-text-secondary mb-3">{item.category}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border-2 border-primary-200 rounded-lg">
                      <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-text-primary hover:bg-primary-50 transition-colors">−</button>
                      <span className="px-3 font-semibold border-l-2 border-r-2 border-primary-200">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-text-primary hover:bg-primary-50 transition-colors">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-accent hover:text-red-700 text-sm font-bold transition-colors">Xóa</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-text-secondary">{formatPrice(item.price)} / sản phẩm</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold font-heading text-text-primary mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-text-secondary">Tạm tính</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Thuế (10%)</span><span className="font-semibold">{formatPrice(tax)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Vận chuyển</span><span className="font-semibold">{shipping === 0 ? <span className="text-success">MIỄN PHÍ</span> : formatPrice(shipping)}</span></div>
              </div>
              <div className="border-t-2 border-primary-100 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold"><span>Tổng</span><span className="text-primary-600">{formatPrice(total)}</span></div>
              </div>
              {user ? (
                <Link to="/checkout"><Button size="lg" fullWidth variant="primary">Tiến hành thanh toán</Button></Link>
              ) : (
                <Link to="/login"><Button size="lg" fullWidth variant="primary">Đăng nhập để thanh toán</Button></Link>
              )}
              <Link to="/products" className="block text-center mt-4 text-primary-600 font-medium hover:text-primary-700 transition-colors">← Tiếp tục mua sắm</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
