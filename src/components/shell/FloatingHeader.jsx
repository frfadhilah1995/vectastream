import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, Tv, User, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * 🎯 FLOATING HEADER - Auto-hiding top bar
 * 
 * Features:
 * - Auto-hide on scroll down, show on scroll up
 * - Logo + Search trigger + User menu
 * - Glassmorphism effect
 * - Responsive design
 * - Smooth animations
 */

const FloatingHeader = ({
    onOpenCommandPalette,
    onOpenDrawer,
    showNotifications = false,
    notificationCount = 0,
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Auto-hide on scroll
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10) {
                // Always show at top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY) {
                // Scrolling down - hide
                setIsVisible(false);
            } else {
                // Scrolling up - show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.header
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
                    className={cn(
                        'fixed top-0 left-0 right-0 z-[var(--z-header)]',
                        'bg-app-bg/80 backdrop-blur-xl border-b border-glass-border/50',
                        'shadow-lg'
                    )}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Left: Logo */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 cursor-pointer group">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/30 to-accent-600/10 border border-accent-500/20 flex items-center justify-center shadow-lg shadow-accent-500/10 group-hover:shadow-accent-500/30 transition-all">
                                        <Tv size={24} className="text-accent-500" />
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="text-lg font-bold text-text-primary">
                                            Vecta<span className="text-accent-500">Stream</span>
                                        </div>
                                        <div className="text-[10px] text-text-tertiary uppercase tracking-wider -mt-1">
                                            V2.0 Beta
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center: Search Trigger */}
                            <div className="flex-1 max-w-xl mx-4 sm:mx-8">
                                <button
                                    onClick={onOpenCommandPalette}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl',
                                        'bg-app-surface/50 border border-glass-border',
                                        'hover:bg-app-surface hover:border-accent-500/30',
                                        'transition-all duration-200',
                                        'group'
                                    )}
                                >
                                    <Search size={18} className="text-text-tertiary group-hover:text-accent-500 transition-colors" />
                                    <span className="flex-1 text-left text-sm text-text-tertiary group-hover:text-text-secondary">
                                        Search channels, actions...
                                    </span>
                                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-text-tertiary bg-white/5 border border-glass-border rounded group-hover:border-accent-500/30 transition-colors">
                                        <span className="text-xs">⌘K</span>
                                    </kbd>
                                </button>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                {/* Notifications */}
                                {showNotifications && (
                                    <button
                                        className={cn(
                                            'relative p-2.5 rounded-xl',
                                            'bg-app-surface/50 hover:bg-app-surface',
                                            'border border-glass-border hover:border-accent-500/30',
                                            'text-text-tertiary hover:text-text-primary',
                                            'transition-all'
                                        )}
                                        aria-label="Notifications"
                                    >
                                        <Bell size={20} />
                                        {notificationCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                                                {notificationCount > 9 ? '9+' : notificationCount}
                                            </span>
                                        )}
                                    </button>
                                )}

                                {/* Channels Menu (Mobile) */}
                                <button
                                    onClick={onOpenDrawer}
                                    className={cn(
                                        'sm:hidden p-2.5 rounded-xl',
                                        'bg-app-surface/50 hover:bg-app-surface',
                                        'border border-glass-border hover:border-accent-500/30',
                                        'text-text-tertiary hover:text-text-primary',
                                        'transition-all'
                                    )}
                                    aria-label="Open channels"
                                >
                                    <Menu size={20} />
                                </button>

                                {/* User Menu */}
                                <button
                                    className={cn(
                                        'hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl',
                                        'bg-app-surface/50 hover:bg-app-surface',
                                        'border border-glass-border hover:border-accent-500/30',
                                        'text-text-tertiary hover:text-text-primary',
                                        'transition-all'
                                    )}
                                    aria-label="User menu"
                                >
                                    <User size={18} />
                                    <span className="text-sm font-medium">Guest</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.header>
            )}
        </AnimatePresence>
    );
};

export default FloatingHeader;
