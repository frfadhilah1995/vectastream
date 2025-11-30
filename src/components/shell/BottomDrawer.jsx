import React, { useState, useMemo } from 'react';
import { Drawer } from 'vaul';
import { motion } from 'framer-motion';
import { Search, X, Grid3x3, List as ListIcon, Tv, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * 🗂️ BOTTOM DRAWER - Channel Grid (Swipe Up)
 * 
 * Features:
 * - Swipe up to open (mobile-friendly)
 * - Channel grid layout (poster view)
 * - Category filters
 * - Search within drawer
 * - Grid / List view toggle
 * - Smooth animations
 */

const BottomDrawer = ({
    open,
    onOpenChange,
    channels = [],
    currentChannel,
    onChannelSelect,
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Categories
    const categories = useMemo(() => {
        const uniqueGroups = [...new Set(channels.map(c => c.group || 'Uncategorized'))];
        return ['All', ...uniqueGroups.sort()];
    }, [channels]);

    // Filtered channels
    const filteredChannels = useMemo(() => {
        return channels.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.group.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || c.group === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [channels, search, selectedCategory]);

    const handleChannelClick = (channel) => {
        onChannelSelect(channel);
        onOpenChange(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                {/* Overlay */}
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-drawer)]" />

                {/* Drawer Content */}
                <Drawer.Content
                    className={cn(
                        'fixed bottom-0 left-0 right-0 z-[var(--z-drawer)]',
                        'bg-app-elevated border-t border-glass-border',
                        'rounded-t-3xl shadow-2xl',
                        'flex flex-col',
                        'max-h-[85vh]',
                        'outline-none'
                    )}
                >
                    {/* Drag Handle */}
                    <div className="flex justify-center py-3 border-b border-glass-border/50">
                        <div className="w-12 h-1.5 bg-glass-border rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-glass-border">
                        <div className="flex items-center justify-between mb-4">
                            <Drawer.Title className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <Tv size={24} className="text-accent-500" />
                                Channels ({filteredChannels.length})
                            </Drawer.Title>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        'p-2 rounded-lg transition-all',
                                        viewMode === 'grid'
                                            ? 'bg-accent-500 text-white'
                                            : 'bg-white/5 text-text-tertiary hover:bg-white/10 hover:text-white'
                                    )}
                                    aria-label="Grid view"
                                >
                                    <Grid3x3 size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        'p-2 rounded-lg transition-all',
                                        viewMode === 'list'
                                            ? 'bg-accent-500 text-white'
                                            : 'bg-white/5 text-text-tertiary hover:bg-white/10 hover:text-white'
                                    )}
                                    aria-label="List view"
                                >
                                    <ListIcon size={18} />
                                </button>
                                <Drawer.Close className="p-2 bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white rounded-lg transition-all ml-2">
                                    <X size={18} />
                                </Drawer.Close>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search channels..."
                                className={cn(
                                    'w-full bg-app-surface border border-glass-border rounded-lg',
                                    'pl-10 pr-10 py-2.5 text-sm',
                                    'text-text-primary placeholder:text-text-tertiary',
                                    'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500',
                                    'transition-all'
                                )}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                                        selectedCategory === category
                                            ? 'bg-accent-500 text-white shadow-glow-accent'
                                            : 'bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                                    )}
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

                    {/* Channel List */}
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        {filteredChannels.length > 0 ? (
                            viewMode === 'grid' ? (
                                // Grid View
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {filteredChannels.map((channel) => {
                                        const isPlaying = currentChannel?.url === channel.url;
                                        return (
                                            <motion.button
                                                key={channel.url}
                                                onClick={() => handleChannelClick(channel)}
                                                className={cn(
                                                    'group relative rounded-xl overflow-hidden',
                                                    'bg-app-surface border transition-all',
                                                    'hover:border-accent-500/50 hover:shadow-glow-accent',
                                                    'active:scale-95',
                                                    isPlaying
                                                        ? 'border-accent-500 shadow-glow-accent ring-2 ring-accent-500/30'
                                                        : 'border-glass-border'
                                                )}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {/* Poster/Logo */}
                                                <div className="aspect-video bg-app-bg flex items-center justify-center relative">
                                                    {channel.logo ? (
                                                        <img
                                                            src={channel.logo}
                                                            alt={channel.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Tv size={32} className="text-text-tertiary" />
                                                    )}

                                                    {/* Playing Indicator */}
                                                    {isPlaying && (
                                                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="p-3">
                                                    <div className="text-sm font-medium text-text-primary truncate group-hover:text-accent-500 transition-colors">
                                                        {channel.name}
                                                    </div>
                                                    <div className="text-xs text-text-tertiary truncate mt-0.5">
                                                        {channel.group}
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ) : (
                                // List View
                                <div className="space-y-1">
                                    {filteredChannels.map((channel) => {
                                        const isPlaying = currentChannel?.url === channel.url;
                                        return (
                                            <motion.button
                                                key={channel.url}
                                                onClick={() => handleChannelClick(channel)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 p-3 rounded-lg',
                                                    'bg-app-surface border transition-all',
                                                    'hover:border-accent-500/50 hover:shadow-glow-accent',
                                                    'active:scale-[0.98]',
                                                    isPlaying
                                                        ? 'border-accent-500 shadow-glow-accent bg-accent-500/10'
                                                        : 'border-glass-border'
                                                )}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {/* Logo */}
                                                <div className="w-12 h-12 rounded-lg bg-app-bg flex items-center justify-center flex-shrink-0">
                                                    {channel.logo ? (
                                                        <img src={channel.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Tv size={20} className="text-text-tertiary" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="font-medium text-text-primary truncate">{channel.name}</div>
                                                    <div className="text-xs text-text-tertiary truncate">{channel.group}</div>
                                                </div>

                                                {/* Status */}
                                                {isPlaying && (
                                                    <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-green-500 font-medium">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                        Playing
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No channels found</p>
                                <p className="text-sm mt-1">Try a different search term or category</p>
                            </div>
                        )}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

export default BottomDrawer;
