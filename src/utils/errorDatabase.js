/**
 * IndexedDB Manager for Forensic Error Logging
 * Stores detailed stream error data for analysis and ML training
 */

const DB_NAME = 'VectaStreamErrors';
const DB_VERSION = 1;
const STORE_NAME = 'errorLogs';

class ErrorDatabase {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create error logs store
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });

                    // Indexes for efficient querying
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('verdict', 'verdict', { unique: false });
                    store.createIndex('channelUrl', 'channel.url', { unique: false });
                    store.createIndex('channelName', 'channel.name', { unique: false });
                }
            };
        });
    }

    /**
     * Save error log to database
     */
    async saveLog(logData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const request = store.add({
                ...logData,
                timestamp: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all error logs (with optional filtering)
     */
    async getLogs(filter = {}) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                let logs = request.result;

                // Apply filters
                if (filter.verdict) {
                    logs = logs.filter(log => log.verdict === filter.verdict);
                }
                if (filter.startDate) {
                    logs = logs.filter(log => new Date(log.timestamp) >= new Date(filter.startDate));
                }
                if (filter.endDate) {
                    logs = logs.filter(log => new Date(log.timestamp) <= new Date(filter.endDate));
                }
                if (filter.channelName) {
                    logs = logs.filter(log => log.channel.name.toLowerCase().includes(filter.channelName.toLowerCase()));
                }

                resolve(logs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get statistics from error logs
     */
    async getStatistics() {
        const logs = await this.getLogs();

        const stats = {
            totalAttempts: logs.length,
            successCount: logs.filter(l => l.verdict === 'SUCCESS').length,
            failureCount: logs.filter(l => l.verdict !== 'SUCCESS').length,
            verdictBreakdown: {},
            strategySuccess: {
                Direct: { success: 0, total: 0 },
                Standard: { success: 0, total: 0 },
                BrowserDirect: { success: 0, total: 0 },
                SelfRef: { success: 0, total: 0 }
            },
            commonErrors: {},
            recentLogs: logs.slice(-10).reverse()
        };

        // Calculate success rate
        stats.successRate = logs.length > 0
            ? Math.round((stats.successCount / logs.length) * 100)
            : 0;

        // Verdict breakdown
        logs.forEach(log => {
            stats.verdictBreakdown[log.verdict] = (stats.verdictBreakdown[log.verdict] || 0) + 1;

            // Strategy success tracking
            log.attempts.forEach(attempt => {
                const strategy = attempt.strategy;
                if (stats.strategySuccess[strategy]) {
                    stats.strategySuccess[strategy].total++;
                    if (attempt.statusCode >= 200 && attempt.statusCode < 300) {
                        stats.strategySuccess[strategy].success++;
                    }
                }
            });

            // Common errors
            if (log.verdict !== 'SUCCESS') {
                const errorKey = `${log.verdict}`;
                stats.commonErrors[errorKey] = (stats.commonErrors[errorKey] || 0) + 1;
            }
        });

        return stats;
    }

    /**
     * Export logs to JSON for analysis
     */
    async exportToJSON() {
        const logs = await this.getLogs();
        const stats = await this.getStatistics();

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalLogs: logs.length,
                version: DB_VERSION
            },
            statistics: stats,
            logs: logs
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Export logs to CSV format
     */
    async exportToCSV() {
        const logs = await this.getLogs();

        const headers = [
            'Timestamp',
            'Channel Name',
            'Channel URL',
            'Verdict',
            'Attempts',
            'Final Strategy',
            'Status Code',
            'Recommendation'
        ];

        const rows = logs.map(log => {
            const finalAttempt = log.attempts[log.attempts.length - 1];
            return [
                log.timestamp,
                log.channel.name,
                log.channel.url,
                log.verdict,
                log.attempts.length,
                finalAttempt.strategy,
                finalAttempt.statusCode || 'N/A',
                log.recommendation || 'N/A'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    /**
     * Download export file
     */
    async downloadExport(format = 'json') {
        const content = format === 'json'
            ? await this.exportToJSON()
            : await this.exportToCSV();

        const blob = new Blob([content], {
            type: format === 'json' ? 'application/json' : 'text/csv'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vectastream-errors-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all logs (for testing/reset)
     */
    async clearAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete specific log by ID
     */
    async deleteLog(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton instance
const errorDB = new ErrorDatabase();

// Auto-initialize on import
errorDB.init().catch(err => console.error('[ErrorDB] Init failed:', err));

export default errorDB;
