import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-primary-600 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold font-heading mb-4">Về TechStore</h3>
            <p className="text-primary-100 text-sm leading-relaxed">
              Cửa hàng trực tuyến uy tín với sản phẩm chất lượng. Giao hàng nhanh, thanh toán an toàn và chăm sóc khách hàng tận tâm.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold font-heading mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-primary-100 hover:text-white transition-colors">
                  Mua sắm ngay
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-100 hover:text-white transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-100 hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-100 hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold font-heading mb-4">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2">
              <li>
                <a href="/shipping" className="text-primary-100 hover:text-white transition-colors">
                  Thông tin giao hàng
                </a>
              </li>
              <li>
                <a href="/returns" className="text-primary-100 hover:text-white transition-colors">
                  Đổi trả
                </a>
              </li>
              <li>
                <Link to="/order-lookup" className="text-primary-100 hover:text-white transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <a href="/privacy" className="text-primary-100 hover:text-white transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="/terms" className="text-primary-100 hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold font-heading mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <span>📧</span>
                <a href="mailto:support@techstore.com" className="text-primary-100 hover:text-white transition-colors">
                  support@techstore.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span>📞</span>
                <a href="tel:+1234567890" className="text-primary-100 hover:text-white transition-colors">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <span>📍</span>
                <span className="text-primary-100">123 Main St, City, Country</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-primary-500 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-100 text-sm">
              © 2024 TechStore. Bảo lưu mọi quyền.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-primary-100 hover:text-white transition-colors">
                Facebook
              </a>
              <a href="#" className="text-primary-100 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-primary-100 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="text-primary-100 hover:text-white transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
