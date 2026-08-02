import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import Spinner from '../components/Spinner';
import { ordersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const STATUS_FILTERS = [
  { label: 'Tất cả', value: 'all', matches: [] },
  { label: 'Chờ xử lý', value: 'pending', matches: ['pending', 'chờ xử lý'] },
  { label: 'Đang xử lý', value: 'processing', matches: ['processing', 'đang xử lý'] },
  { label: 'Đang giao', value: 'shipped', matches: ['shipped', 'đang vận chuyển', 'đang giao'] },
  { label: 'Đã hoàn thành', value: 'delivered', matches: ['delivered', 'đã giao', 'đã hoàn thành'] },
  { label: 'Đã hủy', value: 'cancelled', matches: ['cancelled', 'đã hủy'] },
];

const matchesFilter = (orderStatus, filter) => {
  if (filter.value === 'all') return true;
  return filter.matches.includes(orderStatus.toLowerCase());
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await ordersApi.getAll();
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const activeFilter = STATUS_FILTERS.find(f => f.value === statusFilter) || STATUS_FILTERS[0];
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => matchesFilter(o.status, activeFilter));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const canCancel = (status) => {
    const s = status.toLowerCase();
    return s !== 'shipped' && s !== 'delivered' && s !== 'cancelled' && 
           s !== 'đã hủy' && s !== 'đang giao' && s !== 'đã hoàn thành';
  };

  const handleCancel = async (e, orderId) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    setCancellingId(orderId);
    try {
      await ordersApi.cancel(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
      showToast('Đã hủy đơn hàng thành công');
    } catch (err) {
      showToast(err.response?.data?.error || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const statusColors = { 
    pending: 'warning', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
    'chờ xử lý': 'warning', 'đang xử lý': 'info', 'đang giao': 'info', 'đã hoàn thành': 'success', 'đã hủy': 'danger'
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'Pending': return 'Chờ xử lý';
      case 'Processing': return 'Đang xử lý';
      case 'Shipped': return 'Đang giao';
      case 'Delivered': return 'Đã hoàn thành';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold font-heading text-text-primary mb-6">Lịch sử đơn hàng</h1>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const count = filter.value === 'all'
              ? orders.length
              : orders.filter(o => matchesFilter(o.status, filter)).length;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className="order-filter-btn"
                style={{
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: statusFilter === filter.value ? '#4f46e5' : '#e5e7eb',
                  backgroundColor: statusFilter === filter.value ? '#4f46e5' : '#ffffff',
                  color: statusFilter === filter.value ? '#ffffff' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: statusFilter === filter.value ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== filter.value) {
                    e.target.style.borderColor = '#a5b4fc';
                    e.target.style.color = '#4f46e5';
                    e.target.style.backgroundColor = '#eef2ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== filter.value) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.color = '#6b7280';
                    e.target.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                {filter.label}
                <span style={{
                  backgroundColor: statusFilter === filter.value ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                  color: statusFilter === filter.value ? '#ffffff' : '#9ca3af',
                  borderRadius: '9999px',
                  padding: '1px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  minWidth: '22px',
                  textAlign: 'center',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`} style={{ animation: 'slideIn 0.3s ease-out' }}>
            {toast.type === 'error' ? '❌' : '✅'} {toast.message}
          </div>
        )}

        {orders.length > 0 ? (
          filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Link key={order.id} to={`/order-tracking/${order.id}`} className="block">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div>
                          <p className="text-sm text-text-secondary">Mã đơn</p>
                          <p className="text-2xl font-bold text-primary-600 font-mono">#{order.id}</p>
                        </div>
                        <div className="hidden md:block text-text-secondary">|</div>
                        <div>
                          <p className="text-sm text-text-secondary">Ngày đặt</p>
                          <p className="text-lg font-semibold text-text-primary">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="hidden md:block text-text-secondary">|</div>
                        <div>
                          <p className="text-sm text-text-secondary">Số sản phẩm</p>
                          <p className="text-lg font-semibold text-text-primary">{order.itemCount} sản phẩm</p>
                        </div>
                      </div>
                      {order.trackingNumber && (
                        <p className="text-sm text-text-secondary">Tracking: <span className="font-mono font-semibold">{order.trackingNumber}</span></p>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-4">
                      <Badge variant={statusColors[order.status.toLowerCase()] || 'info'} size="md">
                        {translateStatus(order.status)}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">Tổng</p>
                        <p className="text-2xl font-bold text-primary-600">{formatPrice(order.total)}</p>
                      </div>
                      {/* Cancel Button */}
                      {canCancel(order.status) && (
                        <button
                          onClick={(e) => handleCancel(e, order.id)}
                          disabled={cancellingId === order.id}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {cancellingId === order.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              Đang hủy...
                            </>
                          ) : (
                            <>✕ Hủy đơn hàng</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Không tìm thấy đơn hàng</h2>
              <p className="text-text-secondary mb-6">Không có đơn hàng nào với trạng thái đã chọn</p>
              <button
                onClick={() => setStatusFilter('all')}
                className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
              >Xem tất cả đơn hàng</button>
            </div>
          )
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-text-secondary mb-8">Bắt đầu mua sắm để tạo đơn hàng đầu tiên</p>
            <Link to="/products"><button className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors">Mua sắm ngay</button></Link>
          </div>
        )}
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

export default OrderHistoryPage;
