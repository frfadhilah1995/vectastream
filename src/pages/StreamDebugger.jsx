import React, { useState } from 'react';
import { analyzeStream } from '../utils/streamAnalyzer';
import { Bug, CheckCircle, AlertTriangle, XCircle, Wand2 } from 'lucide-react';

const StreamDebugger = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState(null);

    const handleAnalyze = () => {
        if (!input.trim()) return;
        const analysis = analyzeStream(input);
        setResult(analysis);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <div className="flex items-center gap-3 mb-6">
                <Bug className="text-3xl text-accent" />
                <h1 className="text-3xl font-bold">Stream Debugger & Auto-Fixer</h1>
            </div>

            <p className="text-gray-400 mb-6">
                Paste a Stream URL or a full Network Log (headers) below.
                The AI will analyze the issue and suggest the exact proxy mode to use.
            </p>

            {/* Input Section */}
            <div className="bg-glass p-6 rounded-2xl border border-white/10 mb-8">
                <textarea
                    className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Paste URL or Headers here...&#10;Example:&#10;Request URL: http://...&#10;Status Code: 403 Forbidden..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    onClick={handleAnalyze}
                    className="mt-4 px-6 py-3 bg-accent hover:bg-accent/80 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-accent/20"
                >
                    <Wand2 /> Analyze & Fix
                </button>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-6 animate-fade-in">
                    {/* Status Card */}
                    <div className={`p-6 rounded-2xl border ${result.issues.some(i => i.level === 'error') ? 'bg-red-500/10 border-red-500/30' :
                        result.issues.some(i => i.level === 'warning') ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-green-500/10 border-green-500/30'
                        }`}>
                        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                            {result.issues.some(i => i.level === 'error') ? <><XCircle className="text-red-400" /> Critical Issues Found</> :
                                result.issues.some(i => i.level === 'warning') ? <><AlertTriangle className="text-yellow-400" /> Potential Issues</> :
                                    <><CheckCircle className="text-green-400" /> Stream Looks Healthy</>}
                        </h2>
                        {result.url && (
                            <p className="font-mono text-sm opacity-70 break-all">Target: {result.url}</p>
                        )}
                    </div>

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                        <div className="bg-glass p-6 rounded-2xl border border-accent/30 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                            <h3 className="text-lg font-bold text-accent mb-4">Recommended Solution</h3>
                            <ul className="space-y-3">
                                {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg">
                                        <CheckCircle className="text-green-400 mt-1 shrink-0" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Detailed Issues */}
                    {result.issues.length > 0 && (
                        <div className="bg-glass p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold mb-4">Analysis Log</h3>
                            <ul className="space-y-2">
                                {result.issues.map((issue, idx) => (
                                    <li key={idx} className={`text-sm flex items-start gap-2 ${issue.level === 'error' ? 'text-red-400' :
                                        issue.level === 'warning' ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                        <span className="mt-1">•</span>
                                        {issue.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StreamDebugger;
