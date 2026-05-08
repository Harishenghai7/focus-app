// src/services/boltzService.js — Unified RPC for consistent data format
// 🛡️ PILLAR 2: shadow-moderation filter applied via visibility column
// 🧠 Enhanced with reactions, not-interested, creator insights, trending
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

// ═══════════════════════════════════════════════════════════════
// SECURE FEED (Authenticated, with interaction states)
// ═══════════════════════════════════════════════════════════════

export const fetchBoltzSecureFeed = async (userId, limit = 10, offset = 0, tab = 'foryou') => {
    try {
        const rpcName = tab === 'following' ? 'get_boltz_following_feed' : 'get_boltz_feed_secure';
        const { data, error } = await supabase.rpc(rpcName, {
            p_user_id: userId,
            p_limit: limit,
            p_offset: offset,
        });
        if (!error && data) return data;
    } catch (_) {}
    return fetchBoltzPreview(limit, null, offset);
};

// ═══════════════════════════════════════════════════════════════
// TRENDING BOLTZ
// ═══════════════════════════════════════════════════════════════

export const fetchTrendingBoltz = async (limit = 20, hours = 48) => {
    try {
        const { data, error } = await supabase.rpc('get_trending_boltz', {
            p_limit: limit,
            p_hours: hours,
        });
        if (!error && data) return data;
    } catch (_) {}
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const { data: rows } = await supabase
        .from('boltz')
        .select('*')
        .eq('visibility', 'public')
        .gte('created_at', since)
        .order('likes_count', { ascending: false })
        .limit(limit);
    return rows || [];
};

// ═══════════════════════════════════════════════════════════════
// REACTIONS CRUD
// ═══════════════════════════════════════════════════════════════

export const fetchBoltzReactions = async (boltzId) => {
    try {
        const { data } = await supabase
            .from('boltz_reactions')
            .select('reaction_type, user_id')
            .eq('boltz_id', boltzId);
        return data || [];
    } catch (_) { return []; }
};

export const sendBoltzReaction = async (boltzId, userId, reactionType) => {
    try {
        await supabase.from('boltz_reactions').upsert({
            boltz_id: boltzId,
            user_id: userId,
            reaction_type: reactionType,
            created_at: new Date().toISOString(),
        }, { onConflict: 'boltz_id,user_id' });
        return true;
    } catch (_) { return false; }
};

export const removeBoltzReaction = async (boltzId, userId) => {
    try {
        await supabase.from('boltz_reactions')
            .delete().eq('boltz_id', boltzId).eq('user_id', userId);
        return true;
    } catch (_) { return false; }
};

// ═══════════════════════════════════════════════════════════════
// NOT INTERESTED TRACKING
// ═══════════════════════════════════════════════════════════════

export const trackNotInterested = async (boltzId, userId, reason = 'not_interested') => {
    try {
        await supabase.from('boltz_not_interested').insert({
            boltz_id: boltzId, user_id: userId, reason,
            created_at: new Date().toISOString(),
        });
        return true;
    } catch (_) { return false; }
};

// ═══════════════════════════════════════════════════════════════
// CREATOR INSIGHTS
// ═══════════════════════════════════════════════════════════════

export const fetchCreatorInsights = async (userId) => {
    try {
        const { data, error } = await supabase.rpc('get_boltz_creator_insights', {
            p_user_id: userId,
        });
        if (!error && data) return data;
    } catch (_) {}
    try {
        const { data: items } = await supabase
            .from('boltz')
            .select('id, likes_count, comments_count, views_count, shares_count, saves_count, created_at')
            .eq('user_id', userId).eq('visibility', 'public')
            .order('created_at', { ascending: false });
        if (!items?.length) return null;
        const sum = (k) => items.reduce((s, b) => s + (b[k] || 0), 0);
        return {
            total_boltz: items.length,
            total_views: sum('views_count'),
            total_likes: sum('likes_count'),
            total_comments: sum('comments_count'),
            total_shares: sum('shares_count'),
            total_saves: sum('saves_count'),
            avg_views: Math.round(sum('views_count') / items.length),
            avg_likes: Math.round(sum('likes_count') / items.length),
            top_boltz: items.slice(0, 5),
        };
    } catch (_) { return null; }
};

// ═══════════════════════════════════════════════════════════════
// FETCH SINGLE BOLTZ BY ID (Deep-link support)
// ═══════════════════════════════════════════════════════════════

export const fetchBoltzById = async (boltzId) => {
    try {
        const { data, error } = await supabase
            .from('boltz')
            .select('*, profiles:user_id(id, username, full_name, avatar_url, is_verified)')
            .eq('id', boltzId).single();
        if (error) return null;
        return data;
    } catch (_) { return null; }
};
