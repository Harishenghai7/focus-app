/**
 * safety-audit/index.ts
 * =====================
 * 🚑  PILLAR 5 — Ruthless, Automated Safety Audit (Edge Function)
 *
 * Triggered on every report submission. Gemini analyses the reported user's
 * profile + last 10 posts/comments + report history, returns a verdict.
 *
 * CONTRACT:
 *   POST /functions/v1/safety-audit
 *   Body: { reportId: string }
 *
 *   Response: {
 *     severity:           'critical' | 'high' | 'medium' | 'low' | 'inconclusive',
 *     confidence:          number,
 *     recommendedAction:  'ban_immediate' | 'shadow_ban' | 'warn_user' |
 *                         'temporary_suspension' | 'monitor' | 'dismiss',
 *     summary:             string,
 *     evidence:           { reason: string, sourceId?: string, severity?: string }[],
 *     raw:                 Gemini's raw response (for audit)
 *   }
 *
 * This function uses SERVICE_ROLE via env to bypass RLS — Gemini needs the
 * full picture of the reported user's recent activity. The report row is
 * updated in place with ai_* columns.
 *
 * H2 Innovative — No User Left Behind.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_MODEL = Deno.env.get('GEMINI_AUDIT_MODEL') ?? 'gemini-2.5-flash';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AUDIT_PROMPT = `You are the Lead Safety Auditor for Focus (H2 Innovative). A user has been reported by the community.
Analyse the reported user's PROFILE and recent activity (last 10 posts/comments). Produce a ruthless, fair, and evidence-based audit.

Return ONLY valid JSON:
{
  "severity":           "critical" | "high" | "medium" | "low" | "inconclusive",
  "confidence":          0.0,
  "recommendedAction":  "ban_immediate" | "shadow_ban" | "warn_user" | "temporary_suspension" | "monitor" | "dismiss",
  "summary":             "2-3 sentence verdict in plain language.",
  "evidence":           [ { "reason": "...", "sourceId": "post-id-if-available", "severity": "high" } ]
}

Rules:
- critical + ban_immediate only for: confirmed NSFW targeting minors, credible threats of violence, doxxing, organised hate.
- high + shadow_ban/temporary_suspension for: repeated hate speech, repeated NSFW for adults, repeated harassment.
- medium + warn_user for: first-offence aggression, borderline bullying.
- low + monitor for: minor etiquette issues (all-caps, spamming benign content).
- dismiss ONLY when there is clear evidence the report is malicious or baseless.
- inconclusive when data is too sparse. Prefer monitor over inconclusive when possible.
- Use the reports_against_last_30d count as a pattern signal (>=3 reports → escalate severity by 1 tier).
- Respond with JSON ONLY. No markdown, no prose outside JSON.`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    try {
        const { reportId } = await req.json();
        if (!reportId) {
            return new Response(JSON.stringify({ error: 'reportId required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Mark as running
        await supabase.from('reports').update({ ai_audit_status: 'running' }).eq('id', reportId);

        // Fetch the report
        const { data: report, error: rErr } = await supabase
            .from('reports').select('*').eq('id', reportId).single();
        if (rErr || !report) {
            throw new Error(rErr?.message || 'Report not found');
        }

        // Fetch the reported user's activity snapshot (bypasses RLS via service role)
        const { data: snapshot, error: snapErr } = await supabase.rpc(
            'get_user_activity_snapshot',
            { p_user_id: report.reported_user_id, p_limit: 10 }
        );
        if (snapErr) throw snapErr;

        // ── Call Gemini ───────────────────────────────────────────────────
        let verdict = {
            severity: 'inconclusive',
            confidence: 0,
            recommendedAction: 'monitor',
            summary: 'AI audit unavailable — queued for human review.',
            evidence: [] as unknown[],
            raw: null as unknown,
        };

        if (GEMINI_API_KEY) {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
            const body = {
                system_instruction: { parts: [{ text: AUDIT_PROMPT }] },
                contents: [{
                    parts: [{
                        text: `REPORT METADATA:\n${JSON.stringify({
                            category: report.category,
                            description: report.description,
                            reported_at: report.created_at,
                        }, null, 2)}\n\nTARGET USER ACTIVITY SNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}`,
                    }],
                }],
                generationConfig: {
                    temperature: 0.15,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                },
            };

            const resp = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (resp.ok) {
                const data = await resp.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
                try {
                    const parsed = JSON.parse(rawText);
                    verdict = {
                        severity: parsed.severity ?? verdict.severity,
                        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
                        recommendedAction: parsed.recommendedAction ?? verdict.recommendedAction,
                        summary: parsed.summary ?? verdict.summary,
                        evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
                        raw: parsed,
                    };
                } catch {
                    verdict.raw = { error: 'parse_failed', text: rawText };
                }
            } else {
                const errText = await resp.text();
                verdict.summary = 'Gemini API error. Queued for human review.';
                verdict.raw = { error: errText.slice(0, 500), status: resp.status };
            }
        }

        // ── Persist verdict back to the report ─────────────────────────────
        await supabase.from('reports').update({
            ai_audit_status:        'complete',
            ai_severity:            verdict.severity,
            ai_confidence:          verdict.confidence,
            ai_recommended_action:  verdict.recommendedAction,
            ai_summary:             verdict.summary,
            ai_evidence:            verdict.evidence,
            ai_audited_at:          new Date().toISOString(),
            ai_gemini_raw:          verdict.raw,
            // Upgrade priority if critical/high
            priority: ['critical', 'high'].includes(verdict.severity) ? 'high' : (report.priority || 'normal'),
        }).eq('id', reportId);

        return new Response(JSON.stringify(verdict), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('[safety-audit] unhandled', err);
        try {
            const { reportId } = await req.clone().json().catch(() => ({ reportId: null }));
            if (reportId) {
                await supabase.from('reports').update({
                    ai_audit_status: 'failed',
                    ai_summary: `Audit failed: ${String((err as Error)?.message || err).slice(0, 300)}`,
                }).eq('id', reportId);
            }
        } catch { /* ignore */ }
        return new Response(JSON.stringify({ error: String((err as Error)?.message || err) }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
