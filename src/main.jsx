import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { PWAProvider } from './context/PWAContext.jsx';

// Register Ghost Worker (Service Worker)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Use relative path for GitHub Pages compatibility
        const swPath = new URL('./sw.js', window.location.href).href;
        navigator.serviceWorker.register(swPath)
            .then((registration) => {
                console.log('[GhostWorker] 👻 Registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('[GhostWorker] ❌ Registration failed:', error);
            });
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <PWAProvider>
            <App />
        </PWAProvider>
    </React.StrictMode>
);
