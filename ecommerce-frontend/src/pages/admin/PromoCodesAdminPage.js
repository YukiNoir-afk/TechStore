import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const initialForm = {
  code: '',
  discountType: 'Percentage',
  discountValue: '',
  minOrderValue: '',
  expiryDate: '',
  usageLimit: 0,
  isActive: true,
};

const PromoCodesAdminPage = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchPromoCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getPromoCodes();
      setPromoCodes(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải danh sách mã khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromoCodes(); }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError('');
  };

  const handleInput = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError('Mã khuyến mãi là bắt buộc');
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      setError('Giá trị giảm giá phải lớn hơn 0');
      return;
    }
    if (!form.expiryDate) {
      setError('Ngày hết hạn là bắt buộc');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        expiryDate: new Date(form.expiryDate).toISOString(),
        usageLimit: Number(form.usageLimit) || 0,
        isActive: form.isActive,
      };

      if (editingId) {
        await adminApi.updatePromoCode(editingId, payload);
      } else {
        await adminApi.createPromoCode(payload);
      }
      await fetchPromoCodes();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu mã khuyến mãi thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue || '',
      expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().slice(0, 16) : '',
      usageLimit: promo.usageLimit || 0,
      isActive: promo.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã khuyến mãi này?')) return;
    try {
      await adminApi.deletePromoCode(id);
      setPromoCodes((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Xóa mã khuyến mãi thất bại');
    }
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const expiry = new Date(promo.expiryDate);

    if (!promo.isActive) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">⏸ Tắt</span>;
    }
    if (expiry < now) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">⏰ Hết hạn</span>;
    }
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">🔒 Hết lượt</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">✓ Đang hoạt động</span>;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎟️ Quản lý mã khuyến mãi</h1>
            <p className="text-sm text-gray-500 mt-1">Tạo và quản lý mã giảm giá cho khách hàng.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Mã mới
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            {/* Row 1: Code + Discount Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã khuyến mãi</label>
                <input
                  value={form.code}
                  onChange={handleInput('code')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                  placeholder="VD: SUMMER20, GIAM50K"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Loại giảm giá</label>
                <select
                  value={form.discountType}
                  onChange={handleInput('discountType')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="Percentage">Phần trăm (%)</option>
                  <option value="Fixed">Số tiền cố định (₫)</option>
                </select>
              </div>
            </div>

            {/* Row 2: Discount Value + Min Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Giá trị giảm {form.discountType === 'Percentage' ? '(%)' : '(₫)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discountValue}
                  onChange={handleInput('discountValue')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder={form.discountType === 'Percentage' ? 'VD: 20' : 'VD: 50000'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đơn hàng tối thiểu (₫)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minOrderValue}
                  onChange={handleInput('minOrderValue')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Bỏ trống = không giới hạn"
                />
              </div>
            </div>

            {/* Row 3: Expiry + Usage Limit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày hết hạn</label>
                <input
                  type="datetime-local"
                  value={form.expiryDate}
                  onChange={handleInput('expiryDate')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giới hạn sử dụng</label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={handleInput('usageLimit')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="0 = không giới hạn"
                />
                <p className="mt-1 text-xs text-gray-400">Nhập 0 để không giới hạn số lần dùng</p>
              </div>
            </div>

            {/* Active Toggle */}
            {editingId && (
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleInput('isActive')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">
                  {form.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                </span>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingId ? '✏️ Chỉnh sửa mã' : '🆕 Tạo mã mới'}
                </h2>
                <p className="mt-3 text-sm text-gray-500">
                  Tạo mã khuyến mãi để cung cấp cho khách hàng. Khách hàng sẽ nhập mã này khi thanh toán để được giảm giá.
                </p>

                {/* Preview card */}
                {form.code && (
                  <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Xem trước</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 text-lg tracking-wider">
                        {form.code.toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {form.discountType === 'Percentage'
                          ? `Giảm ${form.discountValue || 0}%`
                          : `Giảm ${formatPrice(form.discountValue || 0)}`}
                      </span>
                    </div>
                    {form.minOrderValue && (
                      <div className="text-xs text-gray-500 mt-1">
                        Đơn tối thiểu: {formatPrice(form.minOrderValue)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật mã' : 'Tạo mã khuyến mãi'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">Danh sách mã khuyến mãi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng {promoCodes.length} mã. Khách hàng có thể nhập mã khi thanh toán.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎟️</div>
            <p className="text-gray-400">Chưa có mã khuyến mãi nào. Hãy tạo mã đầu tiên!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Giảm giá</th>
                  <th className="px-6 py-3">Đơn tối thiểu</th>
                  <th className="px-6 py-3">Hết hạn</th>
                  <th className="px-6 py-3">Đã dùng</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {promoCodes.map((promo) => (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm tracking-wider">
                        {promo.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {promo.discountType === 'Percentage'
                        ? `${promo.discountValue}%`
                        : formatPrice(promo.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {promo.minOrderValue ? formatPrice(promo.minOrderValue) : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(promo.expiryDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-medium">{promo.usedCount}</span>
                      <span className="text-gray-400">
                        {promo.usageLimit > 0 ? ` / ${promo.usageLimit}` : ' / ∞'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(promo)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(promo.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Xóa
                      </button>
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

export default PromoCodesAdminPage;
