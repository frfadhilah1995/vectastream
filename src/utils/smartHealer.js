/**
 * Smart Stream Healer - Auto-healing engine with cascading retry strategies
 * Automatically tries multiple proxy modes and logs forensic data
 */

import errorDB from './errorDatabase';

const PROXY_URL = 'https://vectastream-proxy.frfadhilah-1995-ok.workers.dev';

// Healing Strategies in priority order
const HEALING_STRATEGIES = [
    {
        name: 'Direct',
        description: 'Direct connection (no proxy)',
        mode: 'none',
        priority: 1,
        urlBuilder: (streamUrl) => streamUrl
    },
    {
        name: 'Standard',
        description: 'Standard CORS proxy',
        mode: 'standard',
        priority: 2,
        urlBuilder: (streamUrl) => `${PROXY_URL}/${streamUrl}`
    },
    {
        name: 'BrowserDirect',
        description: 'Browser Direct Mode (for raw streams)',
        mode: 'direct',
        priority: 3,
        urlBuilder: (streamUrl) => `${PROXY_URL}/${streamUrl}?mode=direct`
    },
    {
        name: 'SelfRef',
        description: 'Self-Referential Mode (for legacy CDNs)',
        mode: 'self-ref',
        priority: 4,
        urlBuilder: (streamUrl) => `${PROXY_URL}/${streamUrl}?mode=self-ref`
    }
];

/**
 * Test a stream URL with specific strategy
 */
async function testStrategy(streamUrl, strategy, signal) {
    const startTime = Date.now();
    const testUrl = strategy.urlBuilder(streamUrl);

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
            strategy: strategy.name,
            proxyMode: strategy.mode,
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
            strategy: strategy.name,
            proxyMode: strategy.mode,
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
 * Analyze attempts and determine verdict
 */
function analyzeResults(attempts) {
    // Check if any succeeded
    const successful = attempts.find(a => a.success);
    if (successful) {
        return {
            verdict: 'SUCCESS',
            recommendation: `Stream works with ${successful.strategy} mode. Using: ${successful.url}`,
            workingUrl: successful.url,
            workingStrategy: successful.strategy
        };
    }

    // Analyze failure patterns
    const last = attempts[attempts.length - 1];

    // All 404 = Dead link
    if (attempts.every(a => a.statusCode === 404)) {
        return {
            verdict: 'DEAD_LINK',
            recommendation: 'Stream file not found on server (404). Content may be offline or moved.',
            workingUrl: null,
            workingStrategy: null
        };
    }

    // All 403 = Access forbidden
    if (attempts.every(a => a.statusCode === 403)) {
        return {
            verdict: 'FORBIDDEN',
            recommendation: 'Access forbidden by content provider. Server may require authentication or have geo-restrictions.',
            workingUrl: null,
            workingStrategy: null
        };
    }

    // Network errors
    if (attempts.every(a => a.error)) {
        return {
            verdict: 'NETWORK_ERROR',
            recommendation: 'Network connection failed. Check internet connection or server may be down.',
            workingUrl: null,
            workingStrategy: null
        };
    }

    // Mixed errors
    return {
        verdict: 'UNKNOWN_ERROR',
        recommendation: `Stream failed with status ${last.statusCode || 'N/A'}. ${last.error || 'Unknown error'}`,
        workingUrl: null,
        workingStrategy: null
    };
}

/**
 * Smart Healer - Main function
 * Tries all strategies in sequence and returns result
 */
export async function healStream(channel, options = {}) {
    const {
        timeout = 5000, // 5 seconds per attempt
        onProgress = null, // Callback for progress updates
        saveToDatabase = true
    } = options;

    console.log(`[SmartHealer] 🔄 Starting auto-heal for: ${channel.name}`);

    const attempts = [];
    let successfulResult = null;

    // Try each strategy in order
    for (let i = 0; i < HEALING_STRATEGIES.length; i++) {
        const strategy = HEALING_STRATEGIES[i];

        // Progress callback
        if (onProgress) {
            onProgress({
                current: i + 1,
                total: HEALING_STRATEGIES.length,
                strategy: strategy.name,
                description: strategy.description
            });
        }

        console.log(`[SmartHealer] Trying strategy ${i + 1}/${HEALING_STRATEGIES.length}: ${strategy.name}`);

        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Test this strategy
        const result = await testStrategy(channel.url, strategy, controller.signal);
        clearTimeout(timeoutId);

        attempts.push(result);

        // If successful, stop trying
        if (result.success) {
            console.log(`[SmartHealer] ✅ Success with ${strategy.name}!`);
            successfulResult = result;
            break;
        } else {
            console.log(`[SmartHealer] ❌ ${strategy.name} failed: ${result.statusCode || result.error}`);
        }
    }

    // Analyze results
    const analysis = analyzeResults(attempts);

    // Prepare forensic log
    const forensicLog = {
        channel: {
            name: channel.name,
            url: channel.url,
            group: channel.group || 'Uncategorized'
        },
        attempts,
        verdict: analysis.verdict,
        recommendation: analysis.recommendation,
        workingUrl: analysis.workingUrl,
        workingStrategy: analysis.workingStrategy
    };

    // Save to database
    if (saveToDatabase) {
        try {
            await errorDB.saveLog(forensicLog);
            console.log('[SmartHealer] 💾 Forensic log saved to database');
        } catch (err) {
            console.error('[SmartHealer] Failed to save log:', err);
        }
    }

    // Return result
    return {
        success: analysis.verdict === 'SUCCESS',
        ...analysis,
        attempts,
        forensicLog
    };
}

/**
 * Quick check - only tests direct connection (fast check)
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
 * Batch heal multiple channels (for future use)
 */
export async function batchHeal(channels, options = {}) {
    const results = [];

    for (const channel of channels) {
        const result = await healStream(channel, options);
        results.push({
            channel: channel.name,
            ...result
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
}

export default healStream;
