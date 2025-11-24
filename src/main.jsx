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
        navigator.serviceWorker.register('/sw.js')
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
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('[PWA] Install prompt ready');

    // Show custom install UI (you can add a button to trigger this)
    // For now, automatically show prompt after 5 seconds
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
    }, 5000); // Show prompt after 5 seconds
});

// Log when app is installed
window.addEventListener('appinstalled', () => {
    console.log('[PWA] VectaStream installed successfully!');
    deferredPrompt = null;
});
