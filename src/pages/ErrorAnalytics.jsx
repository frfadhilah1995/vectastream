import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import errorDB from '../utils/errorDatabase';

const ErrorAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState({ verdict: '', channelName: '' });
    const [loading, setLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statistics, errorLogs] = await Promise.all([
                errorDB.getStatistics(),
                errorDB.getLogs(filter)
            ]);
            setStats(statistics);
            setLogs(errorLogs);
        } catch (err) {
            console.error('[ErrorAnalytics] Load failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            await errorDB.downloadExport(format);
        } catch (err) {
            console.error('[ErrorAnalytics] Export failed:', err);
            alert(`Export failed: ${err.message}`);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('⚠️ Delete all error logs? This cannot be undone.')) return;

        try {
            await errorDB.clearAll();
            await loadData();
        } catch (err) {
            console.error('[ErrorAnalytics] Clear failed:', err);
        }
    };

    const handleDeleteLog = async (id) => {
        try {
            await errorDB.deleteLog(id);
            await loadData();
        } catch (err) {
            console.error('[ErrorAnalytics] Delete failed:', err);
        }
    };

    const getVerdictIcon = (verdict) => {
        switch (verdict) {
            case 'SUCCESS': return <CheckCircle className="text-green-400" size={16} />;
            case 'DEAD_LINK': return <XCircle className="text-red-400" size={16} />;
            case 'FORBIDDEN': return <AlertTriangle className="text-yellow-400" size={16} />;
            default: return <XCircle className="text-gray-400" size={16} />;
        }
    };

    const getVerdictColor = (verdict) => {
        switch (verdict) {
            case 'SUCCESS': return 'bg-green-500/10 border-green-500/30 text-green-400';
            case 'DEAD_LINK': return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'FORBIDDEN': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
            default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <RefreshCw className="animate-spin text-accent mx-auto mb-4" size={48} />
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 bg-background text-white">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-accent" size={32} />
                    <h1 className="text-3xl font-bold">Error Analytics Dashboard</h1>
                </div>
                <p className="text-gray-400">Forensic analysis of stream healing attempts</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Attempts */}
                    <div className="bg-glass p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <Database className="text-blue-400" size={24} />
                            <span className="text-3xl font-bold text-blue-400">{stats.totalAttempts}</span>
                        </div>
                        <p className="text-sm text-gray-400">Total Attempts</p>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-glass p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="text-green-400" size={24} />
                            <span className="text-3xl font-bold text-green-400">{stats.successRate}%</span>
                        </div>
                        <p className="text-sm text-gray-400">Success Rate</p>
                        <p className="text-xs text-gray-600 mt-1">{stats.successCount} / {stats.totalAttempts}</p>
                    </div>

                    {/* Failures */}
                    <div className="bg-glass p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="text-red-400" size={24} />
                            <span className="text-3xl font-bold text-red-400">{stats.failureCount}</span>
                        </div>
                        <p className="text-sm text-gray-400">Failures</p>
                    </div>

                    {/* Best Strategy */}
                    <div className="bg-glass p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="text-accent" size={24} />
                            <span className="text-3xl font-bold text-accent">
                                {Object.entries(stats.strategySuccess).reduce((best, [name, data]) => {
                                    const rate = data.total > 0 ? data.success / data.total : 0;
                                    return rate > best.rate ? { name, rate } : best;
                                }, { name: 'N/A', rate: 0 }).name}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">Best Strategy</p>
                    </div>
                </div>
            )}

            {/* Strategy Performance */}
            {stats && (
                <div className="bg-glass p-6 rounded-2xl border border-white/10 mb-8">
                    <h2 className="text-xl font-bold mb-4">Strategy Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(stats.strategySuccess).map(([name, data]) => {
                            const successRate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                            return (
                                <div key={name} className="bg-white/5 p-4 rounded-lg">
                                    <p className="font-semibold text-sm mb-2">{name}</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1 bg-black/50 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-accent h-full transition-all"
                                                style={{ width: `${successRate}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono">{successRate}%</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{data.success} / {data.total} attempts</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={() => handleExport('json')}
                    className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                    <Download size={16} />
                    Export JSON
                </button>
                <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                    <Download size={16} />
                    Export CSV
                </button>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center gap-2 transition-all ml-auto"
                >
                    <Trash2 size={16} />
                    Clear All Logs
                </button>
            </div>

            {/* Filters */}
            <div className="bg-glass p-4 rounded-2xl border border-white/10 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Filter by channel name..."
                        value={filter.channelName}
                        onChange={(e) => setFilter({ ...filter, channelName: e.target.value })}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-gray-600 outline-none focus:border-accent transition-all"
                    />
                    <select
                        value={filter.verdict}
                        onChange={(e) => setFilter({ ...filter, verdict: e.target.value })}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-accent transition-all cursor-pointer"
                    >
                        <option value="">All Verdicts</option>
                        <option value="SUCCESS">Success</option>
                        <option value="DEAD_LINK">Dead Link</option>
                        <option value="FORBIDDEN">Forbidden</option>
                        <option value="NETWORK_ERROR">Network Error</option>
                    </select>
                </div>
                <button
                    onClick={loadData}
                    className="mt-3 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm transition-all"
                >
                    Apply Filters
                </button>
            </div>

            {/* Error Logs Table */}
            <div className="bg-glass rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold">Recent Error Logs ({logs.length})</h2>
                </div>

                <div className="overflow-x-auto">
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Database size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No error logs found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr className="text-left text-sm text-gray-400">
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Channel</th>
                                    <th className="p-4">Verdict</th>
                                    <th className="p-4">Attempts</th>
                                    <th className="p-4">Recommendation</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-xs text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{log.channel.name}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-xs">{log.channel.url}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium ${getVerdictColor(log.verdict)}`}>
                                                {getVerdictIcon(log.verdict)}
                                                {log.verdict}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {log.attempts.length} strategies
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 max-w-md truncate">
                                            {log.recommendation}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-all"
                                                title="Delete log"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorAnalytics;
