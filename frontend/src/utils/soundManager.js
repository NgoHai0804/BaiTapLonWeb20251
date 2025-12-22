/**
 * Sound Manager
 * Centralized audio management system
 */

class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;

        // Load from localStorage
        const savedSettings = localStorage.getItem('soundSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.enabled = settings.enabled ?? true;
            this.volume = settings.volume ?? 0.5;
        }
    }

    /**
     * Preload sounds
     */
    preloadSounds(soundList) {
        soundList.forEach(({ name, src }) => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.sounds[name] = audio;
        });
    }

    /**
     * Play sound
     */
    play(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }

        // Clone audio to allow multiple simultaneous plays
        const audioClone = sound.cloneNode();
        audioClone.volume = this.volume;

        audioClone.play().catch(error => {
            console.warn('Audio play failed:', error);
        });
    }

    /**
     * Play with custom volume
     */
    playWithVolume(soundName, volume) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (!sound) return;

        const audioClone = sound.cloneNode();
        audioClone.volume = Math.min(1, Math.max(0, volume));

        audioClone.play().catch(error => {
            console.warn('Audio play failed:', error);
        });
    }

    /**
     * Loop sound
     */
    loop(soundName) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (!sound) return;

        sound.loop = true;
        sound.volume = this.volume;
        sound.play().catch(error => {
            console.warn('Audio loop failed:', error);
        });
    }

    /**
     * Stop sound
     */
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (!sound) return;

        sound.pause();
        sound.currentTime = 0;
        sound.loop = false;
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
            sound.loop = false;
        });
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        this.volume = Math.min(1, Math.max(0, volume));

        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });

        this.saveSettings();
    }

    /**
     * Enable/disable sounds
     */
    setEnabled(enabled) {
        this.enabled = enabled;

        if (!enabled) {
            this.stopAll();
        }

        this.saveSettings();
    }

    /**
     * Toggle sound
     */
    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('soundSettings', JSON.stringify({
            enabled: this.enabled,
            volume: this.volume
        }));
    }

    /**
     * Get current settings
     */
    getSettings() {
        return {
            enabled: this.enabled,
            volume: this.volume
        };
    }
}

// Create singleton instance
const soundManager = new SoundManager();

// Preload default sounds
soundManager.preloadSounds([
    { name: 'click', src: '/sounds/click.mp3' },
    { name: 'move', src: '/sounds/move.mp3' },
    { name: 'win', src: '/sounds/win.mp3' },
    { name: 'lose', src: '/sounds/lose.mp3' },
    { name: 'draw', src: '/sounds/draw.mp3' },
    { name: 'notification', src: '/sounds/notification.mp3' },
    { name: 'message', src: '/sounds/message.mp3' },
    { name: 'join', src: '/sounds/join.mp3' },
    { name: 'leave', src: '/sounds/leave.mp3' },
    { name: 'error', src: '/sounds/error.mp3' },
    { name: 'success', src: '/sounds/success.mp3' }
]);

export default soundManager;