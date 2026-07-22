import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { wishlistApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const WishlistPage = ({ addToCart }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await wishlistApi.get();
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch wishlist', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistApi.remove(productId);
      setItems(items.filter(i => i.productId !== productId));
    } catch (err) {
      console.error('Failed to remove', err);
    }
  };

  const handleMoveToCart = (item) => {
    addToCart({ id: item.productId, name: item.name, price: item.price, image: item.image, category: item.category });
    handleRemove(item.productId);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold font-heading text-text-primary mb-8">Danh sách yêu thích</h1>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/products/${item.productId}`}>
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                </Link>
                <div className="p-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">{item.category}</p>
                  <Link to={`/products/${item.productId}`} className="font-bold text-text-primary hover:text-primary-600 transition-colors">{item.name}</Link>
                  <div className="flex items-baseline gap-2 mt-2 mb-4">
                    <span className="text-lg font-bold text-primary-600">{formatPrice(item.price)}</span>
                    {item.originalPrice && <span className="text-sm text-text-secondary line-through">{formatPrice(item.originalPrice)}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleMoveToCart(item)} disabled={!item.inStock} className="flex-grow">
                      {item.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </Button>
                    <button onClick={() => handleRemove(item.productId)} className="px-3 py-1 text-accent hover:text-red-700 border-2 border-accent rounded-lg text-sm font-bold transition-colors">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">♡</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Danh sách yêu thích trống</h2>
            <p className="text-text-secondary mb-8">Lưu sản phẩm yêu thích để mua sau</p>
            <Link to="/products"><Button size="lg" variant="primary">Duyệt sản phẩm</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
