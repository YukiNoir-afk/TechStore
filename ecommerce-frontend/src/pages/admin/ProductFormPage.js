import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../../utils/adminApi';
import { categoriesApi, productsApi } from '../../utils/api';

// Defined at module level so React keeps a stable component identity across re-renders.
// This prevents inputs from losing focus on every keystroke.
const InputField = ({ label, name, type = 'text', required, placeholder, className = '', value, onChange, onCompositionStart, onCompositionEnd }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type} name={name} value={value ?? ''} onChange={onChange}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      required={required} placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const ProductFormPage = () => {
  const { id } = useParams(); // id present => edit mode
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '',
    imageUrl: '', categoryId: '', stock: '', onSale: false,
    discount: '', brand: '', model: '', color: '', weight: '', warranty: '',
  });
  const isComposingRef = useRef(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.data));

    if (isEdit) {
      setLoading(true);
      productsApi.getById(id)
        .then(res => {
          const p = res.data;
          if (p) {
            setForm({
              name: p.name || '', description: p.description || '',
              price: p.price?.toString() || '',
              originalPrice: p.originalPrice?.toString() || '',
              imageUrl: p.image || '',
              categoryId: p.categoryId || '',
              stock: p.stock?.toString() || '',
              onSale: p.onSale || false,
              discount: p.discount?.toString() || '',
              brand: p.brand || '', model: p.model || '',
              color: p.color || '', weight: p.weight || '',
              warranty: p.warranty || '',
            });
          }
        })
        .catch(() => setError('Không tìm thấy sản phẩm'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const updateFormField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleChange = (e) => {
    if (isComposingRef.current) return;
    updateFormField(e);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    updateFormField(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        imageUrl: form.imageUrl || null,
        categoryId: form.categoryId,
        stock: parseInt(form.stock) || 0,
        onSale: form.onSale,
        discount: form.discount ? parseInt(form.discount) : null,
        brand: form.brand || null,
        model: form.model || null,
        color: form.color || null,
        weight: form.weight || null,
        warranty: form.warranty || null,
      };

      if (isEdit) {
        await adminApi.updateProduct(id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // InputField is defined at module level above to avoid re-creation on each render

  const handleFileUpload = async (file) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Định dạng file không hợp lệ. Chỉ chấp nhận: JPG, PNG, GIF, WEBP, SVG, BMP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 5MB');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await adminApi.uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Upload hình ảnh thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thông tin cơ bản</h3>
            <InputField label="Tên sản phẩm" name="name" required placeholder="Nhập tên sản phẩm..." value={form.name} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                name="description" value={form.description ?? ''} onChange={handleChange} rows={3}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Mô tả sản phẩm..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
              <select
                name="categoryId" value={form.categoryId} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Giá & Khuyến mãi</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Giá bán ($)" name="price" type="number" required placeholder="0.00" value={form.price} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
              <InputField label="Giá gốc ($)" name="originalPrice" type="number" placeholder="0.00" value={form.originalPrice} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox" id="onSale" name="onSale" checked={form.onSale} onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="onSale" className="text-sm font-medium text-gray-700">Đang giảm giá</label>
            </div>
            {form.onSale && (
              <InputField label="Phần trăm giảm (%)" name="discount" type="number" placeholder="Ví dụ: 25" value={form.discount} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
            )}
          </div>

          {/* Stock & Media */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Kho & Hình ảnh</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Số lượng tồn kho" name="stock" type="number" required placeholder="0" value={form.stock} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
              <InputField label="Thương hiệu" name="brand" placeholder="Ví dụ: TechAudio" value={form.brand} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
            </div>
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  uploading
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600 font-medium">Đang tải lên...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <span className="text-sm font-medium text-blue-600">Nhấn để chọn ảnh</span>
                      <span className="text-sm text-gray-500"> hoặc kéo thả vào đây</span>
                    </div>
                    <span className="text-xs text-gray-400">JPG, PNG, GIF, WEBP — Tối đa 5MB</span>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-grow h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">HOẶC</span>
                <div className="flex-grow h-px bg-gray-200"></div>
              </div>

              {/* URL Input */}
              <InputField label="Nhập URL hình ảnh" name="imageUrl" placeholder="https://..." value={form.imageUrl} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />

              {/* Image Preview */}
              {form.imageUrl && (
                <div className="mt-3 relative inline-block">
                  <img src={form.imageUrl} alt="Preview" loading="lazy"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                    onError={e => e.target.style.display = 'none'}
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Extra details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Chi tiết thêm</h3>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Model" name="model" placeholder="Ví dụ: TA-2000X" value={form.model} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
              <InputField label="Màu sắc" name="color" placeholder="Ví dụ: Black" value={form.color} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
              <InputField label="Trọng lượng" name="weight" placeholder="Ví dụ: 250g" value={form.weight} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
              <InputField label="Bảo hành" name="warranty" placeholder="Ví dụ: 2 years" value={form.warranty} onChange={handleChange} onCompositionStart={handleCompositionStart} onCompositionEnd={handleCompositionEnd} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormPage;
