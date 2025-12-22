# Caro Online - Chat Realtime & Notifications System

## 📋 Tổng quan

Hệ thống **Chat realtime** và **Thông báo** hoàn chỉnh với:
- ✅ Chat global (sảnh chờ, phòng)
- ✅ Chat riêng tư (1-1)
- ✅ Typing indicators
- ✅ Emoji picker
- ✅ Thông báo real-time (friend online, invite room, messages)
- ✅ Sound notifications
- ✅ Auto-dismiss notifications
- ✅ Redux state management

---

## 🚀 Cấu trúc File

### Frontend (16 files)
```
frontend/src/
├── store/
│   ├── chatSlice.js                ✨ NEW - Redux chat state
│   ├── notificationSlice.js        ✨ NEW - Redux notification state
│   └── index.js                    ✏️ Updated
├── hooks/
│   └── useChat.js                  ✨ NEW - Chat hook with socket events
├── components/
│   ├── MessageBubble/
│   │   ├── MessageBubble.jsx       ✨ NEW - Message component
│   │   ├── MessageBubble.css       ✨ NEW
│   │   └── index.js                ✨ NEW
│   ├── ChatBox/
│   │   ├── ChatBox.jsx             ✨ NEW - Main chat component
│   │   ├── ChatBox.css             ✨ NEW
│   │   └── index.js                ✨ NEW
│   └── NotificationToast/
│       ├── NotificationToast.jsx   ✨ NEW - Notification UI
│       ├── NotificationToast.css   ✨ NEW
│       └── index.js                ✨ NEW
```

---

## 📦 Installation

```bash
cd frontend
npm install date-fns emoji-picker-react
```

---

## 🎯 Usage Guide

### **1. ChatBox Component**

#### Global Chat (Lobby, Room)
```javascript
import { ChatBox } from '../components/ChatBox';

function LobbyPage() {
  return (
    <div>
      <ChatBox chatType="global" />
    </div>
  );
}
```

#### Private Chat (1-1)
```javascript
import { ChatBox } from '../components/ChatBox';

function PrivateChatPage() {
  return (
    <ChatBox 
      chatType="private"
      recipientId="user123"
      recipientName="John Doe"
      recipientAvatar="https://..."
      onClose={() => console.log('Chat closed')}
    />
  );
}
```

### **2. useChat Hook**

```javascript
import { useChat } from '../hooks/useChat';

function MyComponent() {
  const { 
    sendMessage, 
    sendPrivateMessage,
    sendTyping,
    sendRoomInvitation 
  } = useChat();

  // Send global message
  const handleSend = () => {
    sendMessage('Hello everyone!');
  };

  // Send private message
  const handlePrivateMessage = () => {
    sendPrivateMessage('user123', 'Hi there!');
  };

  // Send typing indicator
  const handleTyping = () => {
    sendTyping('user123', true); // Start typing
    // Later...
    sendTyping('user123', false); // Stop typing
  };

  // Send room invitation
  const handleInvite = () => {
    sendRoomInvitation('user123', 'room456', 'Pro Room');
  };
}
```

### **3. NotificationToast**

Add to your main layout:

```javascript
import { NotificationToast } from '../components/NotificationToast';

function MainLayout() {
  return (
    <div>
      <Navbar />
      <Content />
      <NotificationToast /> {/* Add here */}
    </div>
  );
}
```

### **4. Redux Actions**

#### Chat Actions
```javascript
import { useDispatch } from 'react-redux';
import {
  addGlobalMessage,
  addPrivateMessage,
  setActiveChat,
  markAsRead,
  setTyping
} from '../store/chatSlice';

// Add global message
dispatch(addGlobalMessage({
  userId: 'user123',
  username: 'John',
  avatarUrl: 'https://...',
  content: 'Hello!',
  timestamp: new Date().toISOString()
}));

// Add private message
dispatch(addPrivateMessage({
  userId: 'user123',
  message: {
    fromUserId: 'user456',
    fromUsername: 'Jane',
    content: 'Hi!',
    type: 'received'
  }
}));

// Set active chat
dispatch(setActiveChat('user123')); // or null for global

// Mark as read
dispatch(markAsRead('user123'));

// Set typing
dispatch(setTyping({ userId: 'user123', isTyping: true }));
```

#### Notification Actions
```javascript
import { addNotification, markAsRead, toggleSound } from '../store/notificationSlice';

// Add notification
dispatch(addNotification({
  type: 'friend_online',
  title: 'Bạn bè',
  message: 'John đã online',
  userId: 'user123',
  username: 'John'
}));

// Mark as read
dispatch(markAsRead(notificationId));

// Toggle sound
dispatch(toggleSound());
```

---

## 🔌 Socket.IO Events

### **Client → Server**

| Event | Data | Description |
|-------|------|-------------|
| `send_message` | `{ userId, username, avatarUrl, content, timestamp }` | Gửi tin nhắn global |
| `private_message` | `{ fromUserId, fromUsername, toUserId, content, timestamp }` | Gửi tin nhắn riêng |
| `typing:global` | `{ isTyping }` | Đang nhập (global) |
| `typing:private` | `{ toUserId, isTyping }` | Đang nhập (private) |
| `invite_room` | `{ fromUserId, toUserId, roomId, roomName }` | Mời vào phòng |

### **Server → Client**

| Event | Data | Description |
|-------|------|-------------|
| `message` | `{ id, userId, username, avatarUrl, content, timestamp }` | Nhận tin nhắn global |
| `private_message` | `{ fromUserId, fromUsername, fromAvatar, content, timestamp }` | Nhận tin nhắn riêng |
| `typing:start` | `{ userId }` | Bắt đầu nhập |
| `typing:stop` | `{ userId }` | Dừng nhập |
| `friend_online` | `{ userId, username, avatarUrl }` | Bạn online |
| `friend_offline` | `{ userId }` | Bạn offline |
| `invite_room` | `{ roomId, roomName, fromUserId, fromUsername, fromAvatar }` | Lời mời phòng |

---

## 🎨 Features

### **ChatBox**
- ✅ Real-time messaging
- ✅ Emoji picker với 1000+ emojis
- ✅ Typing indicators
- ✅ Auto-scroll to latest message
- ✅ Message timestamps (relative time)
- ✅ Avatar display
- ✅ Global/Private chat modes
- ✅ Empty state UI
- ✅ Responsive design

### **MessageBubble**
- ✅ Own vs other message styling
- ✅ Avatar with conditional display
- ✅ Username display
- ✅ Relative timestamps (date-fns)
- ✅ Gradient background for own messages
- ✅ Word wrap for long messages

### **NotificationToast**
- ✅ Multiple notification types
- ✅ Auto-dismiss after 5 minutes
- ✅ Click to navigate
- ✅ Sound notifications
- ✅ Toggle sound on/off
- ✅ Clear all notifications
- ✅ Unread counter
- ✅ Categorized icons & colors
- ✅ Fixed position (top-right)

---

## 🎯 Notification Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `friend_online` | 👥 | Green | Bạn bè online |
| `friend_offline` | 👥 | Gray | Bạn bè offline |
| `friend_request` | 👥 | Blue | Lời mời kết bạn |
| `friend_accepted` | 👥 | Blue | Chấp nhận kết bạn |
| `invite_room` | 🎮 | Purple | Lời mời vào phòng |
| `game_started` | 🎮 | Purple | Game bắt đầu |
| `game_ended` | 🎮 | Purple | Game kết thúc |
| `message` | ✉️ | Orange | Tin nhắn mới |
| `system` | ℹ️ | Gray | Thông báo hệ thống |

---

## 🔊 Sound Notifications

Default notification sound: `/public/notification.mp3`

Add this file to your `/public` folder or disable sound in settings.

### Create notification sound
```javascript
// Simple beep sound generator
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

oscillator.frequency.value = 800;
oscillator.type = 'sine';
gainNode.gain.value = 0.3;

oscillator.start();
setTimeout(() => oscillator.stop(), 200);
```

---

## 🎨 Styling Customization

### Change Chat Gradient
```css
/* ChatBox.css */
.chatbox-header {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}

.own-message .message-bubble-content {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}
```

### Change Notification Position
```css
/* NotificationToast.css */
.notification-container {
  top: 80px;    /* Distance from top */
  right: 20px;  /* Distance from right */
  /* Change to left: 20px for left side */
}
```

---

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 968px
- **Desktop**: > 968px

All components are fully responsive!

---

## 🧪 Testing

### Test Chat Functionality
```javascript
// 1. Open browser console
// 2. Import useChat hook in component
// 3. Send test message

const { sendMessage } = useChat();
sendMessage('Test message!');

// Check Redux state
const state = store.getState();
console.log(state.chat.globalMessages);
```

### Test Notifications
```javascript
// Dispatch test notification
dispatch(addNotification({
  type: 'friend_online',
  title: 'Test',
  message: 'This is a test notification'
}));
```

### Test Socket Events
```javascript
// Backend - Emit test event
io.emit('friend_online', {
  userId: '123',
  username: 'Test User',
  avatarUrl: 'https://...'
});

// Frontend - Check notification appears
```

---

## 🐛 Troubleshooting

### Issue: Messages not showing
**Solution:**
- Check Socket.IO connection
- Verify useChat hook is initialized
- Check Redux state with Redux DevTools

### Issue: Emoji picker not working
**Solution:**
- Install `emoji-picker-react` package
- Check browser console for errors
- Use alternative simple emoji array

### Issue: Notifications not playing sound
**Solution:**
- Add `/public/notification.mp3` file
- Enable sound in notification settings
- Check browser autoplay policies

### Issue: Typing indicator stuck
**Solution:**
- Check timeout logic in ChatBox
- Verify socket events are cleaning up
- Clear typing state on component unmount

---

## 🚀 Next Steps

1. ✅ Integrate ChatBox into Room page
2. ✅ Add chat history persistence (database)
3. ✅ Implement file/image sharing
4. ✅ Add message reactions (emoji reactions)
5. ✅ Implement chat moderation
6. ✅ Add @mentions in group chat
7. ✅ Voice messages (optional)

---

## 📚 Dependencies

```json
{
  "date-fns": "^2.30.0",
  "emoji-picker-react": "^4.5.0",
  "react-icons": "^4.11.0",
  "react-toastify": "^9.1.3",
  "socket.io-client": "^4.7.2"
}
```

---

## 🎉 Complete Example

```javascript
// App.jsx or MainLayout.jsx
import { useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { ChatBox } from './components/ChatBox';
import { NotificationToast } from './components/NotificationToast';

function App() {
  // Initialize chat hook (sets up socket listeners)
  useChat();

  return (
    <div className="app">
      <Navbar />
      
      <main>
        <Routes>
          <Route path="/lobby" element={
            <LobbyPage>
              <ChatBox chatType="global" />
            </LobbyPage>
          } />
          
          <Route path="/room/:id" element={
            <RoomPage>
              <ChatBox chatType="global" />
            </RoomPage>
          } />
        </Routes>
      </main>

      {/* Global notification toast */}
      <NotificationToast />
    </div>
  );
}
```

---

**Chat system is ready! Enjoy real-time communication! 🎉💬**
