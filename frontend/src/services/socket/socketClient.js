import { io } from 'socket.io-client';

// URL from env or default to localhost
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
    socket = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                autoConnect: false,
                withCredentials: true,
            });
        }
        this.socket.connect();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    emit(event, data) {
        if (this.socket) this.socket.emit(event, data);
    }

    on(event, callback) {
        if (this.socket) this.socket.on(event, callback);
    }

    off(event) {
        if (this.socket) this.socket.off(event);
    }
}

export const socketClient = new SocketClient();