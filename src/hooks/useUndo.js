/**
 * useUndo Hook
 * React hook for undo functionality with configurable timeout and toast notifications
 */

import { useCallback, useEffect } from 'react';
import { undoManager } from '../utils/UndoManager';
import { toast } from 'react-toastify';

export const useUndo = () => {
    // Get undo timeout from localStorage settings (default 3 seconds)
    const getUndoTimeout = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('focus_settings') || '{}');
            return (settings.undoTimeout || 3) * 1000;
        } catch {
            return 3000;
        }
    };

    const undoTimeout = getUndoTimeout();

    // Update undo manager timeout
    useEffect(() => {
        undoManager.setDefaultTimeout(undoTimeout);
    }, [undoTimeout]);

    /**
     * Execute action with undo capability
     * @param {Function} action - The action to execute
     * @param {Function} undoAction - The undo action
     * @param {Object} options - Configuration options
     */
    const executeWithUndo = useCallback((action, undoAction, options = {}) => {
        const {
            message = 'Action completed',
            undoMessage = 'Action undone',
            metadata = {}
        } = options;

        // Execute action with undo
        const undoControl = undoManager.executeWithUndo(
            action,
            undoAction,
            {
                timeout: undoTimeout,
                metadata,
                onUndo: () => {
                    toast.info(undoMessage);
                },
                onTimeout: () => {
                    // Action committed, no longer undoable
                }
            }
        );

        // Show toast with undo button
        const toastId = toast.success(
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span>{message}</span>
                <button
                    onClick={() => {
                        undoControl.undo();
                        toast.dismiss(toastId);
                    }}
                    style={{
                        background: 'var(--primary-lavender)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.9'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                    Undo
                </button>
            </div>,
            {
                autoClose: undoTimeout,
                closeButton: false,
            }
        );

        return undoControl;
    }, [undoTimeout]);

    /**
     * Clear all pending undo actions
     */
    const clearAllUndo = useCallback(() => {
        undoManager.clearAll();
    }, []);

    /**
     * Get pending undo count
     */
    const getPendingCount = useCallback(() => {
        return undoManager.getPendingCount();
    }, []);

    return {
        executeWithUndo,
        clearAllUndo,
        getPendingCount,
        undoTimeout
    };
};
