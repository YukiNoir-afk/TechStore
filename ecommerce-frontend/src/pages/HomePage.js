import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';
import { productsApi, recommendationsApi } from '../utils/api';

const HomePage = ({ addToCart, user }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await productsApi.getFeatured();
        setFeaturedProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch featured products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch personalized recommendations when user is logged in
  useEffect(() => {
    if (!user) {
      setRecommendations([]);
      return;
    }
    const fetchRecommendations = async () => {
      setRecsLoading(true);
      try {
        const res = await recommendationsApi.getPersonal(4);
        setRecommendations(res.data.items || []);
        setIsPersonalized(res.data.isPersonalized || false);
      } catch (err) {
        console.log('Recommendations fetch failed', err);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecommendations();
  }, [user]);

  return (
    <div className="bg-background min-h-screen font-sans">
      <SEO 
        title="Trang chủ" 
        description="TechStore cung cấp các thiết bị công nghệ hàng đầu, chính hãng với dịch vụ giao hàng nhanh chóng."
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4 leading-tight">
                Mua sắm sản phẩm tuyệt vời
              </h1>
              <p className="text-primary-100 text-lg mb-6">
                Khám phá hàng nghìn sản phẩm chất lượng với giao hàng nhanh, thanh toán an toàn và đảm bảo hài lòng 100%.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:bg-opacity-10">
                    Mua ngay
                  </Button>
                </Link>
                <Link to="/products">
                  <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-primary-50">
                    Xem tất cả
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative w-full h-64 md:h-80">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                  alt="Hero"
                  className="w-full h-full object-cover rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-bold font-heading text-text-primary mb-2">Miễn phí vận chuyển</h3>
              <p className="text-text-secondary">Miễn phí vận chuyển cho đơn hàng trên 500.000₫. Giao nhanh đến tận nơi.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold font-heading text-text-primary mb-2">Thanh toán an toàn</h3>
              <p className="text-text-secondary">Thanh toán 100% an toàn với Stripe và PayPal.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold font-heading text-text-primary mb-2">Bảo hành 30 ngày</h3>
              <p className="text-text-secondary">Không hài lòng? Hoàn tiền trong vòng 30 ngày.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-text-primary mb-2">Sản phẩm nổi bật</h2>
            <p className="text-text-secondary text-lg">Khám phá sản phẩm bán chạy và ưu đãi đặc biệt</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link to="/products">
              <Button size="lg" variant="primary">Xem tất cả sản phẩm →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations - only for logged-in users */}
      {user && (recommendations.length > 0 || recsLoading) && (
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary-50 via-white to-primary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-lg shadow-md">
                ✨
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-heading text-text-primary">
                  Dành riêng cho bạn{user?.firstName ? `, ${user.firstName}` : ''}
                </h2>
                <p className="text-text-secondary text-sm mt-0.5">
                  {isPersonalized
                    ? 'Gợi ý dựa trên sở thích mua sắm của bạn'
                    : 'Những sản phẩm phổ biến bạn có thể thích'}
                </p>
              </div>
            </div>

            {recsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                  <div key={product.id} className="relative group">
                    {/* Reason badge */}
                    {product.reason && (
                      <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
                        {product.reason}
                      </div>
                    )}
                    <ProductCard product={product} onAddToCart={addToCart} />
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link to="/products">
                <Button size="md" variant="outline">Khám phá thêm →</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="bg-primary-50 py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold font-heading text-text-primary mb-4">Đăng ký nhận bản tin</h2>
          <p className="text-text-secondary mb-6">Nhận ưu đãi độc quyền, sản phẩm mới và chương trình khuyến mãi qua email.</p>
          <form className="flex flex-col sm:flex-row gap-2">
            <input type="email" placeholder="Nhập email của bạn" className="flex-grow px-4 py-3 border-2 border-primary-200 rounded-lg focus:outline-none focus:border-primary-500 transition-colors" required />
            <Button size="md" variant="primary" className="sm:w-auto">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
