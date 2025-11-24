import React from 'react';
import { Play, Info } from 'lucide-react';

const Header = () => {
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

            <div className="group relative">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                    <Info size={20} />
                </button>

                <div className="absolute right-0 top-full mt-4 w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border border-glass-border rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-0 translate-y-2">
                    <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-accent rounded-full"></span>
                        About VectaStream
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed text-justify">
                        VectaStream is a cutting-edge, client-side M3U streaming player designed for the modern web.
                        Experience seamless playback with a premium, glassmorphic interface that puts your content first.
                        Built with performance and aesthetics in mind.
                    </p>
                </div>
            </div>
        </header>
    );
};

export default Header;
