import { useState, useCallback } from 'react';

const useStreamStatus = () => {
    const [statusMap, setStatusMap] = useState({});

    const checkStreamStatus = useCallback(async (url, channelId) => {
        // Set checking status
        setStatusMap(prev => ({
            ...prev,
            [channelId]: { status: 'checking', lastChecked: Date.now() }
        }));

        try {
            // Try to fetch just the headers with a timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(url, {
                method: 'HEAD', // Only get headers, don't download content
                signal: controller.signal,
                mode: 'no-cors' // This allows the request but limits response info
            });

            clearTimeout(timeoutId);

            // Since mode is 'no-cors', we can't read the status
            // If we got here without error, we assume it's online
            setStatusMap(prev => ({
                ...prev,
                [channelId]: { status: 'online', lastChecked: Date.now() }
            }));

        } catch (error) {
            // Determine error type
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
    }, []);

    const getStatus = useCallback((channelId) => {
        return statusMap[channelId] || { status: 'unknown', lastChecked: null };
    }, [statusMap]);

    return { checkStreamStatus, getStatus, statusMap };
};

export default useStreamStatus;
