import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { authApi } from '../utils/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, form.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 className="text-2xl font-bold text-text-primary mb-4">Liên kết không hợp lệ</h1>
            <p className="text-text-secondary mb-6">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.
            </p>
            <Link to="/forgot-password" className="text-primary-600 font-bold hover:text-primary-700">
              Yêu cầu liên kết mới →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
            <h1 className="text-3xl font-bold font-heading text-text-primary mb-2">Đặt lại mật khẩu</h1>
            <p className="text-text-secondary">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          {success ? (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                border: '1px solid #6ee7b7',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ color: '#065f46', margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                  Mật khẩu đã được đặt lại!
                </h3>
                <p style={{ color: '#047857', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  Mật khẩu của bạn đã được thay đổi thành công. 
                  Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                </p>
              </div>
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-block w-full text-center py-3 px-4 rounded-lg font-bold text-white transition-colors"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  Đăng nhập ngay →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    value={form.confirmPassword} 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})}
                    className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                  />
                </div>
                <Button variant="primary" size="lg" fullWidth loading={loading}>Đặt lại mật khẩu</Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-text-secondary">
                  <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">← Quay lại đăng nhập</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
