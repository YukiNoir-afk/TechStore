import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const MomoReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'

  const resultCode = searchParams.get('resultCode');
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message');

  useEffect(() => {
    if (!resultCode || !orderId) {
      setStatus('error');
      return;
    }

    if (resultCode === '0') {
      setStatus('success');
      localStorage.removeItem('guestCart');
      // Tự động chuyển hướng về trang xác nhận đơn hàng sau 3 giây
      const timer = setTimeout(() => {
        navigate(`/order-confirmation/${orderId}`);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setStatus('error');
    }
  }, [resultCode, orderId, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Đang kiểm tra kết quả thanh toán...</h2>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h2>
          <p className="text-gray-600 mb-8">
            {message || 'Đã có lỗi xảy ra trong quá trình thanh toán qua MoMo hoặc bạn đã hủy giao dịch.'}
          </p>
          <div className="space-y-3">
            <Link to={orderId ? `/order-tracking` : `/cart`}>
              <Button fullWidth variant="primary">Thử thanh toán lại</Button>
            </Link>
            <Link to="/">
              <Button fullWidth variant="outline">Về trang chủ</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl text-green-500">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán MoMo thành công!</h2>
        <p className="text-gray-600 mb-8">
          Đơn hàng của bạn đã được thanh toán hoàn tất. Đang chuyển hướng về trang chi tiết đơn hàng...
        </p>
        <Link to={`/order-confirmation/${orderId}`}>
          <Button fullWidth variant="primary">Xem đơn hàng ngay</Button>
        </Link>
      </div>
    </div>
  );
};

export default MomoReturnPage;
