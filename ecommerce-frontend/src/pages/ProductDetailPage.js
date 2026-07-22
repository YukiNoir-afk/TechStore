import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { productsApi, reviewsApi, wishlistApi, recommendationsApi, questionsApi } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const ProductDetailPage = ({ addToCart, user }) => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [questionInput, setQuestionInput] = useState('');
  const [answerInputs, setAnswerInputs] = useState({});
  const [showAnswerForm, setShowAnswerForm] = useState({});
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, revRes, qRes] = await Promise.all([
          productsApi.getById(id),
          reviewsApi.getForProduct(id),
          questionsApi.getForProduct(id)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
        setQuestions(qRes.data || []);
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Check review eligibility when user is logged in
  useEffect(() => {
    if (!user || !id) { setReviewEligibility(null); return; }
    const checkEligibility = async () => {
      try {
        const res = await reviewsApi.checkEligibility(id);
        setReviewEligibility(res.data);
      } catch (err) {
        console.error('Failed to check review eligibility', err);
        setReviewEligibility(null);
      }
    };
    checkEligibility();
  }, [user, id]);

  // Track product view and fetch related products
  useEffect(() => {
    if (!id) return;

    // Track view (fire-and-forget, only for logged-in users)
    if (user) {
      recommendationsApi.trackView(id).catch(() => {});
    }

    // Fetch related products
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const res = await recommendationsApi.getRelated(id, 4);
        setRelatedProducts(res.data.items || []);
      } catch (err) {
        console.log('Related products fetch failed', err);
      } finally {
        setRelatedLoading(false);
      }
    };
    fetchRelated();
  }, [id, user]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setAlertMsg(`✓ Đã thêm ${quantity} sản phẩm vào giỏ!`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) { alert('Vui lòng đăng nhập để thêm vào danh sách yêu thích'); return; }
    try {
      await wishlistApi.add(product.id);
      setAlertMsg('♡ Đã thêm vào danh sách yêu thích!');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Thêm vào danh sách yêu thích thất bại');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) { alert('Vui lòng đăng nhập để viết đánh giá'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.create(id, reviewForm);
      const revRes = await reviewsApi.getForProduct(id);
      setReviews(revRes.data);
      setReviewForm({ rating: 5, title: '', comment: '' });
      // Re-check eligibility (user already reviewed now)
      try {
        const eligRes = await reviewsApi.checkEligibility(id);
        setReviewEligibility(eligRes.data);
      } catch (e) { setReviewEligibility({ canReview: false, reason: 'Bạn đã đánh giá sản phẩm này rồi' }); }
      setAlertMsg('✓ Đã gửi đánh giá!');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!user) { alert('Vui lòng đăng nhập để đặt câu hỏi'); return; }
    if (!questionInput.trim()) return;
    setSubmittingQuestion(true);
    try {
      await questionsApi.create(id, { question: questionInput.trim() });
      const qRes = await questionsApi.getForProduct(id);
      setQuestions(qRes.data || []);
      setQuestionInput('');
    } catch (err) {
      alert(err.response?.data?.error || 'Gửi câu hỏi thất bại');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    const answerText = answerInputs[questionId]?.trim();
    if (!answerText) return;
    setSubmittingAnswer(prev => ({ ...prev, [questionId]: true }));
    try {
      await questionsApi.answer(id, questionId, { answer: answerText });
      const qRes = await questionsApi.getForProduct(id);
      setQuestions(qRes.data || []);
      setAnswerInputs(prev => ({ ...prev, [questionId]: '' }));
      setShowAnswerForm(prev => ({ ...prev, [questionId]: false }));
    } catch (err) {
      alert(err.response?.data?.error || 'Gửi câu trả lời thất bại');
    } finally {
      setSubmittingAnswer(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!product) return <div className="text-center py-20 text-text-secondary">Không tìm thấy sản phẩm</div>;

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center space-x-2 text-sm">
          <Link to="/" className="text-primary-600 hover:text-primary-700">Trang chủ</Link>
          <span className="text-text-secondary">/</span>
          <Link to="/products" className="text-primary-600 hover:text-primary-700">Sản phẩm</Link>
          <span className="text-text-secondary">/</span>
          <span className="text-text-primary font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-96 object-cover" />
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-sm text-text-secondary uppercase tracking-wide font-medium mb-2">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-bold font-heading text-text-primary mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex text-warning">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(product.rating) ? 'text-warning' : 'text-gray-300'}>★</span>
                ))}
              </div>
              <span className="text-sm text-text-secondary">({product.reviews} đánh giá)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold text-primary-600">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xl text-text-secondary line-through">{formatPrice(product.originalPrice)}</span>
                )}
                {product.discount && (
                  <span className="bg-accent text-white px-3 py-1 rounded-lg text-sm font-bold">Tiết kiệm {product.discount}%</span>
                )}
              </div>
            </div>

            {/* Stock */}
            <div className="mb-6">
              {product.inStock ? (
                <p className="text-success font-medium">✓ Còn hàng ({product.stock} sản phẩm)</p>
              ) : (
                <p className="text-accent font-medium">Hết hàng</p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Số lượng</label>
              <div className="flex items-center border-2 border-primary-200 rounded-lg w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-text-primary hover:bg-primary-50 transition-colors">−</button>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-l-2 border-r-2 border-primary-200 py-2 focus:outline-none" />
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-text-primary hover:bg-primary-50 transition-colors">+</button>
              </div>
            </div>

            {showAlert && <Alert type="success" message={alertMsg} onClose={() => setShowAlert(false)} />}

            <div className="space-y-3">
              <Button size="lg" fullWidth onClick={handleAddToCart} disabled={!product.inStock}>
                {product.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
              </Button>
              <Button size="lg" variant="outline" fullWidth onClick={handleAddToWishlist}>
                Thêm vào yêu thích ♡
              </Button>
            </div>

            <div className="mt-8 space-y-3 border-t-2 border-primary-100 pt-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚚</span>
                <div><p className="font-semibold text-text-primary">Miễn phí vận chuyển</p><p className="text-sm text-text-secondary">Cho đơn hàng trên 500.000₫</p></div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔒</span>
                <div><p className="font-semibold text-text-primary">Thanh toán an toàn</p><p className="text-sm text-text-secondary">Thanh toán bằng Stripe & PayPal</p></div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">↩️</span>
                <div><p className="font-semibold text-text-primary">Đổi trả 30 ngày</p><p className="text-sm text-text-secondary">Cam kết hoàn tiền</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-12">
          <div className="flex border-b-2 border-primary-100">
            {[
              { key: 'description', label: 'Mô tả' },
              { key: 'features', label: 'Tính năng' },
              { key: 'reviews', label: 'Đánh giá' },
              { key: 'qa', label: 'Hỏi đáp' }
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 px-6 font-semibold capitalize transition-colors ${
                  activeTab === tab.key ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-600' : 'text-text-secondary hover:text-text-primary'
                }`}>
                {tab.label} {tab.key === 'reviews' && reviews ? `(${reviews.totalReviews})` : ''}{tab.key === 'qa' ? ` (${questions.length})` : ''}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && <p className="text-text-primary leading-relaxed">{product.description}</p>}
            {activeTab === 'features' && product.features && (
              <ul className="space-y-3">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <span className="text-success font-bold">✓</span>
                    <span className="text-text-primary">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            {activeTab === 'reviews' && reviews && (
              <div>
                {/* Rating Summary */}
                <div className="flex items-center gap-6 mb-8 p-4 bg-primary-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600">{reviews.averageRating}</div>
                    <div className="flex text-warning mt-1">{[...Array(5)].map((_, i) => <span key={i}>★</span>)}</div>
                    <div className="text-sm text-text-secondary mt-1">{reviews.totalReviews} đánh giá</div>
                  </div>
                  <div className="flex-grow space-y-1">
                    {[5,4,3,2,1].map(star => (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8">{star}★</span>
                        <div className="flex-grow bg-gray-200 rounded-full h-2">
                          <div className="bg-warning h-2 rounded-full" style={{width: `${reviews.totalReviews ? (reviews.ratingDistribution[star] / reviews.totalReviews) * 100 : 0}%`}}></div>
                        </div>
                        <span className="w-6 text-text-secondary">{reviews.ratingDistribution[star] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.reviews.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {reviews.reviews.map(rev => (
                      <div key={rev.id} className="border-b border-primary-100 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex text-warning text-sm">{[...Array(5)].map((_, i) => <span key={i} className={i < rev.rating ? 'text-warning' : 'text-gray-300'}>★</span>)}</div>
                          <span className="font-bold text-text-primary">{rev.userName}</span>
                          <span className="text-text-secondary text-sm">· {new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        {rev.title && <p className="font-semibold text-text-primary">{rev.title}</p>}
                        {rev.comment && <p className="text-text-secondary mt-1">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary mb-6">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                )}

                {/* Write Review Form */}
                {user && reviewEligibility?.canReview && (
                  <form onSubmit={handleSubmitReview} className="bg-primary-50 rounded-lg p-6">
                    <h4 className="font-bold text-text-primary mb-4">Viết đánh giá</h4>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Xếp hạng</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})}
                            className={`text-2xl ${star <= reviewForm.rating ? 'text-warning' : 'text-gray-300'}`}>★</button>
                        ))}
                      </div>
                    </div>
                    <input type="text" placeholder="Tiêu đề đánh giá" value={reviewForm.title}
                      onChange={e => setReviewForm({...reviewForm, title: e.target.value})}
                      className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-primary-500" />
                    <textarea placeholder="Nội dung đánh giá..." value={reviewForm.comment}
                      onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} rows={3}
                      className="w-full border-2 border-primary-200 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-primary-500" />
                    <Button variant="primary" loading={submitting}>Gửi đánh giá</Button>
                  </form>
                )}
                {user && reviewEligibility && !reviewEligibility.canReview && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-amber-800 font-semibold mb-1">{reviewEligibility.reason}</p>
                    <p className="text-amber-600 text-sm">Chỉ khách hàng đã nhận được sản phẩm mới có thể viết đánh giá.</p>
                  </div>
                )}
                {!user && (
                  <div className="text-center py-4">
                    <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">Đăng nhập để viết đánh giá</Link>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'qa' && (
              <div>
                {/* Ask Question Form */}
                {user ? (
                  <form onSubmit={handleSubmitQuestion} className="bg-primary-50 rounded-lg p-6 mb-8">
                    <h4 className="font-bold text-text-primary mb-4">💬 Đặt câu hỏi về sản phẩm</h4>
                    <textarea
                      placeholder="Nhập câu hỏi của bạn về sản phẩm này..."
                      value={questionInput}
                      onChange={e => setQuestionInput(e.target.value)}
                      rows={3}
                      className="w-full border-2 border-primary-200 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-primary-500 resize-none"
                    />
                    <Button variant="primary" loading={submittingQuestion} disabled={!questionInput.trim()}>
                      Gửi câu hỏi
                    </Button>
                  </form>
                ) : (
                  <div className="bg-primary-50 rounded-lg p-6 mb-8 text-center">
                    <p className="text-text-secondary mb-2">Bạn cần đăng nhập để đặt câu hỏi</p>
                    <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">Đăng nhập ngay →</Link>
                  </div>
                )}

                {/* Questions List */}
                {questions.length > 0 ? (
                  <div className="space-y-6">
                    {questions.map(q => (
                      <div key={q.id} className="border-2 border-primary-100 rounded-xl overflow-hidden">
                        {/* Question */}
                        <div className="p-5 bg-white">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                              H
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-text-primary">{q.userName}</span>
                                <span className="text-text-secondary text-xs">· {new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <p className="text-text-primary leading-relaxed">{q.question}</p>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs text-text-secondary">
                                  {q.answerCount} câu trả lời
                                </span>
                                {user && (
                                  <button
                                    onClick={() => setShowAnswerForm(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                    className="text-xs text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                                  >
                                    {showAnswerForm[q.id] ? 'Đóng' : '↩ Trả lời'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Answers */}
                        {q.answers.length > 0 && (
                          <div className="border-t-2 border-primary-50 bg-gray-50">
                            {q.answers.map(a => (
                              <div key={a.id} className="p-4 pl-16 border-b border-primary-50 last:border-b-0">
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${a.isAdmin ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                    {a.isAdmin ? '✓' : 'A'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`font-bold text-sm ${a.isAdmin ? 'text-green-700' : 'text-text-primary'}`}>
                                        {a.userName}
                                      </span>
                                      {a.isAdmin && (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                          Admin
                                        </span>
                                      )}
                                      <span className="text-text-secondary text-xs">· {new Date(a.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <p className="text-text-secondary text-sm leading-relaxed">{a.answer}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Answer Form */}
                        {showAnswerForm[q.id] && (
                          <div className="p-4 pl-16 border-t-2 border-primary-50 bg-primary-50/50">
                            <div className="flex gap-3">
                              <textarea
                                placeholder="Nhập câu trả lời..."
                                value={answerInputs[q.id] || ''}
                                onChange={e => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                                rows={2}
                                className="flex-1 border-2 border-primary-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSubmitAnswer(q.id)}
                                loading={submittingAnswer[q.id]}
                                disabled={!answerInputs[q.id]?.trim()}
                              >
                                Gửi
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-text-secondary text-lg">Chưa có câu hỏi nào cho sản phẩm này</p>
                    <p className="text-text-secondary text-sm mt-1">Hãy là người đầu tiên đặt câu hỏi!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {(relatedProducts.length > 0 || relatedLoading) && (
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-sm shadow-sm">
                💡
              </div>
              <h2 className="text-2xl font-bold font-heading text-text-primary">Sản phẩm liên quan</h2>
            </div>

            {relatedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rp) => (
                  <div key={rp.id} className="relative group">
                    {rp.reason && (
                      <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        {rp.reason}
                      </div>
                    )}
                    <Link to={`/products/${rp.id}`} className="block">
                      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                        <div className="relative overflow-hidden bg-gray-100 h-48">
                          <img
                            src={rp.image}
                            alt={rp.name}
                            loading="lazy"
                            className="w-full h-full object-cover transition-all duration-300 hover:scale-110"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          {rp.onSale && rp.discount && (
                            <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-lg text-sm font-bold">
                              Giảm {rp.discount}%
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">{rp.category}</p>
                          <h3 className="text-base font-bold text-text-primary line-clamp-2 font-heading mt-1">{rp.name}</h3>
                          <div className="flex items-center space-x-1 mt-2">
                            <div className="flex text-warning">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.floor(rp.rating) ? 'text-warning' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                            <span className="text-xs text-text-secondary">({rp.reviews})</span>
                          </div>
                          <div className="mt-2 flex items-baseline space-x-2">
                            <span className="text-lg font-bold text-primary-600">{formatPrice(rp.price)}</span>
                            {rp.originalPrice && (
                              <span className="text-sm text-text-secondary line-through">{formatPrice(rp.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => addToCart(rp)}
                      disabled={rp.stock === 0}
                      className="w-full mt-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-2 px-4 rounded-b-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed -mt-1 relative z-0"
                    >
                      {rp.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
