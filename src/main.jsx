import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Use relative path for GitHub Pages compatibility
        const swPath = new URL('./sw.js', window.location.href).href;
        navigator.serviceWorker.register(swPath)
            .then((registration) => {
                console.log('[PWA] Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.error('[PWA] Service Worker registration failed:', error);
            });
    });
}

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt ready');

    // Auto-show install prompt after 5 seconds
    setTimeout(() => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('[PWA] User accepted install');
                } else {
                    console.log('[PWA] User dismissed install');
                }
                deferredPrompt = null;
            });
        }
    }, 5000);
});

// Log when app is installed
window.addEventListener('appinstalled', () => {
    console.log('[PWA] VectaStream installed successfully!');
    deferredPrompt = null;
});
