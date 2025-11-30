import React, { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Search, List, Loader2, ChevronLeft, ChevronRight, Globe, Link, X, Bookmark, Trash2, BarChart3, Tv } from 'lucide-react';
import ChannelItem from './ChannelItem';
import { statusRefreshService } from '../utils/statusRefresh.js';
import { getSavedUrls, savePlaylistUrl, deletePlaylistUrl, updateChannelCount } from '../utils/savedPlaylists.js';

const CHANNELS_PER_PAGE = 50;

// IPTV.org repository URLs
const DEFAULT_PLAYLISTS = {
    all: 'https://iptv-org.github.io/iptv/index.m3u',
    categories: 'https://iptv-org.github.io/iptv/index.category.m3u',
    languages: 'https://iptv-org.github.io/iptv/index.language.m3u',
    countries: 'https://iptv-org.github.io/iptv/index.country.m3u',
};

const Sidebar = ({
    channels,
    currentChannel,
    onChannelSelect,
    onLoadPlaylist,
    isLoading,
    playlistUrl,
    setPlaylistUrl,
    getChannelStatus,
    checkStreamStatus,
    onRefreshChannel,
    onClearChannels,
    collapsed = false,
    onToggleCollapsed
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [savedPlaylists, setSavedPlaylists] = useState([]);
    const [showSavedList, setShowSavedList] = useState(false);
    const [sourceMode, setSourceMode] = useState(() => localStorage.getItem('vectastream_source_mode') || 'default');
    const [selectedDefault, setSelectedDefault] = useState(() => localStorage.getItem('vectastream_selected_default') || 'all');

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load saved playlists
    useEffect(() => setSavedPlaylists(getSavedUrls()), []);

    // Persist state
    useEffect(() => localStorage.setItem('vectastream_source_mode', sourceMode), [sourceMode]);
    useEffect(() => localStorage.setItem('vectastream_selected_default', selectedDefault), [selectedDefault]);

    // Auto-load default playlist
    useEffect(() => {
        if (sourceMode === 'default') {
            const timer = setTimeout(() => onLoadPlaylist(DEFAULT_PLAYLISTS[selectedDefault]), 100);
            return () => clearTimeout(timer);
        }
    }, [sourceMode, selectedDefault]);

    // Background refresh
    const [, setRefreshTrigger] = useState(0);
    useEffect(() => {
        if (channels.length > 0) {
            statusRefreshService.start(channels, (url, newStatus) => {
                console.log(`[Sidebar] Status updated: ${url} → ${newStatus}`);
                setRefreshTrigger(prev => prev + 1);
            });
            return () => statusRefreshService.stop();
        }
    }, [channels]);

    const categories = useMemo(() => {
        const uniqueGroups = [...new Set(channels.map(c => c.group || 'Uncategorized'))];
        return ['All', ...uniqueGroups.sort()];
    }, [channels]);

    const filteredChannels = useMemo(() => {
        return channels.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                c.group.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || c.group === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [channels, debouncedSearchTerm, selectedCategory]);

    useEffect(() => setCurrentPage(1), [debouncedSearchTerm, selectedCategory]);

    const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
    const paginatedChannels = filteredChannels.slice(
        (currentPage - 1) * CHANNELS_PER_PAGE,
        currentPage * CHANNELS_PER_PAGE
    );

    const handleLoadSaved = (url) => {
        setPlaylistUrl(url);
        onLoadPlaylist(url);
        setShowSavedList(false);
    };

    const handleDeleteSaved = (url, e) => {
        e.stopPropagation();
        deletePlaylistUrl(url);
        setSavedPlaylists(getSavedUrls());
    };

    useEffect(() => {
        if (channels.length > 0 && playlistUrl && sourceMode === 'custom') {
            savePlaylistUrl(playlistUrl, channels.length);
            updateChannelCount(playlistUrl, channels.length);
            setSavedPlaylists(getSavedUrls());
        }
    }, [channels.length, playlistUrl, sourceMode]);

    // ==========================================
    // COLLAPSED MODE - Refined UI/UX
    // ==========================================
    if (collapsed) {
        return (
            <aside className="w-16 h-full flex flex-col items-center gap-3 py-5 bg-glass-bg backdrop-blur-xl overflow-hidden">
                {/* Logo - Refined with gradient */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
                    <Tv size={26} className="text-accent drop-shadow-sm" />
                </div>

                {/* Divider */}
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Main Icons */}
                <div className="flex-1 flex flex-col gap-2 items-center">
                    {/* Channels */}
                    {channels.length > 0 && (
                        <div className="group relative">
                            <button
                                onClick={() => onToggleCollapsed?.(false)}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all relative cursor-pointer hover:scale-105"
                                aria-label="Expand sidebar to view all channels"
                            >
                                <List size={24} className="text-gray-300" />
                                <span className="absolute -top-1 -right-1 bg-accent text-black text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-accent/30">
                                    {channels.length > 99 ? '99+' : channels.length}
                                </span>
                            </button>
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-all duration-200 delay-300 shadow-xl border border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-accent font-bold">{channels.length}</span>
                                    <span className="text-gray-300">Channels</span>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">Click to expand</div>
                            </div>
                        </div>
                    )}

                    {/* Now Playing */}
                    {currentChannel && (
                        <div className="group relative">
                            <button
                                onClick={() => onToggleCollapsed?.(false)}
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 flex items-center justify-center relative cursor-pointer hover:from-green-500/30 hover:to-green-600/20 transition-all hover:scale-105 shadow-lg shadow-green-500/10"
                                aria-label={`Now playing: ${currentChannel.name}. Click to expand.`}
                            >
                                {currentChannel.logo ? (
                                    <img src={currentChannel.logo} alt="" className="w-7 h-7 object-cover rounded-lg" />
                                ) : (
                                    <Tv size={22} className="text-green-400" />
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50">
                                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                                </div>
                            </button>
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none z-[60] transition-all duration-200 delay-300 max-w-[220px] shadow-xl border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    <span className="font-semibold text-green-400">Now Playing</span>
                                </div>
                                <div className="text-gray-200 truncate font-medium">{currentChannel.name}</div>
                                <div className="text-[10px] text-gray-500 mt-1">Click to expand</div>
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    {channels.length > 0 && (
                        <div className="group relative">
                            <button
                                onClick={() => onToggleCollapsed?.(false)}
                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                                aria-label="Expand sidebar and search channels"
                            >
                                <Search size={24} className="text-gray-300" />
                            </button>
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-all duration-200 delay-300 shadow-xl border border-white/10">
                                Search Channels
                                <div className="text-[10px] text-gray-500 mt-0.5">Click to expand</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Footer Icons */}
                <div className="flex flex-col gap-2 items-center">
                    <RouterLink to="/analytics" className="group relative" aria-label="View analytics dashboard">
                        <div className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-105">
                            <BarChart3 size={22} className="text-gray-300" />
                        </div>
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-all duration-200 delay-300 shadow-xl border border-white/10">
                            Analytics
                        </div>
                    </RouterLink>

                    <RouterLink to="/debug" className="group relative" aria-label="Open stream debugger">
                        <div className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-105">
                            <Globe size={22} className="text-gray-300" />
                        </div>
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900/95 backdrop-blur-sm text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[60] transition-all duration-200 delay-300 shadow-xl border border-white/10">
                            Debug
                        </div>
                    </RouterLink>
                </div>
            </aside>
        );
    }

    // ==========================================
    // EXPANDED MODE - Full sidebar
    // ==========================================
    return (
        <aside className="w-full h-full flex flex-col overflow-hidden bg-glass-bg backdrop-blur-xl">
            {/* Now Playing Card */}
            {currentChannel && (
                <div className="p-4 pb-0">
                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                        <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center flex-shrink-0">
                            {currentChannel.logo ? (
                                <img src={currentChannel.logo} alt={`${currentChannel.name} logo`} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <Tv size={20} className="text-accent" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-accent font-bold uppercase tracking-wider mb-0.5">Now Playing</div>
                            <div className="text-sm font-medium text-white truncate">{currentChannel.name}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                    </div>
                </div>
            )}

            {/* Source Mode Tabs */}
            <div className="p-4 pb-0">
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setSourceMode('default')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${sourceMode === 'default'
                                ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Globe size={14} />
                        Default
                    </button>
                    <button
                        onClick={() => setSourceMode('custom')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${sourceMode === 'custom'
                                ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        <Link size={14} />
                        Custom
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div className="px-4 pb-4 border-b border-glass-border space-y-3">
                {sourceMode === 'custom' ? (
                    <div className="relative group">
                        <input
                            type="url"
                            value={playlistUrl}
                            onChange={(e) => setPlaylistUrl(e.target.value)}
                            placeholder="Paste M3U URL..."
                            className="w-full bg-black/40 border border-glass-border rounded-lg py-2 pl-3 pr-9 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
                        />
                        {playlistUrl ? (
                            <button
                                onClick={() => {
                                    setPlaylistUrl('');
                                    localStorage.removeItem('vectastream_last_url');
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="Clear URL"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <Link className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={16} />
                        )}
                    </div>
                ) : (
                    <select
                        value={selectedDefault}
                        onChange={(e) => setSelectedDefault(e.target.value)}
                        className="w-full bg-black/40 border border-glass-border rounded-lg py-2 px-3 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer"
                    >
                        <option value="all">🌍 All Channels (9000+ global)</option>
                        <option value="categories">📂 By Category (News, Sports, etc.)</option>
                        <option value="languages">🗣️ By Language</option>
                        <option value="countries">🗺️ By Country</option>
                    </select>
                )}

                <button
                    onClick={() => sourceMode === 'custom' ? onLoadPlaylist() : onLoadPlaylist(DEFAULT_PLAYLISTS[selectedDefault])}
                    disabled={isLoading || (sourceMode === 'custom' && !playlistUrl)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : <List size={16} />}
                    {sourceMode === 'default' ? 'Load Default Channels' : 'Load Playlist'}
                </button>

                {/* Saved Playlists */}
                {sourceMode === 'custom' && savedPlaylists.length > 0 && (
                    <div className="mt-3 border-t border-glass-border/50 pt-3">
                        <button
                            onClick={() => setShowSavedList(!showSavedList)}
                            className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-all mb-2"
                        >
                            <span className="flex items-center gap-1.5">
                                <Bookmark size={12} />
                                Recent Playlists ({savedPlaylists.length})
                            </span>
                            <span className={`transform transition-transform ${showSavedList ? 'rotate-180' : ''}`}>▼</span>
                        </button>

                        {showSavedList && (
                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {savedPlaylists.map((item) => (
                                    <div
                                        key={item.url}
                                        onClick={() => handleLoadSaved(item.url)}
                                        className="group flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-white truncate">{item.name}</div>
                                            {item.channelCount && (
                                                <div className="text-[10px] text-gray-500">{item.channelCount} channels</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteSaved(item.url, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {sourceMode === 'default' && (
                    <p className="text-[10px] text-gray-500 text-center">
                        <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                            Powered by IPTV.org
                        </a> • Free & Open Source
                    </p>
                )}
            </div>

            {/* Category Tabs */}
            {channels.length > 0 && categories.length > 1 && (
                <div className="px-4 pt-3 border-b border-glass-border">
                    <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-thin">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === category
                                        ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {category}
                                {category !== 'All' && (
                                    <span className="ml-1.5 opacity-60">
                                        ({channels.filter(c => c.group === category).length})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            {channels.length > 0 && (
                <div className="p-4 border-b border-glass-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search channels..."
                            className="w-full bg-black/40 border border-glass-border rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>
            )}

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {paginatedChannels.length > 0 ? (
                    <div className="p-3 space-y-1">
                        {paginatedChannels.map((channel) => (
                            <ChannelItem
                                key={channel.url}
                                channel={channel}
                                isPlaying={currentChannel?.url === channel.url}
                                status={getChannelStatus(channel.url)}
                                onClick={() => onChannelSelect(channel)}
                                onRefresh={() => {
                                    onRefreshChannel(channel);
                                    checkStreamStatus(channel.url);
                                }}
                            />
                        ))}
                    </div>
                ) : channels.length > 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <Search size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">No channels found</p>
                        <p className="text-xs mt-1">Try a different search term</p>
                    </div>
                ) : null}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-3 border-t border-glass-border bg-black/20">
                    <div className="flex items-center justify-between text-xs">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={14} />
                            Prev
                        </button>

                        <span className="text-gray-400 font-medium">
                            Page {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-glass-border bg-black/10">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <RouterLink to="/analytics" className="hover:text-accent transition-all flex items-center gap-1">
                        <BarChart3 size={12} />
                        Debugger
                    </RouterLink>
                    <span className="text-center">
                        <a href="https://rmdtech.id" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-all">
                            © 2025 VectaStream
                        </a>
                        <br />
                        Developed by RMD TECH
                    </span>
                    <RouterLink to="/debug" className="hover:text-accent transition-all flex items-center gap-1">
                        <Globe size={12} />
                        Analytics
                    </RouterLink>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
