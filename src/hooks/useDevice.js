import { useState, useEffect } from 'react';

const useDevice = () => {
    const [deviceInfo, setDeviceInfo] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: false,
        isLandscape: true,
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Breakpoints
            const isMobile = width < 768;
            const isTablet = width >= 768 && width < 1024;
            const isDesktop = width >= 1024;

            const isPortrait = height > width;
            const isLandscape = width >= height;

            setDeviceInfo({
                isMobile,
                isTablet,
                isDesktop,
                isPortrait,
                isLandscape,
                width,
                height,
            });
        };

        // Initial check
        handleResize();

        // Event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return deviceInfo;
};

export default useDevice;
