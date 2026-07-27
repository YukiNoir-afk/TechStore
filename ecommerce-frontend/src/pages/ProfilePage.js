import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { profileApi, authApi, vouchersApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import './ProfilePage.css';

const ProfilePage = ({ user, onUserUpdate }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // Info form
  const [infoForm, setInfoForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Address
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    street: '', city: '', state: '', zipCode: '', country: 'Việt Nam', isDefault: false
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchVouchers();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.get();
      if (!res.data || !res.data.user) {
        throw new Error('Dữ liệu không hợp lệ từ máy chủ');
      }
      setProfile(res.data);
      setAddresses(res.data.addresses || []);
      setInfoForm({
        firstName: res.data.user.firstName || '',
        lastName: res.data.user.lastName || '',
        phone: res.data.user.phone || '',
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.');
      } else {
        setError(err.response?.data?.error || err.message || 'Không thể tải thông tin tài khoản.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    setVouchersLoading(true);
    try {
      const res = await vouchersApi.getAll();
      setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch vouchers', err);
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Đã sao chép mã voucher!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getVoucherStatus = (v) => {
    if (v.isUsed) return { text: 'Đã sử dụng', class: 'used', icon: '✅' };
    if (new Date(v.expiryDate) < new Date()) return { text: 'Hết hạn', class: 'expired', icon: '⏰' };
    return { text: 'Có thể sử dụng', class: 'active', icon: '🎟️' };
  };

  // ── Info Tab ──
  const handleInfoSave = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await authApi.updateProfile(infoForm);
      // Update parent user state
      if (onUserUpdate) {
        const updatedUser = { ...user, ...res.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
      }
      setProfile(prev => ({ ...prev, user: { ...prev.user, ...res.data } }));
      showToast('Cập nhật thông tin thành công!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Cập nhật thất bại', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  // ── Password Tab ──
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '', class: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: score, text: 'Yếu', class: 'weak' };
    if (score <= 3) return { level: score, text: 'Trung bình', class: 'medium' };
    return { level: score, text: 'Mạnh', class: 'strong' };
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Đổi mật khẩu thành công!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Đổi mật khẩu thất bại', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Address Tab ──
  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ street: '', city: '', state: '', zipCode: '', country: 'Việt Nam', isDefault: false });
    }
    setShowAddressModal(true);
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await profileApi.updateAddress(editingAddress.id, addressForm);
        showToast('Cập nhật địa chỉ thành công!');
      } else {
        await profileApi.addAddress(addressForm);
        showToast('Thêm địa chỉ thành công!');
      }
      setShowAddressModal(false);
      // Refresh addresses
      const res = await profileApi.getAddresses();
      setAddresses(res.data);
    } catch (err) {
      showToast(err.response?.data?.error || 'Lưu địa chỉ thất bại', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await profileApi.deleteAddress(id);
      const res = await profileApi.getAddresses();
      setAddresses(res.data);
      showToast('Đã xóa địa chỉ!');
    } catch (err) {
      showToast('Xóa thất bại', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await profileApi.setDefaultAddress(id);
      const res = await profileApi.getAddresses();
      setAddresses(res.data);
      showToast('Đã đặt địa chỉ mặc định!');
    } catch (err) {
      showToast('Cập nhật thất bại', 'error');
    }
  };

  // ── Render ──
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi Tải Dữ Liệu</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <div className="flex gap-4">
          <button onClick={fetchProfile} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Thử lại</button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">Đăng xuất</button>
        </div>
      </div>
    );
  }
  if (!profile) return null;

  const { user: profileUser, stats } = profile;
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  const getTierInfo = (tier) => {
    const tiers = {
      Bronze: { icon: '🥉', thresholds: { min: 0, max: 500 } },
      Silver: { icon: '🥈', thresholds: { min: 500, max: 1500 } },
      Gold: { icon: '🥇', thresholds: { min: 1500, max: 3000 } },
      Platinum: { icon: '💎', thresholds: { min: 3000, max: 5000 } },
    };
    return tiers[tier] || tiers.Bronze;
  };

  const tierInfo = getTierInfo(profileUser.loyaltyTier);
  const progressPercent = profileUser.loyaltyTier === 'Platinum'
    ? 100
    : Math.min(100, ((profileUser.points - tierInfo.thresholds.min) / (tierInfo.thresholds.max - tierInfo.thresholds.min)) * 100);

  const initials = `${(profileUser.firstName || '')[0] || ''}${(profileUser.lastName || '')[0] || ''}`.toUpperCase();

  return (
    <div className="bg-background min-h-screen">
      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {profileUser.avatarUrl ? (
                <img src={profileUser.avatarUrl} alt="Avatar" />
              ) : (
                <span>{initials || '👤'}</span>
              )}
            </div>
          </div>
          <div className="profile-user-info">
            <h1>{profileUser.firstName} {profileUser.lastName}</h1>
            <p>{profileUser.email}</p>
            <span className={`profile-tier-badge tier-${profileUser.loyaltyTier?.toLowerCase()}`}>
              {tierInfo.icon} {profileUser.loyaltyTier}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon orders">📦</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Đơn hàng</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon spent">💰</div>
          <div className="stat-value">{formatPrice(stats.totalSpent || 0)}</div>
          <div className="stat-label">Tổng chi tiêu</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon points">⭐</div>
          <div className="stat-value">{profileUser.points}</div>
          <div className="stat-label">Điểm thưởng</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            👤 Thông tin
          </button>
          <button className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
            📍 Địa chỉ
          </button>
          <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            🔒 Bảo mật
          </button>
          <button className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
            🏆 Thưởng
          </button>
          <button className={`tab-btn ${activeTab === 'vouchers' ? 'active' : ''}`} onClick={() => { setActiveTab('vouchers'); fetchVouchers(); }}>
            🎟️ Voucher {vouchers.filter(v => !v.isUsed && new Date(v.expiryDate) >= new Date()).length > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', padding: '1px 7px', fontSize: '0.7rem', marginLeft: '4px', fontWeight: 700 }}>
                {vouchers.filter(v => !v.isUsed && new Date(v.expiryDate) >= new Date()).length}
              </span>
            )}
          </button>
        </div>

        <div className="tab-content" key={activeTab}>
          {/* ── Info Tab ── */}
          {activeTab === 'info' && (
            <div className="profile-form-card">
              <h2>✏️ Chỉnh sửa thông tin cá nhân</h2>
              <form onSubmit={handleInfoSave}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="profile-firstName">Họ</label>
                    <input
                      id="profile-firstName"
                      type="text"
                      value={infoForm.firstName}
                      onChange={e => setInfoForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nhập họ"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-lastName">Tên</label>
                    <input
                      id="profile-lastName"
                      type="text"
                      value={infoForm.lastName}
                      onChange={e => setInfoForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Nhập tên"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-email">Email</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileUser.email}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profile-phone">Số điện thoại</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={infoForm.phone}
                      onChange={e => setInfoForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="form-group full-width" style={{ paddingTop: '0.5rem', fontSize: '0.85rem', color: '#7F8C8D' }}>
                    Thành viên từ: {new Date(profileUser.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={savingInfo}>
                    {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Addresses Tab ── */}
          {activeTab === 'addresses' && (
            <div>
              <div className="address-grid">
                {addresses.map(addr => (
                  <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                    {addr.isDefault && (
                      <div className="address-default-badge">✓ Mặc định</div>
                    )}
                    <div className="address-detail">
                      <div style={{ fontWeight: 600 }}>{addr.street}</div>
                      <div>{addr.city}, {addr.state}</div>
                      <div>{addr.zipCode}</div>
                      <div>{addr.country}</div>
                    </div>
                    <div className="address-actions">
                      <button className="btn-edit" onClick={() => openAddressModal(addr)}>✏️ Sửa</button>
                      {!addr.isDefault && (
                        <button className="btn-set-default" onClick={() => handleSetDefault(addr.id)}>⭐ Mặc định</button>
                      )}
                      <button className="btn-delete" onClick={() => handleDeleteAddress(addr.id)}>🗑️ Xóa</button>
                    </div>
                  </div>
                ))}
                <div className="add-address-card" onClick={() => openAddressModal()}>
                  <div className="plus-icon">+</div>
                  <span style={{ fontWeight: 600 }}>Thêm địa chỉ mới</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="profile-form-card">
              <h2>🔒 Đổi mật khẩu</h2>
              <form onSubmit={handlePasswordSave}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="profile-currentPassword">Mật khẩu hiện tại</label>
                    <input
                      id="profile-currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="profile-newPassword">Mật khẩu mới</label>
                    <input
                      id="profile-newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      required
                      minLength={6}
                    />
                    {passwordForm.newPassword && (
                      <>
                        <div className="password-strength">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className={`password-strength-bar ${i <= passwordStrength.level ? `active ${passwordStrength.class}` : ''}`}
                            />
                          ))}
                        </div>
                        <div className={`password-strength-text ${passwordStrength.class}`}>
                          {passwordStrength.text}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="profile-confirmPassword">Xác nhận mật khẩu mới</label>
                    <input
                      id="profile-confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                    />
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <span style={{ color: '#E74C3C', fontSize: '0.8rem' }}>Mật khẩu xác nhận không khớp</span>
                    )}
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                  >
                    {savingPassword ? 'Đang lưu...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Rewards Tab ── */}
          {activeTab === 'rewards' && (
            <div className="rewards-container">
              <div className="rewards-tier-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem' }}>{tierInfo.icon}</span>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2C3E50', margin: 0 }}>
                      Hạng {profileUser.loyaltyTier}
                    </h2>
                    <p style={{ color: '#7F8C8D', margin: 0, fontSize: '0.9rem' }}>
                      {profileUser.loyaltyTier === 'Platinum'
                        ? 'Bạn đã đạt hạng cao nhất! 🎉'
                        : `Cần thêm ${stats.pointsToNextTier > 0 ? stats.pointsToNextTier : 0} điểm để lên hạng ${stats.nextTier}`
                      }
                    </p>
                  </div>
                </div>
                <div className="tier-progress">
                  <div className="tier-progress-bar">
                    <div className="tier-progress-fill" style={{ width: `${Math.max(5, progressPercent)}%` }} />
                  </div>
                  <div className="tier-labels">
                    <span className="current">{profileUser.loyaltyTier}</span>
                    {profileUser.loyaltyTier !== 'Platinum' && <span>{stats.nextTier}</span>}
                  </div>
                </div>
              </div>

              <div className="rewards-info-card">
                <h3>⭐ Điểm hiện tại</h3>
                <div className="info-value">{profileUser.points}</div>
                <div className="info-label">Điểm thưởng tích lũy</div>
              </div>

              <div className="rewards-info-card">
                <h3>💵 Tổng chi tiêu</h3>
                <div className="info-value">{formatPrice(stats.totalSpent || 0)}</div>
                <div className="info-label">Trên {stats.totalOrders} đơn hàng</div>
              </div>

              {/* Tier Benefits */}
              <div className="profile-form-card" style={{ gridColumn: '1 / -1' }}>
                <h2>🎁 Quyền lợi thành viên</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { tier: 'Bronze', icon: '🥉', perks: ['Tích điểm x1', 'Ưu đãi cơ bản'] },
                    { tier: 'Silver', icon: '🥈', perks: ['Tích điểm x1.5', 'Freeship đơn > 500K', 'Sale sớm'] },
                    { tier: 'Gold', icon: '🥇', perks: ['Tích điểm x2', 'Freeship mọi đơn', 'Quà sinh nhật'] },
                    { tier: 'Platinum', icon: '💎', perks: ['Tích điểm x3', 'Freeship ưu tiên', 'Hỗ trợ VIP', 'Ưu đãi độc quyền'] },
                  ].map(t => (
                    <div
                      key={t.tier}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '10px',
                        border: profileUser.loyaltyTier === t.tier ? '2px solid #2E86C1' : '2px solid #e1ecf7',
                        background: profileUser.loyaltyTier === t.tier ? '#f0f6fb' : 'white',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.icon}</div>
                      <div style={{ fontWeight: 700, color: '#2C3E50', marginBottom: '0.5rem' }}>{t.tier}</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {t.perks.map((p, i) => (
                          <li key={i} style={{ fontSize: '0.8rem', color: '#7F8C8D', padding: '0.125rem 0' }}>✓ {p}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Vouchers Tab ── */}
          {activeTab === 'vouchers' && (
            <div className="vouchers-container">
              <div className="profile-form-card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: 0 }}>🎟️ Voucher của tôi</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#7F8C8D' }}>
                      {vouchers.filter(v => !v.isUsed && new Date(v.expiryDate) >= new Date()).length} voucher khả dụng
                    </span>
                  </div>
                </div>

                {vouchersLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <Spinner />
                  </div>
                ) : vouchers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎫</div>
                    <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Bạn chưa có voucher nào</h3>
                    <p style={{ fontSize: '0.9rem' }}>Tiếp tục mua sắm để tích điểm và lên hạng — bạn sẽ nhận voucher thưởng khi đạt hạng mới!</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {vouchers.map(v => {
                      const status = getVoucherStatus(v);
                      const isUsable = !v.isUsed && new Date(v.expiryDate) >= new Date();
                      return (
                        <div
                          key={v.id}
                          className={`voucher-card voucher-${status.class}`}
                          style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            borderRadius: '12px',
                            border: isUsable ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                            overflow: 'hidden',
                            background: isUsable ? 'linear-gradient(135deg, #eff6ff, #f0f9ff)' : '#f8fafc',
                            opacity: isUsable ? 1 : 0.65,
                            transition: 'all 0.2s',
                          }}
                        >
                          {/* Left side - Discount */}
                          <div style={{
                            padding: '1.25rem',
                            minWidth: '140px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isUsable
                              ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                              : '#94a3b8',
                            color: 'white',
                            position: 'relative',
                          }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: '4px' }}>GIẢM</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>
                              {v.discountType === 'Percentage' ? `${v.discountValue}%` : formatPrice(v.discountValue)}
                            </div>
                            {v.minOrderValue && (
                              <div style={{ fontSize: '0.65rem', opacity: 0.85, marginTop: '6px', textAlign: 'center' }}>
                                Đơn từ {formatPrice(v.minOrderValue)}
                              </div>
                            )}
                          </div>

                          {/* Right side - Info */}
                          <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <code style={{
                                background: isUsable ? '#dbeafe' : '#f1f5f9',
                                color: isUsable ? '#1e40af' : '#64748b',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                letterSpacing: '0.5px',
                              }}>
                                {v.code}
                              </code>
                              {isUsable && (
                                <button
                                  onClick={() => handleCopyCode(v.code)}
                                  style={{
                                    border: 'none',
                                    background: copiedCode === v.code ? '#22c55e' : '#e2e8f0',
                                    color: copiedCode === v.code ? 'white' : '#64748b',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  {copiedCode === v.code ? '✓ Đã sao chép' : '📋 Sao chép'}
                                </button>
                              )}
                              <span style={{
                                marginLeft: 'auto',
                                padding: '2px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: status.class === 'active' ? '#dcfce7' : status.class === 'used' ? '#f1f5f9' : '#fef2f2',
                                color: status.class === 'active' ? '#166534' : status.class === 'used' ? '#64748b' : '#991b1b',
                              }}>
                                {status.icon} {status.text}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                              <span>📅 HSD: {new Date(v.expiryDate).toLocaleDateString('vi-VN')}</span>
                              <span>🏅 Hạng: {v.tierRequired}</span>
                              <span>📦 Nguồn: {v.source === 'System' ? 'Hệ thống (lên hạng)' : 'Admin tặng'}</span>
                              {v.isUsed && v.usedAt && (
                                <span>✅ Dùng ngày: {new Date(v.usedAt).toLocaleDateString('vi-VN')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tip */}
                {vouchers.length > 0 && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#fefce8',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    color: '#92400e',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                  }}>
                    <span>💡</span>
                    <span>Sao chép mã voucher và nhập vào ô <strong>"Mã giảm giá"</strong> khi thanh toán để được giảm giá. Mỗi voucher chỉ dùng được 1 lần.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Address Modal ── */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingAddress ? '✏️ Sửa địa chỉ' : '➕ Thêm địa chỉ mới'}</h3>
            <form onSubmit={handleAddressSave}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="addr-street">Địa chỉ</label>
                  <input
                    id="addr-street"
                    type="text"
                    value={addressForm.street}
                    onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Số nhà, tên đường..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr-city">Thành phố</label>
                  <input
                    id="addr-city"
                    type="text"
                    value={addressForm.city}
                    onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="VD: Hồ Chí Minh"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr-state">Tỉnh/Quận</label>
                  <input
                    id="addr-state"
                    type="text"
                    value={addressForm.state}
                    onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="VD: Quận 1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr-zipCode">Mã bưu điện</label>
                  <input
                    id="addr-zipCode"
                    type="text"
                    value={addressForm.zipCode}
                    onChange={e => setAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="VD: 700000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="addr-country">Quốc gia</label>
                  <input
                    id="addr-country"
                    type="text"
                    value={addressForm.country}
                    onChange={e => setAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="VD: Việt Nam"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={e => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#2E86C1' }}
                    />
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddressModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={savingAddress}>
                  {savingAddress ? 'Đang lưu...' : (editingAddress ? 'Cập nhật' : 'Thêm địa chỉ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
