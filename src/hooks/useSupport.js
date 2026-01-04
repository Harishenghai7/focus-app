// useSupport hook - For creating and managing support tickets
import { useState, useCallback } from 'react';
import { createTicket } from '../utils/supabaseSupport';
import { validateTicket, sanitizeTicketData } from '../utils/reportValidator';
import { sendTicketConfirmation } from '../utils/emailNotifications';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const useSupport = () => {
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Create a new support ticket
     * @param {Object} ticketData - Ticket data { category, subject, description, attachments }
     * @returns {Promise<Object>} - Result with ticket data
     */
    const createSupportTicket = useCallback(async (ticketData) => {
        if (!user) {
            setError('You must be logged in to create a support ticket');
            return { success: false, error: 'Not authenticated' };
        }

        setIsCreating(true);
        setError(null);

        try {
            // Add user ID
            const fullTicketData = {
                ...ticketData,
                user_id: user.id
            };

            // Validate ticket data
            const validation = validateTicket(fullTicketData);
            if (!validation.valid) {
                const errorMsg = validation.errors.join(', ');
                setError(errorMsg);
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            }

            // Sanitize data
            const sanitizedData = sanitizeTicketData(fullTicketData);

            // Create ticket
            const result = await createTicket(sanitizedData);

            if (!result.success) {
                setError(result.error);
                toast.error('Failed to create support ticket');
                return result;
            }

            // Send confirmation email
            try {
                await sendTicketConfirmation(result.data, user);
            } catch (emailError) {
                console.warn('Failed to send confirmation email:', emailError);
            }

            toast.success(`Support ticket created: ${result.data.ticket_number}`);
            return result;
        } catch (err) {
            const errorMsg = err.message || 'Failed to create support ticket';
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsCreating(false);
        }
    }, [user]);

    return {
        createTicket: createSupportTicket,
        isCreating,
        error
    };
};

export default useSupport;
