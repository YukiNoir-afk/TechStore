import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/adminApi';

const InventoryAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ productId: '', type: '' });
  const [form, setForm] = useState({ productId: '', type: 'import', quantity: 0, reason: '', note: '' });

  const fetchProducts = async () => {
    try {
      const res = await adminApi.getProducts();
      const sortedProducts = [...res.data].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      setProducts(sortedProducts);
    } catch (err) {
      console.error('Không thể tải sản phẩm', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStockTransactions(filters);
      setTransactions(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải lịch sử kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const handleFilterChange = (field) => (e) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleFormChange = (field) => (e) => {
    const value = field === 'quantity' ? Number(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.productId || form.quantity <= 0) {
      setError('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await adminApi.createStockTransaction(form);
      setForm({ productId: '', type: 'import', quantity: 0, reason: '', note: '' });
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Tạo giao dịch kho thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nhập / Xuất kho</h1>
            <p className="text-sm text-gray-500 mt-1">Theo dõi và điều chỉnh tồn kho bằng các giao dịch nhập xuất.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}

        <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
              <select
                value={form.productId}
                onChange={handleFormChange('productId')}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} ({product.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Loại giao dịch</label>
              <select
                value={form.type}
                onChange={handleFormChange('type')}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Số lượng</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={handleFormChange('quantity')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập số lượng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Lý do</label>
              <input
                value={form.reason}
                onChange={handleFormChange('reason')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Nhập bổ sung, Trả hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea
                value={form.note}
                onChange={handleFormChange('note')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
                placeholder="Ghi chú thêm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Tạo giao dịch mới</h2>
              <p className="mt-3 text-sm text-gray-500">Ghi nhận mọi đợt nhập kho hoặc xuất kho và cập nhật tồn kho sản phẩm.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {saving ? 'Đang tạo...' : 'Tạo giao dịch'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-800">Lịch sử nhập xuất kho</h2>
              <p className="text-sm text-gray-500 mt-1">Xem lại các giao dịch mới nhất và lọc theo sản phẩm hoặc loại.</p>
            </div>
            <form onSubmit={applyFilters} className="flex flex-col sm:flex-row gap-2 items-center">
              <select
                value={filters.productId}
                onChange={handleFilterChange('productId')}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <select
                value={filters.type}
                onChange={handleFilterChange('type')}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Tất cả loại</option>
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
              </select>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Lọc
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Không có giao dịch.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Thời gian</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Loại</th>
                  <th className="px-6 py-3">Số lượng</th>
                  <th className="px-6 py-3">Trước</th>
                  <th className="px-6 py-3">Sau</th>
                  <th className="px-6 py-3">Lý do</th>
                  <th className="px-6 py-3">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{transaction.productName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${transaction.type === 'import' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {transaction.type === 'import' ? 'Nhập' : 'Xuất'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{transaction.quantity}</td>
                    <td className="px-6 py-4 text-gray-700">{transaction.stockBefore}</td>
                    <td className="px-6 py-4 text-gray-700">{transaction.stockAfter}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{transaction.reason || transaction.note || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{transaction.createdBy || 'Admin'}</td>
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

export default InventoryAdminPage;
