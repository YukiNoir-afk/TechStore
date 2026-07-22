import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

const ProductCard = ({ product, onAddToCart }) => {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
    >
      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden bg-gray-100 h-48 md:h-56">
        {/* Skeleton placeholder while loading */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Error fallback */}
        {imgError && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">No image</span>
          </div>
        )}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-all duration-300 hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
        />
        {product.onSale && (
          <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-lg text-sm font-bold">
            Giảm {product.discount}%
          </div>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-4 left-4 bg-warning text-white px-2 py-1 rounded text-xs font-bold">
            Chỉ còn {product.stock}
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Hết hàng</span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">
            {product.category}
          </p>
          <h3 className="text-base font-bold text-text-primary line-clamp-2 font-heading">
            <Link to={`/products/${product.id}`} className="hover:text-primary-600 transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-warning">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(product.rating) ? 'text-warning' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-text-secondary ml-1">
            ({product.reviews} đánh giá)
          </span>
        </div>

        {/* Price */}
        <div className="mb-4 flex items-baseline space-x-2">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-text-secondary line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none hover:translate-y-px"
        >
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
