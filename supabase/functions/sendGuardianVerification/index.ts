import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

serve(async (req: Request) => {
  try {
    const { guardianEmail, userId } = await req.json();

    if (!guardianEmail || !userId) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert guardian verification record
    const { error } = await supabase.from("guardian_verifications").insert([
      { user_id: userId, guardian_email: guardianEmail, verified: false },
    ]);
    if (error) throw error;

    // Here you could also send an email via Supabase SMTP or third-party email service
    // Example: Send magic link to guardian to verify
    // await supabase.functions.invoke('sendEmail', { to: guardianEmail, ... })

    return new Response(JSON.stringify({ message: "Guardian verification initiated!" }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
const verificationId = crypto.randomUUID();

// Insert with ID
const { error } = await supabase.from("guardian_verifications").insert([
  { id: verificationId, user_id: userId, guardian_email: guardianEmail, verified: false }
]);

// Construct magic link
const magicLink = `${FRONTEND_URL}/verify-guardian?vid=${verificationId}`;

// Send email (using Supabase SMTP / email function)
await sendEmail({
  to: guardianEmail,
  subject: "Please verify your child's account",
  html: `Click <a href="${magicLink}">here</a> to verify`
});

