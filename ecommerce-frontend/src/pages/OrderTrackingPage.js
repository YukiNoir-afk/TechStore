import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import { ordersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const getShippingMethodLabel = (method) => {
    switch (method) {
      case 'standard': return 'Tiêu chuẩn';
      case 'express': return 'Nhanh';
      case 'overnight': return 'Giao nhanh';
      default: return method;
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'Shipped': return 'Đã gửi hàng';
      case 'Delivered': return 'Đã giao';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const translateTrackingEventStatus = (status) => {
    switch (status) {
      case 'Order Received': return 'Đơn hàng đã nhận';
      case 'Processing': return 'Đang xử lý';
      case 'Shipped': return 'Đã gửi hàng';
      case 'In Transit': return 'Đang vận chuyển';
      case 'Delivered': return 'Đã giao';
      case 'Cancelled': return 'Đã hủy';
      default: return translateStatus(status);
    }
  };

  const translateTrackingEventDescription = (description) => {
    if (!description) return description;
    let text = description.trim();

    text = text.replace(/Order received and confirmed/gi, 'Đơn hàng đã được tiếp nhận và xác nhận');
    text = text.replace(/Payment verified/gi, 'Thanh toán đã được xác nhận');
    text = text.replace(/Package being prepared for shipment/gi, 'Gói hàng đang được chuẩn bị để giao');
    text = text.replace(/Package being prepared/gi, 'Gói hàng đang được chuẩn bị');
    text = text.replace(/Package shipped from warehouse/gi, 'Gói hàng đã được gửi đi từ kho');
    text = text.replace(/Package shipped/gi, 'Gói hàng đã được gửi đi');
    text = text.replace(/Package arrived at sorting facility/gi, 'Gói hàng đã đến trung tâm phân loại');
    text = text.replace(/Package in transit/gi, 'Gói hàng đang trên đường vận chuyển');
    text = text.replace(/Package delivered to recipient/gi, 'Gói hàng đã được giao đến người nhận');

    return text;
  };

  const canCancel = (status) => {
    const s = status?.toLowerCase();
    return s !== 'shipped' && s !== 'delivered' && s !== 'cancelled';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.')) return;

    setCancelling(true);
    try {
      await ordersApi.cancel(id);
      showToast('Đã hủy đơn hàng thành công');
      setTimeout(() => navigate('/orders'), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!order) return <div className="text-center py-20 text-text-secondary">Không tìm thấy đơn hàng</div>;

  return (
    <div className="bg-background min-h-screen py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`} style={{ animation: 'slideIn 0.3s ease-out' }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/orders" className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-block">← Quay về đơn hàng</Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-bold font-heading text-text-primary">Đơn hàng #{order.id}</h1>
            <Badge variant={
              order.status === 'Cancelled' ? 'danger' :
              order.status === 'Delivered' ? 'success' : 'info'
            } size="md">
              {translateStatus(order.status)}
            </Badge>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><p className="text-sm text-text-secondary mb-2">Ngày đặt hàng</p><p className="text-lg font-semibold text-text-primary">{new Date(order.date).toLocaleDateString()}</p></div>
            <div><p className="text-sm text-text-secondary mb-2">Tổng</p><p className="text-lg font-semibold text-primary-600">{formatPrice(order.total)}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Tracking */}
            {order.tracking && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold font-heading text-text-primary mb-6">Theo dõi vận chuyển</h2>
                <div className="mb-6">
                  <p className="text-sm text-text-secondary mb-1">Đơn vị vận chuyển & mã theo dõi</p>
                  <p className="text-lg font-semibold text-text-primary">{order.tracking.carrier} - <span className="font-mono">{order.tracking.number}</span></p>
                </div>
                <div className="space-y-6">
                  {order.tracking.events?.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-primary-200'}`}></div>
                        {index < order.tracking.events.length - 1 && <div className="w-1 h-16 bg-primary-200 mt-2"></div>}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-text-secondary">{new Date(event.date).toLocaleString()}</p>
                        <p className="font-bold text-text-primary mt-1">{translateTrackingEventStatus(event.status)}</p>
                        <p className="text-text-secondary text-sm mt-1">{event.location}</p>
                        <p className="text-text-secondary text-sm mt-1">{translateTrackingEventDescription(event.description)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold font-heading text-text-primary mb-6">Sản phẩm trong đơn</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-primary-100 last:border-0">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-grow">
                      <p className="font-semibold text-text-primary">{item.name}</p>
                      <p className="text-sm text-text-secondary">Số lượng: {item.quantity}</p>
                    </div>
                    <div className="text-right"><p className="font-bold text-primary-600">{formatPrice(item.price)}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Địa chỉ giao hàng</h3>
              <p className="font-semibold text-text-primary mb-2">{order.shipping.name}</p>
              <p className="text-text-secondary text-sm mb-4">{order.shipping.address}</p>
              <div className="space-y-2 text-sm text-text-secondary border-t border-primary-100 pt-4">
                {order.shipping.phone && <p><span className="text-text-primary font-medium">Điện thoại:</span> {order.shipping.phone}</p>}
                {order.shipping.email && <p><span className="text-text-primary font-medium">Địa chỉ email:</span> {order.shipping.email}</p>}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Phương thức giao hàng</h3>
              <p className="text-text-primary">{getShippingMethodLabel(order.shipping.method)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Tổng đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Thuế</span><span>{formatPrice(order.tax)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Vận chuyển</span><span>{formatPrice(order.shippingCost)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Tổng</span><span className="text-primary-600">{formatPrice(order.total)}</span></div>
              </div>
            </div>

            {/* Cancel Order Button */}
            {canCancel(order.status) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-orange-700">
                    ⚠️ Bạn có thể hủy đơn hàng này vì đơn chưa được giao. Sau khi hủy, số lượng sản phẩm sẽ được hoàn lại kho.
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang hủy đơn...
                    </>
                  ) : (
                    <>✕ Hủy đơn hàng</>
                  )}
                </button>
              </div>
            )}

            {/* Cancelled notice */}
            {order.status === 'Cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium">❌ Đơn hàng này đã bị hủy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrderTrackingPage;
