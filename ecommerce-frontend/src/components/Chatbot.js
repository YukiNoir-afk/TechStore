import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { chatbotApi, liveChatApi } from '../utils/api';
import signalRService from '../utils/signalrService';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Live Chat State ─────────────────────────────────────────────────
  const [mode, setMode] = useState('bot'); // 'bot' | 'live'
  const [conversationId, setConversationId] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [liveChatClosed, setLiveChatClosed] = useState(false);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'bot',
        text: 'Xin chào! 👋 Tôi là trợ lý mua sắm của TechStore. Tôi có thể giúp bạn tìm sản phẩm, theo dõi đơn hàng, và giải đáp thắc mắc. Bạn cần gì?',
        quickReplies: [
          '🔍 Gợi ý sản phẩm',
          '🏷️ Sản phẩm giảm giá',
          '📦 Theo dõi đơn hàng',
          '📋 Chính sách giao hàng',
          '❓ Xem tất cả dịch vụ'
        ]
      }]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, liveMessages, isAdminTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── SignalR Event Handlers ──────────────────────────────────────────
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setLiveMessages(prev => {
          // Prevent duplicate messages
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        if (!isOpen) {
          setHasNewMessage(true);
        }
      }
    };

    const handleTyping = (convId, typing, isAdmin) => {
      if (convId === conversationId && isAdmin) {
        setIsAdminTyping(typing);
      }
    };

    const handleConversationClosed = (convId) => {
      if (convId === conversationId) {
        setLiveChatClosed(true);
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
  }, [conversationId, isOpen]);

  // ── Start Live Chat ─────────────────────────────────────────────────
  const startLiveChat = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: '⚠️ Bạn cần đăng nhập để chat trực tiếp với nhân viên hỗ trợ.',
        quickReplies: ['🔍 Gợi ý sản phẩm', '📋 Chính sách giao hàng']
      }]);
      return;
    }

    setIsConnecting(true);
    try {
      // Connect to SignalR
      await signalRService.connect();

      // Start or resume conversation
      const res = await liveChatApi.startConversation();
      const conv = res.data;
      setConversationId(conv.id);

      // Load existing messages
      const msgRes = await liveChatApi.getMessages(conv.id);
      setLiveMessages(msgRes.data || []);

      // Join conversation
      await signalRService.joinConversation(conv.id);

      setMode('live');
      setLiveChatClosed(conv.status === 'Closed');
    } catch (err) {
      console.error('Failed to start live chat:', err);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: '😔 Không thể kết nối với nhân viên hỗ trợ. Vui lòng thử lại sau.',
        quickReplies: ['🔄 Thử lại']
      }]);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Back to Bot ─────────────────────────────────────────────────────
  const backToBot = () => {
    setMode('bot');
    setLiveChatClosed(false);
  };

  // ── Bot mode: send message ──────────────────────────────────────────
  const sendBotMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), type: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await chatbotApi.sendMessage(text.trim());
      const data = res.data;
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.reply,
        messageType: data.type,
        products: data.products,
        quickReplies: data.quickReplies
      };
      setMessages(prev => [...prev, botMessage]);

      if (!isOpen) setHasNewMessage(true);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: '😔 Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau!',
        quickReplies: ['🔄 Thử lại', '❓ Trợ giúp']
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [isOpen]);

  // ── Live mode: send message ─────────────────────────────────────────
  const sendLiveMessage = useCallback(async (text) => {
    if (!text.trim() || !conversationId) return;

    setInput('');
    await signalRService.sendMessageToAdmin(conversationId, text.trim());
  }, [conversationId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'live') {
      sendLiveMessage(input);
    } else {
      sendBotMessage(input);
    }
  };

  const handleQuickReply = (reply) => {
    if (reply === '💬 Chat với nhân viên') {
      startLiveChat();
    } else if (reply === '🔄 Thử lại' && mode === 'bot') {
      // Check if user was trying to start live chat
      startLiveChat();
    } else {
      sendBotMessage(reply);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasNewMessage(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const renderMessageText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  const renderProducts = (products) => {
    if (!products || products.length === 0) return null;
    return (
      <div className="chatbot-products-grid">
        {products.map(product => (
          <Link key={product.id} to={`/products/${product.id}`} className="chatbot-product-card" onClick={() => setIsOpen(false)}>
            {product.image && (
              <div className="chatbot-product-image">
                <img src={product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`} alt={product.name} onError={(e) => { e.target.style.display = 'none'; }} />
                {product.onSale && product.discount && (<span className="chatbot-product-badge">-{product.discount}%</span>)}
              </div>
            )}
            <div className="chatbot-product-info">
              <h4 className="chatbot-product-name">{product.name}</h4>
              <div className="chatbot-product-price-row">
                <span className="chatbot-product-price">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (<span className="chatbot-product-original-price">{formatPrice(product.originalPrice)}</span>)}
              </div>
              {product.rating > 0 && (
                <div className="chatbot-product-rating">
                  <span className="chatbot-star">★</span>
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="chatbot-review-count">({product.reviews})</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Render Live Chat Messages ───────────────────────────────────────
  const renderLiveChat = () => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

    return (
      <>
        {/* Connection status */}
        {liveMessages.length === 0 && !liveChatClosed && (
          <div className="chatbot-message bot">
            <div className="chatbot-msg-avatar chatbot-msg-avatar--live">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="chatbot-msg-content">
              <div className="chatbot-msg-bubble bot">
                👋 Bạn đã kết nối với nhân viên hỗ trợ. Hãy nhắn tin để được giúp đỡ!
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {liveMessages.map(msg => (
          <div key={msg.id} className={`chatbot-message ${msg.senderId === userId ? 'user' : 'bot'}`}>
            {msg.senderId !== userId && (
              <div className="chatbot-msg-avatar chatbot-msg-avatar--live">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            <div className="chatbot-msg-content">
              {msg.senderId !== userId && (
                <div className="chatbot-live-sender">
                  {msg.isAdmin ? '👨‍💼 ' : ''}{msg.senderName}
                  <span className="chatbot-live-time">{formatTime(msg.createdAt)}</span>
                </div>
              )}
              <div className={`chatbot-msg-bubble ${msg.senderId === userId ? 'user' : 'bot'}`}>
                {msg.message}
              </div>
              {msg.senderId === userId && (
                <div className="chatbot-live-time" style={{ textAlign: 'right' }}>{formatTime(msg.createdAt)}</div>
              )}
            </div>
          </div>
        ))}

        {/* Closed notice */}
        {liveChatClosed && (
          <div className="chatbot-live-closed">
            <div className="chatbot-live-closed-icon">✅</div>
            <p>Cuộc trò chuyện đã kết thúc.</p>
            <button className="chatbot-live-back-btn" onClick={backToBot}>
              🤖 Quay lại chatbot
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Chat Widget */}
      <div className={`chatbot-container ${isOpen ? 'chatbot-open' : ''}`}>
        {/* Header */}
        <div className={`chatbot-header ${mode === 'live' ? 'chatbot-header--live' : ''}`} onClick={toggleChat}>
          <div className="chatbot-header-left">
            <div className={`chatbot-avatar ${mode === 'live' ? 'chatbot-avatar--live' : ''}`}>
              {mode === 'live' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
            <div className="chatbot-header-info">
              <h3>{mode === 'live' ? 'Nhân viên hỗ trợ' : 'TechStore Assistant'}</h3>
              <span className="chatbot-status">
                <span className={`chatbot-status-dot ${mode === 'live' ? 'chatbot-status-dot--live' : ''}`}></span>
                {mode === 'live' ? 'Đang chat trực tiếp' : 'Trực tuyến'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {mode === 'live' && (
              <button
                className="chatbot-close-btn"
                title="Quay lại chatbot"
                onClick={(e) => { e.stopPropagation(); backToBot(); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <button className="chatbot-close-btn" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Live Chat Banner */}
        {mode === 'bot' && (
          <div className="chatbot-live-banner" onClick={startLiveChat}>
            <span>💬</span>
            <span>Chat trực tiếp với nhân viên hỗ trợ</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        {/* Messages Area */}
        <div className="chatbot-messages">
          {mode === 'bot' ? (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`chatbot-message ${msg.type}`}>
                  {msg.type === 'bot' && (
                    <div className="chatbot-msg-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                      </svg>
                    </div>
                  )}
                  <div className="chatbot-msg-content">
                    <div className={`chatbot-msg-bubble ${msg.type}`}>
                      {renderMessageText(msg.text)}
                    </div>
                    {msg.products && renderProducts(msg.products)}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="chatbot-quick-replies">
                        {msg.quickReplies.map((reply, idx) => (
                          <button key={idx} className="chatbot-quick-reply-btn" onClick={() => handleQuickReply(reply)}>
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Connecting indicator */}
              {isConnecting && (
                <div className="chatbot-message bot">
                  <div className="chatbot-msg-avatar chatbot-msg-avatar--live">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="chatbot-msg-content">
                    <div className="chatbot-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '4px' }}>
                      Đang kết nối với nhân viên hỗ trợ...
                    </div>
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="chatbot-message bot">
                  <div className="chatbot-msg-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <div className="chatbot-msg-content">
                    <div className="chatbot-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {renderLiveChat()}

              {/* Admin typing indicator */}
              {isAdminTyping && (
                <div className="chatbot-message bot">
                  <div className="chatbot-msg-avatar chatbot-msg-avatar--live">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="chatbot-msg-content">
                    <div className="chatbot-typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form className="chatbot-input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'live' ? 'Nhắn tin cho nhân viên...' : 'Nhập tin nhắn...'}
            className="chatbot-input"
            disabled={isTyping || isConnecting || (mode === 'live' && liveChatClosed)}
          />
          <button
            type="submit"
            className="chatbot-send-btn"
            disabled={!input.trim() || isTyping || isConnecting || (mode === 'live' && liveChatClosed)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Floating Action Button */}
      {!isOpen && (
        <button className="chatbot-fab" onClick={toggleChat}>
          <div className="chatbot-fab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          {hasNewMessage && <span className="chatbot-fab-badge"></span>}
          <div className="chatbot-fab-pulse"></div>
        </button>
      )}
    </>
  );
};

export default Chatbot;
