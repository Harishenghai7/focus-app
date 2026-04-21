/**
 * FocuslyContext.js
 * =================
 * 🦁  PILLAR 4 — Focusly AI as a living virtual companion.
 *
 * State machine:
 *   - idle          : gentle bob + blink, the default
 *   - thinking      : subtle head tilt + spinner dots
 *   - motivational  : confident pose (stands tall)
 *   - disappointed  : slight shake, dimmed colors (after Trust Shield hard reset)
 *   - celebrating   : bounce + sparkles (after Trust Shield pass, first post, etc.)
 *
 * Public API (via useFocusly()):
 *   - state                        : current animation state
 *   - message                      : current spoken line
 *   - isVisible                    : whether the floating toast layer is showing
 *   - speak({ state, message, duration })    : generic one-off speech
 *   - celebrate(message)           : sugar → speak({ state:'celebrating', ... })
 *   - disappoint(message)          : sugar → speak({ state:'disappointed', ... })
 *   - motivate(message)            : sugar → speak({ state:'motivational', ... })
 *   - think(message)               : sugar → speak({ state:'thinking', ... })
 *   - hush()                       : hide the toast immediately
 *   - setIdle()                    : return to idle state (keeps toast dismissed)
 *
 * Consumed globally by <FocuslyToastLayer /> (auto-mounted by the Provider).
 *
 * H2 Innovative — The Heart in the Machine.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import FocuslyToastLayer from '../components/focusly/FocuslyToastLayer';

const FocuslyContext = createContext(null);

export const FOCUSLY_STATES = Object.freeze({
    IDLE:          'idle',
    THINKING:      'thinking',
    MOTIVATIONAL:  'motivational',
    DISAPPOINTED:  'disappointed',
    CELEBRATING:   'celebrating',
});

const STATE_DEFAULT_DURATION_MS = {
    idle:          0,        // persistent — no auto-dismiss
    thinking:      8000,
    motivational:  7000,
    disappointed:  6500,
    celebrating:   5500,
};

export const FocuslyProvider = ({ children }) => {
    // Chat/dashboard drawer (kept from prior implementation)
    const [isOpen, setIsOpen] = useState(false);
    const [currentMode, setCurrentMode] = useState('chat');

    // Floating mascot / proactive toast layer
    const [state, setStateRaw] = useState(FOCUSLY_STATES.IDLE);
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const dismissTimer = useRef(null);

    const clearDismiss = useCallback(() => {
        if (dismissTimer.current) {
            clearTimeout(dismissTimer.current);
            dismissTimer.current = null;
        }
    }, []);

    const hush = useCallback(() => {
        clearDismiss();
        setIsVisible(false);
        // Linger at current state for a moment so the CSS exit animation plays
        setTimeout(() => {
            setStateRaw(FOCUSLY_STATES.IDLE);
            setMessage('');
        }, 450);
    }, [clearDismiss]);

    /**
     * Generic speak method — sets state + message + auto-dismiss timer.
     * @param {{ state?: string, message: string, duration?: number, sticky?: boolean }} opts
     */
    const speak = useCallback(({ state: nextState = FOCUSLY_STATES.MOTIVATIONAL, message: msg = '', duration, sticky = false } = {}) => {
        if (!msg) return;
        clearDismiss();
        setStateRaw(nextState);
        setMessage(msg);
        setIsVisible(true);
        const effectiveDuration = duration ?? STATE_DEFAULT_DURATION_MS[nextState] ?? 6000;
        if (!sticky && effectiveDuration > 0) {
            dismissTimer.current = setTimeout(() => hush(), effectiveDuration);
        }
    }, [clearDismiss, hush]);

    const celebrate  = useCallback((msg)  => speak({ state: FOCUSLY_STATES.CELEBRATING, message: msg }), [speak]);
    const disappoint = useCallback((msg)  => speak({ state: FOCUSLY_STATES.DISAPPOINTED, message: msg }), [speak]);
    const motivate   = useCallback((msg)  => speak({ state: FOCUSLY_STATES.MOTIVATIONAL, message: msg }), [speak]);
    const think      = useCallback((msg)  => speak({ state: FOCUSLY_STATES.THINKING,     message: msg }), [speak]);
    const setIdle    = useCallback(()      => { clearDismiss(); setStateRaw(FOCUSLY_STATES.IDLE); }, [clearDismiss]);

    // Drawer controls (legacy)
    const open   = useCallback(() => setIsOpen(true),  []);
    const close  = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(v => !v), []);
    const switchMode = useCallback((m) => setCurrentMode(m), []);
    // Legacy helper retained for backward compat with FocuslyContext callers
    const explainFeature = useCallback((featureName) => {
        motivate(`Let me show you ${featureName}.`);
    }, [motivate]);

    // Cleanup
    useEffect(() => () => clearDismiss(), [clearDismiss]);

    const value = {
        // State machine
        state,
        message,
        isVisible,
        speak,
        celebrate,
        disappoint,
        motivate,
        think,
        hush,
        setIdle,
        STATES: FOCUSLY_STATES,
        // Legacy drawer API
        isOpen,
        currentMode,
        open,
        close,
        toggle,
        switchMode,
        explainFeature,
    };

    return (
        <FocuslyContext.Provider value={value}>
            {children}
            <FocuslyToastLayer />
        </FocuslyContext.Provider>
    );
};

/**
 * useFocusly() — the spec-clean hook.
 * (Kept `useFocuslyContext` as alias for existing callers.)
 */
export const useFocusly = () => {
    const ctx = useContext(FocuslyContext);
    if (!ctx) throw new Error('useFocusly must be used within FocuslyProvider');
    return ctx;
};

export const useFocuslyContext = useFocusly;

export default FocuslyContext;
