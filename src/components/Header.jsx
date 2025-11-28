import React from 'react';
import { Play, Info, Download } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

const Header = () => {
    const { installApp, canInstall, isIOS, isInstalled } = usePWA();

    return (
        <header className="h-14 md:h-16 lg:h-18 bg-glass-bg backdrop-blur-md border-b border-glass-border flex items-center justify-between px-3 md:px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                    <Play fill="white" className="ml-0.5 md:ml-1" size={16} />
                </div>
                <div>
                    <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-white">
                        Vecta<span className="text-accent">Stream</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {/* Install Button - Shows if installable or iOS */}
                {(!isInstalled && (canInstall || isIOS)) && (
                    <button
                        onClick={installApp}
                        className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors font-medium text-xs md:text-sm"
                        aria-label="Install VectaStream as an app"
                    >
                        <Download size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5" />
                        <span className="hidden sm:inline">Install App</span>
                    </button>
                )}

                <div className="group relative">
                    <button
                        className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        aria-label="About VectaStream"
                    >
                        <Info size={18} className="md:w-5 md:h-5 lg:w-6 lg:h-6" />
                    </button>

                    {/* Tooltip */}
                    <div className="absolute right-0 top-full mt-2 w-64 md:w-72 lg:w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 md:p-5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <h3 className="text-white font-semibold mb-2 text-sm md:text-base">About VectaStream</h3>
                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                            Professional IPTV player with support for M3U playlists.
                            Features real-time stream validation, categorization, and favorites.
                        </p>
                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
                            <p className="text-[10px] md:text-xs text-gray-500">Version 1.0.0 • PWA Ready</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
