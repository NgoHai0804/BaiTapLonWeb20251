import { useEffect } from 'react';
import { socketClient } from '../services/socket/socketClient';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔌 useSocket: Attempting to connect...');
      socketClient.connect();

      // Không cần thêm listeners ở đây vì đã có trong socketClient
      // Chỉ cleanup khi unmount
      return () => {
        // Không disconnect ở đây vì socket có thể được dùng bởi components khác
        // Chỉ cleanup nếu thực sự cần (khi logout)
      };
    } else {
      console.log('🔌 useSocket: Not authenticated, disconnecting...');
      socketClient.forceDisconnect();
    }
  }, [isAuthenticated, token]);

  return {
    socket: socketClient.getSocket(),
    isConnected: socketClient.isConnected(),
    emit: socketClient.emit.bind(socketClient),
    on: socketClient.on.bind(socketClient),
    off: socketClient.off.bind(socketClient),
  };
};

export default useSocket;
