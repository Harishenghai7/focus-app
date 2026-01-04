import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useContentAppeal = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const submitAppeal = async ({ blockedContentId, userId, reason }) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const { data, error: dbError } = await supabase
                .from('content_appeals')
                .insert([
                    {
                        blocked_content_id: blockedContentId,
                        user_id: userId,
                        reason: reason,
                        status: 'pending'
                    }
                ]);

            if (dbError) throw dbError;

            // Update the blocked content status to 'appealed'
            await supabase
                .from('blocked_content')
                .update({ status: 'appealed' })
                .eq('id', blockedContentId);

            setSuccess(true);
            return data;
        } catch (err) {
            console.error('Appeal submission failed:', err);
            setError(err);
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitAppeal,
        isSubmitting,
        error,
        success
    };
};
