import { useState, useCallback } from 'react';

const useStreamStatus = () => {
    const [statusMap, setStatusMap] = useState({});

    const checkStreamStatus = useCallback(async (url, channelId) => {
        // DISABLED: This feature causes Mixed Content errors by making direct HTTP requests
        // Stream status is not critical for functionality - users can just try playing
        // If we wanted to enable this, we'd need to route through the Cloudflare proxy

        // Immediately return unknown status without making any network requests
        setStatusMap(prev => ({
            ...prev,
            [channelId]: { status: 'unknown', lastChecked: Date.now() }
        }));

        /* ORIGINAL CODE - CAUSES MIXED CONTENT:
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors'
            });

            clearTimeout(timeoutId);

            setStatusMap(prev => ({
                ...prev,
                [channelId]: { status: 'online', lastChecked: Date.now() }
            }));

        } catch (error) {
            let statusType = 'offline';
            if (error.name === 'AbortError') {
                statusType = 'timeout';
            } else if (error.message.includes('CORS')) {
                statusType = 'cors';
            }

            setStatusMap(prev => ({
                ...prev,
                [channelId]: {
                    status: 'error',
                    errorType: statusType,
                    lastChecked: Date.now()
                }
            }));
        }
        */
    }, []);

    const getStatus = useCallback((channelId) => {
        return statusMap[channelId] || { status: 'unknown', lastChecked: null };
    }, [statusMap]);

    return { checkStreamStatus, getStatus, statusMap };
};

export default useStreamStatus;
