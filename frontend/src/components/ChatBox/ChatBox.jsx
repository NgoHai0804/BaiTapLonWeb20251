import { useState, useEffect, useRef } from 'prop-types';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useChat } from '../../hooks/useChat';
import MessageBubble from '../MessageBubble/MessageBubble';
import {
    FaPaperPlane,
    FaSmile,
    FaTimes,
    FaCircle
} from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import './ChatBox.css';

const ChatBox = ({
    chatType = 'global', // 'global' or 'private'
    recipientId = null,
    recipientName = null,
    recipientAvatar = null,
    onClose = null,
    className = ''
}) => {
    const { user } = useSelector((state) => state.auth);
    const { globalMessages, privateChats, typingUsers } = useSelector((state) => state.chat);
    const { sendMessage, sendPrivateMessage, sendTyping } = useChat();

    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Get messages based on chat type
    const messages = chatType === 'global'
        ? globalMessages
        : (privateChats[recipientId] || []);

    // Check if recipient is typing
    const recipientIsTyping = chatType === 'private' && typingUsers[recipientId];

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle input change
    const handleInputChange = (e) => {
        setInputValue(e.target.value);

        // Send typing indicator
        if (!isTyping) {
            setIsTyping(true);
            sendTyping(chatType === 'private' ? recipientId : null, true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTyping(chatType === 'private' ? recipientId : null, false);
        }, 1000);
    };

    // Handle send message
    const handleSend = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        if (chatType === 'global') {
            sendMessage(inputValue);
        } else {
            sendPrivateMessage(recipientId, inputValue);
        }

        setInputValue('');
        setShowEmojiPicker(false);

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            sendTyping(chatType === 'private' ? recipientId : null, false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        // Focus back to input
        inputRef.current?.focus();
    };

    // Handle emoji select
    const handleEmojiClick = (emojiObject) => {
        setInputValue(prev => prev + emojiObject.emoji);
        inputRef.current?.focus();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <div className={`chatbox-container ${className}`}>
            {/* Header */}
            <div className="chatbox-header">
                <div className="chatbox-header-left">
                    {chatType === 'private' && recipientAvatar && (
                        <img
                            src={recipientAvatar || '/default-avatar.png'}
                            alt={recipientName}
                            className="recipient-avatar"
                        />
                    )}
                    <div className="chatbox-title">
                        <h3>{chatType === 'global' ? 'Chat chung' : recipientName}</h3>
                        {chatType === 'private' && (
                            <span className="status-indicator">
                                <FaCircle className="status-dot online" />
                                Đang hoạt động
                            </span>
                        )}
                    </div>
                </div>
                {onClose && (
                    <button className="btn-close-chat" onClick={onClose}>
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="chatbox-messages">
                {messages.length === 0 ? (
                    <div className="empty-chat">
                        <p>Chưa có tin nhắn nào</p>
                        <span>Hãy bắt đầu cuộc trò chuyện! 👋</span>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwnMessage = message.userId === user?._id ||
                                message.fromUserId === user?._id ||
                                message.type === 'sent';

                            return (
                                <MessageBubble
                                    key={message.id || index}
                                    message={{
                                        ...message,
                                        username: isOwnMessage
                                            ? 'Bạn'
                                            : (message.username || message.fromUsername)
                                    }}
                                    isOwnMessage={isOwnMessage}
                                    showAvatar={chatType === 'global' || index === 0 ||
                                        messages[index - 1]?.userId !== message.userId}
                                />
                            );
                        })}

                        {/* Typing Indicator */}
                        {recipientIsTyping && (
                            <div className="typing-indicator">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-text">{recipientName} đang nhập...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <form className="chatbox-input-container" onSubmit={handleSend}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <div className="emoji-picker-wrapper">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width="100%"
                            height="350px"
                        />
                    </div>
                )}

                <div className="chatbox-input-wrapper">
                    <button
                        type="button"
                        className="btn-emoji"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <FaSmile />
                    </button>

                    <input
                        ref={inputRef}
                        type="text"
                        className="chatbox-input"
                        placeholder="Nhập tin nhắn..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        maxLength={500}
                    />

                    <button
                        type="submit"
                        className="btn-send"
                        disabled={!inputValue.trim()}
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </form>
        </div>
    );
};

ChatBox.propTypes = {
    chatType: PropTypes.oneOf(['global', 'private']),
    recipientId: PropTypes.string,
    recipientName: PropTypes.string,
    recipientAvatar: PropTypes.string,
    onClose: PropTypes.func,
    className: PropTypes.string
};

export default ChatBox;