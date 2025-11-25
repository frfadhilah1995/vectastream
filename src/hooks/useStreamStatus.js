import { useState, useCallback } from 'react';
import { getCachedStatus } from '../utils/m3u.js';

const useStreamStatus = () => {
    const [statusMap, setStatusMap] = useState({});

    const checkStreamStatus = useCallback(async (url, channelId) => {
        // OPTIMIZED: Use localStorage cache from HLS.js native error detection
        // No network requests needed - status is updated automatically when user plays

        const cachedStatus = getCachedStatus(url);

        if (cachedStatus) {
            // We have a cached status from previous playback attempt
            setStatusMap(prev => ({
                ...prev,
                [channelId]: {
                    status: cachedStatus, // 'online' or 'offline'
                    lastChecked: Date.now(),
                    cached: true
                }
            }));
        } else {
            // No cache yet - mark as unknown (will be updated after first play)
            setStatusMap(prev => ({
                ...prev,
                [channelId]: {
                    status: 'unknown',
                    lastChecked: Date.now(),
                    cached: false
                }
            }));
        }
    }, []);

    const getStatus = useCallback((channelId) => {
        return statusMap[channelId] || { status: 'unknown', lastChecked: null, cached: false };
    }, [statusMap]);

    return { checkStreamStatus, getStatus, statusMap };
};

export default useStreamStatus;
