import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminApi } from '../../utils/adminApi';
import signalRService from '../../utils/signalrService';

const CustomerCareAdminPage = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState({ status: '', type: '' });
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all');

  // ── Live Chat State ─────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [userTypingMap, setUserTypingMap] = useState({});
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // ── Fetch Tickets ───────────────────────────────────────────────────────
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const params = {};
      if (ticketFilter.status) params.status = ticketFilter.status;
      if (ticketFilter.type) params.type = ticketFilter.type;
      const res = await adminApi.getSupportTickets(params);
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  // ── Fetch Reviews ───────────────────────────────────────────────────────
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await adminApi.getReviews();
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // ── Fetch Conversations ─────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await adminApi.getLiveChatConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // ── Fetch Chat Messages ─────────────────────────────────────────────────
  const fetchChatMessages = useCallback(async (conversationId) => {
    try {
      const res = await adminApi.getLiveChatMessages(conversationId);
      setChatMessages(res.data || []);
      await adminApi.markLiveChatRead(conversationId);
      // Update unread count locally
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unreadByAdmin: 0 } : c
      ));
    } catch (err) {
      console.error('Failed to fetch chat messages', err);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [ticketFilter]);
  useEffect(() => { fetchReviews(); }, []);

  // ── Connect SignalR on Live Chat tab ─────────────────────────────────
  useEffect(() => {
    if (activeTab === 'livechat') {
      fetchConversations();
      signalRService.connect();
    }
  }, [activeTab, fetchConversations]);

  // ── SignalR Event Handlers ──────────────────────────────────────────
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      // Update chat messages if viewing the same conversation
      setChatMessages(prev => {
        if (prev.length === 0) return prev;
        if (prev.some(m => m.id === msg.id)) return prev;
        if (prev[0]?.conversationId === msg.conversationId) {
          return [...prev, msg];
        }
        return prev;
      });

      // Also update the selected conversation messages
      if (selectedConv?.id === msg.conversationId) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              lastMessage: msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message,
              lastMessageAt: msg.createdAt,
              unreadByAdmin: selectedConv?.id === msg.conversationId ? c.unreadByAdmin : c.unreadByAdmin + (msg.isAdmin ? 0 : 1),
            };
          }
          return c;
        });

        // If conversation doesn't exist yet, refetch
        if (!updated.some(c => c.id === msg.conversationId)) {
          fetchConversations();
        }

        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    const handleTyping = (conversationId, isTyping, isAdmin) => {
      if (!isAdmin) {
        setUserTypingMap(prev => ({ ...prev, [conversationId]: isTyping }));
        if (isTyping) {
          setTimeout(() => {
            setUserTypingMap(prev => ({ ...prev, [conversationId]: false }));
          }, 3000);
        }
      }
    };

    const handleConversationClosed = (conversationId) => {
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, status: 'Closed' } : c
      ));
      if (selectedConv?.id === conversationId) {
        setSelectedConv(prev => prev ? { ...prev, status: 'Closed' } : prev);
      }
    };

    signalRService.on('ReceiveMessage', handleReceiveMessage);
    signalRService.on('UserTyping', handleTyping);
    signalRService.on('ConversationClosed', handleConversationClosed);

    return () => {
      signalRService.off('ReceiveMessage', handleReceiveMessage);
      signalRService.off('UserTyping', handleTyping);
      signalRService.off('ConversationClosed', handleConversationClosed);
    };
  }, [selectedConv, fetchConversations]);

  // ── Auto scroll chat ────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Select Conversation ─────────────────────────────────────────────
  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    await fetchChatMessages(conv.id);
    await signalRService.joinConversation(conv.id);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  };

  // ── Send Chat Message ───────────────────────────────────────────────
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConv) return;
    setChatSending(true);
    try {
      await signalRService.sendMessageToUser(selectedConv.id, chatInput.trim());
      setChatInput('');
    } catch (err) {
      alert('Gửi tin nhắn thất bại');
    } finally {
      setChatSending(false);
    }
  };

  // ── Close Conversation ──────────────────────────────────────────────
  const handleCloseConversation = async (convId) => {
    if (!window.confirm('Bạn có chắc muốn đóng cuộc hội thoại này?')) return;
    try {
      await signalRService.closeConversation(convId);
      await adminApi.closeLiveChatConversation(convId);
    } catch (err) {
      alert('Đóng cuộc hội thoại thất bại');
    }
  };

  // ── Ticket Actions ──────────────────────────────────────────────────────
  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await adminApi.replyToTicket(ticketId, { message: replyText });
      setReplyText('');
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || 'Gửi phản hồi thất bại');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await adminApi.updateTicketStatus(ticketId, { status });
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.error || 'Cập nhật trạng thái thất bại');
    }
  };

  // ── Review Actions ──────────────────────────────────────────────────────
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await adminApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Xóa đánh giá thất bại');
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const formatTime = (d) => new Date(d).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit'
  });

  const formatRelativeTime = (d) => {
    const now = new Date();
    const date = new Date(d);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return formatDate(d);
  };

  const ticketStatusBadge = (status) => {
    const styles = {
      Open: 'bg-yellow-100 text-yellow-700',
      InProgress: 'bg-blue-100 text-blue-700',
      Closed: 'bg-gray-100 text-gray-600',
    };
    const labels = { Open: '🟡 Mở', InProgress: '🔵 Đang xử lý', Closed: '⚫ Đã đóng' };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const ticketTypeBadge = (type) => {
    const styles = { QA: 'bg-indigo-100 text-indigo-700', Warranty: 'bg-orange-100 text-orange-700', Feedback: 'bg-green-100 text-green-700' };
    const labels = { QA: '❓ Hỏi đáp', Warranty: '🛡️ Bảo hành', Feedback: '💬 Phản hồi' };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter(r => r.rating === parseInt(reviewFilter));

  // ── Stats ───────────────────────────────────────────────────────────────
  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'InProgress').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
  };

  const reviewStats = {
    total: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0',
  };

  const activeChats = conversations.filter(c => c.status === 'Active').length;
  const totalUnread = conversations.reduce((s, c) => s + (c.unreadByAdmin || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">💬 Chăm sóc khách hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý hỏi đáp, đánh giá sản phẩm, bảo hành, phản hồi và chat trực tiếp.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4">
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-center">
            <div className="text-xl font-bold text-yellow-700">{ticketStats.open}</div>
            <div className="text-xs text-yellow-600">Ticket mở</div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{ticketStats.inProgress}</div>
            <div className="text-xs text-blue-600">Đang xử lý</div>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
            <div className="text-xl font-bold text-gray-700">{ticketStats.closed}</div>
            <div className="text-xs text-gray-600">Đã đóng</div>
          </div>
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
            <div className="text-xl font-bold text-purple-700">{reviewStats.total}</div>
            <div className="text-xs text-purple-600">Đánh giá</div>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
            <div className="text-xl font-bold text-green-700">⭐ {reviewStats.avgRating}</div>
            <div className="text-xs text-green-600">Điểm TB</div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-xl font-bold text-emerald-700">{activeChats}</div>
            <div className="text-xs text-emerald-600">Chat đang mở</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          🎫 Hỏi đáp & Bảo hành ({ticketStats.total})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'reviews' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          ⭐ Đánh giá sản phẩm ({reviewStats.total})
        </button>
        <button
          onClick={() => setActiveTab('livechat')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors relative ${
            activeTab === 'livechat' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          💬 Live Chat ({activeChats})
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════ TICKETS TAB ═══════════════════════ */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Lọc:</span>
            <select
              value={ticketFilter.status}
              onChange={(e) => setTicketFilter(prev => ({ ...prev, status: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Open">Mở</option>
              <option value="InProgress">Đang xử lý</option>
              <option value="Closed">Đã đóng</option>
            </select>
            <select
              value={ticketFilter.type}
              onChange={(e) => setTicketFilter(prev => ({ ...prev, type: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="QA">Hỏi đáp</option>
              <option value="Warranty">Bảo hành</option>
              <option value="Feedback">Phản hồi</option>
            </select>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎫</div>
              <p className="text-gray-400">Không có ticket nào.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  {/* Ticket Header */}
                  <div
                    className="px-6 py-4 cursor-pointer flex items-start gap-4"
                    onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ticketTypeBadge(ticket.type)}
                        {ticketStatusBadge(ticket.status)}
                        {ticket.responseCount > 0 && (
                          <span className="text-xs text-gray-400">💬 {ticket.responseCount} phản hồi</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 truncate">{ticket.subject}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {ticket.userName} ({ticket.userEmail}) · {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ticket.status !== 'Closed' && (
                        <>
                          {ticket.status === 'Open' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'InProgress'); }}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Nhận xử lý
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'Closed'); }}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                          >
                            Đóng
                          </button>
                        </>
                      )}
                      {ticket.status === 'Closed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'Open'); }}
                          className="rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 hover:bg-yellow-100"
                        >
                          Mở lại
                        </button>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedTicket === ticket.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTicket === ticket.id && (
                    <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
                      {/* Original Message */}
                      <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
                        <div className="text-xs text-gray-400 mb-1">Tin nhắn gốc</div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                      </div>

                      {/* Conversation */}
                      {ticket.responses && ticket.responses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {ticket.responses.map((resp, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl p-3 text-sm ${
                                resp.isAdmin
                                  ? 'bg-blue-50 border border-blue-200 ml-8'
                                  : 'bg-white border border-gray-200 mr-8'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold ${resp.isAdmin ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {resp.isAdmin ? '👨‍💼 Admin' : '👤 Khách hàng'}
                                </span>
                                <span className="text-xs text-gray-400">{formatDate(resp.createdAt)}</span>
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap">{resp.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      {ticket.status !== 'Closed' && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập phản hồi..."
                            value={expandedTicket === ticket.id ? replyText : ''}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReply(ticket.id)}
                            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            onClick={() => handleReply(ticket.id)}
                            disabled={replying || !replyText.trim()}
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {replying ? '...' : 'Gửi'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ REVIEWS TAB ═══════════════════════ */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Lọc theo sao:</span>
            {['all', '5', '4', '3', '2', '1'].map((val) => (
              <button
                key={val}
                onClick={() => setReviewFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  reviewFilter === val
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {val === 'all' ? 'Tất cả' : `${val} ⭐`}
              </button>
            ))}
          </div>

          {reviewsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">⭐</div>
              <p className="text-gray-400">Không có đánh giá nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Sản phẩm</th>
                    <th className="px-6 py-3">Khách hàng</th>
                    <th className="px-6 py-3">Đánh giá</th>
                    <th className="px-6 py-3">Nội dung</th>
                    <th className="px-6 py-3">Ngày</th>
                    <th className="px-6 py-3">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{review.productName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-800 text-sm">{review.userName}</div>
                        <div className="text-gray-400 text-xs">{review.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-yellow-500 text-sm tracking-wider">{renderStars(review.rating)}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        {review.title && <div className="font-medium text-gray-800 text-sm">{review.title}</div>}
                        <div className="text-gray-600 text-sm truncate">{review.comment || '—'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ LIVE CHAT TAB ═══════════════════════ */}
      {activeTab === 'livechat' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
          <div className="flex h-full">
            {/* Conversation List (Left) */}
            <div className="w-80 border-r border-gray-200 flex flex-col flex-shrink-0">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700">Cuộc hội thoại</h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-400 text-sm">Chưa có cuộc hội thoại nào.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedConv?.id === conv.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              conv.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}>
                              {conv.userName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800 truncate" style={{ maxWidth: '140px' }}>
                                {conv.userName || 'Khách hàng'}
                              </div>
                              <div className="text-xs text-gray-400">{conv.userEmail}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-gray-400">{formatRelativeTime(conv.lastMessageAt)}</span>
                            {conv.unreadByAdmin > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {conv.unreadByAdmin}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate" style={{ maxWidth: '180px' }}>
                            {userTypingMap[conv.id] ? (
                              <span className="text-emerald-500 italic">Đang nhập...</span>
                            ) : (
                              conv.lastMessage || 'Chưa có tin nhắn'
                            )}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            conv.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {conv.status === 'Active' ? '● Online' : 'Đã đóng'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window (Right) */}
            <div className="flex-1 flex flex-col">
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3 border-b bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        selectedConv.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}>
                        {selectedConv.userName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">{selectedConv.userName}</h4>
                        <p className="text-xs text-gray-500">{selectedConv.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConv.status === 'Active' && (
                        <button
                          onClick={() => handleCloseConversation(selectedConv.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                        >
                          ✕ Đóng chat
                        </button>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        selectedConv.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {selectedConv.status === 'Active' ? '🟢 Đang hoạt động' : '⚫ Đã đóng'}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="text-4xl mb-2">💬</div>
                        <p className="text-gray-400 text-sm">Chưa có tin nhắn.</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {!msg.isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                              {msg.senderName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className={`max-w-[70%] ${msg.isAdmin ? 'text-right' : ''}`}>
                            <div className={`text-xs mb-0.5 ${msg.isAdmin ? 'text-blue-500' : 'text-gray-400'}`}>
                              {msg.isAdmin ? '👨‍💼 Bạn' : msg.senderName} · {formatTime(msg.createdAt)}
                            </div>
                            <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              msg.isAdmin
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* User typing indicator */}
                    {userTypingMap[selectedConv.id] && (
                      <div className="flex gap-2 items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {selectedConv.userName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  {selectedConv.status === 'Active' ? (
                    <form onSubmit={handleSendChatMessage} className="px-4 py-3 border-t flex gap-2 bg-white">
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatInput.trim()}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {chatSending ? '...' : '📤 Gửi'}
                      </button>
                    </form>
                  ) : (
                    <div className="px-4 py-3 border-t bg-gray-50 text-center text-sm text-gray-500">
                      Cuộc hội thoại đã đóng
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Chọn cuộc hội thoại</h3>
                  <p className="text-sm text-gray-400">Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trả lời khách hàng.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCareAdminPage;
