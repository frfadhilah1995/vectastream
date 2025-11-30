import React, { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, Tv, Settings, BarChart3, Globe, Clock, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { cn } from '../../utils/cn';

/**
 * 🎯 COMMAND PALETTE - Revolutionary Navigation (⌘K / Ctrl+K)
 * 
 * Features:
 * - Fuzzy search with Fuse.js
 * - Keyboard shortcuts (⌘K, Escape, Arrow keys)
 * - Quick actions (Go to EPG, Open Settings, etc.)
 * - Recent channels
 * - Channel search
 * - Framer Motion animations
 */

const CommandPalette = ({
    open,
    onOpenChange,
    channels = [],
    onChannelSelect,
    recentChannels = [],
}) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Fuzzy search configuration
    const fuse = useMemo(() => {
        return new Fuse(channels, {
            keys: ['name', 'group'],
            threshold: 0.3, // 0 = exact match, 1 = match anything
            includeScore: true,
        });
    }, [channels]);

    // Search results
    const searchResults = useMemo(() => {
        if (!search) return channels.slice(0, 10); // Show first 10 if no search
        return fuse.search(search).map(result => result.item).slice(0, 10);
    }, [search, fuse, channels]);

    // Quick actions
    const quickActions = [
        {
            id: 'epg',
            label: 'Go to EPG',
            icon: Clock,
            action: () => {
                // Navigate to EPG
                console.log('Navigate to EPG');
                onOpenChange(false);
            },
        },
        {
            id: 'analytics',
            label: 'Open Analytics',
            icon: BarChart3,
            action: () => {
                window.location.href = '#/analytics';
                onOpenChange(false);
            },
        },
        {
            id: 'debug',
            label: 'Open Debug Console',
            icon: Globe,
            action: () => {
                window.location.href = '#/debug';
                onOpenChange(false);
            },
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: Settings,
            action: () => {
                console.log('Open Settings');
                onOpenChange(false);
            },
        },
    ];

    // Keyboard shortcut listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            // ⌘K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpenChange(!open);
            }

            // "/" to open (alternative)
            if (e.key === '/' && !open && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                onOpenChange(true);
            }

            // Escape to close
            if (e.key === 'Escape' && open) {
                onOpenChange(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange]);

    // Reset search when closed
    useEffect(() => {
        if (!open) {
            setSearch('');
            setSelectedIndex(0);
        }
    }, [open]);

    const handleSelect = (channel) => {
        onChannelSelect(channel);
        onOpenChange(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[var(--z-command)]"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Command Palette */}
                    <motion.div
                        initial={{ scale: 0.95, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-w-3xl z-[var(--z-command)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Command
                            className={cn(
                                'bg-app-elevated border border-glass-border rounded-2xl',
                                'shadow-2xl shadow-black/50',
                                'overflow-hidden'
                            )}
                        >
                            {/* Search Input */}
                            <div className="flex items-center border-b border-glass-border px-4">
                                <Search className="text-text-tertiary mr-3" size={20} />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Search channels, actions, or press '/' ..."
                                    className={cn(
                                        'flex-1 bg-transparent border-0 outline-none py-4',
                                        'text-text-primary placeholder:text-text-tertiary',
                                        'text-base'
                                    )}
                                    autoFocus
                                />
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary bg-white/5 border border-glass-border rounded">
                                    <span className="text-xs">ESC</span>
                                </kbd>
                            </div>

                            {/* Results */}
                            <Command.List className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                                {/* Empty State */}
                                <Command.Empty className="py-8 text-center text-text-secondary text-sm">
                                    No results found for "{search}"
                                </Command.Empty>

                                {/* Quick Actions */}
                                {!search && (
                                    <Command.Group heading="Quick Actions" className="mb-2">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                                            Quick Actions
                                        </div>
                                        {quickActions.map((action) => {
                                            const Icon = action.icon;
                                            return (
                                                <Command.Item
                                                    key={action.id}
                                                    onSelect={() => action.action()}
                                                    className={cn(
                                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                                        'text-text-primary',
                                                        'data-[selected=true]:bg-accent-500/20 data-[selected=true]:text-accent-500',
                                                        'transition-colors'
                                                    )}
                                                >
                                                    <Icon size={18} />
                                                    <span className="flex-1">{action.label}</span>
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                )}

                                {/* Recent Channels */}
                                {!search && recentChannels.length > 0 && (
                                    <Command.Group heading="Recent" className="mb-2">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                                            <Clock size={12} />
                                            Recent Channels
                                        </div>
                                        {recentChannels.slice(0, 5).map((channel) => (
                                            <Command.Item
                                                key={`recent-${channel.url}`}
                                                value={channel.name}
                                                onSelect={() => handleSelect(channel)}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                                    'text-text-primary',
                                                    'data-[selected=true]:bg-accent-500/20 data-[selected=true]:text-accent-500',
                                                    'transition-colors'
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-app-surface flex items-center justify-center flex-shrink-0">
                                                    {channel.logo ? (
                                                        <img src={channel.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Tv size={20} className="text-text-tertiary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{channel.name}</div>
                                                    <div className="text-xs text-text-tertiary truncate">{channel.group}</div>
                                                </div>
                                                <Clock size={14} className="text-text-tertiary flex-shrink-0" />
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <Command.Group heading="Channels">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                                            <Tv size={12} />
                                            Channels ({searchResults.length})
                                        </div>
                                        {searchResults.map((channel) => (
                                            <Command.Item
                                                key={channel.url}
                                                value={channel.name}
                                                onSelect={() => handleSelect(channel)}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                                                    'text-text-primary',
                                                    'data-[selected=true]:bg-accent-500/20 data-[selected=true]:text-accent-500',
                                                    'transition-colors'
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-app-surface flex items-center justify-center flex-shrink-0">
                                                    {channel.logo ? (
                                                        <img src={channel.logo} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Tv size={20} className="text-text-tertiary" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{channel.name}</div>
                                                    <div className="text-xs text-text-tertiary truncate">{channel.group}</div>
                                                </div>
                                                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] text-text-tertiary bg-white/5 border border-glass-border rounded">
                                                    ↵
                                                </kbd>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}
                            </Command.List>

                            {/* Footer */}
                            <div className="border-t border-glass-border px-4 py-2 flex items-center justify-between text-xs text-text-tertiary bg-black/20">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-glass-border rounded">↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-glass-border rounded">↵</kbd>
                                        Select
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 bg-white/5 border border-glass-border rounded">ESC</kbd>
                                        Close
                                    </span>
                                </div>
                                <div className="hidden sm:block">
                                    Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-glass-border rounded">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-white/5 border border-glass-border rounded">/</kbd> to open
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
