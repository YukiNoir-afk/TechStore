import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { ordersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const OrderConfirmationPage = ({ user }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await ordersApi.getById(id);
        setOrder(res.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-4xl font-bold font-heading text-text-primary mb-4">Đơn hàng đã được xác nhận!</h1>
          <p className="text-text-secondary text-lg mb-6">Cảm ơn bạn đã mua hàng. Đơn của bạn đã được đặt thành công.</p>

          {order && (
            <>
              <div className="bg-primary-50 rounded-lg p-6 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-text-secondary">Mã đơn</p><p className="text-lg font-bold text-primary-600 font-mono">#{order.id}</p></div>
                  <div><p className="text-text-secondary">Ngày đặt hàng</p><p className="font-semibold">{new Date(order.date).toLocaleDateString()}</p></div>
                  <div><p className="text-text-secondary">Trạng thái</p><p className="font-semibold text-success">{order.status}</p></div>
                  <div><p className="text-text-secondary">Tổng</p><p className="text-lg font-bold text-primary-600">{formatPrice(order.total)}</p></div>
                </div>
                <div className="mt-6 pt-4 border-t border-primary-200">
                  <h3 className="font-bold mb-3">Sản phẩm đã đặt</h3>
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between py-2">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Notification Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-8 text-left" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">✉️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 text-base mb-1">📧 Email xác nhận đã được gửi!</h3>
                    <p className="text-blue-700 text-sm leading-relaxed">
                      Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email đăng ký của bạn.
                      Email bao gồm chi tiết đơn hàng, thông tin giao hàng và mã theo dõi.
                    </p>
                    <p className="text-blue-500 text-xs mt-2">
                      💡 Nếu không nhận được email, vui lòng kiểm tra thư mục Spam hoặc liên hệ hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Link to={`/order-tracking/${id}`}><Button size="lg" variant="primary">Theo dõi đơn hàng</Button></Link>
                <Link to="/orders"><Button size="lg" variant="outline">Xem tất cả đơn hàng</Button></Link>
              </>
            ) : (
              <Link to="/order-lookup"><Button size="lg" variant="primary">Tra cứu đơn hàng</Button></Link>
            )}
            <Link to="/products"><Button size="lg" variant="secondary">Tiếp tục mua sắm</Button></Link>
          </div>
        </div>
        <style>{`
          @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
