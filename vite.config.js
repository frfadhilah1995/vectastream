import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'VectaStream - IPTV Platform',
        short_name: 'VectaStream',
        description: 'Professional IPTV Streaming Platform - Watch live TV channels from around the world',
        theme_color: '#00f2ff',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Don't cache the Ghost Worker (sw.js) - it's already registered manually
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  base: '/vectastream/', // GitHub Pages repository name
  server: {
    host: true
  },
  build: {
    // Production optimizations
    target: 'es2015', // Support modern browsers
    minify: 'esbuild', // Fast minification
    cssCodeSplit: true, // Split CSS for better caching
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-video': ['hls.js', 'm3u8-parser'],
          'vendor-ui': ['lucide-react', 'framer-motion']
        }
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 600
  }
})
