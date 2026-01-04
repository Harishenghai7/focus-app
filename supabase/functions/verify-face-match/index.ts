import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { userId, matchConfidence, deviceFingerprint, livenessPassed } = await req.json();

        // Validate required parameters
        if (!userId || matchConfidence === undefined || !deviceFingerprint || livenessPassed === undefined) {
            throw new Error('Missing required parameters');
        }

        // Validate face match confidence threshold
        if (matchConfidence < 95) {
            throw new Error(`Face match confidence too low (${matchConfidence.toFixed(1)}%). Minimum 95% required. Please ensure good lighting and try again.`);
        }

        // Validate liveness check
        if (!livenessPassed) {
            throw new Error('Liveness check failed. Please ensure you are in front of the camera and blink naturally.');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if user has completed DigiLocker verification
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('digilocker_verified, verified_name')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('Profile not found');
        }

        if (!profile.digilocker_verified) {
            throw new Error('DigiLocker verification must be completed first');
        }

        // Check for device fingerprint duplicates (prevent multi-account abuse)
        const { data: existingDevice } = await supabase
            .from('user_devices')
            .select('user_id')
            .eq('device_fingerprint', deviceFingerprint)
            .eq('is_active', true)
            .neq('user_id', userId)
            .maybeSingle();

        if (existingDevice) {
            // Log failed attempt
            await supabase.from('verification_logs').insert({
                user_id: userId,
                verification_type: 'face_match',
                status: 'failed',
                metadata: {
                    reason: 'device_already_used',
                    confidence: matchConfidence
                }
            });

            throw new Error('This device is already associated with another verified account. Each device can only verify one account.');
        }

        // Update user verification status
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                face_verified: true,
                face_match_confidence: matchConfidence,
                government_id_verified_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Profile update error:', updateError);
            throw new Error(`Failed to update verification status: ${updateError.message}`);
        }

        // Store device fingerprint
        const { error: deviceError } = await supabase
            .from('user_devices')
            .insert({
                user_id: userId,
                device_fingerprint: deviceFingerprint,
                device_info: {
                    verified_at: new Date().toISOString(),
                    confidence: matchConfidence
                }
            });

        if (deviceError) {
            console.error('Device insert error:', deviceError);
            // Non-fatal error, continue with verification
        }

        // Get "Verified Human" badge ID
        const { data: badge } = await supabase
            .from('badge_definitions')
            .select('id')
            .eq('name', 'verified_human')
            .single();

        if (badge) {
            // Check if user already has this badge
            const { data: existingBadge } = await supabase
                .from('user_badges')
                .select('id')
                .eq('user_id', userId)
                .eq('badge_id', badge.id)
                .maybeSingle();

            // Award badge if not already earned
            if (!existingBadge) {
                const { error: badgeError } = await supabase
                    .from('user_badges')
                    .insert({
                        user_id: userId,
                        badge_id: badge.id,
                        status: 'active',
                        date_awarded: new Date().toISOString(),
                        visibility: 'public'
                    });

                if (badgeError) {
                    console.error('Badge award error:', badgeError);
                    // Non-fatal error, continue
                }
            }
        }

        // Increase Trust Score by +50
        const { error: trustScoreError } = await supabase
            .rpc('increment_trust_score', {
                target_user_id: userId,
                points: 50
            });

        if (trustScoreError) {
            console.error('Trust score update error:', trustScoreError);
            // Non-fatal error, continue
        }

        // Log successful verification
        await supabase.from('verification_logs').insert({
            user_id: userId,
            verification_type: 'face_match',
            status: 'success',
            metadata: {
                confidence: matchConfidence,
                liveness_passed: livenessPassed
            }
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: `🎉 Verification complete, ${profile.verified_name}! You are now a Verified Human.`,
                badgeAwarded: true,
                trustScoreIncrease: 50
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Face verification error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred during face verification'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
