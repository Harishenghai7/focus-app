import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

serve(async (req: Request) => {
  try {
    const { verificationId } = await req.json();
    if (!verificationId) {
      return new Response(JSON.stringify({ error: "Missing verification ID" }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mark verification as verified
    const { data, error } = await supabase
      .from("guardian_verifications")
      .update({ verified: true })
      .eq("id", verificationId)
      .select()
      .single();

    if (error) throw error;

    // Update user table
    const { error: userError } = await supabase
      .from("users")
      .update({ guardian_verified: true })
      .eq("id", data.user_id);

    if (userError) throw userError;

    return new Response(JSON.stringify({ message: "User verified successfully!" }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
