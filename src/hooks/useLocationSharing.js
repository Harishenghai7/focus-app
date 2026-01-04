import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for location sharing
 * Supports current location and live location sharing
 */
export const useLocationSharing = () => {
    const [sharing, setSharing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);

    // Get current location
    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setCurrentLocation(location);
                    resolve(location);
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }, []);

    // Share location in message
    const shareLocation = useCallback(async (conversationId, senderId, receiverId, isLive = false) => {
        setSharing(true);
        try {
            const location = await getCurrentLocation();

            const messageData = {
                sender_id: senderId,
                receiver_id: receiverId,
                conversation_id: conversationId,
                message_type: 'location',
                content: isLive ? 'Live location' : 'Location',
                location_data: {
                    ...location,
                    is_live: isLive,
                    shared_at: new Date().toISOString(),
                    expires_at: isLive ? new Date(Date.now() + 3600000).toISOString() : null // 1 hour for live
                }
            };

            const { data, error } = await supabase
                .from('messages')
                .insert(messageData)
                .select()
                .single();

            if (error) throw error;

            focusToast.success(isLive ? 'Live location shared' : 'Location shared');
            return data;
        } catch (error) {
            console.error('Error sharing location:', error);
            focusToast.error('Failed to share location');
            return null;
        } finally {
            setSharing(false);
        }
    }, [getCurrentLocation]);

    // Share location in group
    const shareLocationInGroup = useCallback(async (groupId, senderId, isLive = false) => {
        setSharing(true);
        try {
            const location = await getCurrentLocation();

            const messageData = {
                group_id: groupId,
                sender_id: senderId,
                message_type: 'location',
                content: isLive ? 'Live location' : 'Location',
                location_data: {
                    ...location,
                    is_live: isLive,
                    shared_at: new Date().toISOString(),
                    expires_at: isLive ? new Date(Date.now() + 3600000).toISOString() : null
                }
            };

            const { data, error } = await supabase
                .from('group_messages')
                .insert(messageData)
                .select()
                .single();

            if (error) throw error;

            focusToast.success(isLive ? 'Live location shared' : 'Location shared');
            return data;
        } catch (error) {
            console.error('Error sharing location in group:', error);
            focusToast.error('Failed to share location');
            return null;
        } finally {
            setSharing(false);
        }
    }, [getCurrentLocation]);

    // Format location for display
    const formatLocation = useCallback((lat, lng) => {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }, []);

    // Get Google Maps link
    const getMapLink = useCallback((lat, lng) => {
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }, []);

    return {
        sharing,
        currentLocation,
        getCurrentLocation,
        shareLocation,
        shareLocationInGroup,
        formatLocation,
        getMapLink
    };
};
