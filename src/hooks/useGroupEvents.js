import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for creating and managing events in group chats
 * WhatsApp-style events with RSVP tracking
 */
export const useGroupEvents = (groupId) => {
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState([]);

    // Create an event
    const createEvent = useCallback(async (eventData, creatorId) => {
        if (!eventData.title || !eventData.date) {
            focusToast.error('Event must have a title and date');
            return null;
        }

        setLoading(true);
        try {
            const event = {
                group_id: groupId,
                sender_id: creatorId,
                message_type: 'event',
                content: eventData.title,
                event_data: {
                    title: eventData.title,
                    description: eventData.description || '',
                    date: eventData.date,
                    time: eventData.time || null,
                    location: eventData.location || null,
                    created_by: creatorId,
                    created_at: new Date().toISOString(),
                    rsvp: {
                        going: [],
                        maybe: [],
                        not_going: []
                    }
                }
            };

            const { data, error } = await supabase
                .from('group_messages')
                .insert(event)
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Event created');
            return data;
        } catch (error) {
            console.error('Error creating event:', error);
            focusToast.error('Failed to create event');
            return null;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    // RSVP to an event
    const rsvpEvent = useCallback(async (messageId, userId, response) => {
        setLoading(true);
        try {
            // Get current event data
            const { data: message, error: fetchError } = await supabase
                .from('group_messages')
                .select('event_data')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const eventData = message.event_data;

            // Remove user from all RSVP lists
            eventData.rsvp.going = eventData.rsvp.going.filter(id => id !== userId);
            eventData.rsvp.maybe = eventData.rsvp.maybe.filter(id => id !== userId);
            eventData.rsvp.not_going = eventData.rsvp.not_going.filter(id => id !== userId);

            // Add to selected list
            if (response === 'going') {
                eventData.rsvp.going.push(userId);
            } else if (response === 'maybe') {
                eventData.rsvp.maybe.push(userId);
            } else if (response === 'not_going') {
                eventData.rsvp.not_going.push(userId);
            }

            // Update event
            const { error: updateError } = await supabase
                .from('group_messages')
                .update({ event_data: eventData })
                .eq('id', messageId);

            if (updateError) throw updateError;

            focusToast.success('RSVP updated');
            return true;
        } catch (error) {
            console.error('Error RSVP to event:', error);
            focusToast.error('Failed to RSVP');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Get event summary
    const getEventSummary = useCallback((eventData) => {
        const total = eventData.rsvp.going.length +
            eventData.rsvp.maybe.length +
            eventData.rsvp.not_going.length;

        return {
            going: eventData.rsvp.going.length,
            maybe: eventData.rsvp.maybe.length,
            not_going: eventData.rsvp.not_going.length,
            total,
            percentage: total > 0 ? (eventData.rsvp.going.length / total) * 100 : 0
        };
    }, []);

    // Check user's RSVP status
    const getUserRSVP = useCallback((eventData, userId) => {
        if (eventData.rsvp.going.includes(userId)) return 'going';
        if (eventData.rsvp.maybe.includes(userId)) return 'maybe';
        if (eventData.rsvp.not_going.includes(userId)) return 'not_going';
        return null;
    }, []);

    // Format event date
    const formatEventDate = useCallback((date, time) => {
        const eventDate = new Date(date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let formatted = eventDate.toLocaleDateString('en-US', options);

        if (time) {
            formatted += ` at ${time}`;
        }

        return formatted;
    }, []);

    return {
        loading,
        events,
        createEvent,
        rsvpEvent,
        getEventSummary,
        getUserRSVP,
        formatEventDate
    };
};
