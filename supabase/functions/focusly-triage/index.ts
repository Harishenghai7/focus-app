/**
 * focusly-triage/index.ts
 * =======================
 * 🦁  PILLAR 5 — Focusly as First-Responder (Edge Function)
 *
 * On every new support ticket, Focusly speaks FIRST. This function:
 *   1. Accepts the ticket subject + description + category + userId.
 *   2. Asks Gemini to triage: is this likely a known issue? Are there quick
 *      self-service steps? What's the empathetic first reply?
 *   3. Inserts a `support_ticket_messages` row with author_type='focusly'
 *      containing the AI response. Humans take over from there.
 *
 * CONTRACT:
 *   POST /functions/v1/focusly-triage
 *   Body: { ticketId: string, subject: string, description: string, category?: string }
 *   Returns: { replied: boolean, message: string, severity: 'low'|'medium'|'high' }
 *
 * H2 Innovative — Focusly is the first face every user sees in distress.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL   = Deno.env.get('GEMINI_TRIAGE_MODEL') ?? 'gemini-2.5-flash';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TRIAGE_PROMPT = `You are Focusly — the warm, empathetic virtual companion for Focus (H2 Innovative). A user has just opened a support ticket. You are the FIRST message they see in response.

Tone:
- Warm, human, slightly playful ("Macha" is a friendly Indian English vocative you may use sparingly, like a caring elder).
- Never corporate-speak. Never "I understand your frustration."
- Always acknowledge the user BY their issue, not a generic greeting.

Output JSON only:
{
  "message":   "Your full first-response message, 3-5 short sentences, markdown-friendly. Offer 1 concrete next step if possible.",
  "severity":  "low" | "medium" | "high",  // high = safety/harm, medium = broken flow, low = general question
  "canSelfServe": true | false              // if true, suggest the user can fix it themselves from Settings
}

Rules:
- If the ticket mentions self-harm, suicide, abuse, or emergency → severity='high', message MUST include "If you are in immediate danger, please reach out to a local crisis line. I'm flagging this for our human team right now."
- Never promise a fix. Promise a path.
- Keep message under 500 chars.`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    try {
        const { ticketId, subject = '', description = '', category = '' } = await req.json();
        if (!ticketId) {
            return new Response(JSON.stringify({ error: 'ticketId required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let message = "Hey Macha — I've just received your ticket. A human teammate will be with you very soon. I've flagged this as priority.";
        let severity: 'low' | 'medium' | 'high' = 'medium';

        if (GEMINI_API_KEY) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: TRIAGE_PROMPT }] },
                    contents: [{ parts: [{
                        text: `Ticket category: ${category}\nSubject: ${subject}\nDescription:\n${description.slice(0, 2500)}`,
                    }] }],
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 512,
                        responseMimeType: 'application/json',
                    },
                }),
            });
            if (resp.ok) {
                const data = await resp.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
                try {
                    const parsed = JSON.parse(rawText);
                    if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
                        message = parsed.message.slice(0, 600);
                    }
                    if (['low','medium','high'].includes(parsed.severity)) {
                        severity = parsed.severity;
                    }
                } catch { /* keep default */ }
            }
        }

        // Insert the Focusly first-response message
        await supabase.from('support_ticket_messages').insert({
            ticket_id: ticketId,
            sender_id: null,           // Focusly is not a real user
            author_type: 'focusly',
            message,
            created_at: new Date().toISOString(),
        });

        // If the ticket is high-severity, bump its priority
        if (severity === 'high') {
            await supabase.from('support_tickets').update({ priority: 'urgent' }).eq('id', ticketId);
        }

        return new Response(JSON.stringify({ replied: true, message, severity }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('[focusly-triage] unhandled', err);
        return new Response(JSON.stringify({ replied: false, error: String((err as Error)?.message || err) }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
