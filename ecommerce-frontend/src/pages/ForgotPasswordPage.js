import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { authApi } from '../utils/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
            <h1 className="text-3xl font-bold font-heading text-text-primary mb-2">Quên mật khẩu?</h1>
            <p className="text-text-secondary">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          {sent ? (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                border: '1px solid #6ee7b7',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <h3 style={{ color: '#065f46', margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                  Email đã được gửi!
                </h3>
                <p style={{ color: '#047857', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Nếu tài khoản với email <strong>{email}</strong> tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. 
                  Vui lòng kiểm tra hộp thư đến (và thư mục spam).
                </p>
              </div>
              <div className="text-center">
                <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Địa chỉ email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="email@duongdan.com" 
                    required 
                  />
                </div>
                <Button variant="primary" size="lg" fullWidth loading={loading}>Gửi liên kết đặt lại</Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-text-secondary">
                  Nhớ mật khẩu rồi? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">Đăng nhập</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
