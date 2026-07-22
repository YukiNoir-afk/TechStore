import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { productsApi, categoriesApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const ProductsPage = ({ addToCart }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000000]);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Read search query from URL
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    categoriesApi.getAll().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    // Reset to page 1 when search changes
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page, pageSize: 12, sortBy };
        if (selectedCategory !== 'all') params.category = selectedCategory;
        if (priceRange[0] > 0) params.minPrice = priceRange[0];
        if (priceRange[1] < 50000000) params.maxPrice = priceRange[1];
        if (searchQuery) params.search = searchQuery;
        const res = await productsApi.getAll(params);
        setProducts(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, priceRange, sortBy, page, searchQuery]);

  const clearSearch = () => {
    setSearchParams({});
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-heading text-text-primary mb-2">
            {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Sản phẩm'}
          </h1>
          <p className="text-text-secondary">Hiển thị {totalCount} sản phẩm</p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-200 transition-colors"
            >
              ✕ Xóa tìm kiếm
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <button onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full bg-white border-2 border-primary-200 rounded-lg py-3 px-4 font-bold text-primary-600 mb-4 hover:bg-primary-50 transition-colors">
              {showFilters ? '✕ Ẩn bộ lọc' : '☰ Hiện bộ lọc'}
            </button>

            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Categories</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="category" value="all" checked={selectedCategory === 'all'}
                      onChange={() => { setSelectedCategory('all'); setPage(1); }} className="w-4 h-4 text-primary-600 cursor-pointer" />
                    <span className="capitalize text-text-primary hover:text-primary-600 transition-colors">Tất cả</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center space-x-3 cursor-pointer">
                      <input type="radio" name="category" value={cat.name} checked={selectedCategory === cat.name}
                        onChange={() => { setSelectedCategory(cat.name); setPage(1); }} className="w-4 h-4 text-primary-600 cursor-pointer" />
                      <span className="text-text-primary hover:text-primary-600 transition-colors">
                        {cat.name} ({cat.productCount})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Min: {formatPrice(priceRange[0])}</label>
                    <input type="range" min="0" max="50000000" step="100000" value={priceRange[0]}
                      onChange={(e) => { setPriceRange([parseInt(e.target.value), priceRange[1]]); setPage(1); }} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Max: {formatPrice(priceRange[1])}</label>
                    <input type="range" min="0" max="50000000" step="100000" value={priceRange[1]}
                      onChange={(e) => { setPriceRange([priceRange[0], parseInt(e.target.value)]); setPage(1); }} className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
              <p className="text-sm text-text-secondary">
                Hiển thị <strong>{products.length}</strong> trên tổng {totalCount} kết quả
              </p>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500 transition-colors">
                <option value="newest">Mới nhất</option>
                <option value="price-low">Giá: thấp đến cao</option>
                <option value="price-high">Giá: cao đến thấp</option>
                <option value="rating">Đánh giá cao</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i + 1} onClick={() => setPage(i + 1)}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white text-primary-600 border-2 border-primary-200 hover:bg-primary-50'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-text-secondary mb-6">
                  {searchQuery
                    ? `Không có kết quả cho "${searchQuery}". Hãy thử từ khóa khác.`
                    : 'Hãy điều chỉnh bộ lọc để tìm sản phẩm phù hợp.'}
                </p>
                <Button onClick={() => { setSelectedCategory('all'); setPriceRange([0, 50000000]); clearSearch(); setPage(1); }} variant="primary">Xóa bộ lọc</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;

