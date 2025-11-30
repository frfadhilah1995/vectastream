import { useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';

/**
 * 👆 GESTURE HANDLER - Touch & Swipe Gestures
 * 
 * Supported Gestures:
 * - Swipe Up: Open channel drawer
 * - Swipe Down: Close drawer / Hide controls
 * - Swipe Left: Next channel
 * - Swipe Right: Previous channel
 * - Double Tap: Play/Pause
 * - Long Press: Show context menu
 */

const GestureHandler = ({
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onDoubleTap,
    onLongPress,
    enabled = true,
    targetRef = null,
}) => {
    // Double tap detection
    const handleDoubleTap = useCallback(() => {
        let lastTap = 0;
        let timeout;

        return (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            clearTimeout(timeout);

            if (tapLength < 300 && tapLength > 0) {
                // Double tap detected
                if (onDoubleTap) {
                    e.preventDefault();
                    onDoubleTap(e);
                }
            } else {
                timeout = setTimeout(() => {
                    clearTimeout(timeout);
                }, 300);
            }

            lastTap = currentTime;
        };
    }, [onDoubleTap]);

    // Long press detection
    const handleLongPress = useCallback(() => {
        let pressTimer = null;

        const start = (e) => {
            pressTimer = setTimeout(() => {
                if (onLongPress) {
                    onLongPress(e);
                }
            }, 500); // 500ms for long press
        };

        const cancel = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        return { start, cancel };
    }, [onLongPress]);

    // Swipe handlers using react-swipeable
    const swipeHandlers = useSwipeable({
        onSwipedUp: (eventData) => {
            if (onSwipeUp && enabled) {
                onSwipeUp(eventData);
            }
        },
        onSwipedDown: (eventData) => {
            if (onSwipeDown && enabled) {
                onSwipeDown(eventData);
            }
        },
        onSwipedLeft: (eventData) => {
            if (onSwipeLeft && enabled) {
                onSwipeLeft(eventData);
            }
        },
        onSwipedRight: (eventData) => {
            if (onSwipeRight && enabled) {
                onSwipeRight(eventData);
            }
        },
        preventScrollOnSwipe: true,
        trackMouse: false, // Only track touch, not mouse
        delta: 50, // Min distance for swipe (pixels)
    });

    // Setup event listeners
    useEffect(() => {
        if (!enabled) return;

        const target = targetRef?.current || document.body;
        const longPress = handleLongPress();
        const doubleTap = handleDoubleTap();

        // Double tap
        if (onDoubleTap) {
            target.addEventListener('touchend', doubleTap);
        }

        // Long press
        if (onLongPress) {
            target.addEventListener('touchstart', longPress.start);
            target.addEventListener('touchend', longPress.cancel);
            target.addEventListener('touchmove', longPress.cancel);
        }

        return () => {
            if (onDoubleTap) {
                target.removeEventListener('touchend', doubleTap);
            }
            if (onLongPress) {
                target.removeEventListener('touchstart', longPress.start);
                target.removeEventListener('touchend', longPress.cancel);
                target.removeEventListener('touchmove', longPress.cancel);
            }
        };
    }, [enabled, targetRef, onDoubleTap, onLongPress, handleDoubleTap, handleLongPress]);

    // Return swipe handlers to be spread on target element
    return swipeHandlers;
};

// Hook version for easier usage
export const useGestures = (options) => {
    return GestureHandler(options);
};

export default GestureHandler;
