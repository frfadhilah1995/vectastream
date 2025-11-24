/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#050505',
                glass: {
                    bg: 'rgba(255, 255, 255, 0.05)',
                    border: 'rgba(255, 255, 255, 0.15)',
                },
                accent: {
                    DEFAULT: '#00f2ff',
                    glow: 'rgba(0, 242, 255, 0.5)',
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
