import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Base Skeleton component for loading states
 */
export const Skeleton = ({ className, ...props }) => (
    <div
        className={cn(
            'animate-pulse rounded-md bg-glass-bg',
            className
        )}
        {...props}
    />
);

/**
 * Channel-specific skeleton loader
 */
export const ChannelSkeleton = () => (
    <div className="flex items-center gap-3 p-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
    </div>
);

/**
 * Player-specific skeleton loader
 */
export const PlayerSkeleton = () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
            <Skeleton className="w-32 h-32 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
        </div>
    </div>
);

/**
 * Grid skeleton for multiple channels
 */
export const ChannelListSkeleton = ({ count = 5 }) => (
    <div className="space-y-1">
        {Array.from({ length: count }).map((_, i) => (
            <ChannelSkeleton key={i} />
        ))}
    </div>
);
