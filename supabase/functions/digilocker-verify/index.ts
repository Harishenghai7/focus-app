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
        const { code, userId, state } = await req.json();

        // Verify required parameters
        if (!code || !userId || !state) {
            throw new Error('Missing required parameters: code, userId, or state');
        }

        // Initialize Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify state parameter (CSRF protection)
        // In production, you should store and validate the state parameter
        if (!state || state.length < 8) {
            throw new Error('Invalid state parameter');
        }

        // Check rate limiting - max 5 attempts per 24 hours
        const { data: attemptCount } = await supabase
            .rpc('get_verification_attempts_count', { target_user_id: userId, hours: 24 });

        if (attemptCount && attemptCount >= 5) {
            throw new Error('Too many verification attempts. Please try again tomorrow.');
        }

        // Exchange authorization code for access token
        const digilockerClientId = Deno.env.get('DIGILOCKER_CLIENT_ID')!;
        const digilockerSecret = Deno.env.get('DIGILOCKER_SECRET')!;
        const digilockerRedirectUri = Deno.env.get('DIGILOCKER_REDIRECT_URI')!;

        const tokenResponse = await fetch('https://api.digilocker.gov.in/public/oauth2/1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: digilockerClientId,
                client_secret: digilockerSecret,
                redirect_uri: digilockerRedirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('DigiLocker token error:', errorText);
            throw new Error('Failed to get access token from DigiLocker');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            throw new Error('No access token received from DigiLocker');
        }

        // Fetch Aadhaar document from DigiLocker
        // Note: The actual endpoint and document ID may vary based on DigiLocker API version
        const aadhaarResponse = await fetch('https://api.digilocker.gov.in/public/oauth2/2/file/INAADHAAR', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!aadhaarResponse.ok) {
            const errorText = await aadhaarResponse.text();
            console.error('DigiLocker Aadhaar fetch error:', errorText);
            throw new Error('Failed to fetch Aadhaar document from DigiLocker');
        }

        const aadhaarData = await aadhaarResponse.json();

        // Extract data from Aadhaar response
        // Note: Field names may vary based on DigiLocker API response structure
        const name = aadhaarData.name || aadhaarData.full_name;
        const dob = aadhaarData.dob || aadhaarData.date_of_birth;
        const photo = aadhaarData.photo || aadhaarData.photograph;

        if (!name || !dob) {
            throw new Error('Incomplete Aadhaar data received');
        }

        // Calculate age from DOB
        const dobDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDiff = today.getMonth() - dobDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
            age--;
        }

        // Validate minimum age (13 years)
        if (age < 13) {
            // Log failed attempt
            await supabase.from('verification_logs').insert({
                user_id: userId,
                verification_type: 'digilocker',
                status: 'failed',
                metadata: { reason: 'under_minimum_age', age }
            });

            throw new Error('User must be at least 13 years old to use Focus');
        }

        // Determine verification method based on age
        const verificationMethod = age >= 18 ? 'digilocker_adult' : 'pending_parent_consent';

        // Store verified data in profiles table
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                digilocker_verified: true,
                verified_name: name,
                verified_dob: dob,
                digilocker_photo_url: photo, // Base64 image or URL
                verification_method: verificationMethod
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Profile update error:', updateError);
            throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        // Log successful verification
        await supabase.from('verification_logs').insert({
            user_id: userId,
            verification_type: 'digilocker',
            status: 'success',
            metadata: {
                age,
                name,
                verification_method: verificationMethod
            }
        });

        return new Response(
            JSON.stringify({
                success: true,
                requiresParentConsent: age < 18,
                age,
                photoUrl: photo,
                verifiedName: name,
                message: age >= 18
                    ? 'DigiLocker verification successful! Proceed to face verification.'
                    : 'DigiLocker verification successful! Parent consent required to complete verification.'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('DigiLocker verification error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred during verification'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
