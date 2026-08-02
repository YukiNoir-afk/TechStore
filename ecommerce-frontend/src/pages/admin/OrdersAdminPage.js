import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const statusColor = (s) => {
  const map = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-purple-100 text-purple-800',
    Delivered: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    'Chờ xử lý': 'bg-yellow-100 text-yellow-800',
    'Đang xử lý': 'bg-blue-100 text-blue-800',
    'Đang vận chuyển': 'bg-purple-100 text-purple-800',
    'Đang giao': 'bg-purple-100 text-purple-800',
    'Đã giao': 'bg-green-100 text-green-800',
    'Đã hoàn thành': 'bg-green-100 text-green-800',
    'Đã hủy': 'bg-red-100 text-red-800',
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const STATUS_OPTIONS = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Shipped', label: 'Đã giao' },
  { value: 'Delivered', label: 'Đã hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

const translateStatus = (status) => {
  switch (status) {
    case 'Pending': return 'Chờ xử lý';
    case 'Processing': return 'Đang xử lý';
    case 'Shipped': return 'Đã giao';
    case 'Delivered': return 'Đã hoàn thành';
    case 'Cancelled': return 'Đã hủy';
    default: return status;
  }
};

const translatePaymentStatus = (status) => {
  if (status === 'Paid') return 'Đã thanh toán';
  if (status === 'Pending') return 'Chưa thanh toán';
  return status;
};

const translatePaymentMethod = (method) => {
  switch (method) {
    case 'credit': return 'Thẻ tín dụng';
    case 'cod': return 'Thanh toán khi nhận hàng';
    case 'momo_qr': return 'MoMo QR';
    case 'momo_atm': return 'MoMo ATM';
    case 'vnpay': return 'Ngân hàng (VNPay)';
    default: return method;
  }
};

const translateShippingMethod = (method) => {
  switch (method) {
    case 'express': return 'Giao hàng nhanh (2-3 ngày)';
    case 'overnight': return 'Giao hàng hỏa tốc (1 ngày)';
    case 'standard': return 'Giao hàng tiêu chuẩn (5-7 ngày)';
    default: return method;
  }
};

// ── Order Detail Modal ─────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', animation: 'adminFadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'adminSlideUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
          <div>
            <h2 className="text-xl font-bold text-white">Chi tiết đơn hàng</h2>
            <p className="text-blue-100 text-sm font-mono">#{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(order.status)}`}>
              {translateStatus(order.status)}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Customer & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-xs">👤</span>
                Thông tin khách hàng
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tên</span>
                  <span className="font-medium text-gray-800">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800">{order.customerEmail || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SĐT</span>
                  <span className="font-medium text-gray-800">{order.customerPhone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-green-100 text-green-600 flex items-center justify-center text-xs">💳</span>
                Thanh toán
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức</span>
                  <span className="font-medium text-gray-800">{translatePaymentMethod(order.paymentMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    order.paymentStatus === 'Paid' || order.paymentStatus === 'Đã thanh toán'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {translatePaymentStatus(order.paymentStatus)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày đặt</span>
                  <span className="font-medium text-gray-800">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center text-xs">🚚</span>
              Thông tin giao hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Người nhận</span>
                  <span className="font-medium text-gray-800">{order.shippingName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức</span>
                  <span className="font-medium text-gray-800">{translateShippingMethod(order.shippingMethod)}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã vận đơn</span>
                    <span className="font-mono font-bold text-blue-600">{order.trackingNumber}</span>
                  </div>
                )}
                {order.carrier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đơn vị vận chuyển</span>
                    <span className="font-medium text-gray-800">{order.carrier}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-xs block mb-1">Địa chỉ</span>
                  <p className="font-medium text-gray-800 text-sm">
                    {[order.shippingAddress, order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry]
                      .filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                {order.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dự kiến giao</span>
                    <span className="font-medium text-gray-800">{new Date(order.estimatedDelivery).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-xs">📦</span>
              Sản phẩm ({order.items?.length || 0})
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Sản phẩm</th>
                    <th className="text-center px-4 py-2.5 font-medium">SL</th>
                    <th className="text-right px-4 py-2.5 font-medium">Đơn giá</th>
                    <th className="text-right px-4 py-2.5 font-medium">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">📷</div>
                          )}
                          <span className="font-medium text-gray-800 line-clamp-2">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 font-medium">×{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-xs">💰</span>
              Chi tiết thanh toán
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span className="text-gray-700">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Thuế VAT (10%)</span>
                <span className="text-gray-700">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span className="text-gray-700">{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 flex justify-between">
                <span className="font-bold text-gray-800">Tổng cộng</span>
                <span className="font-bold text-xl text-blue-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">📋</span>
                Lịch sử trạng thái
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="relative">
                  {order.statusHistory.map((event, idx) => (
                    <div key={idx} className="flex gap-4 pb-4 last:pb-0">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                        {idx < order.statusHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 -mt-0.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(event.status)}`}>
                            {translateStatus(event.status)}
                          </span>
                          {event.location && (
                            <span className="text-xs text-gray-400">📍 {event.location}</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-0.5">{event.description}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(event.createdAt).toLocaleDateString('vi-VN')} {new Date(event.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────
const OrdersAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [updating, setUpdating] = useState(null);

  // Phone lookup state
  const [phoneSearch, setPhoneSearch] = useState('');
  const [phoneResult, setPhoneResult] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showPhonePanel, setShowPhonePanel] = useState(false);

  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = (status) => {
    setLoading(true);
    adminApi.getOrders(status === 'All' ? null : status)
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(filterStatus); }, [filterStatus]);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const result = await adminApi.updateOrderStatus(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      const customerEmail = result.data?.customerEmail || '';
      showToast(`✅ Cập nhật trạng thái thành công! Email thông báo đã được gửi${customerEmail ? ` đến ${customerEmail}` : ''}.`);
    } catch (e) {
      showToast('Cập nhật thất bại', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewDetail = async (orderId) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.getOrderDetail(orderId);
      setSelectedOrder(res.data);
    } catch (e) {
      showToast('Không thể tải chi tiết đơn hàng', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePhoneSearch = async (e) => {
    e.preventDefault();
    if (!phoneSearch.trim()) {
      setPhoneError('Vui lòng nhập số điện thoại');
      return;
    }
    setPhoneLoading(true);
    setPhoneError('');
    setPhoneResult(null);
    try {
      const res = await adminApi.getOrdersByPhone(phoneSearch.trim());
      setPhoneResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setPhoneError('Không tìm thấy khách hàng với số điện thoại này');
      } else {
        setPhoneError(err.response?.data?.error || 'Đã xảy ra lỗi');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const clearPhoneSearch = () => {
    setPhoneSearch('');
    setPhoneResult(null);
    setPhoneError('');
    setShowPhonePanel(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 max-w-md px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
        }`} style={{ animation: 'adminSlideIn 0.3s ease-out' }}>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">{toast.type === 'error' ? '❌' : '📧'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Detail Loading Overlay */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700 font-medium">Đang tải chi tiết đơn hàng...</span>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />

      {/* Phone Lookup Toggle */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowPhonePanel(!showPhonePanel)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-800">🔍 Tra cứu đơn hàng theo số điện thoại</h3>
              <p className="text-xs text-gray-500">Tìm kiếm lịch sử mua hàng của khách hàng bằng số điện thoại</p>
            </div>
          </div>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${showPhonePanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPhonePanel && (
          <div className="px-6 pb-5 border-t border-gray-100 bg-gray-50/50">
            <form onSubmit={handlePhoneSearch} className="flex gap-3 mt-4">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="admin-phone-search"
                  type="tel"
                  value={phoneSearch}
                  onChange={(e) => { setPhoneSearch(e.target.value); setPhoneError(''); }}
                  placeholder="Nhập số điện thoại khách hàng..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={phoneLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {phoneLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Tìm kiếm
              </button>
              {(phoneResult || phoneError) && (
                <button
                  type="button"
                  onClick={clearPhoneSearch}
                  className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Xóa
                </button>
              )}
            </form>

            {phoneError && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {phoneError}
              </div>
            )}

            {phoneResult && (
              <div className="mt-4 space-y-4">
                {/* Customer Info */}
                <div className="bg-white rounded-lg border border-blue-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {phoneResult.customerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{phoneResult.customerName}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>📞 {phoneResult.phone}</span>
                        <span>✉️ {phoneResult.customerEmail}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{phoneResult.orders?.length || 0}</div>
                      <div className="text-xs text-gray-500">Đơn hàng</div>
                    </div>
                  </div>
                </div>

                {/* Order Results Table */}
                {phoneResult.orders?.length > 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                      <h4 className="font-semibold text-blue-800 text-sm">
                        Lịch sử đơn hàng ({phoneResult.orders.length} đơn)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="text-left px-4 py-2 font-medium">ID</th>
                            <th className="text-left px-4 py-2 font-medium">SP</th>
                            <th className="text-left px-4 py-2 font-medium">Tổng tiền</th>
                            <th className="text-left px-4 py-2 font-medium">Thanh toán</th>
                            <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
                            <th className="text-left px-4 py-2 font-medium">Ngày</th>
                            <th className="text-left px-4 py-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {phoneResult.orders.map(order => (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-gray-700 text-xs">#{order.id}</td>
                              <td className="px-4 py-3 text-gray-600">{order.itemCount} sp</td>
                              <td className="px-4 py-3 font-bold text-gray-800">{formatPrice(order.total)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  order.paymentStatus === 'Paid' || order.paymentStatus === 'Đã thanh toán'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {translatePaymentStatus(order.paymentStatus)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                                  {translateStatus(order.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500 text-xs">
                                {new Date(order.date).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleViewDetail(order.id)}
                                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  Chi tiết
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>Khách hàng này chưa có đơn hàng nào</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-xl shadow-sm p-1 flex space-x-1 overflow-x-auto">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterStatus === s.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">
            Danh sách đơn hàng
            <span className="ml-2 text-sm font-normal text-gray-500">({orders.length} đơn)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p>Không có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">ID</th>
                  <th className="text-left px-6 py-3 font-medium">Khách hàng</th>
                  <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
                  <th className="text-left px-6 py-3 font-medium">Tổng tiền</th>
                  <th className="text-left px-6 py-3 font-medium">Thanh toán</th>
                  <th className="text-left px-6 py-3 font-medium">Trạng thái</th>
                  <th className="text-left px-6 py-3 font-medium">Ngày</th>
                  <th className="text-left px-6 py-3 font-medium">Cập nhật</th>
                  <th className="text-left px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-700">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{order.customerName}</div>
                      <div className="text-gray-400 text-xs">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{order.itemCount} sản phẩm</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{formatPrice(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {translatePaymentStatus(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(order.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        disabled={updating === order.id || order.status === 'Delivered' || order.status === 'Cancelled'}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Chờ xử lý</option>
                        <option value="Processing">Đang xử lý</option>
                        <option value="Shipped">Đã giao</option>
                        <option value="Delivered">Đã hoàn thành</option>
                        <option value="Cancelled">Đã hủy</option>
                      </select>
                      {updating === order.id && (
                        <span className="ml-2 text-xs text-blue-500">Đang lưu...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center gap-1.5"
                        title="Xem chi tiết đơn hàng"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        @keyframes adminSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes adminFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes adminSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OrdersAdminPage;
