import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Search, Filter, Layout, ArrowLeft } from 'lucide-react';
import errorDB from '../utils/errorDatabase';

const ErrorAnalytics = () => {
    const [stats, setStats] = useState(null);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState({ verdict: '', channelName: '' });
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);

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
            case 'SUCCESS': return <CheckCircle className="text-green-400" size={12} />;
            case 'DEAD_LINK': return <XCircle className="text-red-400" size={12} />;
            case 'FORBIDDEN': return <AlertTriangle className="text-yellow-400" size={12} />;
            default: return <XCircle className="text-gray-400" size={12} />;
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
            <div className="flex items-center justify-center h-full bg-background">
                <div className="text-center">
                    <RefreshCw className="animate-spin text-accent mx-auto mb-4" size={32} />
                    <p className="text-gray-400 text-xs">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background text-white overflow-hidden font-sans text-xs">
            {/* Header - Responsive */}
            <div className="flex-none p-3 md:p-4 lg:p-6 border-b border-white/10 bg-glass-bg backdrop-blur-xl z-10 flex items-center justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <Link
                        to="/"
                        className="p-2 md:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                        title="Back to Player"
                    >
                        <ArrowLeft size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5" />
                        <span className="hidden sm:inline">Back</span>
                    </Link>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-1.5 md:p-2 rounded-lg transition-colors ${showSidebar ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                        title="Toggle Stats Panel"
                    >
                        <Layout size={14} className="md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="text-accent w-5 md:w-6 lg:w-7" size={18} />
                            <h1 className="text-base md:text-lg lg:text-xl font-bold">Error Analytics</h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    <button onClick={() => handleExport('json')} className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all" title="Export JSON">
                        <Download size={14} className="md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button onClick={loadData} className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all" title="Refresh">
                        <RefreshCw size={14} className="md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    </button>
                    <button onClick={handleClearAll} className="p-1.5 md:p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all" title="Clear All">
                        <Trash2 size={14} className="md:w-4 md:h-4 lg:w-5 lg:h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel: Stats (Collapsible) */}
                {showSidebar && (
                    <div className="flex-none w-full md:w-64 lg:w-72 xl:w-80 md:border-r border-b md:border-b-0 border-white/10 overflow-y-auto custom-scrollbar bg-black/20 flex flex-col max-h-[40vh] md:max-h-none">
                        {stats && (
                            <div className="p-3 space-y-3">
                                {/* Key Metrics Grid - Responsive */}
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                                    <div className="bg-glass p-2 md:p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] md:text-xs text-blue-400 font-bold uppercase mb-0.5 md:mb-1">Attempts</div>
                                        <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-none">{stats.totalAttempts}</div>
                                    </div>
                                    <div className="bg-glass p-2 md:p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] md:text-xs text-green-400 font-bold uppercase mb-0.5 md:mb-1">Success</div>
                                        <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-none">{stats.successRate}%</div>
                                    </div>
                                    <div className="bg-glass p-2 md:p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] md:text-xs text-red-400 font-bold uppercase mb-0.5 md:mb-1">Failures</div>
                                        <div className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-none">{stats.failureCount}</div>
                                    </div>
                                    <div className="bg-glass p-2 md:p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] md:text-xs text-accent font-bold uppercase mb-0.5 md:mb-1">Best Strat</div>
                                        <div className="text-xs md:text-sm font-bold text-white truncate" title={Object.entries(stats.strategySuccess).reduce((best, [name, data]) => {
                                            const rate = data.total > 0 ? data.success / data.total : 0;
                                            return rate > best.rate ? { name, rate } : best;
                                        }, { name: 'N/A', rate: 0 }).name}>
                                            {Object.entries(stats.strategySuccess).reduce((best, [name, data]) => {
                                                const rate = data.total > 0 ? data.success / data.total : 0;
                                                return rate > best.rate ? { name, rate } : best;
                                            }, { name: 'N/A', rate: 0 }).name.split('_')[0]}
                                        </div>
                                    </div>
                                </div>

                                {/* Strategy Performance */}
                                <div className="bg-glass rounded-lg border border-white/5 p-3">
                                    <h3 className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Strategies</h3>
                                    <div className="space-y-2">
                                        {Object.entries(stats.strategySuccess).map(([name, data]) => {
                                            const successRate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                                            return (
                                                <div key={name}>
                                                    <div className="flex justify-between text-[10px] mb-0.5">
                                                        <span className="text-gray-300 truncate max-w-[80px] md:max-w-[100px] lg:max-w-[120px]">{name}</span>
                                                        <span className="font-mono text-accent">{successRate}%</span>
                                                    </div>
                                                    <div className="h-0.5 bg-black/50 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent transition-all duration-500"
                                                            style={{ width: `${successRate}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Right Panel: Logs Table */}
                <div className="flex-1 flex flex-col min-w-0 bg-black/10">
                    {/* Filters Bar - Compact */}
                    <div className="flex-none p-2 md:p-3 border-b border-white/10 flex flex-col sm:flex-row gap-2 bg-white/5 items-stretch sm:items-center">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={10} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filter.channelName}
                                onChange={(e) => setFilter({ ...filter, channelName: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-md pl-6 pr-2 py-1 text-[10px] text-white placeholder:text-gray-600 focus:border-accent outline-none"
                            />
                        </div>
                        <div className="relative w-full sm:w-24">
                            <select
                                value={filter.verdict}
                                onChange={(e) => setFilter({ ...filter, verdict: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:border-accent outline-none cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="SUCCESS">Success</option>
                                <option value="DEAD_LINK">Dead</option>
                                <option value="FORBIDDEN">403</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-2 md:p-3">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <Database size={24} className="mb-2" />
                                <p className="text-xs">No logs</p>
                            </div>
                        ) : (
                            <div className="bg-glass border border-white/5 rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                                        <tr>
                                            <th className="p-1.5 md:p-2 lg:p-3 text-[9px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase w-12 md:w-16 lg:w-20">Time</th>
                                            <th className="p-1.5 md:p-2 lg:p-3 text-[9px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase">Channel</th>
                                            <th className="p-1.5 md:p-2 lg:p-3 text-[9px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase w-16 md:w-20 lg:w-24">Verdict</th>
                                            <th className="p-1.5 md:p-2 lg:p-3 text-[9px] md:text-xs lg:text-sm font-bold text-gray-500 uppercase hidden sm:table-cell">Details</th>
                                            <th className="p-1.5 md:p-2 lg:p-3 w-6 md:w-8 lg:w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-1.5 md:p-2 lg:p-3 text-[9px] md:text-[10px] lg:text-xs text-gray-500 font-mono whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </td>
                                                <td className="p-1.5 md:p-2 lg:p-3">
                                                    <div className="font-medium text-[9px] md:text-[10px] lg:text-xs xl:text-sm text-white truncate max-w-[80px] sm:max-w-[120px] md:max-w-[150px] lg:max-w-[200px] xl:max-w-[250px]">{log.channel.name}</div>
                                                </td>
                                                <td className="p-1.5 md:p-2">
                                                    <span className={`inline-flex items-center gap-0.5 md:gap-1 px-1 md:px-1.5 py-0.5 rounded border text-[8px] md:text-[9px] font-bold uppercase ${getVerdictColor(log.verdict)}`}>
                                                        {getVerdictIcon(log.verdict)}
                                                        <span className="hidden sm:inline">{log.verdict === 'DEAD_LINK' ? 'DEAD' : log.verdict}</span>
                                                    </span>
                                                </td>
                                                <td className="p-1.5 md:p-2 hidden sm:table-cell">
                                                    <div className="text-[9px] text-gray-400 truncate max-w-[100px] md:max-w-[150px] lg:max-w-[200px]" title={log.recommendation}>
                                                        {log.recommendation}
                                                    </div>
                                                </td>
                                                <td className="p-1.5 md:p-2 text-right">
                                                    <button
                                                        onClick={() => handleDeleteLog(log.id)}
                                                        className="p-1 hover:bg-red-500/20 rounded text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorAnalytics;
