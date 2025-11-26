import React, { useState, useMemo, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Search, Satellite, List, Loader2, ChevronLeft, ChevronRight, Globe, Link, X, Bookmark, Trash2, BarChart3 } from 'lucide-react';
import ChannelItem from './ChannelItem';
import { statusRefreshService } from '../utils/statusRefresh.js';
import { getSavedUrls, savePlaylistUrl, deletePlaylistUrl, updateChannelCount } from '../utils/savedPlaylists.js';

const CHANNELS_PER_PAGE = 50;

// IPTV.org repository URLs - Validated from official repo
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
    checkStreamStatus, // Received from App
    onRefreshChannel,
    onClearChannels
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [savedPlaylists, setSavedPlaylists] = useState([]);
    const [showSavedList, setShowSavedList] = useState(false);

    // Initialize state from localStorage
    const [sourceMode, setSourceMode] = useState(() => localStorage.getItem('vectastream_source_mode') || 'default');
    const [selectedDefault, setSelectedDefault] = useState(() => localStorage.getItem('vectastream_selected_default') || 'all');

    // Load saved playlists on mount
    useEffect(() => {
        setSavedPlaylists(getSavedUrls());
    }, []);

    // Persist state changes
    useEffect(() => {
        localStorage.setItem('vectastream_source_mode', sourceMode);
    }, [sourceMode]);

    useEffect(() => {
        localStorage.setItem('vectastream_selected_default', selectedDefault);
    }, [selectedDefault]);

    // Auto-load default playlist on mount if in default mode
    useEffect(() => {
        if (sourceMode === 'default') {
            // Small delay to ensure App is ready
            const timer = setTimeout(() => {
                onLoadPlaylist(DEFAULT_PLAYLISTS[selectedDefault]);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [sourceMode, selectedDefault]);

    // BACKGROUND REFRESH: Start service when channels load
    const [, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (channels.length > 0) {
            // Start background refresh with callback to trigger re-render
            statusRefreshService.start(channels, (url, newStatus) => {
                console.log(`[Sidebar] Status updated: ${url} → ${newStatus}`);
                // Force re-render to update badges
                setRefreshTrigger(prev => prev + 1);
            });

            return () => {
                statusRefreshService.stop();
            };
        }
    }, [channels]);

    const categories = useMemo(() => {
        const uniqueGroups = [...new Set(channels.map(c => c.group || 'Uncategorized'))];
        return ['All', ...uniqueGroups.sort()];
    }, [channels]);

    const filteredChannels = useMemo(() => {
        const filtered = channels.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.group.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || c.group === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        return filtered;
    }, [channels, searchTerm, selectedCategory]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    const totalPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
    const startIndex = (currentPage - 1) * CHANNELS_PER_PAGE;
    const endIndex = startIndex + CHANNELS_PER_PAGE;
    const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

    // Saved Playlist Handlers
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

    // Auto-save after successful load
    useEffect(() => {
        if (channels.length > 0 && playlistUrl && sourceMode === 'custom') {
            savePlaylistUrl(playlistUrl, channels.length);
            updateChannelCount(playlistUrl, channels.length);
            setSavedPlaylists(getSavedUrls());
        }
    }, [channels.length, playlistUrl, sourceMode]);

    return (
        <aside className="w-full h-full flex flex-col overflow-hidden bg-glass-bg backdrop-blur-xl">
            {/* Source Mode Tabs */}
            <div className="p-4 pb-0">
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => {
                            setSourceMode('default');
                            // onClearChannels(); // REMOVED: Don't clear player when switching tabs
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${sourceMode === 'default' ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        <Globe size={14} />
                        Default
                    </button>
                    <button
                        onClick={() => {
                            setSourceMode('custom');
                            // onClearChannels(); // REMOVED: Don't clear player when switching tabs
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${sourceMode === 'custom' ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
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

                {/* Saved Playlists Section (Custom mode only) */}
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
                            <span className={`transform transition-transform ${showSavedList ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {showSavedList && (
                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {savedPlaylists.map((item, idx) => (
                                    <div
                                        key={item.url}
                                        onClick={() => handleLoadSaved(item.url)}
                                        className="group flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-white truncate">
                                                {item.name}
                                            </div>
                                            {item.channelCount && (
                                                <div className="text-[10px] text-gray-500">
                                                    {item.channelCount} channels
                                                </div>
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
                        <a href="https://github.com/iptv-org/iptv" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Powered by IPTV.org</a> • Free & Open Source
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === category ? 'bg-accent text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
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

            {/* Search */}
            {channels.length > 0 && (
                <div className="px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search channels..."
                            className="w-full bg-white/5 border border-transparent rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:bg-black/40 focus:border-glass-border outline-none transition-all"
                        />
                        {searchTerm && selectedCategory !== 'All' && (
                            <span className="text-accent font-normal normal-case absolute right-3 top-1/2 -translate-y-1/2 text-xs">in {selectedCategory}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Channel List */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {channels.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                            <Satellite size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Choose a source above to start watching</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-2 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                <span>{filteredChannels.length} Channels</span>
                                {selectedCategory !== 'All' && (
                                    <span className="text-accent font-normal normal-case">in {selectedCategory}</span>
                                )}
                            </div>
                            {paginatedChannels.map((channel, idx) => (
                                <ChannelItem
                                    key={`${channel.url}-${startIndex + idx}`}
                                    channel={channel}
                                    isActive={currentChannel === channel}
                                    onClick={() => onChannelSelect(channel)}
                                    status={getChannelStatus ? getChannelStatus(`${channel.url}-${channels.indexOf(channel)}`) : null}
                                    onRefresh={onRefreshChannel}
                                />
                            ))}
                            {filteredChannels.length === 0 && (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    {searchTerm ? `No channels match "${searchTerm}"` : `No channels in "${selectedCategory}"`}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-2.5 border-t border-glass-border bg-black/20">
                        <div className="flex items-center justify-between text-xs">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                            >
                                <ChevronLeft size={14} />
                                Prev
                            </button>

                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-gray-400">
                                    Page <span className="text-accent font-medium">{currentPage}</span> / {totalPages}
                                </span>
                                <span className="text-gray-600 text-[10px]">
                                    {startIndex + 1}-{Math.min(endIndex, filteredChannels.length)} of {filteredChannels.length}
                                </span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                            >
                                Next
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-glass-border text-center text-xs text-gray-600 bg-black/20">
                <div className="flex justify-center gap-4 mb-2">
                    <RouterLink to="/debug" className="flex items-center gap-2 text-accent hover:text-white transition-colors">
                        <Globe size={12} />
                        <span>Debugger</span>
                    </RouterLink>
                    <RouterLink to="/analytics" className="flex items-center gap-2 text-accent hover:text-white transition-colors">
                        <BarChart3 size={12} />
                        <span>Analytics</span>
                    </RouterLink>
                </div>
                <p>&copy; {new Date().getFullYear()} VectaStream</p>
                <p className="mt-1 font-medium text-gray-500">Developed by RMD TECH</p>
            </div>
        </aside>
    );
};

export default Sidebar;
