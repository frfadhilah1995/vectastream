/**
 * Stream Analyzer Utility
 * Analyzes stream URLs and header logs to diagnose playback issues.
 */

export const analyzeStream = (input) => {
    const result = {
        type: 'unknown',
        url: null,
        issues: [],
        recommendations: [],
        proxyMode: 'standard' // 'standard', 'direct', 'none'
    };

    // 1. Detect Input Type (URL or Log)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsFound = input.match(urlRegex);

    if (urlsFound && urlsFound.length > 0) {
        // Prioritize the first URL found that isn't the proxy itself
        result.url = urlsFound.find(u => !u.includes('workers.dev')) || urlsFound[0];
        result.type = input.includes('Request Method') ? 'log' : 'url';
    } else {
        result.issues.push({
            level: 'error',
            message: 'No valid URL found in input.'
        });
        return result;
    }

    // 2. Analyze URL Structure
    try {
        const urlObj = new URL(result.url);
        const port = urlObj.port;
        const protocol = urlObj.protocol;

        // Check for Raw/Legacy Ports
        if (['9981', '8000', '1935'].includes(port)) {
            result.issues.push({
                level: 'warning',
                message: `Detected non-standard media port: ${port}. Likely a raw stream server (Tvheadend, Shoutcast, Wowza).`
            });

            if (port === '9981' || port === '8000' || urlObj.pathname.includes('channelid')) {
                result.recommendations.push('Use "Browser Direct Mode" (No Referer/Origin) to bypass strict server checks.');
                result.proxyMode = 'direct';
            } else if (port === '1935') {
                result.recommendations.push('Legacy Wowza server detected. Requires "Self-Referential Referer" (Referer = Target URL).');
                result.proxyMode = 'standard'; // Standard proxy now handles this
            }
        }

        // Check for HTTP vs HTTPS
        if (protocol === 'http:') {
            result.issues.push({
                level: 'info',
                message: 'Stream is HTTP. Modern browsers block Mixed Content.'
            });
            result.recommendations.push('Must use Proxy to upgrade to HTTPS.');
        }

    } catch (e) {
        result.issues.push({ level: 'error', message: 'Invalid URL format.' });
    }

    // 3. Analyze Log Content (if provided)
    if (result.type === 'log') {
        // Check Status Code
        if (input.includes('403 Forbidden')) {
            result.issues.push({
                level: 'error',
                message: 'Server returned 403 Forbidden. Likely blocked due to Referer, Origin, or User-Agent.'
            });
        } else if (input.includes('206 Partial Content') || input.includes('200 OK')) {
            result.issues.push({
                level: 'success',
                message: 'Stream seems accessible (200/206 OK).'
            });
        }

        // Check Content-Type
        if (input.includes('content-type') && input.includes('text/html')) {
            result.issues.push({
                level: 'error',
                message: 'Server returned HTML instead of Video/Playlist. This is an error page.'
            });
        }

        // Check CORS Headers
        if (!input.toLowerCase().includes('access-control-allow-origin')) {
            result.issues.push({
                level: 'warning',
                message: 'No CORS headers detected in response.'
            });
            result.recommendations.push('Proxy is required to fix CORS.');
        }
    }

    // 4. Final Recommendations
    if (result.recommendations.length === 0) {
        if (result.issues.some(i => i.level === 'error')) {
            result.recommendations.push('Try enabling the Universal Proxy.');
        } else {
            result.recommendations.push('Stream looks good! If it fails, try the Proxy.');
        }
    }

    return result;
};
