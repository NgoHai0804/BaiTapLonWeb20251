# Installation Guide - UI/UX Features

## 📦 Required NPM Packages

```bash
cd frontend
npm install framer-motion react-confetti react-use
```

## Package Details

### 1. **framer-motion** (v10+)
- **Purpose**: Advanced animations
- **Usage**: GameResultModal, Modal, Loading animations
- **Size**: ~600KB
- **Docs**: https://www.framer.com/motion/

### 2. **react-confetti**
- **Purpose**: Confetti effect for win screen
- **Usage**: GameResultModal (victory celebration)
- **Size**: ~50KB
- **Docs**: https://github.com/alampros/react-confetti

### 3. **react-use**
- **Purpose**: Useful React hooks (useWindowSize, etc.)
- **Usage**: GameResultModal for responsive confetti
- **Size**: ~100KB
- **Docs**: https://github.com/streamich/react-use

## ✅ Verification

After installation, verify packages:

```bash
npm list framer-motion react-confetti react-use
```

Should output:
```
your-app@1.0.0
├── framer-motion@10.x.x
├── react-confetti@6.x.x
└── react-use@17.x.x
```

## 🎨 Import CSS Files

Add to your `src/index.css` or `src/main.jsx`:

```css
/* Import responsive utilities */
@import './styles/responsive.css';

/* Import animations */
@import './styles/animations.css';

/* Import toast styles */
@import './utils/toast.css';
```

Or in `main.jsx`:

```javascript
import './styles/responsive.css';
import './styles/animations.css';
import './utils/toast.css';
```

## 🔊 Setup Sound Files

See [SOUND_SETUP_GUIDE.md](./SOUND_SETUP_GUIDE.md) for detailed instructions.

Quick setup:
```bash
mkdir -p public/sounds
# Add your MP3 files here
```

## 📁 File Structure Check

Ensure these files exist:

```
frontend/
├── src/
│   ├── components/
│   │   ├── GameResultModal/
│   │   │   ├── GameResultModal.jsx
│   │   │   ├── GameResultModal.css
│   │   │   └── index.js
│   │   ├── Loading/
│   │   │   ├── Loading.jsx
│   │   │   ├── Loading.css
│   │   │   └── index.js
│   │   └── Modal/
│   │       ├── Modal.jsx
│   │       ├── Modal.css
│   │       └── index.js
│   ├── hooks/
│   │   ├── useAudio.js
│   │   └── useResponsive.js
│   ├── utils/
│   │   ├── soundManager.js
│   │   ├── toast.js
│   │   ├── toast.css
│   │   └── responsive.js
│   └── styles/
│       ├── responsive.css
│       └── animations.css
└── public/
    └── sounds/
        ├── click.mp3
        ├── move.mp3
        ├── win.mp3
        └── ... (other sounds)
```

## 🧪 Test Installation

Create a test component:

```javascript
// src/TestUI.jsx
import { useState } from 'react';
import { GameResultModal } from './components/GameResultModal';
import { Loading } from './components/Loading';
import { Modal } from './components/Modal';
import { useAudio } from './hooks/useAudio';
import toast from './utils/toast';

function TestUI() {
  const [showResult, setShowResult] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { playWin, playClick } = useAudio();

  return (
    <div className="p-4">
      <h1>UI Components Test</h1>
      
      {/* Test Buttons */}
      <div className="flex gap-2 mt-4">
        <button onClick={() => setShowResult(true)}>
          Show Win Modal
        </button>
        <button onClick={() => setShowModal(true)}>
          Show Modal
        </button>
        <button onClick={() => toast.success('Success!')}>
          Show Toast
        </button>
        <button onClick={playWin}>
          Play Sound
        </button>
      </div>

      {/* Loading Test */}
      <div className="mt-4">
        <Loading variant="spin" size="medium" text="Loading..." />
      </div>

      {/* Result Modal */}
      <GameResultModal
        isOpen={showResult}
        result="win"
        onClose={() => setShowResult(false)}
        onRematch={() => console.log('Rematch')}
        onExit={() => setShowResult(false)}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Test Modal"
      >
        <p>This is a test modal!</p>
      </Modal>
    </div>
  );
}

export default TestUI;
```

Add to your router:
```javascript
import TestUI from './TestUI';

// In routes
<Route path="/test-ui" element={<TestUI />} />
```

Visit `http://localhost:5173/test-ui` to test all components.

## 🐛 Troubleshooting

### Issue: Framer Motion not working
**Solution**:
```bash
npm install framer-motion@latest
```

### Issue: Confetti not showing
**Solution**:
- Check browser console for errors
- Ensure `react-use` is installed
- Verify window size is being detected

### Issue: Sounds not playing
**Solution**:
- Check sound files exist in `/public/sounds/`
- Check browser console for 404 errors
- Try clicking first (browser autoplay policy)
- Check volume settings in browser

### Issue: Animations laggy
**Solution**:
- Use `will-change: transform` CSS
- Reduce animation complexity
- Check GPU acceleration in DevTools

### Issue: Toast not styled
**Solution**:
- Import `toast.css` in main file
- Check `react-toastify` is installed
- Verify CSS import order

## 🚀 Production Build

Test production build:

```bash
npm run build
npm run preview
```

Check bundle size:
```bash
npm run build -- --report
```

## 📊 Bundle Size Impact

Approximate bundle size additions:
- framer-motion: ~55KB (gzipped)
- react-confetti: ~8KB (gzipped)
- react-use: ~15KB (gzipped)
- Custom CSS: ~5KB (gzipped)
- **Total**: ~83KB (acceptable for rich UI)

## ✨ Optional Optimizations

### Code Splitting
```javascript
// Lazy load GameResultModal
const GameResultModal = lazy(() => import('./components/GameResultModal'));
```

### Tree Shaking
Framer Motion supports tree shaking. Only import what you need:
```javascript
import { motion, AnimatePresence } from 'framer-motion';
// Don't import { * } from 'framer-motion'
```

## 🎉 You're Ready!

All UI/UX enhancements are now installed and ready to use!

Next steps:
1. ✅ Test all components
2. ✅ Add sound files
3. ✅ Integrate into game pages
4. ✅ Customize styles
5. ✅ Deploy!
