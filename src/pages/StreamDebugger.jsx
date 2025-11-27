import React, { useState } from 'react';
import { analyzeStream } from '../utils/streamAnalyzer';
import { Bug, CheckCircle, AlertTriangle, XCircle, Wand2, ArrowRight, Activity, Terminal } from 'lucide-react';

const StreamDebugger = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);

    const handleAnalyze = () => {
        if (!input.trim()) return;
        const analysis = analyzeStream(input);
        setResult(analysis);
    };

    return (
        <div className="h-full flex flex-col bg-background text-white overflow-hidden">
            {/* Header */}
            <div className="flex-none p-6 border-b border-white/10 bg-glass-bg backdrop-blur-xl z-10">
                <div className="flex items-center gap-3 mb-1">
                    <Bug className="text-accent" size={24} />
                    <h1 className="text-2xl font-bold">Stream Debugger</h1>
                </div>
                <p className="text-gray-400 text-sm">AI-powered stream analysis and auto-fixer</p>
            </div>

            {/* Main Content - Split View */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                {/* Left Panel: Input (Fixed width on desktop) */}
                <div className="flex-none lg:w-[450px] p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col bg-black/20">
                    <div className="flex-1 flex flex-col">
                        <label className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <Terminal size={16} className="text-accent" />
                            Input Source
                        </label>
                        <div className="flex-1 relative mb-4">
                            <textarea
                                className="absolute inset-0 w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-accent transition-colors resize-none custom-scrollbar"
                                placeholder="Paste Stream URL or Network Headers here...&#10;&#10;Example:&#10;http://example.com/stream.m3u8&#10;&#10;OR Headers:&#10;Request URL: ...&#10;Status Code: 403 Forbidden..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={!input.trim()}
                            className="w-full py-3 bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/10"
                        >
                            <Wand2 size={18} />
                            Analyze & Fix
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results (Flex Grow) */}
                <div className="flex-1 bg-glass-bg overflow-y-auto custom-scrollbar p-6">
                    {!result ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <Activity size={64} className="mb-4" />
                            <p className="text-lg font-medium">Ready to analyze</p>
                            <p className="text-sm">Paste a URL or headers to begin</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                            {/* Status Card */}
                            <div className={`p-6 rounded-2xl border backdrop-blur-md ${result.issues.some(i => i.level === 'error') ? 'bg-red-500/5 border-red-500/20' :
                                    result.issues.some(i => i.level === 'warning') ? 'bg-yellow-500/5 border-yellow-500/20' :
                                        'bg-green-500/5 border-green-500/20'
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${result.issues.some(i => i.level === 'error') ? 'text-red-400' :
                                                result.issues.some(i => i.level === 'warning') ? 'text-yellow-400' :
                                                    'text-green-400'
                                            }`}>
                                            {result.issues.some(i => i.level === 'error') ? <><XCircle size={24} /> Critical Issues Found</> :
                                                result.issues.some(i => i.level === 'warning') ? <><AlertTriangle size={24} /> Potential Issues</> :
                                                    <><CheckCircle size={24} /> Stream Looks Healthy</>}
                                        </h2>
                                        {result.url && (
                                            <p className="font-mono text-xs text-gray-400 break-all bg-black/20 p-2 rounded-lg mt-2 inline-block">
                                                {result.url}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-white">{100 - (result.issues.length * 10)}%</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Health Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {result.recommendations.length > 0 && (
                                <div className="bg-glass p-6 rounded-2xl border border-accent/20 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent group-hover:w-1.5 transition-all"></div>
                                    <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Wand2 size={16} />
                                        Recommended Solution
                                    </h3>
                                    <ul className="space-y-3">
                                        {result.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                                <ArrowRight className="text-accent mt-1 shrink-0" size={16} />
                                                <span className="text-sm text-gray-200 leading-relaxed">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Detailed Issues */}
                            {result.issues.length > 0 && (
                                <div className="bg-glass p-6 rounded-2xl border border-white/10">
                                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Activity size={16} />
                                        Analysis Log
                                    </h3>
                                    <div className="space-y-2">
                                        {result.issues.map((issue, idx) => (
                                            <div key={idx} className={`text-sm flex items-start gap-3 p-3 rounded-lg ${issue.level === 'error' ? 'bg-red-500/5 text-red-300' :
                                                    issue.level === 'warning' ? 'bg-yellow-500/5 text-yellow-300' :
                                                        'bg-green-500/5 text-green-300'
                                                }`}>
                                                <span className="mt-1">•</span>
                                                <span className="leading-relaxed">{issue.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StreamDebugger;
