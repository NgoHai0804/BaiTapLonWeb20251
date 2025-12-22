import { useCallback, useEffect, useRef } from 'react';
import soundManager from '../utils/soundManager';

/**
 * Custom hook for audio management
 * Easy to use sound effects in components
 * 
 * @returns {Object} Audio control functions
 */
export const useAudio = () => {
    const soundsRef = useRef({});

    /**
     * Play sound by name
     */
    const playSound = useCallback((soundName) => {
        soundManager.play(soundName);
    }, []);

    /**
     * Play sound with custom volume
     */
    const playSoundWithVolume = useCallback((soundName, volume) => {
        soundManager.playWithVolume(soundName, volume);
    }, []);

    /**
     * Loop sound
     */
    const loopSound = useCallback((soundName) => {
        soundManager.loop(soundName);
    }, []);

    /**
     * Stop sound
     */
    const stopSound = useCallback((soundName) => {
        soundManager.stop(soundName);
    }, []);

    /**
     * Stop all sounds
     */
    const stopAllSounds = useCallback(() => {
        soundManager.stopAll();
    }, []);

    /**
     * Set volume (0-1)
     */
    const setVolume = useCallback((volume) => {
        soundManager.setVolume(volume);
    }, []);

    /**
     * Toggle sound on/off
     */
    const toggleSound = useCallback(() => {
        return soundManager.toggle();
    }, []);

    /**
     * Set sound enabled
     */
    const setSoundEnabled = useCallback((enabled) => {
        soundManager.setEnabled(enabled);
    }, []);

    /**
     * Get sound settings
     */
    const getSoundSettings = useCallback(() => {
        return soundManager.getSettings();
    }, []);

    // Game-specific sound shortcuts
    const playMove = useCallback(() => playSound('move'), [playSound]);
    const playWin = useCallback(() => playSound('win'), [playSound]);
    const playLose = useCallback(() => playSound('lose'), [playSound]);
    const playDraw = useCallback(() => playSound('draw'), [playSound]);
    const playClick = useCallback(() => playSound('click'), [playSound]);
    const playNotification = useCallback(() => playSound('notification'), [playSound]);
    const playMessage = useCallback(() => playSound('message'), [playSound]);
    const playJoin = useCallback(() => playSound('join'), [playSound]);
    const playLeave = useCallback(() => playSound('leave'), [playSound]);
    const playError = useCallback(() => playSound('error'), [playSound]);
    const playSuccess = useCallback(() => playSound('success'), [playSound]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllSounds();
        };
    }, [stopAllSounds]);

    return {
        // Core functions
        playSound,
        playSoundWithVolume,
        loopSound,
        stopSound,
        stopAllSounds,
        setVolume,
        toggleSound,
        setSoundEnabled,
        getSoundSettings,

        // Game shortcuts
        playMove,
        playWin,
        playLose,
        playDraw,
        playClick,
        playNotification,
        playMessage,
        playJoin,
        playLeave,
        playError,
        playSuccess
    };
};

export default useAudio;