import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for guardian email OTP verification
 * Used in Teen Care for parental consent
 */
export const useGuardianVerification = () => {
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Generate 6-digit OTP
     */
    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    /**
     * Send OTP to guardian email
     */
    const sendOTP = useCallback(async (guardianEmail, teenUserId) => {
        setSending(true);
        setError(null);

        try {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store OTP in database
            const { error: insertError } = await supabase
                .from('guardian_verifications')
                .insert({
                    teen_user_id: teenUserId,
                    guardian_email: guardianEmail,
                    otp_code: otp,
                    expires_at: expiresAt.toISOString(),
                    verified: false
                });

            if (insertError) throw insertError;

            // Send email via Supabase Edge Function
            const { error: emailError } = await supabase.functions.invoke('send-guardian-otp', {
                body: {
                    guardianEmail,
                    otp,
                    teenUserId
                }
            });

            if (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue anyway - OTP is stored in DB
            }

            setOtpSent(true);
            return { success: true, expiresAt };
        } catch (err) {
            console.error('Send OTP error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setSending(false);
        }
    }, []);

    /**
     * Verify OTP code
     */
    const verifyOTP = useCallback(async (guardianEmail, teenUserId, otpCode) => {
        setVerifying(true);
        setError(null);

        try {
            // Get the latest OTP for this guardian/teen pair
            const { data, error: fetchError } = await supabase
                .from('guardian_verifications')
                .select('*')
                .eq('teen_user_id', teenUserId)
                .eq('guardian_email', guardianEmail)
                .eq('verified', false)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError) throw new Error('No verification request found');

            // Check if OTP is expired
            if (new Date(data.expires_at) < new Date()) {
                throw new Error('OTP has expired. Please request a new one.');
            }

            // Verify OTP code
            if (data.otp_code !== otpCode) {
                throw new Error('Invalid OTP code');
            }

            // Mark as verified
            const { error: updateError } = await supabase
                .from('guardian_verifications')
                .update({
                    verified: true,
                    verified_at: new Date().toISOString()
                })
                .eq('id', data.id);

            if (updateError) throw updateError;

            // Update teen user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    guardian_verified: true,
                    guardian_email: guardianEmail
                })
                .eq('id', teenUserId);

            if (profileError) throw profileError;

            setVerified(true);
            return { success: true };
        } catch (err) {
            console.error('Verify OTP error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setVerifying(false);
        }
    }, []);

    /**
     * Resend OTP
     */
    const resendOTP = useCallback(async (guardianEmail, teenUserId) => {
        // Invalidate previous OTPs
        await supabase
            .from('guardian_verifications')
            .update({ verified: false, expires_at: new Date().toISOString() })
            .eq('teen_user_id', teenUserId)
            .eq('guardian_email', guardianEmail)
            .eq('verified', false);

        // Send new OTP
        return sendOTP(guardianEmail, teenUserId);
    }, [sendOTP]);

    /**
     * Check if guardian is already verified
     */
    const checkVerification = useCallback(async (teenUserId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('guardian_verified, guardian_email')
                .eq('id', teenUserId)
                .single();

            if (error) throw error;

            return {
                verified: data.guardian_verified || false,
                guardianEmail: data.guardian_email
            };
        } catch (err) {
            console.error('Check verification error:', err);
            return { verified: false };
        }
    }, []);

    return {
        sending,
        verifying,
        otpSent,
        verified,
        error,
        sendOTP,
        verifyOTP,
        resendOTP,
        checkVerification
    };
};
