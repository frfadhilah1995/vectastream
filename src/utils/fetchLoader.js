/**
 * Fetch-based HLS Loader
 * Forces HLS.js to use fetch() instead of XMLHttpRequest
 * This ensures Service Worker can intercept ALL HLS requests
 */

class FetchLoader {
    constructor(config) {
        this.context = null;
        this.config = config;
        this.callbacks = null;
        // 🔧 FIX: Initialize FULL stats structure in constructor
        this.stats = {
            trequest: 0,
            tfirst: 0,
            tload: 0,
            loaded: 0,
            total: 0,
            loading: { start: 0, first: 0, end: 0 },
            parsing: { start: 0, end: 0 },
            buffering: { start: 0, first: 0, end: 0 }
        };
        this.abortController = null;
        // Debug log removed to prevent spam (was logging on every segment load)
    }

    destroy() {
        this.abort();
        this.context = null;
        this.config = null;
        this.callbacks = null;
    }

    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    load(context, config, callbacks) {
        this.context = context;
        this.config = config;
        this.callbacks = callbacks;

        // 🔧 FIX: Robust stats initialization
        // console.log('[FetchLoader] Context stats before init:', context.stats);

        // Ensure all substructures expected by HLS.js exist
        // If context.stats exists, we merge into it. If not, we use our default.
        this.stats = context.stats || this.stats;

        if (!this.stats.trequest) this.stats.trequest = performance.now();
        if (!this.stats.retry) this.stats.retry = 0;

        // Force-ensure substructures exist
        if (!this.stats.loading) this.stats.loading = { start: 0, first: 0, end: 0 };
        if (!this.stats.parsing) this.stats.parsing = { start: 0, end: 0 };
        if (!this.stats.buffering) this.stats.buffering = { start: 0, first: 0, end: 0 };

        // Sync back to context explicitly
        if (context.stats !== this.stats) {
            context.stats = this.stats;
        }

        this.abortController = new AbortController();

        const url = context.url;
        const startTime = performance.now();

        // 🔧 FIX: Set start time SYNCHRONOUSLY
        // HLS.js monitors this while request is in progress
        this.stats.loading.start = startTime;

        // Use fetch (which Service Worker CAN intercept)
        fetch(url, {
            signal: this.abortController.signal,
            credentials: 'omit',
            mode: 'cors',
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} ${response.statusText}`);
                }

                const firstByteTime = performance.now();

                // Get response as ArrayBuffer or text
                let data;
                if (context.responseType === 'arraybuffer' || url.endsWith('.ts')) {
                    data = await response.arrayBuffer();
                } else {
                    data = await response.text();
                }

                const endTime = performance.now();

                // Update stats
                this.stats.loading.first = firstByteTime;
                this.stats.loading.end = endTime;

                this.stats.loaded = data.byteLength || data.length;
                this.stats.total = parseInt(response.headers.get('content-length') || '0') || this.stats.loaded;
                this.stats.tload = endTime;

                const successData = {
                    url: url,
                    data: data,
                };

                // 🔧 FIX: Verify callbacks exist and wrap in try-catch
                if (callbacks && callbacks.onSuccess) {
                    try {
                        callbacks.onSuccess(successData, this.stats, context, response);
                    } catch (err) {
                        console.error('[FetchLoader] Error in onSuccess callback:', err);
                        // Don't re-throw, just log. HLS.js might handle it or we might need to trigger onError
                    }
                }
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    // console.log('[FetchLoader] Request aborted:', url);
                    return;
                }

                console.error('[FetchLoader] Load failed:', url, error);

                const errorData = {
                    code: 0,
                    text: error.message || 'Fetch failed',
                };

                // 🔧 FIX: Verify callbacks exist and wrap in try-catch
                if (callbacks && callbacks.onError) {
                    try {
                        callbacks.onError(errorData, context, null, this.stats);
                    } catch (err) {
                        console.error('[FetchLoader] Error in onError callback:', err);
                    }
                }
            });
    }

    // Required by HLS.js interface
    getResponseHeader(name) {
        // Not used in our implementation
        return null;
    }
}

export default FetchLoader;
