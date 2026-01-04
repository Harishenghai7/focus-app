// useAdminSupport hook - For admin support ticket management
import { useState, useEffect, useCallback } from 'react';
import { getTicketQueue, addTicketMessage, updateTicketStatus } from '../utils/supabaseSupport';
import { sendTicketUpdate } from '../utils/emailNotifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const useAdminSupport = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'open', limit: 50, offset: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getTicketQueue(filters);
            if (result.success) {
                setTickets(result.data);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    /**
     * Reply to a ticket
     * @param {string} ticketId - Ticket ID
     * @param {string} message - Reply message
     * @param {boolean} changeStatus - Whether to update ticket status
     * @param {string} newStatus - New status if changing
     * @returns {Promise<void>}
     */
    const replyToTicket = useCallback(async (ticketId, message, changeStatus = false, newStatus = null) => {
        if (!user) return;

        setIsProcessing(true);
        try {
            // Add message
            const messageResult = await addTicketMessage({
                ticket_id: ticketId,
                sender_id: user.id,
                message,
                is_admin: true,
                is_internal_note: false
            });

            if (!messageResult.success) {
                throw new Error(messageResult.error);
            }

            // Update status if needed
            if (changeStatus && newStatus) {
                await updateTicketStatus(ticketId, { status: newStatus });
            }

            // Get ticket for email
            const ticket = tickets.find(t => t.id === ticketId);
            if (ticket && ticket.user) {
                try {
                    await sendTicketUpdate(ticket, ticket.user, message);
                } catch (emailError) {
                    console.warn('Failed to send update email:', emailError);
                }
            }

            toast.success('Reply sent successfully');
            fetchTickets();
        } catch (error) {
            console.error('Error replying to ticket:', error);
            toast.error('Failed to send reply');
        } finally {
            setIsProcessing(false);
        }
    }, [user, tickets, fetchTickets]);

    /**
     * Assign ticket to admin
     * @param {string} ticketId - Ticket ID
     * @param {string} adminId - Admin user ID
     * @returns {Promise<void>}
     */
    const assignTicket = useCallback(async (ticketId, adminId) => {
        setIsProcessing(true);
        try {
            const result = await updateTicketStatus(ticketId, { assigned_to: adminId });

            if (result.success) {
                toast.success('Ticket assigned');
                fetchTickets();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error assigning ticket:', error);
            toast.error('Failed to assign ticket');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchTickets]);

    return {
        tickets,
        loading,
        filters,
        setFilters,
        replyToTicket,
        assignTicket,
        isProcessing,
        refreshTickets: fetchTickets
    };
};

export default useAdminSupport;
