import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.callbacks = {};
  }

  // ── Connect to SignalR Hub ────────────────────────────────────────────
  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/chatHub', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register all stored callbacks
    Object.entries(this.callbacks).forEach(([event, handlers]) => {
      handlers.forEach(handler => {
        this.connection.on(event, handler);
      });
    });

    // Connection lifecycle events
    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this._emit('onReconnecting');
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
      this._emit('onReconnected');
    });

    this.connection.onclose(() => {
      console.log('SignalR connection closed');
      this._emit('onClosed');
    });

    try {
      await this.connection.start();
      console.log('SignalR connected');
    } catch (err) {
      console.error('SignalR connection failed:', err);
    }
  }

  // ── Disconnect ────────────────────────────────────────────────────────
  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  // ── Register event handler ────────────────────────────────────────────
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);

    if (this.connection) {
      this.connection.on(event, callback);
    }
  }

  // ── Remove event handler ──────────────────────────────────────────────
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
    if (this.connection) {
      this.connection.off(event, callback);
    }
  }

  // ── Invoke hub method ─────────────────────────────────────────────────
  async invoke(method, ...args) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke(method, ...args);
      } catch (err) {
        console.error(`SignalR invoke ${method} failed:`, err);
      }
    }
  }

  // ── Helper: send message to admin ─────────────────────────────────────
  async sendMessageToAdmin(conversationId, message) {
    await this.invoke('SendMessageToAdmin', conversationId, message);
  }

  // ── Helper: send message to user (admin) ──────────────────────────────
  async sendMessageToUser(conversationId, message) {
    await this.invoke('SendMessageToUser', conversationId, message);
  }

  // ── Helper: typing indicator ──────────────────────────────────────────
  async sendTyping(conversationId, isTyping) {
    await this.invoke('Typing', conversationId, isTyping);
  }

  // ── Helper: close conversation ────────────────────────────────────────
  async closeConversation(conversationId) {
    await this.invoke('CloseConversation', conversationId);
  }

  // ── Helper: join conversation ─────────────────────────────────────────
  async joinConversation(conversationId) {
    await this.invoke('JoinConversation', conversationId);
  }

  // ── Internal emit ─────────────────────────────────────────────────────
  _emit(event, ...args) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(...args));
    }
  }

  // ── Check connection state ────────────────────────────────────────────
  get isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Singleton instance
const signalRService = new SignalRService();
export default signalRService;
