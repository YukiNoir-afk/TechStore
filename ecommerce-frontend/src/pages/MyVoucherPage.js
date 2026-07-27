import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { vouchersApi, profileApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import './MyVoucherPage.css';

const TIER_MAP = {
  Bronze: { icon: '🥉', level: 0 },
  Silver: { icon: '🥈', level: 1 },
  Gold: { icon: '🥇', level: 2 },
  Platinum: { icon: '💎', level: 3 },
};

const MyVoucherPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('catalog');
  const [catalog, setCatalog] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catalogRes, vouchersRes, profileRes] = await Promise.all([
        vouchersApi.getCatalog(),
        vouchersApi.getAll(),
        profileApi.get(),
      ]);
      setCatalog(catalogRes.data || []);
      setMyVouchers(vouchersRes.data || []);
      setProfile(profileRes.data);
    } catch (err) {
      console.error('Failed to fetch voucher data', err);
      showToast('Không thể tải dữ liệu voucher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (templateId) => {
    setClaimingId(templateId);
    try {
      const res = await vouchersApi.claim(templateId);
      showToast(res.data.message || 'Nhận voucher thành công!');
      // Refresh data
      const [catalogRes, vouchersRes] = await Promise.all([
        vouchersApi.getCatalog(),
        vouchersApi.getAll(),
      ]);
      setCatalog(catalogRes.data || []);
      setMyVouchers(vouchersRes.data || []);
    } catch (err) {
      showToast(err.response?.data?.error || 'Nhận voucher thất bại', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Đã sao chép mã voucher!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getVoucherStatus = (v) => {
    if (v.isUsed) return { text: 'Đã sử dụng', cls: 'used', icon: '✅' };
    if (new Date(v.expiryDate) < new Date()) return { text: 'Hết hạn', cls: 'expired', icon: '⏰' };
    return { text: 'Có thể sử dụng', cls: 'active', icon: '🎟️' };
  };

  const activeVouchers = myVouchers.filter(v => !v.isUsed && new Date(v.expiryDate) >= new Date());

  if (loading) {
    return (
      <div className="voucher-page">
        <div className="voucher-loading"><Spinner /></div>
      </div>
    );
  }

  const profileUser = profile?.user;
  const currentTier = profileUser?.loyaltyTier || user?.loyaltyTier || 'Bronze';
  const currentPoints = profileUser?.points || user?.points || 0;
  const tierInfo = TIER_MAP[currentTier] || TIER_MAP.Bronze;

  return (
    <div className="voucher-page">
      {/* ── Hero Header ── */}
      <div className="voucher-hero">
        <div className="voucher-hero-content">
          <div className="voucher-hero-left">
            <h1>🎟️ Kho Voucher Thân Thiết</h1>
            <p>Khám phá và nhận voucher ưu đãi dành riêng cho hạng thành viên của bạn. Hạng càng cao, ưu đãi càng lớn!</p>
          </div>
          <div className="voucher-hero-right">
            <div className="hero-tier-badge">
              <span className="hero-tier-icon">{tierInfo.icon}</span>
              <div className="hero-tier-info">
                <span className="hero-tier-label">Hạng thành viên</span>
                <span className="hero-tier-name">{currentTier}</span>
              </div>
            </div>
            <div className="hero-points-badge">
              <span className="hero-points-value">⭐ {currentPoints}</span>
              <span className="hero-points-label">Điểm thưởng</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="voucher-tabs">
        <div className="voucher-tab-nav">
          <button
            id="tab-catalog"
            className={`voucher-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            🏪 Kho Voucher
            <span className="voucher-tab-count">{catalog.length}</span>
          </button>
          <button
            id="tab-my-vouchers"
            className={`voucher-tab-btn ${activeTab === 'claimed' ? 'active' : ''}`}
            onClick={() => setActiveTab('claimed')}
          >
            🎫 Voucher Đã Nhận
            {activeVouchers.length > 0 && (
              <span className="voucher-tab-count">{activeVouchers.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="voucher-content" key={activeTab}>
        {/* ── Tab: Catalog ── */}
        {activeTab === 'catalog' && (
          <>
            {catalog.length === 0 ? (
              <div className="voucher-empty">
                <span className="voucher-empty-icon">🏪</span>
                <h3>Chưa có voucher nào trong kho</h3>
                <p>Hệ thống chưa phát hành voucher. Hãy quay lại sau để nhận ưu đãi!</p>
              </div>
            ) : (
              <div className="voucher-catalog-grid">
                {catalog.map(item => {
                  const tierReq = TIER_MAP[item.tierRequired] || TIER_MAP.Bronze;
                  const isSoldOut = item.maxClaims > 0 && item.claimedCount >= item.maxClaims;
                  const remaining = item.maxClaims > 0 ? item.maxClaims - item.claimedCount : null;

                  let cardClass = 'vc-card';
                  if (item.isLocked) cardClass += ' locked';
                  else if (item.alreadyClaimed) cardClass += ' claimed';
                  else if (isSoldOut) cardClass += ' soldout';
                  else if (item.isClaimable) cardClass += ' claimable';

                  return (
                    <div key={item.id} className={cardClass}>
                      {/* Lock Overlay */}
                      {item.isLocked && (
                        <div className="vc-lock-overlay">
                          <span className="vc-lock-icon">🔒</span>
                          <span className="vc-lock-text">Cần hạng {item.tierRequired}</span>
                        </div>
                      )}

                      {/* Top */}
                      <div className="vc-card-top">
                        <div className={`vc-discount-badge ${item.tierRequired.toLowerCase()}`}>
                          <span className="vc-discount-label">GIẢM</span>
                          <span className="vc-discount-value">
                            {item.discountType === 'Percentage'
                              ? `${item.discountValue}%`
                              : formatPrice(item.discountValue)}
                          </span>
                        </div>
                        <div className="vc-card-info">
                          <div className="vc-card-title">{item.title}</div>
                          {item.description && (
                            <div className="vc-card-desc">{item.description}</div>
                          )}
                        </div>
                      </div>

                      {/* Bottom */}
                      <div className="vc-card-bottom">
                        <div className="vc-card-meta">
                          <span className="vc-meta-tag tier">
                            {tierReq.icon} {item.tierRequired}
                          </span>
                          <span className="vc-meta-tag expiry">
                            📅 HSD: {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
                          </span>
                          {item.minOrderValue && (
                            <span className="vc-meta-tag min-order">
                              💰 Đơn từ {formatPrice(item.minOrderValue)}
                            </span>
                          )}
                          {remaining !== null && (
                            <span className={`vc-meta-tag stock ${remaining <= 5 ? 'low' : ''}`}>
                              📦 Còn {remaining} lượt
                            </span>
                          )}
                        </div>

                        {/* Action Button */}
                        {item.isLocked ? (
                          <button className="vc-claim-btn locked" disabled>
                            🔒 Cần hạng {item.tierRequired} để nhận
                          </button>
                        ) : item.alreadyClaimed ? (
                          <button className="vc-claim-btn claimed" disabled>
                            ✅ Đã nhận voucher này
                          </button>
                        ) : isSoldOut ? (
                          <button className="vc-claim-btn soldout" disabled>
                            ❌ Đã hết lượt nhận
                          </button>
                        ) : (
                          <button
                            className="vc-claim-btn claimable"
                            onClick={() => handleClaim(item.id)}
                            disabled={claimingId === item.id}
                          >
                            {claimingId === item.id ? (
                              <>
                                <span className="spinner-small" />
                                Đang nhận...
                              </>
                            ) : (
                              <>🎁 Nhận Voucher Ngay</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {catalog.length > 0 && (
              <div className="voucher-tip">
                <span className="voucher-tip-icon">💡</span>
                <span>
                  Voucher có biểu tượng <strong>🔒</strong> yêu cầu hạng thành viên cao hơn.
                  Tiếp tục mua sắm để tích điểm và lên hạng — bạn sẽ mở khóa thêm nhiều ưu đãi hấp dẫn!
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Tab: My Vouchers (Claimed) ── */}
        {activeTab === 'claimed' && (
          <>
            {myVouchers.length === 0 ? (
              <div className="voucher-empty">
                <span className="voucher-empty-icon">🎫</span>
                <h3>Bạn chưa có voucher nào</h3>
                <p>Hãy vào <strong>Kho Voucher</strong> để nhận voucher ưu đãi, hoặc tiếp tục mua sắm để lên hạng!</p>
              </div>
            ) : (
              <div className="voucher-claimed-list">
                {myVouchers.map(v => {
                  const status = getVoucherStatus(v);
                  const isUsable = status.cls === 'active';
                  return (
                    <div key={v.id} className={`vc-claimed-card ${status.cls}-voucher`}>
                      {/* Left - Discount */}
                      <div className={`vc-claimed-left ${status.cls}`}>
                        <span className="vc-claimed-discount-label">GIẢM</span>
                        <span className="vc-claimed-discount-value">
                          {v.discountType === 'Percentage'
                            ? `${v.discountValue}%`
                            : formatPrice(v.discountValue)}
                        </span>
                      </div>

                      {/* Right - Details */}
                      <div className="vc-claimed-right">
                        <div className="vc-claimed-code-row">
                          <code className="vc-claimed-code">{v.code}</code>
                          {isUsable && (
                            <button
                              className={`vc-copy-btn ${copiedCode === v.code ? 'copied' : ''}`}
                              onClick={() => handleCopyCode(v.code)}
                            >
                              {copiedCode === v.code ? '✓ Đã sao chép' : '📋 Sao chép'}
                            </button>
                          )}
                          <span className={`vc-claimed-status ${status.cls}`}>
                            {status.icon} {status.text}
                          </span>
                        </div>
                        <div className="vc-claimed-details">
                          <span>📅 HSD: {new Date(v.expiryDate).toLocaleDateString('vi-VN')}</span>
                          <span>🏅 Hạng: {v.tierRequired}</span>
                          <span>📦 Nguồn: {v.source === 'System' ? 'Lên hạng' : v.source === 'Catalog' ? 'Kho Voucher' : 'Admin tặng'}</span>
                          {v.minOrderValue && (
                            <span>💰 Đơn từ {formatPrice(v.minOrderValue)}</span>
                          )}
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

            {myVouchers.length > 0 && (
              <div className="voucher-tip">
                <span className="voucher-tip-icon">💡</span>
                <span>
                  Sao chép mã voucher và nhập vào ô <strong>"Mã giảm giá"</strong> khi thanh toán để được giảm giá.
                  Mỗi voucher chỉ dùng được 1 lần.
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`voucher-toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default MyVoucherPage;
