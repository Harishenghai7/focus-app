/**
 * useOfflineQueue Hook
 * React hook for offline queue management
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineQueue } from '../utils/OfflineQueue';
import { toast } from 'react-toastify';

export const useOfflineQueue = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [queueSize, setQueueSize] = useState(offlineQueue.getQueueSize());
    const [isSyncing, setIsSyncing] = useState(false);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Back online! Syncing queued actions...');
            syncQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('You are offline. Actions will be queued for sync.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    /**
     * Queue an action for offline execution
     */
    const queueAction = useCallback((type, payload) => {
        if (offlineQueue.isFull()) {
            toast.error('Too many pending actions. Please connect to internet.');
            return false;
        }

        const success = offlineQueue.enqueue({ type, payload });
        if (success) {
            setQueueSize(offlineQueue.getQueueSize());
            if (!isOnline) {
                toast.info('Action queued for sync');
            }
        }
        return success;
    }, [isOnline]);

    /**
     * Sync queued actions
     */
    const syncQueue = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            const result = await offlineQueue.syncQueue();
            setQueueSize(offlineQueue.getQueueSize());

            if (result.successCount > 0) {
                toast.success(`Synced ${result.successCount} actions`);
            }
            if (result.failedCount > 0) {
                toast.error(`${result.failedCount} actions failed to sync`);
            }
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error('Failed to sync actions');
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing]);

    /**
     * Clear queue
     */
    const clearQueue = useCallback(() => {
        offlineQueue.clear();
        setQueueSize(0);
        toast.success('Queue cleared');
    }, []);

    return {
        isOnline,
        queueSize,
        isSyncing,
        queueAction,
        syncQueue,
        clearQueue,
        isFull: offlineQueue.isFull()
    };
};
