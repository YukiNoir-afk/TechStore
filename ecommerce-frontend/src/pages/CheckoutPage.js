import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '../components/Button';
import { ordersApi, paymentsApi, profileApi, promoApi, vouchersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

// ── Constant Options for Stripe Elements ─────────────────────────────────────
// Defined at module level to prevent re-creation and losing focus on keystrokes
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// ── Stripe Card Form (Inner Component containing Stripe hooks) ───────────────
const StripePaymentForm = ({ total, onSuccess, onError, isLoading, setIsLoading, formData }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleStripePayment = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe has not loaded yet
      return;
    }

    setIsLoading(true);
    onError('');

    try {
      // Step 1: Create PaymentIntent on backend
      const intentRes = await paymentsApi.createIntent(total);
      const { clientSecret, paymentIntentId } = intentRes.data;

      // Step 2: Confirm payment with Stripe (card details never touch our server)
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
          },
        },
      });

      if (error) {
        onError(error.message || 'Thanh toán thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntentId);
      } else {
        onError('Thanh toán chưa hoàn tất. Vui lòng thử lại.');
        setIsLoading(false);
      }
    } catch (err) {
      onError(err.response?.data?.error || 'Xử lý thanh toán thất bại.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleStripePayment} className="mt-4">
      <div className="space-y-4">
        {/* Card Number Field */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Số thẻ</label>
          <div className="border-2 border-primary-200 rounded-lg px-4 py-3 focus-within:border-primary-500 transition-colors bg-white">
            <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>

        {/* Expiry and CVC Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Ngày hết hạn (MM/YY)</label>
            <div className="border-2 border-primary-200 rounded-lg px-4 py-3 focus-within:border-primary-500 transition-colors bg-white">
              <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Mã bảo mật (CVC)</label>
            <div className="border-2 border-primary-200 rounded-lg px-4 py-3 focus-within:border-primary-500 transition-colors bg-white">
              <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
        <span>🔒</span> Thông tin thẻ được mã hóa và xử lý an toàn bởi Stripe. Chúng tôi không lưu trữ chi tiết thẻ của bạn.
      </p>



      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base mt-4"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Đang xử lý...
          </span>
        ) : (
          `Thanh toán ${formatPrice(total)}`
        )}
      </button>
    </form>
  );
};

// ── Main Checkout Page Content ───────────────────────────────────────────────
const CheckoutPageInner = ({ cartItems, user, onOrderPlaced, stripePromise, isStripeConfigured }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Việt Nam',
    shippingMethod: 'standard',
    paymentMethod: 'momo_qr',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Saved addresses from profile
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null); // { code, discountType, discountValue, minOrderValue }
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Load saved addresses on mount
  useEffect(() => {
    if (user) {
      profileApi.getAddresses()
        .then(res => {
          const addrs = res.data || [];
          setSavedAddresses(addrs);
          // Auto-fill with default address
          const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setFormData(prev => ({
              ...prev,
              address: defaultAddr.street,
              city: defaultAddr.city,
              state: defaultAddr.state,
              zipCode: defaultAddr.zipCode,
              country: defaultAddr.country || 'Việt Nam',
            }));
          } else {
            setUseNewAddress(true);
          }
        })
        .catch(() => {
          setUseNewAddress(true);
        });
    }
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setUseNewAddress(false);
    setFormData(prev => ({
      ...prev,
      address: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country || 'Việt Nam',
    }));
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setUseNewAddress(true);
    setFormData(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Việt Nam',
    }));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const shipping = formData.shippingMethod === 'standard' ? (subtotal > 500000 ? 0 : 30000)
    : formData.shippingMethod === 'express' ? 60000 : 120000;

  // Calculate discount
  let discountAmount = 0;
  if (promoApplied) {
    if (promoApplied.discountType === 'Percentage') {
      discountAmount = Math.round(subtotal * (promoApplied.discountValue / 100) * 100) / 100;
    } else {
      discountAmount = promoApplied.discountValue;
    }
  }

  const total = Math.max(0, subtotal - discountAmount + tax + shipping);

  // Promo code handlers
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      // Try promo code first
      const res = await promoApi.validate(promoCode.trim());
      const promo = res.data;
      // Check min order value
      if (promo.minOrderValue && subtotal < promo.minOrderValue) {
        setPromoError(`Đơn hàng tối thiểu ${formatPrice(promo.minOrderValue)} để áp dụng mã này`);
        setPromoApplied(null);
      } else {
        setPromoApplied({ ...promo, isVoucher: false });
        setPromoError('');
      }
    } catch (err) {
      // If promo code fails, try as voucher code
      try {
        const vRes = await vouchersApi.validate(promoCode.trim());
        const voucher = vRes.data;
        if (voucher.minOrderValue && subtotal < voucher.minOrderValue) {
          setPromoError(`Đơn hàng tối thiểu ${formatPrice(voucher.minOrderValue)} để áp dụng voucher này`);
          setPromoApplied(null);
        } else {
          setPromoApplied({ ...voucher, isVoucher: true });
          setPromoError('');
        }
      } catch (vErr) {
        setPromoError(err.response?.data?.error || 'Mã giảm giá / voucher không hợp lệ');
        setPromoApplied(null);
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (paymentIntentId = null) => {
    if (!user) {
      setError('Vui lòng đăng nhập để đặt hàng');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await ordersApi.create({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        shippingMethod: formData.shippingMethod,
        paymentMethod: formData.paymentMethod,
        paymentIntentId,
        promoCode: promoApplied?.isVoucher ? null : (promoApplied?.code || null),
        voucherCode: promoApplied?.isVoucher ? promoApplied.code : null,
      });

      if (formData.paymentMethod === 'momo_qr') {
        // Redirect to MoMo payment page (QR Code)
        const momoRes = await paymentsApi.createMomoPayment(res.data.id, 'captureWallet');
        window.location.href = momoRes.data.payUrl;
      } else if (formData.paymentMethod === 'momo_atm') {
        // Redirect to MoMo payment page (ATM)
        const momoRes = await paymentsApi.createMomoPayment(res.data.id, 'payWithATM');
        window.location.href = momoRes.data.payUrl;
      } else {
        if (onOrderPlaced) onOrderPlaced();
        // Stripe and COD
        navigate(`/order-confirmation/${res.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đặt hàng thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="bg-background min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn đang trống</h1>
            <Link to="/products">
              <Button size="lg" variant="primary">Tiếp tục mua sắm</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold font-heading text-text-primary mb-8">Thanh toán</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8 flex justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center space-x-2 ${s <= step ? 'text-primary-600' : 'text-text-secondary'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${s <= step ? 'bg-primary-600 text-white' : 'bg-primary-100'}`}>{s}</div>
                  <span className="hidden sm:inline text-sm font-medium">{s === 1 ? 'Giao hàng' : s === 2 ? 'Thanh toán' : 'Kiểm tra'}</span>
                </div>
              ))}
            </div>

            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold font-heading text-text-primary mb-6">Địa chỉ giao hàng</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Địa chỉ email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Tên</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Họ</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                    </div>
                  </div>

                  {/* Saved Addresses Selector */}
                  {savedAddresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-3">Chọn địa chỉ đã lưu</label>
                      <div className="space-y-2">
                        {savedAddresses.map(addr => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedAddressId === addr.id && !useNewAddress
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-primary-100 hover:border-primary-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={selectedAddressId === addr.id && !useNewAddress}
                              onChange={() => handleSelectAddress(addr)}
                              className="mt-1 w-4 h-4"
                            />
                            <div className="flex-grow">
                              <div className="font-medium text-text-primary text-sm">
                                {addr.street}
                                {addr.isDefault && (
                                  <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Mặc định</span>
                                )}
                              </div>
                              <div className="text-text-secondary text-xs mt-0.5">
                                {addr.city}, {addr.state} {addr.zipCode} · {addr.country}
                              </div>
                            </div>
                          </label>
                        ))}
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            useNewAddress
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-primary-100 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={useNewAddress}
                            onChange={handleUseNewAddress}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-text-primary text-sm">+ Nhập địa chỉ mới</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Address fields - show always if no saved, or when "new address" selected */}
                  {(savedAddresses.length === 0 || useNewAddress) ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Địa chỉ</label>
                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" placeholder="Số nhà, tên đường..." />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">Thành phố</label>
                          <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">Tỉnh/Thành</label>
                          <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">Mã ZIP</label>
                          <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500" />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Show read-only summary when a saved address is selected */
                    <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                      <p className="text-sm font-medium text-text-primary">{formData.address}</p>
                      <p className="text-sm text-text-secondary">{formData.city}, {formData.state} {formData.zipCode}</p>
                      <p className="text-sm text-text-secondary">{formData.country}</p>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t-2 border-primary-100">
                    <h3 className="text-lg font-bold font-heading text-text-primary mb-4">Phương thức giao hàng</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'standard', label: 'Tiêu chuẩn (5-7 ngày)', price: subtotal > 500000 ? 'MIỄN PHÍ' : formatPrice(30000) },
                        { id: 'express', label: 'Nhanh (2-3 ngày)', price: formatPrice(60000) },
                        { id: 'overnight', label: 'Giao nhanh qua đêm', price: formatPrice(120000) }
                      ].map((m) => (
                        <label key={m.id} className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name="shippingMethod" value={m.id} checked={formData.shippingMethod === m.id} onChange={handleInputChange} className="w-4 h-4" />
                          <span className="flex-grow">{m.label}</span>
                          <span className="font-semibold text-primary-600">{m.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold font-heading text-text-primary mb-6">Phương thức thanh toán</h2>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { id: 'momo_qr', label: '📱 Ví điện tử MoMo (Quét mã QR)' },
                      { id: 'momo_atm', label: '💳 Thẻ ATM Nội Địa (Qua cổng MoMo)' },
                      { id: 'cod', label: '💵 Thanh toán khi nhận hàng (COD)' }
                    ].map((m) => (
                      <label key={m.id} className="flex items-center space-x-3 cursor-pointer">
                        <input type="radio" name="paymentMethod" value={m.id} checked={formData.paymentMethod === m.id} onChange={handleInputChange} className="w-4 h-4" />
                        <span className="font-medium text-text-primary">{m.label}</span>
                      </label>
                    ))}
                  </div>

                  {formData.paymentMethod === 'cod' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <p className="text-green-800 font-medium">💵 Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-green-600 text-sm mt-1">Bạn sẽ thanh toán bằng tiền mặt khi shipper giao hàng tới.</p>
                    </div>
                  )}

                  {formData.paymentMethod === 'momo_qr' && (
                    <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg text-center">
                      <p className="text-pink-800 font-medium">📱 Thanh toán qua Ví MoMo (Mã QR)</p>
                      <p className="text-pink-600 text-sm mt-1">Sử dụng ứng dụng MoMo trên điện thoại để quét mã QR thanh toán.</p>
                    </div>
                  )}

                  {formData.paymentMethod === 'momo_atm' && (
                    <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg text-center">
                      <p className="text-pink-800 font-medium">💳 Thanh toán bằng Thẻ ATM Nội Địa (MoMo)</p>
                      <p className="text-pink-600 text-sm mt-1">Bạn sẽ được chuyển hướng sang cổng thanh toán MoMo để nhập thông tin thẻ ATM.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">Địa chỉ giao hàng</h3>
                  <p>{formData.firstName} {formData.lastName}</p>
                  <p className="text-text-secondary">{formData.address}</p>
                  <p className="text-text-secondary">{formData.city}, {formData.state} {formData.zipCode}</p>
                  <p className="text-text-secondary mt-2">{formData.email}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">Sản phẩm đã đặt</h3>
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-primary-100">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-4 mt-6">
              {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>← Quay lại</Button>}
              <div className="flex-grow"></div>
              {/* Show Next only on steps 1 and 2 */}
              {step < 3 && (
                <Button variant="primary" size="lg" onClick={() => {
                  setStep(step === 2 ? 3 : 2);
                }}>
                  {step === 2 ? 'Kiểm tra đơn hàng →' : 'Tiếp theo →'}
                </Button>
              )}
              {step === 3 && (
                <Button variant="primary" size="lg" fullWidth loading={isLoading} onClick={() => handlePlaceOrder(null)}>
                  Đặt hàng
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold font-heading text-text-primary mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-3 mb-6 pb-6 border-b-2 border-primary-100 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{item.name} × {item.quantity}</span>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Promo Code Section */}
              <div className="mb-6 pb-6 border-b-2 border-primary-100">
                <label className="block text-sm font-medium text-text-primary mb-2">🏷️ Mã giảm giá / Voucher</label>
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div>
                      <span className="font-bold text-green-700 text-sm">✅ {promoApplied.code} {promoApplied.isVoucher && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">Voucher</span>}</span>
                      <span className="text-green-600 text-xs block">
                        Giảm {promoApplied.discountType === 'Percentage'
                          ? `${promoApplied.discountValue}%`
                          : `Giảm ${formatPrice(promoApplied.discountValue)}`
                        }
                      </span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
                    >
                      ✕ Bỏ
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="checkout-promo-input"
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Nhập mã giảm giá hoặc voucher"
                      className="flex-grow border-2 border-primary-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 uppercase"
                    />
                    <button
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {promoLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-red-500 text-xs mt-2">❌ {promoError}</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-text-secondary">Tạm tính</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({promoApplied.code})</span>
                    <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className="text-text-secondary">Thuế (10%)</span><span className="font-semibold">{formatPrice(tax)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Vận chuyển</span><span className="font-semibold">{shipping === 0 ? <span className="text-green-600">MIỄN PHÍ</span> : formatPrice(shipping)}</span></div>
              </div>
              <div className="border-t-2 border-primary-100 pt-4">
                <div className="flex justify-between text-lg font-bold"><span>Tổng</span><span className="text-primary-600">{formatPrice(total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Outer wrapper that provides Stripe Elements context ───────────────────────
const CheckoutPage = (props) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);

  useEffect(() => {
    paymentsApi.getConfig()
      .then(res => {
        const data = res.data;
        if (data.publishableKey && !data.publishableKey.includes('YOUR_STRIPE')) {
          setStripePromise(loadStripe(data.publishableKey));
          setIsStripeConfigured(true);
        }
      })
      .catch(() => {}); // silently fail — demo mode shown
  }, []);

  return (
    <CheckoutPageInner
      {...props}
      stripePromise={stripePromise}
      isStripeConfigured={isStripeConfigured}
    />
  );
};

export default CheckoutPage;
