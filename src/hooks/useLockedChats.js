import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for locking chats with biometric/PIN
 * WhatsApp-style chat locking
 */
export const useLockedChats = (userId) => {
    const [lockedChats, setLockedChats] = useState([]);
    const [masterPin, setMasterPin] = useState(null);
    const [isUnlocked, setIsUnlocked] = useState(false);

    // Load locked chats
    useEffect(() => {
        if (userId) {
            loadLockedChats();
        }
    }, [userId]);

    const loadLockedChats = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('locked_chats, chat_lock_pin')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setLockedChats(data.locked_chats || []);
            setMasterPin(data.chat_lock_pin);
        } catch (error) {
            console.error('Error loading locked chats:', error);
        }
    }, [userId]);

    // Set master PIN
    const setPin = useCallback(async (pin) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ chat_lock_pin: pin })
                .eq('id', userId);

            if (error) throw error;

            setMasterPin(pin);
            focusToast.success('PIN set successfully');
            return true;
        } catch (error) {
            console.error('Error setting PIN:', error);
            focusToast.error('Failed to set PIN');
            return false;
        }
    }, [userId]);

    // Lock a chat
    const lockChat = useCallback(async (chatId) => {
        if (!masterPin) {
            focusToast.error('Please set a PIN first');
            return false;
        }

        try {
            const newLocked = [...lockedChats, chatId];

            const { error } = await supabase
                .from('profiles')
                .update({ locked_chats: newLocked })
                .eq('id', userId);

            if (error) throw error;

            setLockedChats(newLocked);
            focusToast.success('Chat locked');
            return true;
        } catch (error) {
            console.error('Error locking chat:', error);
            focusToast.error('Failed to lock chat');
            return false;
        }
    }, [lockedChats, masterPin, userId]);

    // Unlock a chat
    const unlockChat = useCallback(async (chatId) => {
        try {
            const newLocked = lockedChats.filter(id => id !== chatId);

            const { error } = await supabase
                .from('profiles')
                .update({ locked_chats: newLocked })
                .eq('id', userId);

            if (error) throw error;

            setLockedChats(newLocked);
            focusToast.success('Chat unlocked');
            return true;
        } catch (error) {
            console.error('Error unlocking chat:', error);
            focusToast.error('Failed to unlock chat');
            return false;
        }
    }, [lockedChats, userId]);

    // Verify PIN
    const verifyPin = useCallback((inputPin) => {
        if (inputPin === masterPin) {
            setIsUnlocked(true);
            return true;
        }
        focusToast.error('Incorrect PIN');
        return false;
    }, [masterPin]);

    // Check if chat is locked
    const isLocked = useCallback((chatId) => {
        return lockedChats.includes(chatId);
    }, [lockedChats]);

    // Request biometric authentication
    const requestBiometric = useCallback(async () => {
        // This would integrate with browser's Web Authentication API
        // For now, we'll use PIN as fallback
        return new Promise((resolve) => {
            // Simulated biometric check
            resolve(isUnlocked);
        });
    }, [isUnlocked]);

    return {
        lockedChats,
        masterPin,
        isUnlocked,
        setPin,
        lockChat,
        unlockChat,
        verifyPin,
        isLocked,
        requestBiometric
    };
};
