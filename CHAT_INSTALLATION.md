# Installation Guide for Chat Features

## Required NPM Packages

```bash
cd frontend
npm install date-fns emoji-picker-react
```

## Package Descriptions

- **date-fns**: Modern JavaScript date utility library for formatting timestamps
- **emoji-picker-react**: React emoji picker component for chat

## Usage in Components

### date-fns (MessageBubble.jsx)
```javascript
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const timeAgo = formatDistanceToNow(new Date(timestamp), { 
  addSuffix: true,
  locale: vi 
});
```

### emoji-picker-react (ChatBox.jsx)
```javascript
import EmojiPicker from 'emoji-picker-react';

<EmojiPicker 
  onEmojiClick={handleEmojiClick}
  width="100%"
  height="350px"
/>
```

## Alternative (if packages cause issues)

If you encounter issues, you can:

1. **For date-fns**: Use native JavaScript
```javascript
const timeAgo = new Date(timestamp).toLocaleString('vi-VN');
```

2. **For emoji-picker**: Remove emoji picker feature or use a simpler implementation
```javascript
// Simple emoji array
const emojis = ['😀', '😂', '❤️', '👍', '🎉'];
```
