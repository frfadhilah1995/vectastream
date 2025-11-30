// 🎨 VECTASTREAM V2.0 - REVOLUTIONARY DESIGN TOKENS
// Updated Tailwind Configuration with Revolutionary Design System

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ===================================
            // COLOR SYSTEM
            // ===================================
            colors: {
                // App Backgrounds (Pure Dark)
                app: {
                    bg: '#000000',          // True black
                    surface: '#0F0F0F',     // Gray 950
                    elevated: '#1A1A1A',    // Gray 900
                    overlay: 'rgba(0, 0, 0, 0.9)',
                },

                // Accent/Primary (Cyan-Teal Gradient)
                accent: {
                    50: '#ECFEFF',
                    100: '#CFFAFE',
                    200: '#A5F3FC',
                    300: '#67E8F9',
                    400: '#22D3EE',
                    500: '#06B6D4',    // Primary
                    600: '#0891B2',
                    700: '#0E7490',
                    800: '#155E75',
                    900: '#164E63',
                    primary: '#06B6D4',
                    secondary: '#14B8A6',
                    glow: 'rgba(6, 182, 212, 0.4)',
                },

                // Glass/Glassmorphism
                glass: {
                    bg: 'rgba(255, 255, 255, 0.05)',
                    'bg-strong': 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.15)',
                    'border-dark': 'rgba(0, 0, 0, 0.2)',
                },

                // Text Colors
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A3A3A3',  // Gray 400
                    tertiary: '#525252',   // Gray 600
                    disabled: '#404040',   // Gray 700
                },

                // Semantic
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',

                // Dynamic (set by JS - content-aware)
                dynamic: {
                    ambient: 'var(--content-ambient, #000000)',
                    vibrant: 'var(--content-vibrant, #06B6D4)',
                },
            },

            // ===================================
            // TYPOGRAPHY
            // ===================================
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
                mono: [
                    '"SF Mono"',
                    'Monaco',
                    '"Cascadia Code"',
                    'Consolas',
                    'monospace',
                ],
            },

            fontSize: {
                // Base Sizes
                'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
                'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px
                'lg': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
                'xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
                '2xl': ['2rem', { lineHeight: '2.25rem' }],      // 32px
                '3xl': ['3rem', { lineHeight: '1' }],            // 48px
                '4xl': ['4rem', { lineHeight: '1' }],            // 64px
            },

            // ===================================
            // SPACING (4px base unit)
            // ===================================
            spacing: {
                '18': '4.5rem',  // 72px
                '22': '5.5rem',  // 88px
                '26': '6.5rem',  // 104px
                '30': '7.5rem',  // 120px
            },

            // ===================================
            // BORDER RADIUS
            // ===================================
            borderRadius: {
                'sm': '0.375rem',   // 6px
                'md': '0.5rem',     // 8px
                'lg': '0.75rem',    // 12px
                'xl': '1rem',       // 16px
                '2xl': '1.5rem',    // 24px
                '3xl': '2rem',      // 32px
            },

            // ===================================
            // SHADOWS
            // ===================================
            boxShadow: {
                // Elevation
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',

                // Glows
                'glow-accent': '0 0 20px rgba(6, 182, 212, 0.4)',
                'glow-success': '0 0 20px rgba(16, 185, 129, 0.4)',
                'glow-error': '0 0 20px rgba(239, 68, 68, 0.4)',
            },

            // ===================================
            // ANIMATIONS
            // ===================================
            animation: {
                // Fade
                'fade-in': 'fadeIn 0.2s ease-in-out',
                'fade-out': 'fadeOut 0.2s ease-in-out',

                // Slide
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'slide-left': 'slideLeft 0.3s ease-out',
                'slide-right': 'slideRight 0.3s ease-out',

                // Scale
                'scale-in': 'scaleIn 0.2s ease-out',
                'scale-out': 'scaleOut 0.2s ease-out',

                // Drawer
                'drawer-in': 'drawerIn 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                'drawer-out': 'drawerOut 0.3s cubic-bezier(0.32, 0.72, 0, 1)',

                // Pulse
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeOut: {
                    '0%': { opacity: '1' },
                    '100%': { opacity: '0' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideLeft: {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                slideRight: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                scaleOut: {
                    '0%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(0.95)', opacity: '0' },
                },
                drawerIn: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                drawerOut: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(100%)' },
                },
            },

            // ===================================
            // BACKDROP BLUR
            // ===================================
            backdropBlur: {
                'xs': '2px',
                'sm': '4px',
                'md': '8px',
                'lg': '12px',
                'xl': '16px',
                '2xl': '24px',
            },

            // ===================================
            // Z-INDEX LAYERS
            // ===================================
            zIndex: {
                '1': '1',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',   // Floating header
                '60': '60',   // Tooltips
                '70': '70',   // Drawer
                '80': '80',   // Command palette
                '90': '90',   // Modals
                '100': '100', // Notifications
            },
        },
    },
    plugins: [],
}
