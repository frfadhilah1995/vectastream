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
        this.stats = { trequest: 0, tfirst: 0, tload: 0, loaded: 0, total: 0 };
        this.abortController = null;
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

        // 🔧 FIX: Safe stats initialization - prevent "Cannot set properties of undefined"
        this.stats = context.stats || {
            trequest: 0,
            tfirst: 0,
            tload: 0,
            loaded: 0,
            total: 0
        };

        this.abortController = new AbortController();

        const url = context.url;
        const startTime = performance.now();

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

                // 🔧 FIX: Safe stats.loading assignment with null check
                if (!this.stats.loading) {
                    this.stats.loading = {};
                }
                this.stats.loading.start = startTime;
                this.stats.loading.first = firstByteTime;
                this.stats.loading.end = endTime;

                this.stats.loaded = data.byteLength || data.length;
                this.stats.total = parseInt(response.headers.get('content-length') || '0') || this.stats.loaded;

                const successData = {
                    url: url,
                    data: data,
                };

                // 🔧 FIX: Verify callbacks exist before calling
                if (callbacks && callbacks.onSuccess) {
                    callbacks.onSuccess(successData, this.stats, context, response);
                }
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    console.log('[FetchLoader] Request aborted:', url);
                    return;
                }

                console.error('[FetchLoader] Load failed:', url, error);

                const errorData = {
                    code: 0,
                    text: error.message || 'Fetch failed',
                };

                // 🔧 FIX: Verify callbacks exist before calling
                if (callbacks && callbacks.onError) {
                    callbacks.onError(errorData, context, null, this.stats);
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
