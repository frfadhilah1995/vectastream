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
        this.stats = { trequest: performance.now(), tfirst: 0, tload: 0, mtime: null };
        this.abortController = new AbortController();

        const url = context.url;

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

                this.stats.tfirst = Math.max(performance.now(), this.stats.trequest);
                this.stats.total = parseInt(response.headers.get('content-length') || '0');

                // Get response as ArrayBuffer or text
                let data;
                if (context.responseType === 'arraybuffer' || url.endsWith('.ts')) {
                    data = await response.arrayBuffer();
                } else {
                    data = await response.text();
                }

                this.stats.tload = performance.now();
                this.stats.loaded = data.byteLength || data.length;

                const successData = {
                    url: url,
                    data: data,
                };

                callbacks.onSuccess(successData, this.stats, context, response);
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

                callbacks.onError(errorData, context, null, this.stats);
            });
    }

    // Required by HLS.js interface
    getResponseHeader(name) {
        // Not used in our implementation
        return null;
    }
}

export default FetchLoader;
