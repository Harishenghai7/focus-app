import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type NotifyPayload = {
  kind: 'report' | 'support_ticket';
  urgencyScore?: number | null;
  priority?: string | null;
  contentType?: string | null;
  targetId?: string | null;
  reportId?: string | null;
  ticketId?: string | null;
  reason?: string | null;
  subject?: string | null;
  message?: string | null;
  reporterId?: string | null;
  userId?: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';

    if (!SUPABASE_SERVICE_ROLE_KEY || token !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!DISCORD_WEBHOOK_URL) {
      return new Response(JSON.stringify({ ok: false, error: 'DISCORD_WEBHOOK_URL not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<NotifyPayload>;

    const kind = body.kind === 'support_ticket' ? 'support_ticket' : 'report';

    const title =
      kind === 'report'
        ? `⚠️ SOVEREIGN ALERT: High-priority report on ${String(body.contentType || 'content').toUpperCase()} #${String(body.targetId || '').slice(0, 8)}`
        : `🎟️ SOVEREIGN SUPPORT: New ${String(body.priority || 'high').toUpperCase()} ticket #${String(body.ticketId || '').slice(0, 8)}`;

    const urgency = typeof body.urgencyScore === 'number' ? clamp(body.urgencyScore, 0, 10) : null;
    const color = 0x7e57c2; // Royal Lavender

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (kind === 'report') {
      if (urgency !== null) fields.push({ name: 'Urgency (U)', value: urgency.toFixed(2), inline: true });
      if (body.reason) fields.push({ name: 'Reason', value: String(body.reason).slice(0, 512) });
      if (body.reportId) fields.push({ name: 'Report ID', value: String(body.reportId), inline: false });
      if (body.reporterId) fields.push({ name: 'Reporter', value: String(body.reporterId), inline: false });
    } else {
      if (body.priority) fields.push({ name: 'Priority', value: String(body.priority), inline: true });
      if (body.subject) fields.push({ name: 'Subject', value: String(body.subject).slice(0, 256) });
      if (body.message) fields.push({ name: 'Message', value: String(body.message).slice(0, 512) });
      if (body.userId) fields.push({ name: 'User', value: String(body.userId), inline: false });
    }

    const discordPayload = {
      username: 'Sovereign Justice',
      embeds: [
        {
          title,
          color,
          fields,
          timestamp: new Date().toISOString(),
          footer: { text: 'H2 Innovative • Royal Lavender Command Center' },
        },
      ],
    };

    const resp = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('[notify-sovereign-admin] Discord webhook error', resp.status, errText);
      return new Response(JSON.stringify({ ok: false, status: resp.status }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[notify-sovereign-admin] unhandled', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
