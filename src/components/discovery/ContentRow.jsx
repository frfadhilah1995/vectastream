import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';

export default function ContentRow({ title, channels, onChannelSelect }) {
    const scrollRef = useRef(null);

    if (!channels || channels.length === 0) return null;

    return (
        <div className="py-6 space-y-4">
            <div className="flex items-center justify-between px-4 md:px-8">
                <h3 className="text-lg font-semibold text-white/90">{title}</h3>
                {/* Future: Add 'See All' button here */}
            </div>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 px-4 md:px-8 pb-4 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {channels.map((channel, idx) => (
                    <motion.div
                        key={idx}
                        className="flex-none w-48 aspect-video relative group rounded-lg overflow-hidden bg-white/5 border border-white/10 cursor-pointer snap-start"
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onChannelSelect(channel)}
                    >
                        {/* Thumbnail / Logo */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            {channel.logo ? (
                                <img
                                    src={channel.logo}
                                    alt={channel.name}
                                    className="w-2/3 h-2/3 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            {/* Fallback Text Logo */}
                            <span
                                className="text-2xl font-bold text-white/20 group-hover:text-white/40 transition-colors"
                                style={{ display: channel.logo ? 'none' : 'block' }}
                            >
                                {channel.name.substring(0, 2).toUpperCase()}
                            </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <h4 className="font-medium text-white text-sm truncate">{channel.name}</h4>
                            <p className="text-[10px] text-white/60 truncate">{channel.group || 'Unknown Category'}</p>

                            <div className="mt-2 flex items-center gap-2">
                                <button className="p-1.5 bg-accent-500 rounded-full text-white hover:bg-accent-600 transition-colors">
                                    <Play className="w-3 h-3 fill-current" />
                                </button>
                                <button className="p-1.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
                                    <Info className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
