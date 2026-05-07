import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type JudgeRequest = {
  table: 'posts' | 'boltz' | 'flash';
  contentId?: string | null;
  userId: string;
  text?: string | null;
  imageUrls?: string[] | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
};

type ContentModeratorVerdict = {
  moderationStatus: 'approved' | 'restricted' | 'flagged';
  toxicityType: string;
  severity: string;
  confidence: number;
  categories: string[];
  reason: string;
  suggestion?: string | null;
  model?: string;
  raw?: unknown;
};

function normalizeContentType(table: JudgeRequest['table']): 'post' | 'boltz' | 'flash' {
  if (table === 'posts') return 'post';
  if (table === 'boltz') return 'boltz';
  return 'flash';
}

function derivePurityScore(verdict: ContentModeratorVerdict): number {
  const conf = typeof verdict.confidence === 'number' ? verdict.confidence : 0;
  const harm = verdict.moderationStatus === 'approved' ? 0 : Math.min(1, Math.max(0, conf || 0.85));
  return Math.max(0, Math.min(1, 1 - harm));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // DB trigger calls this with service role bearer.
    const auth = req.headers.get('authorization') || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
    if (token !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<JudgeRequest>;

    if (!body?.table || !body?.userId) {
      return new Response(JSON.stringify({ error: 'Invalid payload: table + userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [];
    if (body.mediaUrl && typeof body.mediaUrl === 'string') imageUrls.unshift(body.mediaUrl);

    // Reuse the existing Gemini-based content-moderator for the actual verdict.
    const verdictResp = await fetch(`${SUPABASE_URL}/functions/v1/content-moderator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        text: typeof body.text === 'string' ? body.text : '',
        imageUrls: imageUrls.slice(0, 4),
        contentType: normalizeContentType(body.table as JudgeRequest['table']),
        mediaType: typeof body.mediaType === 'string' ? body.mediaType : null,
      }),
    });

    const verdictJson = (await verdictResp.json().catch(() => ({}))) as Partial<ContentModeratorVerdict>;

    const verdict: ContentModeratorVerdict = {
      moderationStatus: (verdictJson.moderationStatus as any) ?? 'flagged',
      toxicityType: typeof verdictJson.toxicityType === 'string' ? verdictJson.toxicityType : 'safe',
      severity: typeof verdictJson.severity === 'string' ? verdictJson.severity : 'none',
      confidence: typeof verdictJson.confidence === 'number' ? verdictJson.confidence : 0,
      categories: Array.isArray(verdictJson.categories) ? (verdictJson.categories as any).map(String) : [],
      reason: typeof verdictJson.reason === 'string' ? verdictJson.reason : 'No reason provided',
      suggestion: verdictJson.suggestion ?? null,
      model: typeof verdictJson.model === 'string' ? verdictJson.model : undefined,
      raw: verdictJson.raw,
    };

    const purityScore = derivePurityScore(verdict);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Always log moderation decision (including approved) for auditability.
    await supabase.from('moderation_logs').insert({
      user_id: body.userId,
      content_id: body.contentId ?? null,
      content_type: normalizeContentType(body.table as JudgeRequest['table']),
      moderation_status: verdict.moderationStatus,
      moderation_reason: verdict.reason ?? null,
      moderation_score: verdict.confidence ?? null,
      moderation_categories: verdict.categories ?? [],
      purity_score: purityScore,
      toxicity_score: verdict.moderationStatus === 'approved' ? 0 : verdict.confidence ?? null,
      profanity_score: null,
      nsfw_score: verdict.toxicityType === 'nsfw' ? verdict.confidence ?? null : null,
      moderator_type: 'sovereign_judge',
      raw_analysis: verdict.raw ?? verdict,
    });

    // Strike integration (restricted verdict only).
    let strikeInfo: any = null;
    if (verdict.moderationStatus === 'restricted') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('strike_count')
        .eq('id', body.userId)
        .maybeSingle();

      const currentStrikes = Number(profile?.strike_count ?? 0);
      const nextStrike = Math.min(3, currentStrikes + 1);

      const actionTaken = nextStrike === 1 ? 'warning' : nextStrike === 2 ? 'shadow_ban' : 'quarantine';

      await supabase.from('content_strikes').insert({
        user_id: body.userId,
        strike_number: nextStrike,
        violation_type: verdict.toxicityType,
        reason: verdict.reason,
        content_id: body.contentId ?? null,
        content_type: normalizeContentType(body.table as JudgeRequest['table']),
        content_snapshot: typeof body.text === 'string' ? body.text.slice(0, 800) : null,
        action_taken: actionTaken,
        gemini_explanation: verdict.reason,
      });

      const profileUpdates: Record<string, unknown> = {
        strike_count: nextStrike,
      };

      if (nextStrike >= 3) {
        profileUpdates.account_status = 'QUARANTINED';
        profileUpdates.is_restricted = true;
      }

      await supabase.from('profiles').update(profileUpdates).eq('id', body.userId);

      strikeInfo = { strikeNumber: nextStrike, actionTaken, isRestricted: nextStrike >= 3 };
    }

    return new Response(
      JSON.stringify({
        ...verdict,
        purityScore,
        strikeInfo,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[sovereign-judge] unhandled', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
