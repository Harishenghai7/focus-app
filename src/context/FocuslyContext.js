import React, { createContext, useContext, useState, useCallback } from 'react';

const FocuslyContext = createContext(null);

/**
 * Focusly Context Provider
 * Provides global access to Focusly state and actions
 */
export const FocuslyProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMode, setCurrentMode] = useState('chat'); // 'chat', 'onboarding', 'game'

    /**
     * Open Focusly
     */
    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    /**
     * Close Focusly
     */
    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    /**
     * Toggle Focusly
     */
    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    /**
     * Switch mode
     */
    const switchMode = useCallback((mode) => {
        setCurrentMode(mode);
    }, []);

    /**
     * Trigger Focusly to explain a feature
     */
    const explainFeature = useCallback((featureName, elementSelector) => {
        open();
        // This could trigger a tooltip or guided tour
        // Implementation would depend on FocuslyTooltip component
    }, [open]);

    /**
     * Trigger Focusly to celebrate
     */
    const celebrate = useCallback((message) => {
        open();
        // This could trigger a celebration animation
    }, [open]);

    const value = {
        isOpen,
        currentMode,
        open,
        close,
        toggle,
        switchMode,
        explainFeature,
        celebrate
    };

    return (
        <FocuslyContext.Provider value={value}>
            {children}
        </FocuslyContext.Provider>
    );
};

/**
 * Hook to use Focusly context
 */
export const useFocuslyContext = () => {
    const context = useContext(FocuslyContext);
    if (!context) {
        throw new Error('useFocuslyContext must be used within FocuslyProvider');
    }
    return context;
};

export default FocuslyContext;
