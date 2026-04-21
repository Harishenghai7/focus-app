// NOTE: Client-side nsfwjs has been replaced by server-side Gemini moderation
// (see supabase/functions/content-moderator). This stub preserves the API.
//
// The heavy nsfwjs model shards (~25MB) were bundled unnecessarily and caused
// webpack static-require errors. Focus uses the Gemini-powered Edge Function
// for real-time moderation per Pillar 2 (The Immune System).

export const loadNSFWModel = async () => null;

export const checkImageNSFW = async () => ({
    flagged: false,
    predictions: [],
    _note: 'Gemini moderation handles this server-side.',
});
