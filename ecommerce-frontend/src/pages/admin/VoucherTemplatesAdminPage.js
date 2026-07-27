import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const initialForm = {
  title: '',
  description: '',
  discountType: 'Percentage',
  discountValue: '',
  minOrderValue: '',
  tierRequired: 'Bronze',
  expiryDate: '',
  maxClaims: 0,
};

const VoucherTemplatesAdminPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getVoucherTemplates();
      setTemplates(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const resetForm = () => {
    setForm(initialForm);
    setError('');
  };

  const handleInput = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Tên voucher là bắt buộc');
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
        title: form.title.trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        tierRequired: form.tierRequired,
        expiryDate: new Date(form.expiryDate).toISOString(),
        maxClaims: Number(form.maxClaims) || 0,
      };

      await adminApi.createVoucherTemplate(payload);
      await fetchTemplates();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Tạo voucher thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminApi.toggleVoucherTemplate(id);
      await fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật trạng thái thất bại');
    }
  };

  const getStatusBadge = (template) => {
    const now = new Date();
    const expiry = new Date(template.expiryDate);

    if (!template.isActive) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">⏸ Đã khóa</span>;
    }
    if (expiry < now) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">⏰ Hết hạn</span>;
    }
    if (template.maxClaims > 0 && template.claimedCount >= template.maxClaims) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">🔒 Hết lượt</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">✓ Đang hoạt động</span>;
  };

  const getTierBadge = (tier) => {
    const colors = {
      Bronze: 'bg-orange-100 text-orange-800',
      Silver: 'bg-gray-200 text-gray-800',
      Gold: 'bg-yellow-100 text-yellow-800',
      Platinum: 'bg-indigo-100 text-indigo-800',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${colors[tier] || colors.Bronze}`}>{tier}</span>;
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
            <h1 className="text-2xl font-bold text-gray-800">🎁 Kho Voucher (Khách Hàng Thân Thiết)</h1>
            <p className="text-sm text-gray-500 mt-1">Tạo voucher ưu đãi cho từng hạng thành viên (Voucher sẽ hiển thị ở trang Kho Voucher của khách hàng).</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Xóa Form
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            {/* Row 1: Title + Desc */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên voucher</label>
              <input
                value={form.title}
                onChange={handleInput('title')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="VD: Giảm 20% cho thành viên Gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
              <textarea
                value={form.description}
                onChange={handleInput('description')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="VD: Áp dụng cho mọi đơn hàng từ 500k"
                rows="2"
              ></textarea>
            </div>

            {/* Row 2: Discount Type + Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Row 3: Tier + Min Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Hạng thành viên yêu cầu</label>
                <select
                  value={form.tierRequired}
                  onChange={handleInput('tierRequired')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="Bronze">🥉 Bronze (Tất cả user)</option>
                  <option value="Silver">🥈 Silver (Từ 500 điểm)</option>
                  <option value="Gold">🥇 Gold (Từ 1500 điểm)</option>
                  <option value="Platinum">💎 Platinum (Từ 3000 điểm)</option>
                </select>
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

            {/* Row 4: Expiry + Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày hết hạn nhận voucher</label>
                <input
                  type="datetime-local"
                  value={form.expiryDate}
                  onChange={handleInput('expiryDate')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số lượng voucher tối đa</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxClaims}
                  onChange={handleInput('maxClaims')}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="0 = không giới hạn"
                />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  🆕 Phát hành voucher mới
                </h2>
                <p className="mt-3 text-sm text-gray-500">
                  Voucher này sẽ xuất hiện trong "Kho Voucher" của khách hàng. Chỉ khách hàng đạt hạng yêu cầu mới có thể bấm nhận. Khi nhận thành công, mã code sẽ được sinh tự động cho từng khách.
                </p>

                {/* Preview card */}
                {form.title && (
                  <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Xem trước</div>
                    <div className="font-bold text-gray-800 mb-1">{form.title}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-green-600">
                        {form.discountType === 'Percentage'
                          ? `Giảm ${form.discountValue || 0}%`
                          : `Giảm ${formatPrice(form.discountValue || 0)}`}
                      </span>
                      {getTierBadge(form.tierRequired)}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {saving ? 'Đang phát hành...' : 'Phát hành vào Kho Voucher'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">Danh sách Voucher trong Kho</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng {templates.length} mẫu voucher.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏪</div>
            <p className="text-gray-400">Chưa có voucher nào trong kho. Hãy tạo voucher đầu tiên!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Tên Voucher</th>
                  <th className="px-6 py-3">Hạng yêu cầu</th>
                  <th className="px-6 py-3">Giảm giá</th>
                  <th className="px-6 py-3">Đã nhận</th>
                  <th className="px-6 py-3">Hết hạn</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {tpl.title}
                    </td>
                    <td className="px-6 py-4">
                      {getTierBadge(tpl.tierRequired)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {tpl.discountType === 'Percentage'
                        ? `${tpl.discountValue}%`
                        : formatPrice(tpl.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-medium">{tpl.claimedCount}</span>
                      <span className="text-gray-400">
                        {tpl.maxClaims > 0 ? ` / ${tpl.maxClaims}` : ' / ∞'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(tpl.expiryDate)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tpl)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggle(tpl.id)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          tpl.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {tpl.isActive ? 'Khóa' : 'Mở khóa'}
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

export default VoucherTemplatesAdminPage;
