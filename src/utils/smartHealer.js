/**
 * Advanced Smart Stream Healer
 * Multi-proxy rotation + Alternative sources + Exponential backoff retry
 * Native Android Support (Capacitor)
 */

import errorDB from './errorDatabase';
import proxyPool from './proxyPool';
import { getAlternatives } from './alternativeSources';
import { smartHead, isNativePlatform } from './nativeHttp';

/**
 * Retry with exponential backoff
 */
async function tryWithRetry(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        factor = 2
    } = options;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const delay = Math.min(baseDelay * Math.pow(factor, i), maxDelay);
            console.log(`[Retry] Attempt ${i + 1} failed, waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Test a stream URL with specific proxy
 */
async function testWithProxy(streamUrl, proxy, signal) {
    const startTime = Date.now();

    // Build proxy URL
    const testUrl = proxy.url.endsWith('=')
        ? `${proxy.url}${streamUrl}`  // CORS Anywhere format
        : `${proxy.url}/${streamUrl}`; // Standard format

    try {
        const response = await fetch(testUrl, {
            method: 'HEAD',
            signal,
            headers: {
                'Accept': '*/*',
                'Origin': window.location.origin
            }
        });

        const duration = Date.now() - startTime;
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return {
            proxy: proxy.name,
            statusCode: response.status,
            headers,
            duration,
            success: response.ok,
            error: null,
            url: testUrl
        };

    } catch (error) {
        const duration = Date.now() - startTime;

        return {
            proxy: proxy.name,
            statusCode: null,
            headers: {},
            duration,
            success: false,
            error: error.name === 'AbortError' ? 'Timeout' : error.message,
            url: testUrl
        };
    }
}

/**
 * Test direct connection (no proxy)
 * Uses native HTTP on mobile (CORS-free!) and fetch on web
 */
async function testDirect(streamUrl, signal) {
    const startTime = Date.now();
    const isNative = isNativePlatform();

    try {
        // Use smart HTTP (native on mobile, fetch on web)
        const response = await smartHead(streamUrl, {
            signal,
            timeout: 10000
        });

        const duration = Date.now() - startTime;
        const headers = {};

        // Handle both fetch Response and native response
        if (response.headers && response.headers.forEach) {
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
        } else if (response.headers) {
            // Native headers map
            Object.entries(response.headers).forEach(([key, value]) => {
                headers[key] = value;
            });
        }

        return {
            proxy: isNative ? 'Direct (Native)' : 'Direct (Web)',
            statusCode: response.status,
            headers,
            duration,
            success: response.ok || (response.status >= 200 && response.status < 300),
            error: null,
            url: streamUrl,
            isNative
        };

    } catch (error) {
        const duration = Date.now() - startTime;

        return {
            proxy: isNative ? 'Direct (Native)' : 'Direct (Web)',
            statusCode: null,
            headers: {},
            duration,
            success: false,
            error: error.message,
            url: streamUrl,
            isNative
        };
    }
}

/**
 * Try all proxies for a single URL
 */
async function tryAllProxies(streamUrl, options = {}) {
    const { timeout = 10000, onProgress = null } = options;
    const attempts = [];

    // 1. Try direct first (fastest)
    if (onProgress) onProgress({ proxy: 'Direct', stage: 'testing' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const directResult = await testDirect(streamUrl, controller.signal);
    clearTimeout(timeoutId);

    attempts.push(directResult);

    if (directResult.success) {
        proxyPool.reportSuccess('Direct', directResult.duration);
        return { success: true, result: directResult, attempts };
    }

    // 2. Try proxies (only if direct failed)
    // On native, we might want to skip proxies if the error was definitely not geo-blocking
    // But for now, let's keep it robust and try proxies if direct fails

    const proxies = proxyPool.getAllProxies();

    for (const proxy of proxies) {
        if (onProgress) onProgress({ proxy: proxy.name, stage: 'testing' });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await testWithProxy(streamUrl, proxy, controller.signal);
        clearTimeout(timeoutId);

        attempts.push(result);

        if (result.success) {
            proxyPool.reportSuccess(proxy.name, result.duration);
            return { success: true, result, attempts };
        } else {
            // Determine error type for better reporting
            const errorType = result.statusCode === 403 ? '403' :
                result.statusCode === 404 ? '404' :
                    result.error === 'Timeout' ? 'timeout' :
                        'network';

            proxyPool.reportFailure(proxy.name, errorType);
        }
    }

    return { success: false, result: null, attempts };
}

/**
 * Analyze all attempts and determine verdict
 */
function analyzeAttempts(allAttempts, urlsTried) {
    // Find any successful attempt
    const successful = allAttempts.find(a => a.success);
    if (successful) {
        return {
            verdict: 'SUCCESS',
            recommendation: `Stream works via ${successful.proxy}. Using: ${successful.url}`,
            workingUrl: successful.url,
            workingStrategy: successful.proxy
        };
    }

    // All failed - analyze patterns
    const lastAttempt = allAttempts[allAttempts.length - 1];

    // All 404 = Dead link
    if (allAttempts.every(a => a.statusCode === 404)) {
        return {
            verdict: 'DEAD_LINK',
            recommendation: `All ${urlsTried.length} URLs returned 404. Content permanently offline.`,
            workingUrl: null,
            workingStrategy: null
        };
    }

    // All 403 = Geo-blocking / IP blocking
    if (allAttempts.every(a => a.statusCode === 403)) {
        return {
            verdict: 'FORBIDDEN',
            recommendation: 'All proxies blocked (403). Server requires Indonesia VPS proxy or IP whitelisting.',
            workingUrl: null,
            workingStrategy: null
        };
    }

    // All network errors
    if (allAttempts.every(a => a.error)) {
        return {
            verdict: 'NETWORK_ERROR',
            recommendation: 'Network connection failed on all attempts. Server may be down or geo-restricted.',
            workingUrl: null,
            workingStrategy: null
        };
    }

    // Mixed errors
    return {
        verdict: 'UNKNOWN_ERROR',
        recommendation: `Failed with ${lastAttempt.statusCode || lastAttempt.error}. ${urlsTried.length} URLs tried, all failed.`,
        workingUrl: null,
        workingStrategy: null
    };
}

/**
 * Advanced Smart Healer - Main Function
 * Multi-proxy + Multi-source with intelligent fallback
 */
export async function healStream(channel, options = {}) {
    const {
        timeout = 10000,
        onProgress = null,
        saveToDatabase = true,
        useAlternatives = true,
        maxRetries = 2
    } = options;

    console.log(`[AdvancedHealer] 🚀 Starting advanced heal for: ${channel.name}`);

    // Get all URLs to try (original + alternatives)
    const urlsToTry = useAlternatives
        ? getAlternatives(channel.name, channel.url)
        : [channel.url];

    console.log(`[AdvancedHealer] Will try ${urlsToTry.length} URL(s):`, urlsToTry);

    const allAttempts = [];

    // Try each URL
    for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
        const currentUrl = urlsToTry[urlIndex];

        if (onProgress) {
            onProgress({
                stage: 'url',
                current: urlIndex + 1,
                total: urlsToTry.length,
                url: currentUrl
            });
        }

        console.log(`[AdvancedHealer] Trying URL ${urlIndex + 1}/${urlsToTry.length}: ${currentUrl}`);

        // Try with retry logic
        const tryUrl = async () => {
            return await tryAllProxies(currentUrl, { timeout, onProgress });
        };

        try {
            const result = await tryWithRetry(tryUrl, { maxRetries });

            allAttempts.push(...result.attempts);

            if (result.success) {
                console.log(`[AdvancedHealer] ✅ Success with URL ${urlIndex + 1}!`);

                // Analyze and save
                const analysis = {
                    verdict: 'SUCCESS',
                    recommendation: `Stream works via ${result.result.proxy}. Using: ${result.result.url}`,
                    workingUrl: result.result.url,
                    workingStrategy: result.result.proxy
                };

                if (saveToDatabase) {
                    await saveForensicLog(channel, allAttempts, analysis, urlsToTry);
                }

                return {
                    success: true,
                    ...analysis,
                    attempts: allAttempts,
                    urlsTried: urlsToTry.slice(0, urlIndex + 1)
                };
            }
        } catch (error) {
            console.error(`[AdvancedHealer] Error with URL ${urlIndex + 1}:`, error);
        }
    }

    // All URLs failed
    console.error('[AdvancedHealer] ❌ All URLs and proxies failed');

    const analysis = analyzeAttempts(allAttempts, urlsToTry);

    if (saveToDatabase) {
        await saveForensicLog(channel, allAttempts, analysis, urlsToTry);
    }

    return {
        success: false,
        ...analysis,
        attempts: allAttempts,
        urlsTried: urlsToTry
    };
}

/**
 * Save forensic log to database
 */
async function saveForensicLog(channel, attempts, analysis, urlsTried) {
    try {
        const forensicLog = {
            channel: {
                name: channel.name,
                url: channel.url,
                group: channel.group || 'Uncategorized'
            },
            attempts,
            urlsTried,
            verdict: analysis.verdict,
            recommendation: analysis.recommendation,
            workingUrl: analysis.workingUrl,
            workingStrategy: analysis.workingStrategy
        };

        await errorDB.saveLog(forensicLog);
        console.log('[AdvancedHealer] 💾 Forensic log saved');
    } catch (err) {
        console.error('[AdvancedHealer] Failed to save log:', err);
    }
}

/**
 * Quick health check (for UI status indicators)
 */
export async function quickCheck(streamUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        const response = await fetch(streamUrl, {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}

/**
 * Batch heal multiple channels
 */
export async function batchHeal(channels, options = {}) {
    const results = [];

    for (const channel of channels) {
        const result = await healStream(channel, options);
        results.push({
            channel: channel.name,
            ...result
        });

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

export default healStream;
