import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/adminApi';

const initialForm = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
};

const CategoriesAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingCategoryId(null);
    setError('');
  };

  const handleInput = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Tên và slug là bắt buộc');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingCategoryId) {
        await adminApi.updateCategory(editingCategoryId, form);
      } else {
        await adminApi.createCategory(form);
      }
      await fetchCategories();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu danh mục thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategoryId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await adminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Xóa danh mục thất bại');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
            <p className="text-sm text-gray-500 mt-1">Thêm, sửa hoặc xóa danh mục sản phẩm.</p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Danh mục mới
          </button>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
              <input
                value={form.name}
                onChange={handleInput('name')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Điện thoại"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                value={form.slug}
                onChange={handleInput('slug')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="vi-du-dien-thoai"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                value={form.description}
                onChange={handleInput('description')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={4}
                placeholder="Mô tả ngắn về danh mục"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ảnh đại diện (URL)</label>
              <input
                value={form.imageUrl}
                onChange={handleInput('imageUrl')}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{editingCategoryId ? 'Chỉnh sửa danh mục' : 'Danh mục mới'}</h2>
                <p className="mt-3 text-sm text-gray-500">Điền thông tin và bấm lưu để cập nhật hoặc tạo danh mục mới.</p>
              </div>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {saving ? 'Đang lưu...' : editingCategoryId ? 'Cập nhật danh mục' : 'Tạo danh mục'}
                </button>
                {editingCategoryId && (
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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">Danh sách danh mục</h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh mục hiện tại và xem số lượng sản phẩm liên quan.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Chưa có danh mục nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Mô tả</th>
                  <th className="px-6 py-3">Sản phẩm</th>
                  <th className="px-6 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{category.name}</td>
                    <td className="px-6 py-4 text-gray-600">{category.slug}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-lg truncate">{category.description || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{category.productCount ?? 0}</td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
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

export default CategoriesAdminPage;
