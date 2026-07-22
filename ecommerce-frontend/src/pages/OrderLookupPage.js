import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { ordersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const OrderLookupPage = () => {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const resultRef = useRef(null);

  const handleSearch = async (e) => {
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

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
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
          Nhập số điện thoại để xem lại toàn bộ lịch sử mua hàng của bạn
        </p>
      </div>

      {/* Search Card */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-100/50 border border-white/60 p-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
          <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-4">
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
      `}</style>
    </div>
  );
};

export default OrderLookupPage;
