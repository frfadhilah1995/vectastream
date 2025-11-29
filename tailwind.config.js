/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Base
                background: '#050505',

                // Surface System (for elevation)
                surface: {
                    base: '#050505',
                    raised: '#0A0A0A',
                    overlay: '#121212',
                },

                // Glass System (glassmorphism)
                glass: {
                    bg: 'rgba(255, 255, 255, 0.05)',
                    'bg-strong': 'rgba(255, 255, 255, 0.1)',
                    border: 'rgba(255, 255, 255, 0.15)',
                },

                // Accent/Primary System
                accent: {
                    50: '#E5F9FB',
                    100: '#B3EFFF',
                    500: '#00F2FF', // Primary
                    600: '#00D9E6',
                    700: '#00B8CC',
                    900: '#006B7D',
                    DEFAULT: '#00F2FF',
                    glow: 'rgba(0, 242, 255, 0.5)',
                },

                // Semantic Colors
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                info: '#3B82F6',
            },

            fontFamily: {
                sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },

            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.5rem' }],
                'lg': ['1.125rem', { lineHeight: '1.75rem' }],
                'xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '1' }],
            },

            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.4s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
