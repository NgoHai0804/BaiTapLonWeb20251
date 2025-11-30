import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { socketClient } from '../../services/socket/socketClient';
import { addMessage, setMessages, markAllAsRead } from '../../store/chatSlice';
import { SOCKET_EVENTS } from '../../utils/constants';
import { playSound } from '../../utils/soundManager';

const ChatBox = ({ roomId }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { messages } = useSelector((state) => state.chat);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when component mounts
  useEffect(() => {
    if (!roomId) return;

    const loadMessages = () => {
      socketClient.emit(SOCKET_EVENTS.GET_ROOM_MESSAGES, { roomId, limit: 50 });
    };

    loadMessages();

    // Listen for room messages
    const handleRoomMessages = (data) => {
      if (data.roomId === roomId) {
        dispatch(setMessages(data.messages || []));
        dispatch(markAllAsRead());
      }
    };

    // Listen for new messages
    const handleMessageReceived = (messageData) => {
      if (messageData.roomId === roomId) {
        dispatch(addMessage({
          _id: messageData._id,
          message: messageData.message,
          type: messageData.type,
          senderId: messageData.senderId?._id || messageData.senderId,
          sender: messageData.sender,
          roomId: messageData.roomId,
          isRead: messageData.isRead,
          createdAt: messageData.createdAt,
          timestamp: messageData.timestamp,
        }));
        scrollToBottom();
      }
    };

    // Listen for errors
    const handleChatError = (data) => {
      console.error('Chat error:', data.message);
    };

    socketClient.on(SOCKET_EVENTS.ROOM_MESSAGES, handleRoomMessages);
    socketClient.on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socketClient.on(SOCKET_EVENTS.CHAT_ERROR, handleChatError);

    return () => {
      socketClient.off(SOCKET_EVENTS.ROOM_MESSAGES, handleRoomMessages);
      socketClient.off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socketClient.off(SOCKET_EVENTS.CHAT_ERROR, handleChatError);
    };
  }, [roomId, dispatch]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !roomId) return;

    socketClient.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      roomId,
      message: inputMessage.trim(),
      type: 'text',
    });

    setInputMessage('');
    playSound('message');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (senderId) => {
    const userId = user?.id || user?._id;
    return (senderId?.toString() === userId?.toString());
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-96">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Chat phòng</h3>
      </div>
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ maxHeight: '300px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
          </div>
        ) : (
          messages.map((msg) => {
            const myMessage = isMyMessage(msg.senderId);
            return (
              <div
                key={msg._id || msg.timestamp}
                className={`flex ${myMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    myMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {!myMessage && (
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {msg.sender?.username || 'Người chơi'}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.message}</div>
                  <div className={`text-xs mt-1 ${myMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp || msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Gửi
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
