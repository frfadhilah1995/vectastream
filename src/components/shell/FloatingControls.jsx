import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
    Settings,
    PictureInPicture,
    Maximize
} from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * 🎮 FLOATING CONTROLS - Player controls (auto-hide)
 * 
 * Features:
 * - Auto-hide when inactive
 * - Play/Pause, Volume, Fullscreen
 * - Quality selector
 * - Picture-in-Picture
 * - Previous/Next channel
 * - Smooth animations
 */

const FloatingControls = ({
    isPlaying = false,
    onPlayPause,
    volume = 1,
    onVolumeChange,
    isMuted = false,
    onMuteToggle,
    onFullscreen,
    onPip,
    onPrevious,
    onNext,
    onQualityChange,
    availableQualities = ['Auto', '1080p', '720p', '480p'],
    currentQuality = 'Auto',
    className,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [idleTimer, setIdleTimer] = useState(null);

    // Auto-hide after 3 seconds of inactivity
    useEffect(() => {
        const handleMouseMove = () => {
            setIsVisible(true);

            // Clear existing timer
            if (idleTimer) {
                clearTimeout(idleTimer);
            }

            // Set new timer
            const timer = setTimeout(() => {
                setIsVisible(false);
                setShowVolumeSlider(false);
                setShowQualityMenu(false);
            }, 3000);

            setIdleTimer(timer);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleMouseMove);
            if (idleTimer) clearTimeout(idleTimer);
        };
    }, [idleTimer]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
                    className={cn(
                        'fixed bottom-0 left-0 right-0 z-[var(--z-header)]',
                        'bg-gradient-to-t from-black/90 via-black/70 to-transparent',
                        'backdrop-blur-xl',
                        'pb-safe',
                        className
                    )}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left: Playback Controls */}
                            <div className="flex items-center gap-2">
                                {/* Previous */}
                                {onPrevious && (
                                    <button
                                        onClick={onPrevious}
                                        className={cn(
                                            'p-3 rounded-xl',
                                            'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                            'text-white',
                                            'transition-all',
                                            'backdrop-blur-sm'
                                        )}
                                        aria-label="Previous channel"
                                    >
                                        <SkipBack size={20} />
                                    </button>
                                )}

                                {/* Play/Pause */}
                                <button
                                    onClick={onPlayPause}
                                    className={cn(
                                        'p-4 rounded-xl',
                                        'bg-accent-500 hover:bg-accent-600 active:bg-accent-700',
                                        'text-white shadow-lg shadow-accent-500/30',
                                        'transition-all transform hover:scale-105 active:scale-95'
                                    )}
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                                </button>

                                {/* Next */}
                                {onNext && (
                                    <button
                                        onClick={onNext}
                                        className={cn(
                                            'p-3 rounded-xl',
                                            'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                            'text-white',
                                            'transition-all',
                                            'backdrop-blur-sm'
                                        )}
                                        aria-label="Next channel"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                )}

                                {/* Volume */}
                                <div className="relative flex items-center gap-2">
                                    <button
                                        onClick={onMuteToggle}
                                        onMouseEnter={() => setShowVolumeSlider(true)}
                                        className={cn(
                                            'p-3 rounded-xl',
                                            'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                            'text-white',
                                            'transition-all',
                                            'backdrop-blur-sm'
                                        )}
                                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>

                                    {/* Volume Slider */}
                                    <AnimatePresence>
                                        {showVolumeSlider && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className={cn(
                                                    'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl',
                                                    'bg-black/80 backdrop-blur-sm border border-white/20'
                                                )}
                                                onMouseLeave={() => setShowVolumeSlider(false)}
                                            >
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.01"
                                                    value={volume}
                                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                                    className="w-24 accent-accent-500"
                                                />
                                                <span className="text-xs text-white font-medium w-10 text-right">
                                                    {Math.round(volume * 100)}%
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Right: Settings & Actions */}
                            <div className="flex items-center gap-2">
                                {/* Quality Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                                        className={cn(
                                            'hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl',
                                            'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                            'text-white text-sm font-medium',
                                            'transition-all',
                                            'backdrop-blur-sm',
                                            showQualityMenu && 'bg-white/20'
                                        )}
                                    >
                                        <Settings size={18} />
                                        {currentQuality}
                                    </button>

                                    {/* Quality Menu */}
                                    <AnimatePresence>
                                        {showQualityMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className={cn(
                                                    'absolute bottom-full right-0 mb-2',
                                                    'bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl',
                                                    'shadow-2xl overflow-hidden'
                                                )}
                                            >
                                                {availableQualities.map((quality) => (
                                                    <button
                                                        key={quality}
                                                        onClick={() => {
                                                            onQualityChange(quality);
                                                            setShowQualityMenu(false);
                                                        }}
                                                        className={cn(
                                                            'w-full px-6 py-3 text-left text-sm',
                                                            'hover:bg-white/10 transition-colors',
                                                            quality === currentQuality
                                                                ? 'text-accent-500 font-bold bg-white/5'
                                                                : 'text-white'
                                                        )}
                                                    >
                                                        {quality}
                                                        {quality === currentQuality && (
                                                            <span className="ml-2">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Picture-in-Picture */}
                                {onPip && (
                                    <button
                                        onClick={onPip}
                                        className={cn(
                                            'p-3 rounded-xl',
                                            'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                            'text-white',
                                            'transition-all',
                                            'backdrop-blur-sm'
                                        )}
                                        aria-label="Picture-in-Picture"
                                    >
                                        <PictureInPicture size={20} />
                                    </button>
                                )}

                                {/* Fullscreen */}
                                <button
                                    onClick={onFullscreen}
                                    className={cn(
                                        'p-3 rounded-xl',
                                        'bg-white/10 hover:bg-white/20 active:bg-white/30',
                                        'text-white',
                                        'transition-all',
                                        'backdrop-blur-sm'
                                    )}
                                    aria-label="Fullscreen"
                                >
                                    <Maximize size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloatingControls;
