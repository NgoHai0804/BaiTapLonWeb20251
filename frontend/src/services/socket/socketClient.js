import { io } from 'socket.io-client';
import { storage, STORAGE_KEYS } from '../../utils/storage';

// URL from env or default to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
    socket = null;
    pingInterval = null;
    allListeners = new Map(); // Track tất cả listeners để cleanup

    connect() {
        let token = storage.get(STORAGE_KEYS.TOKEN);
        
        if (!token) {
            console.warn('⚠️ No token found, cannot connect socket');
            this.forceDisconnect(); // Đóng socket cũ nếu có
            return;
        }

        // Loại bỏ dấu ngoặc kép nếu có
        if (typeof token === 'string') {
            token = token.replace(/^"(.*)"$/, '$1').trim();
        }

        if (!token || token === 'null' || token === 'undefined') {
            console.warn('⚠️ Invalid token, cannot connect socket');
            this.forceDisconnect(); // Đóng socket cũ nếu có
            return;
        }

        // Luôn đóng socket cũ trước khi tạo mới (tránh duplicate connections)
        if (this.socket) {
            const currentToken = this.socket.auth?.token;
            if (currentToken !== token) {
                console.log('🔄 Token changed, closing old socket...');
                this.forceDisconnect();
            } else if (this.socket.connected) {
                console.log('✅ Socket already connected with same token');
                return; // Đã có socket connected, không cần tạo mới
            } else {
                // Socket tồn tại nhưng chưa connected, đóng nó đi
                console.log('🔄 Closing disconnected socket before creating new one...');
                this.forceDisconnect();
            }
        }

        // Tạo socket mới (đã đảm bảo socket cũ đã được đóng)
        console.log('🔌 Creating new socket connection to:', SOCKET_URL);
        this.socket = io(SOCKET_URL, {
            autoConnect: false,
            withCredentials: true,
            auth: {
                token: token,
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
            // Giới hạn số lượng reconnection để tránh tạo quá nhiều socket
            reconnectionDelayMax: 5000,
        });

        // Cleanup tất cả listeners cũ trước khi thêm mới
        this.allListeners.clear();

        // Thêm event listeners và track chúng
        const connectHandler = () => {
            console.log('✅ Socket connected:', this.socket.id);
            // Tự động kiểm tra và reconnect vào phòng khi socket kết nối lại
            if (this.onReconnectCallback) {
                this.onReconnectCallback();
            }
        };
        this.socket.on('connect', connectHandler);
        this.allListeners.set('connect', connectHandler);

        const connectErrorHandler = (error) => {
            console.error('❌ Socket connection error:', error.message);
            console.error('Error details:', error);
        };
        this.socket.on('connect_error', connectErrorHandler);
        this.allListeners.set('connect_error', connectErrorHandler);

        const disconnectHandler = (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        };
        this.socket.on('disconnect', disconnectHandler);
        this.allListeners.set('disconnect', disconnectHandler);

        const errorHandler = (error) => {
            console.error('❌ Socket error:', error);
        };
        this.socket.on('error', errorHandler);
        this.allListeners.set('error', errorHandler);

        // Ping/Pong để giữ kết nối
        const pongHandler = (data) => {
            console.log('🏓 Pong received from server', data);
        };
        this.socket.on('pong_server', pongHandler);
        this.allListeners.set('pong_server', pongHandler);
        
        if (!this.socket.connected) {
            console.log('🔌 Attempting to connect socket...');
            this.socket.connect();
        } else {
            console.log('✅ Socket already connected');
        }

        // Bắt đầu ping interval (5 giây/lần)
        this.startPingInterval();
    }

    startPingInterval() {
        // Clear interval cũ nếu có
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Ping mỗi 5 giây
        this.pingInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.socket.emit('ping_server');
                console.log('🏓 Ping sent to server');
            }
        }, 5000);
    }

    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    disconnect() {
        this.forceDisconnect();
    }

    forceDisconnect() {
        this.stopPingInterval();
        
        if (this.socket) {
            // Remove tất cả listeners trước khi disconnect
            this.allListeners.forEach((handler, event) => {
                try {
                    this.socket.off(event, handler);
                } catch (e) {
                    console.warn('Error removing listener:', event, e);
                }
            });
            this.allListeners.clear();

            // Disconnect socket
            try {
                if (this.socket.connected) {
                    console.log('🔌 Force disconnecting socket:', this.socket.id);
                    this.socket.disconnect();
                }
                // Remove tất cả listeners còn lại
                this.socket.removeAllListeners();
            } catch (e) {
                console.warn('Error disconnecting socket:', e);
            }
            
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
            // Track listener để có thể cleanup sau
            const key = `${event}_${callback?.toString() || 'anonymous'}`;
            this.allListeners.set(key, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
                const key = `${event}_${callback?.toString() || 'anonymous'}`;
                this.allListeners.delete(key);
            } else {
                // Remove tất cả listeners của event này
                this.socket.off(event);
                // Xóa tất cả listeners có event này
                const keysToDelete = [];
                this.allListeners.forEach((_, key) => {
                    if (key.startsWith(event + '_')) {
                        keysToDelete.push(key);
                    }
                });
                keysToDelete.forEach(key => this.allListeners.delete(key));
            }
        }
    }

    isConnected() {
        return this.socket && this.socket.connected;
    }

    getSocket() {
        return this.socket;
    }

    onReconnect(callback) {
        this.onReconnectCallback = callback;
    }
}

export const socketClient = new SocketClient();
