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

  const fetchOrders = (status) => {
    setLoading(true);
    adminApi.getOrders(status === 'All' ? null : status)
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(filterStatus); }, [filterStatus]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      alert('Cập nhật thất bại');
    } finally {
      setUpdating(null);
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersAdminPage;
