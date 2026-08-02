import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

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
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', animation: 'dashFadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ animation: 'dashSlideUp 0.3s ease-out' }}
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

// ── Main Dashboard ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const [range, setRange] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDateValue = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const loadDashboard = async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (selectedRange = range, selectedPayment = paymentMethod, selectedFrom = fromDate, selectedTo = toDate) => {
    setReportLoading(true);
    setReportError(null);

    const params = {};

    if (selectedRange === 'custom') {
      if (selectedFrom) params.from = `${selectedFrom}T00:00:00Z`;
      if (selectedTo) params.to = `${selectedTo}T23:59:59Z`;
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - Number(selectedRange));
      params.from = `${formatDateValue(start)}T00:00:00Z`;
      params.to = `${formatDateValue(end)}T23:59:59Z`;
    }

    if (selectedPayment) params.paymentMethod = selectedPayment;

    try {
      const res = await adminApi.getRevenueReport(params);
      setReport(res.data);
    } catch (err) {
      setReportError(err.response?.data?.error || 'Không thể tải báo cáo doanh thu');
    } finally {
      setReportLoading(false);
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

  useEffect(() => {
    loadDashboard();
    loadReport();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    loadReport(range, paymentMethod, fromDate, toDate);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500">Đang tải...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
  );

  const maxDailyRevenue = Math.max(1, ...(report?.dailyBreakdown || []).map((item) => Number(item.revenue) || 0));

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 max-w-md px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
        }`} style={{ animation: 'dashSlideIn 0.3s ease-out' }}>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">{toast.type === 'error' ? '❌' : '✅'}</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Tổng doanh thu" icon="💰" color="border-green-500"
          value={formatPrice(stats.totalRevenue)}
          sub="Tất cả đơn hàng"
        />
        <StatCard
          label="Tổng đơn hàng" icon="📦" color="border-blue-500"
          value={stats.totalOrders}
          sub={`${stats.processingOrders} đang xử lý`}
        />
        <StatCard
          label="Sản phẩm" icon="🏷️" color="border-purple-500"
          value={stats.totalProducts}
          sub="Đang hiển thị"
        />
        <StatCard
          label="Người dùng" icon="👥" color="border-orange-500"
          value={stats.totalUsers}
          sub="Đã đăng ký"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Chờ xử lý', val: stats.pendingOrders, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: 'Đang xử lý', val: stats.processingOrders, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Đã giao', val: stats.shippedOrders, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Hoàn thành', val: stats.deliveredOrders, color: 'bg-green-50 text-green-700 border-green-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-lg border p-4 text-center ${item.color}`}>
            <div className="text-2xl font-bold">{item.val}</div>
            <div className="text-sm font-medium mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="font-bold text-gray-800">Thống kê doanh thu</h2>
            <p className="text-sm text-gray-500 mt-1">Lọc theo khoảng thời gian và hình thức thanh toán.</p>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full md:w-auto">
            <select value={range} onChange={(e) => setRange(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="7">7 ngày gần đây</option>
              <option value="30">30 ngày gần đây</option>
              <option value="90">90 ngày gần đây</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Tất cả hình thức</option>
              <option value="credit">Thẻ tín dụng</option>
              <option value="vnpay">Ngân hàng (VNPay)</option>
              <option value="paypal">PayPal</option>
              <option value="cod">COD</option>
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="md:col-span-4 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
              Áp dụng
            </button>
          </form>
        </div>

        {reportError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{reportError}</div>
        )}

        {reportLoading ? (
          <div className="mt-6 flex items-center justify-center h-32 text-sm text-gray-500">Đang tải báo cáo...</div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                <p className="text-sm text-green-700">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{formatPrice(report?.totalRevenue || 0)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                <p className="text-sm text-blue-700">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{report?.totalOrders || 0}</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
                <p className="text-sm text-purple-700">Giá trị đơn trung bình</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">{formatPrice(report?.averageOrderValue || 0)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Doanh thu theo ngày</h3>
                <div className="space-y-3">
                  {(report?.dailyBreakdown || []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có dữ liệu trong khoảng thời gian này.</p>
                  ) : report.dailyBreakdown.map((item) => (
                    <div key={item.date} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-500">{item.date}</div>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max(8, (item.revenue / maxDailyRevenue) * 100)}%` }} />
                      </div>
                      <div className="w-24 text-right text-sm font-medium text-gray-700">{formatPrice(item.revenue)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-4">Theo hình thức thanh toán</h3>
                <div className="space-y-3">
                  {(report?.byPaymentMethod || []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có dữ liệu cho hình thức thanh toán này.</p>
                  ) : report.byPaymentMethod.map((item) => (
                    <div key={item.paymentMethod} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.paymentMethod}</p>
                        <p className="text-xs text-gray-500">{item.orderCount} đơn hàng</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{formatPrice(item.revenue)}</p>
                        <p className="text-xs text-gray-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Orders List after Filter ────────────────────────────────── */}
            {(report?.orders || []).length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📋</span>
                    <h3 className="font-bold text-gray-800">Danh sách đơn hàng</h3>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {report.orders.length} đơn
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium">ID</th>
                        <th className="text-left px-5 py-3 font-medium">Khách hàng</th>
                        <th className="text-left px-5 py-3 font-medium">SP</th>
                        <th className="text-left px-5 py-3 font-medium">Tổng tiền</th>
                        <th className="text-left px-5 py-3 font-medium">Thanh toán</th>
                        <th className="text-left px-5 py-3 font-medium">Trạng thái</th>
                        <th className="text-left px-5 py-3 font-medium">Ngày</th>
                        <th className="text-left px-5 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.orders.map(order => (
                        <tr key={order.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-gray-700 text-xs">#{order.id}</td>
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-800 text-sm">{order.customerName}</div>
                            <div className="text-gray-400 text-xs">{order.customerEmail}</div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{order.itemCount} sp</td>
                          <td className="px-5 py-3 font-bold text-gray-800">{formatPrice(order.total)}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'Paid' || order.paymentStatus === 'Đã thanh toán'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {translatePaymentStatus(order.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                              {translateStatus(order.status)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {new Date(order.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-5 py-3">
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
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Đơn hàng gần đây</h2>
            <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline">Xem tất cả →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Khách hàng</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tổng tiền</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Trạng thái</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-gray-600">#{order.id}</td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-gray-800">{order.customerName}</div>
                      <div className="text-gray-400 text-xs">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-800">{formatPrice(order.total)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
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
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Top sản phẩm</h2>
            <Link to="/admin/products" className="text-blue-600 text-sm hover:underline">Xem tất cả →</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.topProducts.map((p, i) => (
              <div key={p.id} className="px-6 py-4 flex items-center space-x-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                {p.image && (
                  <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm truncate">{p.name}</div>
                  <div className="text-gray-400 text-xs">{p.totalSold} đã bán · {formatPrice(p.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dashSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes dashFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dashSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
