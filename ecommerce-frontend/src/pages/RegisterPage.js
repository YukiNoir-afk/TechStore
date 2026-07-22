import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { authApi } from '../utils/api';

const RegisterPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(form);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-heading text-text-primary mb-2">Tạo tài khoản</h1>
            <p className="text-text-secondary">Tham gia cùng chúng tôi và bắt đầu mua sắm</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-text-primary mb-2">Tên</label>
                <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500" required /></div>
              <div><label className="block text-sm font-medium text-text-primary mb-2">Họ</label>
                <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500" required /></div>
            </div>
            <div><label className="block text-sm font-medium text-text-primary mb-2">Địa chỉ email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500" placeholder="email@duongdan.com" required /></div>
            <div><label className="block text-sm font-medium text-text-primary mb-2">Mật khẩu</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500" placeholder="••••••••" required /></div>
            <Button variant="primary" size="lg" fullWidth loading={loading}>Đăng ký</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Đã có tài khoản? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
