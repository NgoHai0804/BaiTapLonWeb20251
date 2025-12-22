# Caro Online - UI/UX Enhancement System

## 🎨 Tổng quan

Hệ thống **UI/UX Enhancement** hoàn chỉnh với:
- ✅ Framer Motion animations
- ✅ Sound effects system
- ✅ Loading states
- ✅ Toast notifications
- ✅ Modal components
- ✅ Game result animations
- ✅ Responsive design
- ✅ Accessibility features

---

## 📦 Installation

```bash
cd frontend
npm install framer-motion react-confetti react-use
```

See [UI_INSTALLATION_GUIDE.md](./UI_INSTALLATION_GUIDE.md) for detailed setup.

---

## 🎯 Components Overview

### 1. **GameResultModal** 🏆
Win/Lose/Draw modal với animations và confetti

```javascript
import { GameResultModal } from './components/GameResultModal';

<GameResultModal
  isOpen={gameOver}
  result="win" // 'win', 'lose', 'draw'
  onClose={() => setGameOver(false)}
  onRematch={handleRematch}
  onExit={handleExit}
/>
```

**Features:**
- ✅ Framer Motion animations
- ✅ Confetti for wins
- ✅ Sound effects
- ✅ Decorative stars
- ✅ Gradient backgrounds
- ✅ Responsive design

---

### 2. **Loading** ⏳
Multiple loading variants

```javascript
import { Loading } from './components/Loading';

// Fullscreen loading
<Loading 
  fullScreen 
  variant="spin" 
  text="Đang tải..."
/>

// Inline loading
<Loading 
  variant="dots" 
  size="small"
/>
```

**Variants:**
- `spin` - Spinning circle
- `dots` - Bouncing dots
- `pulse` - Pulsing circle
- `bars` - Animated bars

**Sizes:**
- `small` - 30-40px
- `medium` - 50-60px (default)
- `large` - 80-90px

---

### 3. **Modal** 📋
Reusable modal component

```javascript
import { Modal } from './components/Modal';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="medium"
>
  <p>Modal content here</p>
</Modal>
```

**Props:**
- `size`: 'small' | 'medium' | 'large' | 'fullscreen'
- `closeOnOverlayClick`: boolean
- `closeOnEscape`: boolean
- `showCloseButton`: boolean

---

## 🔊 Sound System

### soundManager
Centralized sound management

```javascript
import soundManager from './utils/soundManager';

// Play sound
soundManager.play('click');

// Play with custom volume
soundManager.playWithVolume('win', 0.8);

// Loop background music
soundManager.loop('background');

// Stop sound
soundManager.stop('background');

// Set volume (0-1)
soundManager.setVolume(0.5);

// Toggle sound on/off
soundManager.toggle();

// Get settings
const { enabled, volume } = soundManager.getSettings();
```

### useAudio Hook
React hook for sounds

```javascript
import { useAudio } from './hooks/useAudio';

function MyComponent() {
  const { 
    playClick, 
    playWin,
    playMove,
    setVolume,
    toggleSound 
  } = useAudio();

  const handleClick = () => {
    playClick();
    // do something
  };

  const handleWin = () => {
    playWin();
    // show result
  };

  return (
    <button onClick={handleClick}>
      Click Me
    </button>
  );
}
```

**Available Sounds:**
- `playClick()` - Button clicks
- `playMove()` - Game moves
- `playWin()` - Victory
- `playLose()` - Defeat
- `playDraw()` - Draw
- `playNotification()` - Notifications
- `playMessage()` - New messages
- `playJoin()` - User joins room
- `playLeave()` - User leaves room
- `playError()` - Errors
- `playSuccess()` - Success actions

---

## 🎨 Toast Notifications

Enhanced toast with sounds and styling

```javascript
import toast from './utils/toast';

// Success
toast.success('Đã lưu thành công!');
toast.success('Profile updated', 'Success');

// Error
toast.error('Có lỗi xảy ra!');
toast.error('Invalid input', 'Error');

// Warning
toast.warning('Vui lòng kiểm tra lại');

// Info
toast.info('Game sắp bắt đầu!');

// Loading (Promise)
toast.loading(
  apiCall(),
  {
    pending: 'Đang xử lý...',
    success: 'Thành công!',
    error: 'Lỗi!'
  }
);

// Dismiss
const toastId = toast.success('Hello');
toast.dismiss(toastId);

// Dismiss all
toast.dismissAll();
```

**Features:**
- ✅ Custom icons per type
- ✅ Sound integration
- ✅ Gradient backgrounds
- ✅ Auto-dismiss
- ✅ Promise handling
- ✅ Responsive

---

## 📱 Responsive Utilities

### useResponsive Hook

```javascript
import { useResponsive } from './hooks/useResponsive';

function MyComponent() {
  const { 
    breakpoint,  // 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
    isMobile,    // boolean
    isTablet,    // boolean
    isDesktop,   // boolean
    viewport     // { width, height }
  } = useResponsive();

  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
      <p>Screen: {viewport.width}x{viewport.height}</p>
    </div>
  );
}
```

### Responsive Utilities

```javascript
import { 
  isMobile, 
  isTablet, 
  isDesktop,
  getCurrentBreakpoint,
  getViewport,
  debounce,
  throttle 
} from './utils/responsive';

// Check device type
if (isMobile()) {
  // Mobile logic
}

// Get current breakpoint
const breakpoint = getCurrentBreakpoint(); // 'sm', 'md', etc.

// Get viewport size
const { width, height } = getViewport();

// Debounce resize handler
const handleResize = debounce(() => {
  console.log('Resized!');
}, 300);

// Throttle scroll handler
const handleScroll = throttle(() => {
  console.log('Scrolling!');
}, 200);
```

---

## 🎭 Animation Utilities

### CSS Classes

```html
<!-- Fade animations -->
<div class="animate-fadeIn">Fade in</div>
<div class="animate-fadeOut">Fade out</div>

<!-- Slide animations -->
<div class="animate-slideInLeft">Slide from left</div>
<div class="animate-slideInRight">Slide from right</div>
<div class="animate-slideInUp">Slide from bottom</div>
<div class="animate-slideInDown">Slide from top</div>

<!-- Scale animations -->
<div class="animate-scaleIn">Scale in</div>
<div class="animate-bounceIn">Bounce in</div>

<!-- Continuous animations -->
<div class="animate-spin">Spinning</div>
<div class="animate-bounce">Bouncing</div>
<div class="animate-pulse">Pulsing</div>
<div class="animate-float">Floating</div>
<div class="animate-glow">Glowing</div>

<!-- With delays -->
<div class="animate-fadeIn animate-delay-1">Delayed 0.1s</div>
<div class="animate-slideInUp animate-delay-3">Delayed 0.3s</div>

<!-- With custom duration -->
<div class="animate-fadeIn animate-fast">Fast (0.2s)</div>
<div class="animate-slideInRight animate-slow">Slow (0.6s)</div>

<!-- Hover effects -->
<button class="hover-lift">Lift on hover</button>
<button class="hover-scale">Scale on hover</button>
<button class="hover-glow">Glow on hover</button>
<button class="hover-rotate">Rotate on hover</button>
```

### Responsive CSS Utilities

```html
<!-- Grid -->
<div class="grid grid-cols-3 gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Flex -->
<div class="flex items-center justify-between gap-2">
  <span>Left</span>
  <span>Right</span>
</div>

<!-- Spacing -->
<div class="mt-4 mb-2 p-3">Content</div>

<!-- Hide/Show responsively -->
<div class="hide-mobile">Desktop only</div>
<div class="show-mobile">Mobile only</div>
<div class="hide-tablet">Not on tablet</div>
```

---

## 🎯 Usage Examples

### Game Page with All Features

```javascript
import { useState, useEffect } from 'react';
import { GameResultModal } from './components/GameResultModal';
import { Loading } from './components/Loading';
import { Modal } from './components/Modal';
import { useAudio } from './hooks/useAudio';
import { useResponsive } from './hooks/useResponsive';
import toast from './utils/toast';

function GamePage() {
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const { playMove, playWin, playLose } = useAudio();
  const { isMobile } = useResponsive();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 2000);
  }, []);

  const handleMove = (row, col) => {
    playMove();
    // Game logic
  };

  const handleGameEnd = (winner) => {
    if (winner === 'player') {
      playWin();
      setResult('win');
    } else {
      playLose();
      setResult('lose');
    }
    setGameOver(true);
    toast.success('Game ended!');
  };

  if (loading) {
    return <Loading fullScreen variant="spin" text="Loading game..." />;
  }

  return (
    <div className="game-container">
      {/* Game Board */}
      <div className={`board ${isMobile ? 'mobile' : 'desktop'}`}>
        {/* Board cells */}
      </div>

      {/* Menu Modal */}
      <Modal
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Game Menu"
      >
        <button onClick={() => console.log('Settings')}>Settings</button>
        <button onClick={() => console.log('Exit')}>Exit</button>
      </Modal>

      {/* Result Modal */}
      <GameResultModal
        isOpen={gameOver}
        result={result}
        onClose={() => setGameOver(false)}
        onRematch={() => {
          setGameOver(false);
          // Restart game
        }}
        onExit={() => {
          // Exit to lobby
        }}
      />
    </div>
  );
}
```

---

## 📊 Features Checklist

### Animations
- ✅ Game result modal (win/lose/draw)
- ✅ Confetti for victories
- ✅ Loading states
- ✅ Modal transitions
- ✅ Hover effects
- ✅ Micro-interactions

### Sound System
- ✅ Sound manager
- ✅ useAudio hook
- ✅ 11 default sounds
- ✅ Volume control
- ✅ Enable/disable toggle
- ✅ LocalStorage persistence

### Components
- ✅ GameResultModal
- ✅ Loading (4 variants)
- ✅ Modal
- ✅ Toast notifications

### Responsive
- ✅ useResponsive hook
- ✅ Responsive utilities
- ✅ Breakpoint detection
- ✅ Mobile/Tablet/Desktop helpers
- ✅ Global responsive CSS

### Accessibility
- ✅ Keyboard support (Escape key)
- ✅ Focus management
- ✅ ARIA labels
- ✅ Reduced motion support
- ✅ Screen reader friendly

---

## 🎨 Customization

### Change Theme Colors

Edit component CSS files:

```css
/* GameResultModal.css */
.result-win {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}

/* Modal.css */
.modal-header {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}
```

### Add Custom Sounds

```javascript
// soundManager.js
soundManager.preloadSounds([
  // ... existing sounds
  { name: 'mySound', src: '/sounds/mySound.mp3' }
]);

// Usage
import soundManager from './utils/soundManager';
soundManager.play('mySound');
```

### Custom Animations

Add to `animations.css`:

```css
@keyframes myAnimation {
  from { /* ... */ }
  to { /* ... */ }
}

.animate-myAnimation {
  animation: myAnimation 0.5s ease forwards;
}
```

---

## 🐛 Troubleshooting

See [UI_INSTALLATION_GUIDE.md](./UI_INSTALLATION_GUIDE.md#troubleshooting)

---

## 📚 Documentation

- [UI Installation Guide](./UI_INSTALLATION_GUIDE.md)
- [Sound Setup Guide](./SOUND_SETUP_GUIDE.md)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Confetti](https://github.com/alampros/react-confetti)

---

## 🎉 Complete!

Your Caro Online game now has premium UI/UX with:
- 🎭 Smooth animations
- 🔊 Sound effects
- 📱 Full responsive design
- ♿ Accessibility features
- 🎨 Modern aesthetics

**Enjoy creating an amazing user experience!** ✨
