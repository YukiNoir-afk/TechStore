import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../utils/adminApi';
import { formatPrice } from '../../utils/formatPrice';

const ProductsAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);

  const fetchProducts = (q = '') => {
    setLoading(true);
    adminApi.getProducts(q || null)
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await adminApi.toggleProduct(id);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      alert('Thao tác thất bại');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
            Tìm
          </button>
        </form>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
        >
          <span>+</span><span>Thêm sản phẩm</span>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-bold text-gray-800">
            Danh sách sản phẩm
            <span className="ml-2 text-sm font-normal text-gray-500">({products.length} sản phẩm)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📦</div>
            <p>Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
                  <th className="text-left px-6 py-3 font-medium">Danh mục</th>
                  <th className="text-left px-6 py-3 font-medium">Giá</th>
                  <th className="text-left px-6 py-3 font-medium">Tồn kho</th>
                  <th className="text-left px-6 py-3 font-medium">Đánh giá</th>
                  <th className="text-left px-6 py-3 font-medium">Trạng thái</th>
                  <th className="text-left px-6 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} loading="lazy"
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">📷</div>
                        )}
                        <div>
                          <div className="font-medium text-gray-800 max-w-xs truncate">{product.name}</div>
                          {product.brand && <div className="text-gray-400 text-xs">{product.brand}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{formatPrice(product.price)}</div>
                      {product.onSale && product.discount && (
                        <div className="text-xs text-green-600 font-medium">-{product.discount}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-gray-700 font-medium">{product.rating}</span>
                        <span className="text-gray-400 text-xs">({product.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {product.isActive ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleToggle(product.id)}
                          disabled={toggling === product.id}
                          className="text-gray-600 hover:text-gray-800 text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          {toggling === product.id ? '...' : product.isActive ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
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

export default ProductsAdminPage;
