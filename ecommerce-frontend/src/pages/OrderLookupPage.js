import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { ordersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const OrderLookupPage = () => {
  // Tab: 'phone' or 'order'
  const [activeTab, setActiveTab] = useState('phone');

  // Phone lookup state
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const resultRef = useRef(null);

  // Order ID + Phone lookup state
  const [orderPhone, setOrderPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSearched, setOrderSearched] = useState(false);
  const orderResultRef = useRef(null);

  // ─── Phone Lookup ────────────────────────────────────────────────────
  const handlePhoneSearch = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    setExpandedOrder(null);

    try {
      const res = await ordersApi.lookupByPhone(phone.trim());
      setResult(res.data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Không tìm thấy khách hàng với số điện thoại này. Vui lòng kiểm tra lại.');
      } else {
        setError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Order ID + Phone Lookup ─────────────────────────────────────────
  const handleOrderSearch = async (e) => {
    e.preventDefault();
    if (!orderPhone.trim() || !orderId.trim()) {
      setOrderError('Vui lòng nhập cả mã đơn hàng và số điện thoại');
      return;
    }

    setOrderLoading(true);
    setOrderError('');
    setOrderResult(null);
    setOrderSearched(true);

    try {
      const res = await ordersApi.lookup(orderPhone.trim(), orderId.trim());
      setOrderResult(res.data);
      setTimeout(() => {
        orderResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (err.response?.status === 404) {
        setOrderError('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.');
      } else {
        setOrderError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } finally {
      setOrderLoading(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────
  const statusColors = {
    pending: 'warning', processing: 'info', shipped: 'info',
    delivered: 'success', cancelled: 'danger',
    'chờ xử lý': 'warning', 'đang xử lý': 'info', 'đang vận chuyển': 'info',
    'đã giao': 'success', 'đã hủy': 'danger', 'đã hoàn thành': 'success',
  };

  const translateStatus = (status) => {
    const map = {
      'Pending': 'Chờ xử lý', 'Processing': 'Đang xử lý',
      'Shipped': 'Đang giao', 'Delivered': 'Đã hoàn thành',
      'Cancelled': 'Đã hủy',
    };
    return map[status] || status;
  };

  const getShippingMethodLabel = (method) => {
    switch (method) {
      case 'standard': return 'Tiêu chuẩn (5-7 ngày)';
      case 'express': return 'Nhanh (2-3 ngày)';
      case 'overnight': return 'Giao nhanh qua đêm';
      default: return method;
    }
  };

  const translateTrackingEventStatus = (status) => {
    const map = {
      'Order Received': 'Đơn hàng đã nhận',
      'Processing': 'Đang xử lý',
      'Shipped': 'Đã gửi hàng',
      'In Transit': 'Đang vận chuyển',
      'Delivered': 'Đã giao',
      'Cancelled': 'Đã hủy',
    };
    return map[status] || translateStatus(status);
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

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 mb-6 animate-bounce-slow">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Tra cứu đơn hàng
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Tra cứu đơn hàng mà không cần đăng nhập
        </p>
      </div>

      {/* Tab Selector */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex bg-white/60 backdrop-blur-xl rounded-xl p-1.5 shadow-md border border-white/60">
          <button
            id="tab-phone-lookup"
            onClick={() => switchTab('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'phone'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-300/40'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Tra cứu theo SĐT
          </button>
          <button
            id="tab-order-lookup"
            onClick={() => switchTab('order')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
              activeTab === 'order'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-300/40'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tra cứu theo Mã đơn
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: Phone Lookup
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'phone' && (
        <>
          {/* Search Card */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-100/50 border border-white/60 p-8">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
              <form onSubmit={handlePhoneSearch} className="relative flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    id="phone-search-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    placeholder="Nhập số điện thoại (VD: 0912345678)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg transition-all duration-300 bg-white/80 placeholder-gray-400"
                  />
                </div>
                <button
                  id="phone-search-button"
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-300/50 hover:shadow-blue-400/60 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Tra cứu
                    </>
                  )}
                </button>
              </form>

              {/* Error message */}
              {error && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fadeIn">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div ref={resultRef} className="max-w-4xl mx-auto animate-fadeInUp">
              {/* Customer Summary */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {result.customerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{result.customerName}</h2>
                      <p className="text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {result.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {result.totalOrders}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Đơn hàng</div>
                    </div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        {formatPrice(result.totalSpent)}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Tổng chi tiêu</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Danh sách đơn hàng ({result.orders?.length || 0})
                </h3>

                {result.orders?.length > 0 ? (
                  result.orders.map((order, index) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Order Header */}
                      <div
                        className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                              <div>
                                <span className="text-xs text-gray-400 font-medium">Mã đơn</span>
                                <p className="text-lg font-bold text-blue-600 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                              </div>
                              <div className="hidden sm:block text-gray-300">|</div>
                              <div>
                                <span className="text-xs text-gray-400 font-medium">Ngày đặt</span>
                                <p className="text-base font-semibold text-gray-700">
                                  {new Date(order.date).toLocaleDateString('vi-VN', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="hidden sm:block text-gray-300">|</div>
                              <div>
                                <span className="text-xs text-gray-400 font-medium">Sản phẩm</span>
                                <p className="text-base font-semibold text-gray-700">{order.itemCount} sản phẩm</p>
                              </div>
                            </div>
                            {order.trackingNumber && (
                              <p className="text-xs text-gray-400">
                                Tracking: <span className="font-mono font-semibold text-gray-600">{order.trackingNumber}</span>
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant={statusColors[order.status.toLowerCase()] || 'info'} size="md">
                                {translateStatus(order.status)}
                              </Badge>
                              <p className="text-xl font-bold text-gray-800 mt-1">{formatPrice(order.total)}</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${expandedOrder === order.id ? 'rotate-180' : ''}`}>
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Items */}
                      {expandedOrder === order.id && order.items && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 animate-fadeIn">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chi tiết sản phẩm</p>
                          <div className="space-y-3">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-4 bg-white rounded-lg p-3 shadow-sm">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100" />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-grow min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                                  <p className="text-xs text-gray-400">Số lượng: {item.quantity}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-gray-400">{formatPrice(item.price)} / sp</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tip to use Order ID lookup for more details */}
                          <div className="mt-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-blue-700">
                              Muốn xem chi tiết theo dõi vận chuyển? Chuyển sang tab{' '}
                              <button
                                onClick={(e) => { e.stopPropagation(); switchTab('order'); setOrderId(order.id); setOrderPhone(phone); }}
                                className="font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                              >
                                "Tra cứu theo Mã đơn"
                              </button>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h3>
                    <p className="text-gray-400">Khách hàng này chưa thực hiện đơn hàng nào</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state when nothing searched yet */}
          {!searched && !result && (
            <div className="max-w-md mx-auto text-center py-8">
              <div className="text-7xl mb-4 opacity-30">🔍</div>
              <p className="text-gray-400 text-lg">Nhập số điện thoại để bắt đầu tra cứu</p>
            </div>
          )}

          {/* No result after search */}
          {searched && !result && !loading && !error && (
            <div className="max-w-md mx-auto text-center py-8">
              <div className="text-7xl mb-4 opacity-30">📭</div>
              <p className="text-gray-400 text-lg">Không tìm thấy kết quả</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: Order ID + Phone Lookup
         ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'order' && (
        <>
          {/* Search Card */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-100/50 border border-white/60 p-8">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
              <form onSubmit={handleOrderSearch} className="relative space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                  <input
                    id="order-id-input"
                    type="text"
                    value={orderId}
                    onChange={(e) => { setOrderId(e.target.value); setOrderError(''); }}
                    placeholder="Nhập mã đơn hàng (VD: ORD-20250807-ABCD1234)"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg transition-all duration-300 bg-white/80 placeholder-gray-400"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      id="order-phone-input"
                      type="tel"
                      value={orderPhone}
                      onChange={(e) => { setOrderPhone(e.target.value); setOrderError(''); }}
                      placeholder="Nhập số điện thoại đặt hàng"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg transition-all duration-300 bg-white/80 placeholder-gray-400"
                    />
                  </div>
                  <button
                    id="order-search-button"
                    type="submit"
                    disabled={orderLoading}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-300/50 hover:shadow-blue-400/60 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {orderLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Tra cứu
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mã đơn hàng có trong email xác nhận đơn hàng sau khi bạn đặt hàng thành công
                </p>
              </form>

              {/* Error message */}
              {orderError && (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-fadeIn">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {orderError}
                </div>
              )}
            </div>
          </div>

          {/* ─── Full Order Detail Result ──────────────────────────────── */}
          {orderResult && (
            <div ref={orderResultRef} className="max-w-4xl mx-auto animate-fadeInUp">
              {/* Order Header */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Mã đơn hàng</p>
                    <h2 className="text-2xl font-bold text-blue-600 font-mono">#{orderResult.id}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Đặt ngày {new Date(orderResult.date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <Badge variant={statusColors[orderResult.status?.toLowerCase()] || 'info'} size="md">
                    {translateStatus(orderResult.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tracking Timeline */}
                  {orderResult.tracking && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Theo dõi vận chuyển
                      </h3>
                      <p className="text-sm text-gray-500 mb-5">
                        {orderResult.tracking.carrier} · <span className="font-mono font-semibold">{orderResult.tracking.number}</span>
                      </p>
                      <div className="space-y-0">
                        {orderResult.tracking.events?.map((event, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3.5 h-3.5 rounded-full ring-4 ${
                                index === 0
                                  ? 'bg-blue-600 ring-blue-100'
                                  : 'bg-gray-300 ring-gray-100'
                              }`}></div>
                              {index < orderResult.tracking.events.length - 1 && (
                                <div className="w-0.5 h-16 bg-gray-200 mt-1"></div>
                              )}
                            </div>
                            <div className="pb-6">
                              <p className="text-xs text-gray-400">{new Date(event.date).toLocaleString('vi-VN')}</p>
                              <p className="font-bold text-gray-800 mt-0.5">{translateTrackingEventStatus(event.status)}</p>
                              {event.location && <p className="text-gray-500 text-sm mt-0.5">{event.location}</p>}
                              {event.description && <p className="text-gray-400 text-sm mt-0.5">{translateTrackingEventDescription(event.description)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Sản phẩm trong đơn ({orderResult.items?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {orderResult.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-sm text-gray-400">Số lượng: {item.quantity}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-400">{formatPrice(item.price)} / sp</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Shipping Info */}
                  {orderResult.shipping && (
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Địa chỉ giao hàng
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-gray-800">{orderResult.shipping.name}</p>
                        <p className="text-gray-500">{orderResult.shipping.address}</p>
                        {orderResult.shipping.phone && (
                          <p className="text-gray-500 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {orderResult.shipping.phone}
                          </p>
                        )}
                        {orderResult.shipping.email && (
                          <p className="text-gray-500 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {orderResult.shipping.email}
                          </p>
                        )}
                      </div>
                      {orderResult.shipping.method && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-1">Phương thức giao hàng</p>
                          <p className="text-sm font-semibold text-gray-700">{getShippingMethodLabel(orderResult.shipping.method)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Total */}
                  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                      Tổng đơn hàng
                    </h3>
                    <div className="space-y-2 text-sm">
                      {orderResult.subtotal != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tạm tính</span>
                          <span className="font-medium">{formatPrice(orderResult.subtotal)}</span>
                        </div>
                      )}
                      {orderResult.tax != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Thuế</span>
                          <span className="font-medium">{formatPrice(orderResult.tax)}</span>
                        </div>
                      )}
                      {orderResult.shippingCost != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vận chuyển</span>
                          <span className="font-medium">{formatPrice(orderResult.shippingCost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-3 mt-3">
                        <span>Tổng cộng</span>
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatPrice(orderResult.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancelled notice */}
                  {(orderResult.status === 'Cancelled' || orderResult.status === 'Đã hủy') && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-lg">❌</span>
                      <p className="text-sm text-red-700 font-medium">Đơn hàng này đã bị hủy</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!orderSearched && !orderResult && (
            <div className="max-w-md mx-auto text-center py-8">
              <div className="text-7xl mb-4 opacity-30">📋</div>
              <p className="text-gray-400 text-lg">Nhập mã đơn hàng và số điện thoại để xem chi tiết</p>
              <p className="text-gray-300 text-sm mt-2">Mã đơn hàng được gửi qua email sau khi bạn đặt hàng</p>
            </div>
          )}

          {/* No result */}
          {orderSearched && !orderResult && !orderLoading && !orderError && (
            <div className="max-w-md mx-auto text-center py-8">
              <div className="text-7xl mb-4 opacity-30">📭</div>
              <p className="text-gray-400 text-lg">Không tìm thấy đơn hàng</p>
            </div>
          )}
        </>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}
      </style>
    </div>
  );
};

export default OrderLookupPage;
