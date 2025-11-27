import React from 'react';
import { Play, Info, Download } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

const Header = () => {
    const { installApp, canInstall, isIOS, isInstalled } = usePWA();

    return (
        <header className="h-16 bg-glass-bg backdrop-blur-md border-b border-glass-border flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                    <Play fill="white" className="ml-1" size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Vecta<span className="text-accent">Stream</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Install Button - Shows if installable or iOS */}
                {(!isInstalled && (canInstall || isIOS)) && (
                    <button
                        onClick={installApp}
                        className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors font-medium text-sm"
                        aria-label="Install VectaStream as an app"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Install App</span>
                    </button>
                )}

                <div className="group relative">
                    <button
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        aria-label="About VectaStream"
                    >
                        <Info size={20} />
                    </button>

                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <h3 className="text-white font-semibold mb-2">About VectaStream</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Professional IPTV player with support for M3U playlists.
                            Features real-time stream validation, categorization, and favorites.
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-gray-500">Version 1.0.0 • PWA Ready</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
