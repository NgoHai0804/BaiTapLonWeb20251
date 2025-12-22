import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSocket } from './useSocket';
import {
    addGlobalMessage,
    addPrivateMessage,
    setTyping,
    addOnlineUser,
    removeOnlineUser
} from '../store/chatSlice';
import { addNotification } from '../store/notificationSlice';
import { toast } from 'react-toastify';

/**
 * Custom hook for Chat functionality
 * Handles socket events: send_message, private_message, typing, etc.
 * 
 * @returns {Object} Chat functions and state
 */
export const useChat = () => {
    const dispatch = useDispatch();
    const { emit, on } = useSocket();
    const { user } = useSelector((state) => state.auth);
    const { soundEnabled } = useSelector((state) => state.notification);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        if (soundEnabled) {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => { }); // Ignore errors
        }
    }, [soundEnabled]);

    // Setup socket event listeners
    useEffect(() => {
        const cleanupFunctions = [];

        // ============================================
        // GLOBAL CHAT EVENTS
        // ============================================

        // Receive global message
        const unsubscribeMessage = on('message', (data) => {
            dispatch(addGlobalMessage({
                id: data.id || Date.now(),
                userId: data.userId,
                username: data.username,
                avatarUrl: data.avatarUrl,
                content: data.content,
                timestamp: data.timestamp
            }));

            // Play sound if not from current user
            if (data.userId !== user?._id) {
                playNotificationSound();
            }
        });
        cleanupFunctions.push(unsubscribeMessage);

        // ============================================
        // PRIVATE MESSAGE EVENTS
        // ============================================

        // Receive private message
        const unsubscribePrivateMessage = on('private_message', (data) => {
            const { fromUserId, fromUsername, fromAvatar, content, timestamp } = data;

            dispatch(addPrivateMessage({
                userId: fromUserId,
                message: {
                    id: Date.now(),
                    fromUserId,
                    fromUsername,
                    fromAvatar,
                    content,
                    timestamp,
                    type: 'received'
                }
            }));

            // Show notification
            dispatch(addNotification({
                type: 'message',
                title: 'Tin nhắn mới',
                message: `${fromUsername}: ${content}`,
                fromUserId,
                fromUsername,
                fromAvatar
            }));

            // Play sound
            playNotificationSound();

            // Show toast
            toast.info(`${fromUsername}: ${content.substring(0, 50)}...`);
        });
        cleanupFunctions.push(unsubscribePrivateMessage);

        // ============================================
        // TYPING INDICATOR EVENTS
        // ============================================

        // User started typing
        const unsubscribeTypingStart = on('typing:start', (data) => {
            dispatch(setTyping({ userId: data.userId, isTyping: true }));
        });
        cleanupFunctions.push(unsubscribeTypingStart);

        // User stopped typing
        const unsubscribeTypingStop = on('typing:stop', (data) => {
            dispatch(setTyping({ userId: data.userId, isTyping: false }));
        });
        cleanupFunctions.push(unsubscribeTypingStop);

        // ============================================
        // FRIEND STATUS EVENTS
        // ============================================

        // Friend came online
        const unsubscribeFriendOnline = on('friend_online', (data) => {
            dispatch(addOnlineUser(data.userId));

            dispatch(addNotification({
                type: 'friend_online',
                title: 'Bạn bè',
                message: `${data.username} đã online`,
                userId: data.userId,
                username: data.username,
                avatarUrl: data.avatarUrl
            }));

            toast.success(`${data.username} đã online`);
            playNotificationSound();
        });
        cleanupFunctions.push(unsubscribeFriendOnline);

        // Friend went offline
        const unsubscribeFriendOffline = on('friend_offline', (data) => {
            dispatch(removeOnlineUser(data.userId));
        });
        cleanupFunctions.push(unsubscribeFriendOffline);

        // ============================================
        // ROOM INVITATION EVENTS
        // ============================================

        // Received room invitation
        const unsubscribeInviteRoom = on('invite_room', (data) => {
            const { roomId, roomName, fromUserId, fromUsername, fromAvatar } = data;

            dispatch(addNotification({
                type: 'invite_room',
                title: 'Lời mời vào phòng',
                message: `${fromUsername} mời bạn vào phòng "${roomName}"`,
                roomId,
                roomName,
                fromUserId,
                fromUsername,
                fromAvatar
            }));

            toast.info(`${fromUsername} mời bạn vào phòng "${roomName}"`);
            playNotificationSound();
        });
        cleanupFunctions.push(unsubscribeInviteRoom);

        // Cleanup
        return () => {
            cleanupFunctions.forEach(cleanup => cleanup && cleanup());
        };
    }, [on, dispatch, user, playNotificationSound]);

    // ============================================
    // SEND FUNCTIONS
    // ============================================

    // Send global message
    const sendMessage = useCallback((content) => {
        if (!content.trim()) return;

        const messageData = {
            userId: user._id,
            username: user.nickname || user.username,
            avatarUrl: user.avatarUrl,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        // Emit to server
        emit('send_message', messageData);

        // Add to local state immediately
        dispatch(addGlobalMessage({
            ...messageData,
            id: Date.now()
        }));
    }, [emit, dispatch, user]);

    // Send private message
    const sendPrivateMessage = useCallback((toUserId, content) => {
        if (!content.trim()) return;

        const messageData = {
            fromUserId: user._id,
            fromUsername: user.nickname || user.username,
            fromAvatar: user.avatarUrl,
            toUserId,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        // Emit to server
        emit('private_message', messageData);

        // Add to local state immediately
        dispatch(addPrivateMessage({
            userId: toUserId,
            message: {
                id: Date.now(),
                ...messageData,
                type: 'sent'
            }
        }));
    }, [emit, dispatch, user]);

    // Send typing indicator
    const sendTyping = useCallback((toUserId = null, isTyping = true) => {
        if (toUserId) {
            // Private chat typing
            emit('typing:private', { toUserId, isTyping });
        } else {
            // Global chat typing
            emit('typing:global', { isTyping });
        }
    }, [emit]);

    // Send room invitation
    const sendRoomInvitation = useCallback((toUserId, roomId, roomName) => {
        emit('invite_room', {
            fromUserId: user._id,
            fromUsername: user.nickname || user.username,
            fromAvatar: user.avatarUrl,
            toUserId,
            roomId,
            roomName
        });

        toast.success('Đã gửi lời mời!');
    }, [emit, user]);

    return {
        sendMessage,
        sendPrivateMessage,
        sendTyping,
        sendRoomInvitation
    };
};

export default useChat;
