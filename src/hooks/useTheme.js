import { useState, useEffect } from 'react';

/**
 * Hook for managing theme (dark/light mode)
 * Syncs with localStorage and applies CSS class to document
 */
export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('focus-theme');
        if (saved) return saved;

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'dark'; // Default to dark
    });

    useEffect(() => {
        // Apply theme class to document
        document.documentElement.setAttribute('data-theme', theme);

        // Save to localStorage
        localStorage.setItem('focus-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const setDarkTheme = () => setTheme('dark');
    const setLightTheme = () => setTheme('light');

    return {
        theme,
        toggleTheme,
        setDarkTheme,
        setLightTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light'
    };
};
