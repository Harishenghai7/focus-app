// src/services/boltzService.js — load rows first, then profiles (avoids brittle embed + RLS quirks)
import { supabase } from '../lib/supabase';

export const fetchBoltzPreview = async (limit = 12) => {
    let rows;
    let error;
    const primary = await supabase
        .from('boltz')
        .select(
            'id, video_url, thumbnail_url, thumb_url, cover_url, poster_url, preview_url, user_id, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(limit);
    rows = primary.data;
    error = primary.error;

    if (error) {
        const fb = await supabase
            .from('boltz')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        rows = fb.data;
        error = fb.error;
    }

    if (error) throw error;
    if (!rows?.length) return [];

    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    if (ids.length === 0) return rows.map((r) => ({ ...r, profiles: null }));

    const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);

    if (pErr) {
        console.warn('Boltz preview: profile batch fetch failed', pErr);
        return rows.map((r) => ({ ...r, profiles: null }));
    }

    const map = Object.fromEntries((profs || []).map((p) => [p.id, p]));
    return rows.map((r) => {
        const thumb =
            r.thumbnail_url ||
            r.thumb_url ||
            r.cover_url ||
            r.poster_url ||
            r.preview_url ||
            null;
        return {
            ...r,
            profiles: map[r.user_id] || null,
            _previewThumb: thumb,
            _videoFallback: r.video_url || null,
        };
    });
};
