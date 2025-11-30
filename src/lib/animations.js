// 🎭 VECTASTREAM V2.0 - FRAMER MOTION ANIMATION PRESETS

/**
 * Centralized animation configurations for consistent motion design
 * Based on Material Design motion principles and Apple's iOS animation curves
 */

// ===================================
// EASING CURVES
// ===================================
export const easings = {
    // Standard (general use)
    standard: [0.4, 0.0, 0.2, 1],

    // Deceleration (entrance)
    decelerate: [0.0, 0.0, 0.2, 1],

    // Acceleration (exit)
    accelerate: [0.4, 0.0, 1, 1],

    // Sharp (quick interactions)
    sharp: [0.4, 0.0, 0.6, 1],

    // Spring (bouncy feel)
    spring: { type: 'spring', damping: 30, stiffness: 300 },
    springBouncy: { type: 'spring', damping: 20, stiffness: 200 },
};

// ===================================
// DURATIONS
// ===================================
export const durations = {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.4,
    slower: 0.6,
};

// ===================================
// FADE ANIMATIONS
// ===================================
export const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast, ease: easings.standard },
};

export const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

export const fadeDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

export const fadeLeft = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

export const fadeRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

// ===================================
// SLIDE ANIMATIONS
// ===================================
export const slideUp = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: easings.spring,
};

export const slideDown = {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
    transition: easings.spring,
};

export const slideLeft = {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: easings.spring,
};

export const slideRight = {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    transition: easings.spring,
};

// ===================================
// SCALE ANIMATIONS
// ===================================
export const scale = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: durations.fast, ease: easings.standard },
};

export const scaleUp = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

export const scaleDown = {
    initial: { scale: 1.1, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.1, opacity: 0 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

// ===================================
// DRAWER ANIMATIONS (Bottom Sheet)
// ===================================
export const drawer = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { ...easings.spring, damping: 40, stiffness: 350 },
};

export const drawerOverlay = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast },
};

// ===================================
// MODAL/DIALOG ANIMATIONS
// ===================================
export const modal = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: durations.normal, ease: easings.standard },
};

export const modalOverlay = {
    initial: { opacity: 0, backdropFilter: 'blur(0px)' },
    animate: { opacity: 1, backdropFilter: 'blur(8px)' },
    exit: { opacity: 0, backdropFilter: 'blur(0px)' },
    transition: { duration: durations.normal },
};

// ===================================
// COMMAND PALETTE ANIMATIONS
// ===================================
export const commandPalette = {
    initial: { scale: 0.95, y: -20, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: { scale: 0.95, y: -20, opacity: 0 },
    transition: { duration: durations.fast, ease: easings.sharp },
};

// ===================================
// HOVER/TAP ANIMATIONS
// ===================================
export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.15, ease: easings.standard },
};

export const hoverGlow = {
    boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
    transition: { duration: durations.fast },
};

export const tapScale = {
    scale: 0.95,
    transition: { duration: 0.1 },
};

// ===================================
// STAGGER ANIMATIONS (List Items)
// ===================================
export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05, // 50ms between each child
            delayChildren: 0.1,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
    transition: { duration: durations.fast },
};

// ===================================
// PAGE TRANSITIONS
// ===================================
export const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: durations.normal, ease: easings.standard },
};

// ===================================
// FLOATING ANIMATIONS (Header/Controls)
// ===================================
export const floatingHeader = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

export const floatingControls = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    transition: { duration: durations.normal, ease: easings.decelerate },
};

// ===================================
// SKELETON LOADING ANIMATION
// ===================================
export const shimmer = {
    animate: {
        backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
    },
};

// ===================================
// PRESET COLLECTIONS
// ===================================
export const animations = {
    // Basic
    fade,
    fadeUp,
    fadeDown,
    fadeLeft,
    fadeRight,

    // Slide
    slideUp,
    slideDown,
    slideLeft,
    slideRight,

    // Scale
    scale,
    scaleUp,
    scaleDown,

    // Components
    drawer,
    drawerOverlay,
    modal,
    modalOverlay,
    commandPalette,

    // Interactions
    hoverScale,
    hoverGlow,
    tapScale,

    // Lists
    staggerContainer,
    staggerItem,

    // Pages
    pageTransition,

    // Floating
    floatingHeader,
    floatingControls,

    // Loading
    shimmer,
};

export default animations;
