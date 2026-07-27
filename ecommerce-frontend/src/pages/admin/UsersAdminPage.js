import React, { useState, useEffect, useCallback } from 'react';
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

// ── Lock Modal ───────────────────────────────────────────────────────
const LockModal = ({ user, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(user.id, reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h3 className="text-white font-bold text-lg">🔒 Khóa tài khoản</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">
              Bạn đang khóa tài khoản <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
              Người dùng sẽ không thể đăng nhập sau khi bị khóa.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do khóa (tùy chọn)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do khóa tài khoản..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Xác nhận khóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm(user.id);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h3 className="text-white font-bold text-lg">⚠️ Xóa tài khoản</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-semibold mb-1">Hành động này không thể hoàn tác!</p>
            <p className="text-sm text-red-700">
              Tài khoản <strong>{user.firstName} {user.lastName}</strong> ({user.email}) sẽ bị xóa vĩnh viễn cùng với giỏ hàng, wishlist, địa chỉ và đánh giá.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhập <strong className="text-red-600">XÓA</strong> để xác nhận
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="XÓA"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'XÓA'}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Reset Password Modal ─────────────────────────────────────────────
const ResetPasswordModal = ({ user, onClose, onConfirm }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    await onConfirm(user.id, newPassword);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <h3 className="text-white font-bold text-lg">🔑 Đổi mật khẩu</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-sm text-indigo-800">
              Đổi mật khẩu cho <strong>{user.firstName} {user.lastName}</strong> ({user.email})
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !newPassword}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Order History Modal ──────────────────────────────────────────────
const OrderHistoryModal = ({ data, onClose, loading, error }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-white font-bold text-lg">📦 Lịch sử mua hàng</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-gray-500">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <span className="text-xs text-gray-500">Khách hàng</span>
                  <p className="font-semibold text-gray-800">{data.customerName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Email</span>
                  <p className="font-semibold text-gray-800">{data.customerEmail}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Số điện thoại</span>
                  <p className="font-semibold text-gray-800">{data.phone}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Tổng đơn</span>
                  <p className="font-semibold text-blue-700">{data.orders.length} đơn hàng</p>
                </div>
              </div>

              {/* Orders List */}
              {data.orders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">Khách hàng chưa có đơn hàng nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Mã đơn</th>
                        <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                        <th className="text-left px-4 py-3 font-medium">Tổng tiền</th>
                        <th className="text-left px-4 py-3 font-medium">Thanh toán</th>
                        <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
                        <th className="text-left px-4 py-3 font-medium">Ngày đặt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">#{order.id.slice(-6)}</td>
                          <td className="px-4 py-3 text-gray-600">{order.itemCount} sản phẩm</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{formatPrice(order.total)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {order.paymentStatus === 'Paid' ? 'Đã TT' : 'Chưa TT'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
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
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── Phone Search Bar ────────────────────────────────────────────────
const PhoneSearchBar = ({ onSearch }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    await onSearch(phone.trim());
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg">
        📱
      </div>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Nhập SĐT khách hàng để tra cứu lịch sử mua hàng..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !phone.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span>🔍</span>
          )}
          Tra cứu
        </button>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────
const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modal states
  const [lockModal, setLockModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [orderModal, setOrderModal] = useState({ show: false, data: null, loading: false, error: null });
  const [resetPwModal, setResetPwModal] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi.getUsers()
      .then(res => setUsers(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Lock User ──
  const handleLockUser = async (userId, reason) => {
    try {
      await adminApi.lockUser(userId, { reason });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: true, lockedAt: new Date().toISOString(), lockReason: reason } : u));
      showToast('Đã khóa tài khoản thành công');
      setLockModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi khóa tài khoản', 'error');
    }
  };

  // ── Unlock User ──
  const handleUnlockUser = async (userId) => {
    try {
      await adminApi.unlockUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: false, lockedAt: null, lockReason: null } : u));
      showToast('Đã mở khóa tài khoản thành công');
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi mở khóa', 'error');
    }
  };

  // ── Delete User ──
  const handleDeleteUser = async (userId) => {
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('Đã xóa tài khoản thành công');
      setDeleteModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi xóa tài khoản', 'error');
    }
  };

  // ── Reset Password ──
  const handleResetPassword = async (userId, newPassword) => {
    try {
      await adminApi.resetUserPassword(userId, { newPassword });
      showToast('Đã đổi mật khẩu thành công');
      setResetPwModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi khi đổi mật khẩu', 'error');
    }
  };

  // ── View Orders by Phone ──
  const handleViewOrdersByPhone = async (phone) => {
    setOrderModal({ show: true, data: null, loading: true, error: null });
    try {
      const res = await adminApi.getOrdersByPhone(phone);
      setOrderModal({ show: true, data: res.data, loading: false, error: null });
    } catch (err) {
      setOrderModal({ show: true, data: null, loading: false, error: err.response?.data?.error || 'Không tìm thấy khách hàng' });
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-slide-in ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.message}
        </div>
      )}

      {/* Phone Search */}
      <PhoneSearchBar onSearch={handleViewOrdersByPhone} />

      {/* Search */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Tìm theo tên, email hoặc SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">{filtered.length} người dùng</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">Danh sách người dùng</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Người dùng</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Số điện thoại</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Trạng thái</th>
                  <th className="text-left px-6 py-3 font-medium">Số đơn</th>
                  <th className="text-left px-6 py-3 font-medium">Ngày tạo</th>
                  <th className="text-left px-6 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.isLocked ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                          user.isLocked ? 'bg-gray-400' : user.role === 'Admin' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {user.isLocked ? '🔒' : user.firstName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className={`font-medium ${user.isLocked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-gray-400 text-xs">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${user.isLocked ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={user.isLocked ? 'text-gray-400' : 'text-gray-600'}>{user.phone || '—'}</span>
                        {user.phone && (
                          <button
                            onClick={() => handleViewOrdersByPhone(user.phone)}
                            title="Xem lịch sử đơn hàng"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors"
                          >
                            📦 Đơn hàng
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'Admin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isLocked ? (
                        <div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            🔒 Đã khóa
                          </span>
                          {user.lockReason && (
                            <div className="text-xs text-gray-400 mt-1 max-w-[150px] truncate" title={user.lockReason}>
                              Lý do: {user.lockReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          ✅ Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{user.orderCount}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      {user.role !== 'Admin' && (
                        <div className="flex items-center gap-1">
                          {user.isLocked ? (
                            <button
                              onClick={() => handleUnlockUser(user.id)}
                              title="Mở khóa tài khoản"
                              className="px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              🔓 Mở khóa
                            </button>
                          ) : (
                            <button
                              onClick={() => setLockModal(user)}
                              title="Khóa tài khoản"
                              className="px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                              🔒 Khóa
                            </button>
                          )}
                          <button
                            onClick={() => setResetPwModal(user)}
                            title="Đổi mật khẩu"
                            className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            🔑 Đổi MK
                          </button>
                          <button
                            onClick={() => setDeleteModal(user)}
                            title="Xóa tài khoản"
                            className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {lockModal && (
        <LockModal user={lockModal} onClose={() => setLockModal(null)} onConfirm={handleLockUser} />
      )}
      {deleteModal && (
        <DeleteModal user={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDeleteUser} />
      )}
      {resetPwModal && (
        <ResetPasswordModal user={resetPwModal} onClose={() => setResetPwModal(null)} onConfirm={handleResetPassword} />
      )}
      {orderModal.show && (
        <OrderHistoryModal
          data={orderModal.data}
          loading={orderModal.loading}
          error={orderModal.error}
          onClose={() => setOrderModal({ show: false, data: null, loading: false, error: null })}
        />
      )}

      {/* Toast animation style */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UsersAdminPage;
