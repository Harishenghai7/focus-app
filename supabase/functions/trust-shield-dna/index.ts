import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const normalize = (value: string) => value.replace(/[\s\-]/g, '').trim().toLowerCase();

const computeIdentityDna = async (pepper: string, payload: string) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(sig);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { idNumber, idType, institutionName, userId, commit } = await req.json();

    if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length < 3) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid idNumber' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!idType || typeof idType !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Invalid idType' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const pepper = Deno.env.get('TRUST_SHIELD_IDENTITY_PEPPER');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Server misconfigured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!pepper || pepper.length < 16) {
      return new Response(JSON.stringify({ success: false, error: 'Identity pepper missing/too short' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const normalizedId = normalize(idNumber);
    const normalizedInst = institutionName ? normalize(institutionName) : '';

    const payload = idType === 'student'
      ? `v1|${idType}|${normalizedId}|${normalizedInst}`
      : `v1|${idType}|${normalizedId}`;

    const identityDnaHash = await computeIdentityDna(pepper, payload);

    const query = supabase
      .from('profiles')
      .select('id')
      .eq('identity_dna_hash', identityDnaHash)
      .limit(1);

    const { data: existing, error: existingErr } = userId
      ? await query.neq('id', userId)
      : await query;

    if (existingErr) {
      return new Response(JSON.stringify({ success: false, error: existingErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const exists = Array.isArray(existing) && existing.length > 0;

    if (commit === true) {
      if (!userId || typeof userId !== 'string') {
        return new Response(JSON.stringify({ success: false, error: 'userId required for commit' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      if (exists) {
        return new Response(JSON.stringify({ success: false, exists: true, error: 'Identity already registered' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ identity_dna_hash: identityDnaHash })
        .eq('id', userId);

      if (updateErr) {
        return new Response(JSON.stringify({ success: false, error: updateErr.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, exists, identity_dna_hash: identityDnaHash }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unexpected error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
