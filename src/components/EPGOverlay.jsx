import React, { useState, useEffect } from 'react';
import { X, Tv, Clock } from 'lucide-react';

const EPGOverlay = ({ visible, onClose, channels, currentChannel, onChannelSelect }) => {
    const [selectedChannelIndex, setSelectedChannelIndex] = useState(0);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!visible) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedChannelIndex(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedChannelIndex(prev => Math.min(channels.length - 1, prev + 1));
                    break;
                case 'Enter':
                    if (channels[selectedChannelIndex]) {
                        onChannelSelect(channels[selectedChannelIndex]);
                        onClose();
                    }
                    break;
                case 'Escape':
                case 'e':
                case 'E':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, selectedChannelIndex, channels, onChannelSelect, onClose]);

    // Auto-scroll to selected channel
    useEffect(() => {
        if (visible && selectedChannelIndex >= 0) {
            const element = document.getElementById(`epg-channel-${selectedChannelIndex}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedChannelIndex, visible]);

    // Set selected index to current channel when opening
    useEffect(() => {
        if (visible && currentChannel) {
            const index = channels.findIndex(c => c.url === currentChannel.url);
            if (index >= 0) {
                setSelectedChannelIndex(index);
            }
        }
    }, [visible, currentChannel, channels]);

    if (!visible) return null;

    // Generate time slots (current + next 4 hours)
    const currentHour = new Date().getHours();
    const timeSlots = Array.from({ length: 5 }, (_, i) => {
        const hour = (currentHour + i) % 24;
        return `${hour.toString().padStart(2, '0')}:00`;
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Tv size={24} className="text-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Program Guide</h2>
                        <p className="text-sm text-gray-400">{channels.length} channels available</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                    title="Close (ESC)"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Time Header */}
            <div className="flex border-b border-white/10 bg-black/40">
                <div className="w-64 flex-shrink-0 px-4 py-3 font-semibold text-white border-r border-white/10">
                    Channels
                </div>
                <div className="flex-1 grid grid-cols-5 gap-px bg-white/5">
                    {timeSlots.map(time => (
                        <div key={time} className="px-4 py-3 text-center text-base md:text-lg font-mono text-gray-300 flex items-center justify-center gap-2">
                            <Clock size={16} className="text-accent" />
                            {time}
                        </div>
                    ))}
                </div>
            </div>

            {/* Channel Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {channels.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <Tv size={48} className="mb-4 opacity-20 mx-auto" />
                            <p>No channels loaded</p>
                        </div>
                    </div>
                ) : (
                    channels.map((channel, idx) => (
                        <div
                            key={channel.url}
                            id={`epg-channel-${idx}`}
                            onClick={() => {
                                onChannelSelect(channel);
                                onClose();
                            }}
                            className={`
                                flex border-b border-white/5 cursor-pointer transition-all
                                ${idx === selectedChannelIndex
                                    ? 'bg-accent/20 border-accent/30 ring-2 ring-accent/50'
                                    : 'hover:bg-white/5'
                                }
                                ${currentChannel?.url === channel.url ? 'bg-green-500/10' : ''}
                            `}
                        >
                            {/* Channel Info */}
                            <div className="w-64 flex-shrink-0 p-4 border-r border-white/10 flex items-center gap-3">
                                {channel.logo ? (
                                    <img
                                        src={channel.logo}
                                        alt={channel.name}
                                        className="w-10 h-10 rounded-lg object-cover bg-black/40"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center">
                                        <Tv size={20} className="text-gray-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white truncate text-sm md:text-base">
                                        {channel.name}
                                    </div>
                                    {channel.group && (
                                        <div className="text-xs text-gray-500 truncate">
                                            {channel.group}
                                        </div>
                                    )}
                                </div>
                                {currentChannel?.url === channel.url && (
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                )}
                            </div>

                            {/* Program Slots (Placeholder) */}
                            <div className="flex-1 grid grid-cols-5 gap-px bg-white/5">
                                {timeSlots.map((time, tIdx) => (
                                    <div
                                        key={time}
                                        className="p-3 bg-black/20 hover:bg-white/5 transition-all"
                                    >
                                        <div className="text-xs text-gray-400">
                                            {/* Future: EPG data from XMLTV */}
                                            {tIdx === 0 ? 'Live' : 'Program ' + (tIdx + 1)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                    <span className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded text-white">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded text-white">Enter</kbd>
                        Select
                    </span>
                    <span className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded text-white">ESC</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EPGOverlay;
