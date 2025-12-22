# Sound Files Setup Guide

## 📁 Directory Structure

Create this folder in your frontend:
```
frontend/public/sounds/
├── click.mp3
├── move.mp3
├── win.mp3
├── lose.mp3
├── draw.mp3
├── notification.mp3
├── message.mp3
├── join.mp3
├── leave.mp3
├── error.mp3
└── success.mp3
```

## 🎵 Sound Requirements

All sounds should be:
- **Format**: MP3
- **Duration**: 0.5 - 2 seconds
- **Size**: < 100KB per file
- **Volume**: Normalized

## 🔊 Where to Get Sounds

### Free Sound Resources:
1. **Freesound.org** - https://freesound.org
   - License: CC0 (Public Domain)
   - Search terms: "click", "success", "error", "notification"

2. **Zapsplat.com** - https://zapsplat.com
   - License: Free for games
   - High quality game sounds

3. **Mixkit.co** - https://mixkit.co/free-sound-effects
   - License: Free
   - Modern UI sounds

4. **Pixabay Sounds** - https://pixabay.com/sound-effects
   - License: Free
   - Clean, simple sounds

## 🎹 Generate Sounds Programmatically

If you can't download sounds, use Web Audio API:

```javascript
// Create sound generator
function generateBeep(frequency = 800, duration = 200) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Usage
generateBeep(800, 200); // Success sound
generateBeep(400, 100); // Click sound
generateBeep(200, 300); // Error sound
```

## 🎯 Recommended Sound Mappings

| Sound File | Frequency | Duration | Use Case |
|------------|-----------|----------|----------|
| `click.mp3` | 1000Hz | 50ms | Button clicks |
| `move.mp3` | 800Hz | 100ms | Game moves |
| `win.mp3` | 880Hz→1200Hz | 500ms | Victory |
| `lose.mp3` | 400Hz→200Hz | 500ms | Defeat |
| `draw.mp3` | 600Hz | 300ms | Draw game |
| `notification.mp3` | 800Hz | 200ms | Notifications |
| `message.mp3` | 900Hz | 150ms | New messages |
| `join.mp3` | 600Hz→800Hz | 200ms | User joins |
| `leave.mp3` | 800Hz→600Hz | 200ms | User leaves |
| `error.mp3` | 300Hz | 400ms | Errors |
| `success.mp3` | 800Hz→1200Hz | 300ms | Success |

## 🛠️ Create MP3 Files

### Option 1: Online Tools
- **Online Tone Generator**: https://onlinetonegenerator.com
- **Audacity** (Free software): https://audacityteam.org
  1. Generate → Tone
  2. Set frequency and duration
  3. Export as MP3

### Option 2: Using Audacity
1. Download Audacity
2. Generate → Tone
3. Configure:
   - Waveform: Sine
   - Frequency: See table above
   - Amplitude: 0.3
   - Duration: See table above
4. Effect → Fade Out (last 0.1s)
5. File → Export → MP3

### Option 3: Use Placeholder
If sounds are not critical during development, create silent placeholders:

```bash
cd frontend/public
mkdir -p sounds
cd sounds

# Create empty files
touch click.mp3 move.mp3 win.mp3 lose.mp3 draw.mp3 \
      notification.mp3 message.mp3 join.mp3 leave.mp3 \
      error.mp3 success.mp3
```

The app will work without errors (sounds just won't play).

## ✅ Verification

After adding sounds, verify they work:

```javascript
// In browser console
import soundManager from './utils/soundManager';

soundManager.play('click');    // Should hear click
soundManager.play('win');      // Should hear win sound
soundManager.play('error');    // Should hear error sound
```

## 🎨 Custom Sounds

To use your own sounds:

1. Add files to `/public/sounds/`
2. Update `soundManager.js`:

```javascript
soundManager.preloadSounds([
  { name: 'mySound', src: '/sounds/mySound.mp3' },
  // ... other sounds
]);
```

3. Use in components:

```javascript
const { playSound } = useAudio();
playSound('mySound');
```

## 📝 License Compliance

If using downloaded sounds, check licenses:
- ✅ CC0 (Public Domain) - OK for commercial use
- ✅ CC-BY - OK, but requires attribution
- ❌ CC-BY-NC - Not for commercial projects

## 🚀 Production Tips

1. **Compress sounds** before production:
   ```bash
   ffmpeg -i input.mp3 -ab 64k output.mp3
   ```

2. **Lazy load** sounds:
   - Only load when needed
   - Preload critical sounds (click, move)
   - Load others on demand

3. **Fallback**:
   - Add error handling in soundManager
   - App should work without sounds

---

**Note**: Sounds are optional. The app will work fine without them - users just won't hear audio feedback.
