import { useState, useEffect } from 'react';
import {
    getCurrentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    getViewport,
    debounce
} from '../utils/responsive';

/**
 * Custom hook for responsive design
 * Detects screen size changes and provides helpers
 * 
 * @returns {Object} Responsive state and helpers
 */
export const useResponsive = () => {
    const [state, setState] = useState({
        breakpoint: getCurrentBreakpoint(),
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        viewport: getViewport()
    });

    useEffect(() => {
        const handleResize = debounce(() => {
            setState({
                breakpoint: getCurrentBreakpoint(),
                isMobile: isMobile(),
                isTablet: isTablet(),
                isDesktop: isDesktop(),
                viewport: getViewport()
            });
        }, 200);

        window.addEventListener('resize', handleResize);

        // Initial check
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return state;
};

export default useResponsive;
