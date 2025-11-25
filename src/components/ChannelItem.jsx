import React, { useState } from 'react';
import { Play, Tv, RefreshCw, Loader2, Star } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite } from '../utils/favorites';

const ChannelItem = ({ channel, isActive, onClick, status, onRefresh }) => {
    const [logoError, setLogoError] = useState(false);
    const [favorite, setFavorite] = useState(isFavorite(channel.url));

    const getStatusBadge = () => {
        if (!status) return null;

        const statusConfig = {
            online: {
                color: 'bg-green-500/90 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
                text: 'Live',
                icon: '⬤',
                pulse: true
            },
            offline: {
                color: 'bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
                text: 'Offline',
                icon: '○',
                pulse: false
            },
            error: {
                color: 'bg-red-500/90',
                text: 'Error',
                icon: '!',
                pulse: false
            },
            checking: {
                color: 'bg-yellow-500/90 animate-pulse',
                text: 'Checking',
                icon: '◐',
                pulse: true
            },
            unknown: {
                color: 'bg-gray-500/50',
                text: '',
                icon: '',
                pulse: false
            },
        };

        const config = statusConfig[status.status] || statusConfig.unknown;

        // Don't show badge for unknown status
        if (status.status === 'unknown') return null;

        return (
            <span className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full ${config.color} text-white font-medium transition-all`}>
                <span className={config.pulse ? 'animate-pulse' : ''}>{config.icon}</span>
                {config.text}
            </span>
        );
    };

    const handleRefresh = (e) => {
        e.stopPropagation();
        if (onRefresh) {
            onRefresh(channel);
        }
    };

    const handleFavorite = (e) => {
        e.stopPropagation();
        if (favorite) {
            removeFavorite(channel.url);
            setFavorite(false);
        } else {
            addFavorite(channel);
            setFavorite(true);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`
        group flex items-center p-3 mb-2 rounded-lg cursor-pointer transition-all duration-300 border
        ${isActive
                    ? 'bg-accent/10 border-accent text-accent shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-gray-300'
                }
      `}
        >
            <div className={`
        mr-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors overflow-hidden flex-shrink-0
        ${isActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white'}
      `}>
                {channel.logo && !logoError ? (
                    <img
                        src={channel.logo}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                        loading="lazy"
                    />
                ) : (
                    isActive ? <Play size={14} fill="currentColor" /> : <Tv size={14} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-gray-200'}`}>
                    {channel.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-gray-500 truncate">{channel.group}</p>

                    {/* Metadata badges */}
                    {channel.resolution && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                            {channel.resolution}
                        </span>
                    )}
                    {channel.country && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            {channel.country}
                        </span>
                    )}
                    {channel.language && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-300">
                            {channel.language}
                        </span>
                    )}

                    {/* Status badge */}
                    {getStatusBadge()}
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={handleFavorite}
                    className={`
            p-1.5 rounded-lg transition-all flex-shrink-0
            ${favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}
            hover:bg-white/10 active:scale-95
          `}
                    title={favorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star size={14} fill={favorite ? "currentColor" : "none"} />
                </button>

                <button
                    onClick={handleRefresh}
                    disabled={status?.status === 'checking'}
                    className={`
            p-1.5 rounded-lg transition-all flex-shrink-0
            ${status?.status === 'checking' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 active:scale-95'}
          `}
                    title="Check stream status"
                >
                    {status?.status === 'checking' ? (
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                    ) : (
                        <RefreshCw size={14} className="text-gray-400 hover:text-white" />
                    )}
                </button>
            </div>
        </div>
    );
};

// OPTIMIZATION: Memo-ized component to prevent unnecessary re-renders
// Only re-render if the channel, active state, or status actually changes
export default React.memo(ChannelItem, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.channel.url === nextProps.channel.url &&
        prevProps.status?.status === nextProps.status?.status &&
        prevProps.status?.lastChecked === nextProps.status?.lastChecked
    );
});
