/**
 * 📱 ANDROID BACKGROUND PLAYBACK MANAGER
 * Enables PWA to run in background on Android devices
 * Features: Media Session API, Wake Lock, Background Sync
 */

class BackgroundPlaybackManager {
    constructor() {
        this.wakeLock = null;
        this.mediaSession = null;
        this.isBackgroundEnabled = false;
    }

    /**
     * Initialize background playback features
     */
    async initialize(videoElement) {
        console.log('[BackgroundPlayback] Initializing...');

        // 1. Setup Media Session (for background controls)
        if ('mediaSession' in navigator) {
            await this.setupMediaSession(videoElement);
        }

        // 2. Setup Wake Lock (prevent screen sleep)
        if ('wakeLock' in navigator) {
            await this.requestWakeLock();
        }

        // 3. Setup Page Lifecycle handlers
        this.setupLifecycleHandlers();

        // 4. Setup Background Sync
        this.setupBackgroundSync();

        this.isBackgroundEnabled = true;
        console.log('[BackgroundPlayback] ✅ Initialized');
    }

    /**
     * Setup Media Session API for background playback controls
     */
    async setupMediaSession(videoElement) {
        if (!('mediaSession' in navigator)) {
            console.warn('[MediaSession] Not supported');
            return;
        }

        try {
            // Set metadata
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'VectaStream Live',
                artist: 'IPTV Stream',
                album: 'Live TV',
                artwork: [
                    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            // Set action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('[MediaSession] Play action');
                videoElement?.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('[MediaSession] Pause action');
                videoElement?.pause();
            });

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                console.log('[MediaSession] Seek backward');
                if (videoElement) {
                    videoElement.currentTime = Math.max(videoElement.currentTime - (details.seekOffset || 10), 0);
                }
            });

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                console.log('[MediaSession] Seek forward');
                if (videoElement) {
                    videoElement.currentTime = Math.min(videoElement.currentTime + (details.seekOffset || 10), videoElement.duration);
                }
            });

            // Update playback state
            navigator.mediaSession.playbackState = 'playing';

            console.log('[MediaSession] ✅ Configured');
            this.mediaSession = navigator.mediaSession;
        } catch (error) {
            console.error('[MediaSession] Setup failed:', error);
        }
    }

    /**
     * Update media session metadata (call when channel changes)
     */
    updateMetadata(channelName, channelLogo = '/icon-192.png') {
        if (!this.mediaSession) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: channelName,
                artist: 'VectaStream',
                album: 'Live TV',
                artwork: [
                    { src: channelLogo || '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: channelLogo || '/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });
            console.log('[MediaSession] Metadata updated:', channelName);
        } catch (error) {
            console.error('[MediaSession] Update failed:', error);
        }
    }

    /**
     * Request Wake Lock to prevent screen sleep during playback
     */
    async requestWakeLock() {
        if (!('wakeLock' in navigator)) {
            console.warn('[WakeLock] Not supported');
            return;
        }

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('[WakeLock] ✅ Acquired');

            // Re-acquire wake lock when visibility changes
            this.wakeLock.addEventListener('release', () => {
                console.log('[WakeLock] Released');
            });
        } catch (error) {
            console.error('[WakeLock] Request failed:', error);
        }
    }

    /**
     * Release Wake Lock
     */
    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('[WakeLock] Released manually');
            } catch (error) {
                console.error('[WakeLock] Release failed:', error);
            }
        }
    }

    /**
     * Setup Page Lifecycle handlers to maintain background playback
     */
    setupLifecycleHandlers() {
        // Re-acquire wake lock when page becomes visible
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && !this.wakeLock) {
                console.log('[Lifecycle] Page visible, re-acquiring wake lock');
                await this.requestWakeLock();
            }
        });

        // Handle page freeze/resume (Android background)
        document.addEventListener('freeze', () => {
            console.log('[Lifecycle] Page frozen (background)');
            // Keep media session active
        });

        document.addEventListener('resume', () => {
            console.log('[Lifecycle] Page resumed (foreground)');
            // Re-acquire wake lock if needed
            if (!this.wakeLock) {
                this.requestWakeLock();
            }
        });

        console.log('[Lifecycle] ✅ Handlers setup');
    }

    /**
     * Setup Background Sync for data synchronization
     */
    async setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Register periodic sync for playlist updates
                if ('periodicSync' in registration) {
                    await registration.periodicSync.register('update-playlists', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    });
                    console.log('[BackgroundSync] ✅ Periodic sync registered');
                }
            } catch (error) {
                console.warn('[BackgroundSync] Setup failed:', error);
            }
        }
    }

    /**
     * Enable picture-in-picture mode
     */
    async enablePictureInPicture(videoElement) {
        if (!document.pictureInPictureEnabled) {
            console.warn('[PiP] Not supported');
            return false;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoElement.requestPictureInPicture();
                console.log('[PiP] ✅ Enabled');
            }
            return true;
        } catch (error) {
            console.error('[PiP] Failed:', error);
            return false;
        }
    }

    /**
     * Cleanup
     */
    async cleanup() {
        await this.releaseWakeLock();

        if (this.mediaSession) {
            navigator.mediaSession.playbackState = 'none';
        }

        console.log('[BackgroundPlayback] Cleaned up');
    }
}

// Singleton instance
const backgroundPlayback = new BackgroundPlaybackManager();

export default backgroundPlayback;
