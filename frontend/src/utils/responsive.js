/**
 * Responsive Utilities
 * Breakpoints and responsive helpers
 */

// Breakpoints (matches Tailwind CSS defaults)
export const breakpoints = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};

/**
 * Media query helpers
 */
export const media = {
    xs: `(max-width: ${breakpoints.xs}px)`,
    sm: `(max-width: ${breakpoints.sm}px)`,
    md: `(max-width: ${breakpoints.md}px)`,
    lg: `(max-width: ${breakpoints.lg}px)`,
    xl: `(max-width: ${breakpoints.xl}px)`,
    '2xl': `(max-width: ${breakpoints['2xl']}px)`,

    // Min-width versions
    minXs: `(min-width: ${breakpoints.xs}px)`,
    minSm: `(min-width: ${breakpoints.sm}px)`,
    minMd: `(min-width: ${breakpoints.md}px)`,
    minLg: `(min-width: ${breakpoints.lg}px)`,
    minXl: `(min-width: ${breakpoints.xl}px)`,
    min2xl: `(min-width: ${breakpoints['2xl']}px)`
};

/**
 * Check if screen size matches breakpoint
 */
export const isBreakpoint = (breakpoint) => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(media[breakpoint]).matches;
};

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = () => {
    if (typeof window === 'undefined') return null;

    const width = window.innerWidth;

    if (width < breakpoints.xs) return 'xs';
    if (width < breakpoints.sm) return 'sm';
    if (width < breakpoints.md) return 'md';
    if (width < breakpoints.lg) return 'lg';
    if (width < breakpoints.xl) return 'xl';
    return '2xl';
};

/**
 * Check if mobile
 */
export const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.md;
};

/**
 * Check if tablet
 */
export const isTablet = () => {
    if (typeof window === 'undefined') return false;
    const width = window.innerWidth;
    return width >= breakpoints.md && width < breakpoints.lg;
};

/**
 * Check if desktop
 */
export const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoints.lg;
};

/**
 * Get viewport dimensions
 */
export const getViewport = () => {
    if (typeof window === 'undefined') {
        return { width: 0, height: 0 };
    }

    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
};

/**
 * Debounce function for resize handlers
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function for scroll/resize handlers
 */
export const throttle = (func, limit = 200) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

export default {
    breakpoints,
    media,
    isBreakpoint,
    getCurrentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    getViewport,
    debounce,
    throttle
};
