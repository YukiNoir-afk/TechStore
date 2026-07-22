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
  const map = { Pending:'bg-yellow-100 text-yellow-800', Processing:'bg-blue-100 text-blue-800',
    Shipped:'bg-purple-100 text-purple-800', Delivered:'bg-green-100 text-green-800',
    Cancelled:'bg-red-100 text-red-800' };
  return map[s] || 'bg-gray-100 text-gray-800';
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.error || 'Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
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

      {/* Order Status Row */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
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

        {/* Top Products */}
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
