/**
 * Console Log Collector
 * Intercepts console messages and provides a way to download them for analysis.
 */

const MAX_LOGS = 5000;
const logs = [];

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

function formatArg(arg) {
    try {
        if (arg instanceof Error) {
            return {
                message: arg.message,
                stack: arg.stack,
                name: arg.name
            };
        }
        if (typeof arg === 'object') {
            return JSON.parse(JSON.stringify(arg));
        }
        return arg;
    } catch (e) {
        return String(arg);
    }
}

function captureLog(type, args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(formatArg);

    logs.push({
        timestamp,
        type,
        message: formattedArgs
    });

    if (logs.length > MAX_LOGS) {
        logs.shift();
    }
}

export const consoleCollector = {
    init: () => {
        console.log = (...args) => {
            captureLog('log', args);
            originalConsole.log.apply(console, args);
        };
        console.error = (...args) => {
            captureLog('error', args);
            originalConsole.error.apply(console, args);
        };
        console.warn = (...args) => {
            captureLog('warn', args);
            originalConsole.warn.apply(console, args);
        };
        console.info = (...args) => {
            captureLog('info', args);
            originalConsole.info.apply(console, args);
        };

        console.log('[ConsoleCollector] 📥 Log collection started');
    },

    downloadLogs: () => {
        const data = JSON.stringify(logs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vectastream-console-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    getLogs: () => logs
};

export default consoleCollector;
