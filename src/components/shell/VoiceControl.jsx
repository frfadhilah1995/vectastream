import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * 🎤 VOICE CONTROL - Speech recognition for hands-free control
 * 
 * Supported Commands:
 * - "Play [channel name]" - Switch to channel
 * - "Pause" / "Stop" - Pause playback
 * - "Play" / "Resume" - Resume playback
 * - "Next channel" - Go to next
 * - "Previous channel" - Go to previous
 * - "Volume up" / "Volume down" - Adjust volume
 * - "Mute" / "Unmute" - Toggle mute
 * - "Fullscreen" - Enter fullscreen
 * - "Search [query]" - Open search with query
 */

const VoiceControl = ({
    channels = [],
    onChannelSelect,
    onPlayPause,
    onNext,
    onPrevious,
    onVolumeChange,
    onMuteToggle,
    onFullscreen,
    onSearch,
    enabled = true,
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // Initialize Web Speech API
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech Recognition not supported in this browser');
            setIsSupported(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onstart = () => {
            setIsListening(true);
            setTranscript('');
        };

        recognitionInstance.onresult = (event) => {
            const lastResult = event.results[event.results.length - 1];
            const transcriptText = lastResult[0].transcript.toLowerCase().trim();
            setTranscript(transcriptText);
            processCommand(transcriptText);
        };

        recognitionInstance.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
        };

        setRecognition(recognitionInstance);
        setIsSupported(true);

        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop();
            }
        };
    }, []);

    // Process voice command
    const processCommand = useCallback((command) => {
        console.log('Voice command:', command);

        // Play specific channel
        if (command.startsWith('play ') || command.startsWith('watch ')) {
            const channelName = command.replace(/^(play|watch)\s+/, '');
            const matchedChannel = channels.find(c =>
                c.name.toLowerCase().includes(channelName)
            );

            if (matchedChannel && onChannelSelect) {
                onChannelSelect(matchedChannel);
                return;
            }
        }

        // Playback controls
        if (command === 'pause' || command === 'stop') {
            if (onPlayPause) onPlayPause(false);
            return;
        }

        if (command === 'play' || command === 'resume') {
            if (onPlayPause) onPlayPause(true);
            return;
        }

        // Navigation
        if (command === 'next channel' || command === 'next') {
            if (onNext) onNext();
            return;
        }

        if (command === 'previous channel' || command === 'previous' || command === 'back') {
            if (onPrevious) onPrevious();
            return;
        }

        // Volume
        if (command === 'volume up' || command === 'louder') {
            if (onVolumeChange) onVolumeChange(0.1, 'increase');
            return;
        }

        if (command === 'volume down' || command === 'quieter') {
            if (onVolumeChange) onVolumeChange(-0.1, 'decrease');
            return;
        }

        if (command === 'mute') {
            if (onMuteToggle) onMuteToggle(true);
            return;
        }

        if (command === 'unmute') {
            if (onMuteToggle) onMuteToggle(false);
            return;
        }

        // Fullscreen
        if (command === 'fullscreen' || command === 'full screen') {
            if (onFullscreen) onFullscreen();
            return;
        }

        // Search
        if (command.startsWith('search ')) {
            const query = command.replace(/^search\s+/, '');
            if (onSearch) onSearch(query);
            return;
        }

        console.warn('Command not recognized:', command);
    }, [channels, onChannelSelect, onPlayPause, onNext, onPrevious, onVolumeChange, onMuteToggle, onFullscreen, onSearch]);

    // Start/stop listening
    const toggleListening = useCallback(() => {
        if (!recognition || !enabled) return;

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }, [recognition, isListening, enabled]);

    // Keyboard shortcut (Ctrl+Shift+V)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                toggleListening();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleListening]);

    if (!isSupported) {
        return null; // Don't render if not supported
    }

    return {
        isListening,
        transcript,
        toggleListening,
        isSupported,
    };
};

// Voice Control Button Component
export const VoiceControlButton = ({
    voiceControl,
    className
}) => {
    if (!voiceControl.isSupported) return null;

    return (
        <button
            onClick={voiceControl.toggleListening}
            className={cn(
                'relative p-3 rounded-xl transition-all',
                voiceControl.isListening
                    ? 'bg-error text-white shadow-glow-error animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-white',
                'backdrop-blur-sm',
                className
            )}
            aria-label={voiceControl.isListening ? 'Stop listening' : 'Start voice control'}
        >
            {voiceControl.isListening ? <MicOff size={20} /> : <Mic size={20} />}

            {/* Listening indicator */}
            {voiceControl.isListening && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-ping" />
            )}
        </button>
    );
};

// Hook version
export const useVoiceControl = (options) => {
    return VoiceControl(options);
};

export default VoiceControl;
