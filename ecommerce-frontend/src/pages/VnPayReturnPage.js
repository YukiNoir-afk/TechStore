import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import { paymentsApi } from '../utils/api';
import axios from 'axios';

const VnPayReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
    const vnp_TxnRef = searchParams.get('vnp_TxnRef');
    
    setOrderId(vnp_TxnRef);

    if (!vnp_ResponseCode || !vnp_TxnRef) {
      setStatus('error');
      setErrorMessage('Không tìm thấy thông tin giao dịch.');
      return;
    }

    // Gửi toàn bộ query string về backend để verify chữ ký
    const verifyPayment = async () => {
      try {
        const queryString = searchParams.toString();
        const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/v1/payments/vnpay/callback?${queryString}`);
        
        if (res.data.success && res.data.result.isSuccess && res.data.result.responseCode === '00') {
          setStatus('success');
          localStorage.removeItem('guestCart');
          // Tự động chuyển hướng về trang xác nhận đơn hàng sau 3 giây
          const timer = setTimeout(() => {
            navigate(`/order-confirmation/${vnp_TxnRef}`);
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          setStatus('error');
          setErrorMessage('Giao dịch không thành công hoặc đã bị hủy.');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.error || 'Xác thực thanh toán thất bại.');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-700">Đang kiểm tra kết quả thanh toán VNPay...</h2>
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
            {errorMessage || 'Đã có lỗi xảy ra trong quá trình thanh toán qua VNPay hoặc bạn đã hủy giao dịch.'}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán VNPay thành công!</h2>
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

export default VnPayReturnPage;
