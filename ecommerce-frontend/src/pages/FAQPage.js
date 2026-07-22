import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const faqCategories = [
  { id: 'all', label: 'Tất cả', icon: '📋' },
  { id: 'order', label: 'Đặt hàng', icon: '🛒' },
  { id: 'shipping', label: 'Vận chuyển', icon: '🚚' },
  { id: 'payment', label: 'Thanh toán', icon: '💳' },
  { id: 'return', label: 'Đổi trả', icon: '↩️' },
  { id: 'account', label: 'Tài khoản', icon: '👤' },
  { id: 'product', label: 'Sản phẩm', icon: '📦' },
];

const faqData = [
  {
    id: 1,
    category: 'order',
    question: 'Làm thế nào để đặt hàng trên TechStore?',
    answer: 'Bạn chỉ cần tìm sản phẩm yêu thích, nhấn "Thêm vào giỏ", sau đó vào giỏ hàng và tiến hành thanh toán. Bạn cần đăng nhập hoặc tạo tài khoản trước khi hoàn tất đơn hàng. Quy trình đặt hàng gồm 3 bước: nhập địa chỉ giao hàng, chọn phương thức thanh toán, và xác nhận đơn hàng.',
  },
  {
    id: 2,
    category: 'order',
    question: 'Tôi có thể hủy đơn hàng đã đặt không?',
    answer: 'Bạn có thể hủy đơn hàng khi đơn đang ở trạng thái "Chờ xử lý". Sau khi đơn hàng đã được xử lý hoặc giao cho đơn vị vận chuyển, bạn sẽ không thể hủy mà cần liên hệ bộ phận hỗ trợ khách hàng để được tư vấn.',
  },
  {
    id: 3,
    category: 'order',
    question: 'Tôi có thể thay đổi địa chỉ giao hàng sau khi đặt hàng không?',
    answer: 'Nếu đơn hàng chưa được xử lý, bạn có thể liên hệ bộ phận hỗ trợ để thay đổi địa chỉ giao hàng. Tuy nhiên, nếu đơn hàng đã được giao cho đơn vị vận chuyển, việc thay đổi địa chỉ sẽ không khả thi.',
  },
  {
    id: 4,
    category: 'shipping',
    question: 'Thời gian giao hàng là bao lâu?',
    answer: 'Chúng tôi cung cấp 3 phương thức giao hàng:\n• Tiêu chuẩn: 5-7 ngày làm việc\n• Nhanh: 2-3 ngày làm việc\n• Giao nhanh qua đêm: 1 ngày làm việc\nThời gian giao hàng được tính từ khi đơn hàng được xác nhận và xử lý.',
  },
  {
    id: 5,
    category: 'shipping',
    question: 'Phí vận chuyển được tính như thế nào?',
    answer: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫ trở lên với phương thức giao hàng tiêu chuẩn. Với đơn hàng dưới 500.000₫, phí vận chuyển tiêu chuẩn là 30.000₫. Phí giao nhanh là 60.000₫ và giao qua đêm là 120.000₫.',
  },
  {
    id: 6,
    category: 'shipping',
    question: 'Tôi có thể theo dõi đơn hàng của mình không?',
    answer: 'Có! Sau khi đơn hàng được giao cho đơn vị vận chuyển, bạn sẽ nhận được mã theo dõi. Bạn có thể xem trạng thái đơn hàng trong phần "Đơn hàng" trên tài khoản của mình, hoặc sử dụng mã theo dõi để kiểm tra trực tiếp trên trang web của đơn vị vận chuyển.',
  },
  {
    id: 7,
    category: 'payment',
    question: 'TechStore chấp nhận những phương thức thanh toán nào?',
    answer: 'Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ (Visa, MasterCard, American Express) thông qua cổng thanh toán Stripe an toàn. Chúng tôi cũng đang phát triển tích hợp PayPal và sẽ sớm có mặt.',
  },
  {
    id: 8,
    category: 'payment',
    question: 'Thanh toán trên TechStore có an toàn không?',
    answer: 'Hoàn toàn an toàn! Chúng tôi sử dụng cổng thanh toán Stripe — một trong những nền tảng thanh toán được tin cậy nhất thế giới. Thông tin thẻ của bạn được mã hóa end-to-end và không bao giờ lưu trữ trên máy chủ của chúng tôi. Tất cả giao dịch đều tuân thủ tiêu chuẩn PCI DSS.',
  },
  {
    id: 9,
    category: 'payment',
    question: 'Tôi có thể sử dụng mã giảm giá như thế nào?',
    answer: 'Trong trang thanh toán, bạn sẽ thấy ô "Mã giảm giá" ở phần tóm tắt đơn hàng. Nhập mã và nhấn "Áp dụng". Nếu mã hợp lệ, giá trị giảm giá sẽ được tự động trừ vào tổng đơn hàng. Mỗi đơn hàng chỉ được sử dụng một mã giảm giá.',
  },
  {
    id: 10,
    category: 'return',
    question: 'Chính sách đổi trả như thế nào?',
    answer: 'Bạn có thể đổi hoặc trả sản phẩm trong vòng 30 ngày kể từ ngày nhận hàng. Sản phẩm phải còn nguyên tem, nhãn, bao bì và chưa qua sử dụng. Liên hệ bộ phận hỗ trợ để bắt đầu quy trình đổi trả. Chúng tôi sẽ hoàn tiền trong vòng 5-7 ngày làm việc sau khi nhận được sản phẩm trả lại.',
  },
  {
    id: 11,
    category: 'return',
    question: 'Ai chịu phí vận chuyển khi đổi trả?',
    answer: 'Nếu sản phẩm bị lỗi hoặc giao sai, TechStore sẽ chịu toàn bộ chi phí vận chuyển đổi trả. Đối với trường hợp đổi ý, khách hàng sẽ chịu phí vận chuyển trả lại sản phẩm.',
  },
  {
    id: 12,
    category: 'account',
    question: 'Làm thế nào để tạo tài khoản?',
    answer: 'Nhấn vào nút "Đăng nhập" ở góc trên bên phải, sau đó chọn "Đăng ký". Bạn cần cung cấp tên, email và mật khẩu. Sau khi đăng ký, bạn có thể sử dụng tài khoản để mua sắm, theo dõi đơn hàng, và quản lý thông tin cá nhân.',
  },
  {
    id: 13,
    category: 'account',
    question: 'Tôi quên mật khẩu, phải làm sao?',
    answer: 'Hiện tại, bạn vui lòng liên hệ bộ phận hỗ trợ khách hàng qua email support@techstore.com để được hỗ trợ đặt lại mật khẩu. Chúng tôi đang phát triển tính năng đặt lại mật khẩu tự động và sẽ sớm triển khai.',
  },
  {
    id: 14,
    category: 'account',
    question: 'Làm thế nào để cập nhật thông tin cá nhân?',
    answer: 'Đăng nhập vào tài khoản, vào phần "Tài khoản" hoặc "Hồ sơ" trên thanh điều hướng. Tại đây bạn có thể cập nhật tên, số điện thoại, địa chỉ giao hàng và thay đổi mật khẩu.',
  },
  {
    id: 15,
    category: 'product',
    question: 'Sản phẩm trên TechStore có bảo hành không?',
    answer: 'Tất cả sản phẩm trên TechStore đều được bảo hành theo chính sách của nhà sản xuất. Ngoài ra, chúng tôi có chính sách bảo hành 30 ngày cam kết hoàn tiền nếu bạn không hài lòng với sản phẩm.',
  },
  {
    id: 16,
    category: 'product',
    question: 'Làm sao để đánh giá sản phẩm?',
    answer: 'Sau khi mua sản phẩm, bạn có thể vào trang chi tiết sản phẩm đó, chọn tab "Đánh giá" và viết nhận xét. Bạn cần đăng nhập để gửi đánh giá. Đánh giá của bạn sẽ giúp các khách hàng khác đưa ra quyết định mua sắm tốt hơn.',
  },
  {
    id: 17,
    category: 'product',
    question: 'Tôi muốn hỏi về sản phẩm, hỏi ở đâu?',
    answer: 'Bạn có thể đặt câu hỏi trực tiếp trên trang chi tiết sản phẩm trong tab "Hỏi đáp". Đội ngũ của chúng tôi hoặc cộng đồng người dùng sẽ trả lời câu hỏi của bạn. Ngoài ra, bạn cũng có thể sử dụng chatbot TechStore Assistant ở góc dưới bên phải để được hỗ trợ nhanh.',
  },
];

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqData.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-16 md:py-20"
        style={{
          background: 'linear-gradient(135deg, #1B3A5C 0%, #2E86C1 50%, #1B3A5C 100%)',
          backgroundSize: '200% 200%',
          animation: 'faq-gradient-flow 8s ease infinite',
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-15 rounded-full px-4 py-1.5 mb-6">
            <span className="text-lg">❓</span>
            <span className="text-white text-sm font-medium">Trung tâm hỗ trợ</span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold font-heading text-white mb-4"
            style={{ letterSpacing: '-0.03em' }}
          >
            Câu hỏi thường gặp
          </h1>
          <p className="text-white text-opacity-80 text-lg mb-8 max-w-2xl mx-auto">
            Tìm câu trả lời nhanh cho các thắc mắc phổ biến về đặt hàng, vận chuyển, thanh toán và nhiều hơn nữa.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <input
              id="faq-search-input"
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 rounded-2xl border-2 border-white border-opacity-20 bg-white bg-opacity-15 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:border-opacity-40 focus:bg-opacity-20 transition-all text-base backdrop-blur-sm"
              style={{ caretColor: 'white' }}
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white text-opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-opacity-60 hover:text-opacity-100 transition-opacity"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-16">
        {/* Category Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setExpandedId(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-text-secondary hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Count */}
        {searchQuery && (
          <div className="mb-6">
            <p className="text-text-secondary text-sm">
              Tìm thấy <strong className="text-text-primary">{filteredFaqs.length}</strong> kết quả cho "{searchQuery}"
            </p>
          </div>
        )}

        {/* FAQ List */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
                  expandedId === faq.id
                    ? 'shadow-lg ring-2 ring-primary-200'
                    : 'shadow-sm hover:shadow-md'
                }`}
              >
                <button
                  id={`faq-question-${faq.id}`}
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
                        expandedId === faq.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-primary-50 text-primary-600 group-hover:bg-primary-100'
                      }`}
                    >
                      {faqCategories.find((c) => c.id === faq.category)?.icon || '❓'}
                    </div>
                    <span
                      className={`font-semibold text-base transition-colors ${
                        expandedId === faq.id
                          ? 'text-primary-600'
                          : 'text-text-primary group-hover:text-primary-600'
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      expandedId === faq.id
                        ? 'rotate-180 text-primary-600'
                        : 'text-text-secondary'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: expandedId === faq.id ? '500px' : '0',
                  }}
                >
                  <div className="px-6 pb-6 pl-20">
                    <div className="border-t border-primary-100 pt-4">
                      <p className="text-text-secondary leading-relaxed whitespace-pre-line text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy kết quả</h3>
            <p className="text-text-secondary mb-6">
              Không có câu hỏi nào khớp với tìm kiếm của bạn. Hãy thử từ khóa khác hoặc liên hệ hỗ trợ.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Help CTA Section */}
        <div className="mt-12 bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-2xl p-8 md:p-10 text-center border-2 border-primary-100">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-2xl font-bold font-heading text-text-primary mb-3">
            Chưa tìm được câu trả lời?
          </h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn. Liên hệ qua email hoặc sử dụng chatbot để được hỗ trợ nhanh nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@techstore.com"
              className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-primary-700 transition-colors hover:shadow-lg"
            >
              <span>📧</span>
              <span>Gửi email hỗ trợ</span>
            </a>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-bold py-3 px-6 rounded-xl border-2 border-primary-200 hover:bg-primary-50 transition-colors"
            >
              <span>🛍️</span>
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes faq-gradient-flow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

export default FAQPage;
