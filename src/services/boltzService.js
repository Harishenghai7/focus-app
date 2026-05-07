// src/services/boltzService.js — Unified RPC for consistent data format
// 🛡️ PILLAR 2: shadow-moderation filter applied via visibility column
import { supabase } from '../lib/supabase';

const isHttpUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

const toPublicStorageUrl = (bucket, pathOrUrl) => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
    if (isHttpUrl(pathOrUrl)) return pathOrUrl;
    const cleaned = pathOrUrl.replace(/^\/+/, '');
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleaned);
    return data?.publicUrl || null;
};

export const fetchBoltzPreview = async (limit = 12, viewerIdOrOffset = null, offsetMaybe = null) => {
    const offset = typeof viewerIdOrOffset === 'number' ? viewerIdOrOffset : (offsetMaybe || 0);
    const viewerId = typeof viewerIdOrOffset === 'number' ? offsetMaybe : viewerIdOrOffset;
    // Try unified RPC first
    try {
        const { data, error } = await supabase.rpc('get_public_boltz_feed', {
            p_limit: limit,
            p_offset: offset
        });
        if (!error && data) {
            return data.map(item => ({
                ...item,
                // RPC returns user data flat, normalize for component compatibility
                profiles: item.username ? {
                    id: item.user_id,
                    username: item.username,
                    full_name: item.full_name,
                    avatar_url: item.avatar_url,
                    is_verified: item.is_verified
                } : null,
                // Unified thumbnail fallback
                _previewThumb:
                    toPublicStorageUrl('thumbnails', item.thumbnail_url) ||
                    toPublicStorageUrl('thumbnails', item.poster_url) ||
                    toPublicStorageUrl('thumbnails', item.preview_image) ||
                    toPublicStorageUrl('thumbnails', item.cover_url) ||
                    toPublicStorageUrl('posts', item.thumbnail_url) ||
                    toPublicStorageUrl('posts', item.poster_url) ||
                    toPublicStorageUrl('posts', item.preview_image) ||
                    toPublicStorageUrl('posts', item.cover_url) ||
                    toPublicStorageUrl('boltz_thumbs', item.thumbnail_url) ||
                    toPublicStorageUrl('boltz_thumbs', item.poster_url) ||
                    toPublicStorageUrl('boltz_thumbs', item.preview_image) ||
                    toPublicStorageUrl('boltz_thumbs', item.cover_url) ||
                    null,
                _videoFallback:
                    toPublicStorageUrl('boltz', item.video_url) ||
                    toPublicStorageUrl('posts', item.video_url) ||
                    null,
            }));
        }
    } catch (rpcErr) {
        console.warn('[boltzService] RPC failed, falling back to direct query:', rpcErr);
    }

    // Fallback to direct query with all thumbnail column variations
    const { data: rows, error } = await supabase
        .from('boltz')
        .select('id, video_url, thumbnail_url, thumbnail_path, poster_url, preview_image, cover_url, description, caption, user_id, created_at, likes_count, comments_count, views_count, visibility')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!rows?.length) return [];

    // Batch fetch profiles
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    if (ids.length === 0) return rows.map((r) => ({ ...r, profiles: null }));

    const { data: profs, error: pErr } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_verified')
        .in('id', ids);

    if (pErr) {
        console.warn('Boltz preview: profile batch fetch failed', pErr);
        return rows.map((r) => ({ ...r, profiles: null }));
    }

    const map = Object.fromEntries((profs || []).map((p) => [p.id, p]));
    return rows.map((r) => {
        // Unified thumbnail fallback across all schema variations
        const thumb =
            r.thumbnail_url ||
            r.thumbnail_path ||
            r.poster_url ||
            r.preview_image ||
            r.cover_url ||
            null;
        const publicThumb =
            toPublicStorageUrl('thumbnails', thumb) ||
            toPublicStorageUrl('posts', thumb) ||
            toPublicStorageUrl('boltz_thumbs', thumb) ||
            (isHttpUrl(thumb) ? thumb : null);
        const publicVideo =
            toPublicStorageUrl('boltz', r.video_url || r.storage_path) ||
            toPublicStorageUrl('posts', r.video_url || r.storage_path) ||
            (isHttpUrl(r.video_url) ? r.video_url : null);
        return {
            ...r,
            profiles: map[r.user_id] || null,
            _previewThumb: publicThumb,
            _videoFallback: publicVideo,
        };
    });
};
