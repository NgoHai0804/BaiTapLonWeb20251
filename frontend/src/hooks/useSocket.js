import { useEffect, useRef, useCallback } from 'react';
import { socketClient } from '../services/socket/socketClient';

/**
 * Custom hook for Socket.IO management
 * Quản lý vòng đời kết nối Socket.IO (connect, disconnect, on/off events)
 * 
 * @param {boolean} autoConnect - Tự động connect khi mount (default: true)
 * @returns {Object} { socket, emit, on, off, connect, disconnect, isConnected }
 */
export const useSocket = (autoConnect = true) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Get socket instance
        socketRef.current = socketClient.socket;

        // Auto connect if enabled
        if (autoConnect) {
            socketClient.connect();
        }

        // Cleanup on unmount
        return () => {
            // Don't disconnect - keep persistent connection
            // socketClient.disconnect();
        };
    }, [autoConnect]);

    // Emit event
    const emit = useCallback((event, data, callback) => {
        if (callback) {
            socketClient.socket?.emit(event, data, callback);
        } else {
            socketClient.emit(event, data);
        }
    }, []);

    // Listen to event
    const on = useCallback((event, callback) => {
        socketClient.on(event, callback);

        // Return cleanup function
        return () => {
            socketClient.off(event);
        };
    }, []);

    // Remove event listener
    const off = useCallback((event) => {
        socketClient.off(event);
    }, []);

    // Manual connect
    const connect = useCallback(() => {
        socketClient.connect();
    }, []);

    // Manual disconnect
    const disconnect = useCallback(() => {
        socketClient.disconnect();
    }, []);

    // Check if connected
    const isConnected = socketClient.socket?.connected || false;

    return {
        socket: socketClient.socket,
        emit,
        on,
        off,
        connect,
        disconnect,
        isConnected
    };
};

export default useSocket;