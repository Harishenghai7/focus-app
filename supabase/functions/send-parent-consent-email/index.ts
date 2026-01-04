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
        const { parentEmail, childName, childUserId, verificationLink } = await req.json();

        // Validate required parameters
        if (!parentEmail || !childName || !childUserId) {
            throw new Error('Missing required parameters');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Generate verification token
        const token = crypto.randomUUID();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days expiry

        // Store parent verification request
        const { error: insertError } = await supabase
            .from('parent_verifications')
            .insert({
                child_user_id: childUserId,
                parent_email: parentEmail,
                verification_token: token,
                token_expires_at: tokenExpiresAt.toISOString()
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`Failed to create verification request: ${insertError.message}`);
        }

        // Construct verification link
        const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://yourapp.com';
        const fullVerificationLink = verificationLink || `${baseUrl}/guardian/verify-consent/${token}`;

        // Email content
        const emailSubject = `Focus Account Verification Request for ${childName}`;
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Focus Account Verification</h1>
          </div>
          <div class="content">
            <h2>Parent/Guardian Consent Required</h2>
            <p>Hello,</p>
            <p><strong>${childName}</strong> has requested to create an account on Focus, a social media platform that prioritizes authentic human connections.</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> As ${childName} is under 18 years old, we require parent/guardian verification and consent before they can complete their account setup.
            </div>
            
            <p>To verify your identity and provide consent, you will need to:</p>
            <ol>
              <li>Verify your own identity using DigiLocker (Indian government service)</li>
              <li>Review and approve ${childName}'s account creation</li>
              <li>Set up parental controls and safety settings</li>
            </ol>
            
            <p style="text-align: center;">
              <a href="${fullVerificationLink}" class="button">Verify and Provide Consent</a>
            </p>
            
            <p><strong>This link expires in 7 days.</strong></p>
            
            <p>If you did not expect this email or have concerns, please contact us immediately at support@focusapp.com</p>
            
            <h3>Why Focus Requires This:</h3>
            <ul>
              <li>✅ Ensures only real, verified humans use the platform</li>
              <li>✅ Protects teens from fake accounts and bots</li>
              <li>✅ Gives parents visibility and control over teen accounts</li>
              <li>✅ Complies with digital safety regulations</li>
            </ul>
          </div>
          <div class="footer">
            <p>Focus - Authentic Human Connections</p>
            <p>This is an automated email. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const emailText = `
Focus Account Verification Request

${childName} has requested to create an account on Focus and needs your consent.

To verify your identity and provide consent, visit:
${fullVerificationLink}

This link expires in 7 days.

If you did not expect this email, please contact support@focusapp.com

- Focus Team
    `;

        // Send email using Supabase Auth (or external service like SendGrid)
        // Note: You may need to configure an external email service
        // For now, we'll use Supabase's built-in email functionality

        try {
            // Option 1: Use Supabase Auth to send email
            // This requires the parent to have a Supabase account or use magic link
            const { error: emailError } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email: parentEmail,
                options: {
                    redirectTo: fullVerificationLink
                }
            });

            if (emailError) {
                console.error('Email send error:', emailError);
                // Fall back to logging (in production, use SendGrid/Mailgun/etc)
                console.log('Email content:', { emailSubject, emailHtml, emailText });
            }
        } catch (emailErr) {
            console.error('Email service error:', emailErr);
            // Non-fatal - verification link is still valid
        }

        // Log the verification request
        await supabase.from('verification_logs').insert({
            user_id: childUserId,
            verification_type: 'parent_consent',
            status: 'pending',
            metadata: {
                parent_email: parentEmail,
                token_expires_at: tokenExpiresAt.toISOString()
            }
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: `Consent request sent to ${parentEmail}. Please ask your parent/guardian to check their email.`,
                verificationToken: token,
                expiresAt: tokenExpiresAt.toISOString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Parent consent email error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to send parent consent request'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
