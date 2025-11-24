import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import { parseM3U } from './utils/m3u';
import { fetchWithCorsProxy } from './utils/corsProxy';
import { getCachedPlaylist, cachePlaylist } from './utils/playlistCache';
import { addToHistory } from './utils/history';
import { Menu, X } from 'lucide-react';
import useDevice from './hooks/useDevice';
import useStreamStatus from './hooks/useStreamStatus';

function App() {
    const { isMobile, isTablet } = useDevice();
    const { checkStreamStatus, getStatus } = useStreamStatus();
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Load last URL from localStorage
    useEffect(() => {
        const lastUrl = localStorage.getItem('vectastream_last_url');
        if (lastUrl) {
            setPlaylistUrl(lastUrl);
        }
    }, []);

    const handleLoadPlaylist = useCallback(async (urlToLoad = playlistUrl) => {
        if (!urlToLoad) {
            console.warn('[App] No URL provided to handleLoadPlaylist');
            return;
        }

        console.log(`[App] 🔄 Loading playlist from: ${urlToLoad}`);
        setIsLoading(true);

        try {
            // Check cache first for instant load
            const cached = await getCachedPlaylist(urlToLoad);

            if (cached && cached.channels) {
                // Cache hit - instant load!
                console.log(`[App] ⚡ Using cached playlist (${cached.channels.length} channels)`);
                setChannels(cached.channels);
                localStorage.setItem('vectastream_last_url', urlToLoad);
                setIsLoading(false);
                return;
            }

            // Cache miss - fetch fresh data
            console.log('[App] 🌐 Fetching fresh playlist...');
            const text = await fetchWithCorsProxy(urlToLoad);
            console.log(`[App] ✅ Fetched playlist, size: ${text.length} characters`);

            const parsedChannels = parseM3U(text);
            console.log(`[App] 📺 Parsed ${parsedChannels.length} channels`);

            if (parsedChannels.length === 0) {
                alert("No channels found in playlist.");
                return;
            }

            // Save to cache for next time (1-hour TTL)
            await cachePlaylist(urlToLoad, parsedChannels);

            setChannels(parsedChannels);
            localStorage.setItem('vectastream_last_url', urlToLoad);
            console.log(`[App] ✅ Successfully loaded ${parsedChannels.length} channels!`);

        } catch (error) {
            console.error("[App] ❌ Error loading playlist:", error);
            alert(`Failed to load playlist.\n\n${error.message}\n\nPlease check:\n1. The URL is correct\n2. The playlist is publicly accessible\n3. Your internet connection`);
        } finally {
            setIsLoading(false);
        }
    }, [playlistUrl]);

    const handleRefreshChannel = useCallback((channel) => {
        const channelId = `${channel.url}-${channels.indexOf(channel)}`;
        checkStreamStatus(channel.url, channelId);
    }, [channels, checkStreamStatus]);

    // OPTIMIZATION Phase 1: Removed mass auto-check of all channels
    // Previously this checked 9000+ streams concurrently causing massive lag
    // Now status is only checked on manual refresh button click
    // This improves initial load time by ~90%

    return (
        <div className="flex flex-col h-full bg-background text-white font-sans overflow-hidden">
            {/* Mobile/Tablet Header Overlay for Menu Toggle */}
            {(isMobile || isTablet) && (
                <div className="fixed top-4 right-4 z-50">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 bg-black/50 backdrop-blur-md border border-glass-border rounded-lg text-white shadow-lg active:scale-95 transition-transform"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Logic */}
                <div className={`
          z-40 h-full transition-transform duration-300 ease-in-out
          ${(isMobile || isTablet) ? 'absolute inset-y-0 left-0' : 'relative'}
          ${(isMobile || isTablet) && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        `}>
                    <div className="h-full flex flex-col w-80 bg-background border-r border-glass-border shadow-2xl md:shadow-none">
                        <Header />
                        <Sidebar
                            channels={channels}
                            currentChannel={currentChannel}
                            onChannelSelect={(channel) => {
                                setCurrentChannel(channel);
                                addToHistory(channel);
                                if (isMobile || isTablet) setIsMobileMenuOpen(false);
                            }}
                            onLoadPlaylist={handleLoadPlaylist}
                            isLoading={isLoading}
                            playlistUrl={playlistUrl}
                            setPlaylistUrl={setPlaylistUrl}
                            getChannelStatus={getStatus}
                            onRefreshChannel={handleRefreshChannel}
                        />

                        {/* Footer */}
                        <div className="p-4 border-t border-glass-border text-center text-xs text-gray-600 bg-black/20">
                            <p>&copy; {new Date().getFullYear()} VectaStream</p>
                            <p className="mt-1 font-medium text-gray-500">Developed by RMD TECH</p>
                        </div>
                    </div>
                </div>

                {/* Main Content (Player) */}
                <main className="flex-1 relative bg-black w-full h-full">
                    <Player channel={currentChannel} />
                </main>
            </div>
        </div>
    );
}

export default App;
