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
  };
  return map[s] || 'bg-gray-100 text-gray-800';
};

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
                        {order.status}
                      </span>
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
    </div>
  );
};

export default DashboardPage;
