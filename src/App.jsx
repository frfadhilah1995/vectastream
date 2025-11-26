import useStreamStatus from './hooks/useStreamStatus';

import { statusRefreshService } from './utils/statusRefresh';

function App() {
    const { isMobile, isTablet } = useDevice();
    const { checkStreamStatus, getStatus } = useStreamStatus();
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Load last URL and Channel from localStorage
    useEffect(() => {
        const lastUrl = localStorage.getItem('vectastream_last_url');
        if (lastUrl) {
            setPlaylistUrl(lastUrl);
        }
    }, []);

    // Save current channel to localStorage
    useEffect(() => {
        if (currentChannel) {
            localStorage.setItem('vectastream_last_channel', JSON.stringify(currentChannel));
        }
    }, [currentChannel]);

    const handleLoadPlaylist = useCallback(async (urlToLoad = playlistUrl) => {
        if (!urlToLoad) {
            console.warn('[App] No URL provided to handleLoadPlaylist');
            return;
        }

        console.log(`[App] 🔄 Loading playlist from: ${urlToLoad}`);
        setIsLoading(true);
        setChannels([]); // Clear existing channels immediately to avoid confusion
        // setCurrentChannel(null); // REMOVED: Keep playing current channel while loading new playlist

        try {
            let loadedChannels = [];
            // Check cache first for instant load
            const cached = await getCachedPlaylist(urlToLoad);

            if (cached && cached.channels) {
                // Cache hit - instant load!
                console.log(`[App] ⚡ Using cached playlist (${cached.channels.length} channels)`);
                loadedChannels = cached.channels;
            } else {
                // Cache miss - fetch fresh data
                console.log('[App] 🌐 Fetching fresh playlist...');
                const text = await fetchWithCorsProxy(urlToLoad);
                console.log(`[App] ✅ Fetched playlist, size: ${text.length} characters`);

                const parsedChannels = parseM3U(text, urlToLoad);
                console.log(`[App] 📺 Parsed ${parsedChannels.length} channels`);


                if (parsedChannels.length === 0) {
                    alert("No channels found in playlist.");
                    setIsLoading(false);
                    return;
                }

                // Save to cache for next time (1-hour TTL)
                await cachePlaylist(urlToLoad, parsedChannels);
                loadedChannels = parsedChannels;
            }

            setChannels(loadedChannels);
            localStorage.setItem('vectastream_last_url', urlToLoad);
            console.log(`[App] ✅ Successfully loaded ${loadedChannels.length} channels!`);

            // Auto-resume last played channel if it exists in the new list
            const lastChannelJson = localStorage.getItem('vectastream_last_channel');
            if (lastChannelJson) {
                try {
                    const lastChannel = JSON.parse(lastChannelJson);
                    // Find matching channel in new list (by URL or Name)
                    const foundChannel = loadedChannels.find(c => c.url === lastChannel.url || c.name === lastChannel.name);
                    if (foundChannel) {
                        console.log(`[App] ▶️ Auto-resuming channel: ${foundChannel.name}`);
                        setCurrentChannel(foundChannel);
                    }
                } catch (e) {
                    console.error("[App] Failed to parse last channel", e);
                }
            }

        } catch (error) {
            console.error("[App] ❌ Error loading playlist:", error);
            alert(`Failed to load playlist.\n\n${error.message}\n\nPlease check:\n1. The URL is correct\n2. The playlist is publicly accessible\n3. Your internet connection`);
        } finally {
            setIsLoading(false);
        }
    }, [playlistUrl]);

    const handleRefreshChannel = useCallback(async (channel) => {
        const channelId = `${channel.url}-${channels.indexOf(channel)}`;

        // 1. Perform actual network check (updates localStorage)
        await statusRefreshService.refreshChannel(channel);

        // 2. Update UI state from the newly updated cache
        checkStreamStatus(channel.url, channelId);
    }, [channels, checkStreamStatus]);

    // NOTE: Removed global status check loop to prevent lag on large playlists (9000+ items)
    // Status checking is now handled in Sidebar.jsx for visible items only (Pagination Scoped)

    return (
        <div className="flex flex-col h-full bg-background text-white font-sans overflow-hidden">
            {/* Mobile/Tablet Header Overlay for Menu Toggle */}
            {(isMobile || isTablet) && (
                <div className="fixed top-4 left-4 z-50">
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
                            checkStreamStatus={checkStreamStatus} // Pass this for scoped checking
                            onRefreshChannel={handleRefreshChannel}
                            onClearChannels={() => {
                                setChannels([]);
                                setCurrentChannel(null);
                            }}
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
                    <Routes>
                        <Route path="/debug" element={<StreamDebugger />} />
                        <Route path="/" element={
                            <Player channel={currentChannel} />
                        } />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App;
