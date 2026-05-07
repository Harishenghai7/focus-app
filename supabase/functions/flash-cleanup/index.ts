/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FLASH CLEANUP — Supabase Edge Function | Sovereign Ephemerality
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Automatically deletes expired flash stories after their 24-hour TTL expires.
 * Triggered via Supabase scheduled function (cron job) every 15 minutes.
 * 
 * Cron Schedule: 0,15,30,45 * * * *
 * Runs at: 00:00, 00:15, 00:30, 00:45 every hour
 * 
 * Features:
 * - Hard deletes flashes where expires_at < NOW()
 * - Cascading delete of related flash_views and flash_replies
 * - Batch processing (100 records per run to avoid timeout)
 * - Logging for monitoring and debugging
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlashRecord {
    id: string;
    user_id: string;
    media_url: string;
    expires_at: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Initialize Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const startTime = Date.now();
        const results = {
            flashes_deleted: 0,
            views_deleted: 0,
            replies_deleted: 0,
            storage_deleted: 0,
            errors: [] as string[],
        };

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 1: Fetch expired flashes (batch of 100)
        // ═════════════════════════════════════════════════════════════════════════
        const { data: expiredFlashes, error: fetchError } = await supabase
            .from('flash')
            .select('id, user_id, media_url, expires_at')
            .lt('expires_at', new Date().toISOString())
            .limit(100);

        if (fetchError) {
            throw new Error(`Failed to fetch expired flashes: ${fetchError.message}`);
        }

        if (!expiredFlashes || expiredFlashes.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No expired flashes found',
                    processed: 0,
                    execution_time_ms: Date.now() - startTime,
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        const flashIds = expiredFlashes.map((f: FlashRecord) => f.id);

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 2: Delete related flash_views
        // ═════════════════════════════════════════════════════════════════════════
        const { count: viewsCount, error: viewsError } = await supabase
            .from('flash_views')
            .delete()
            .in('flash_id', flashIds)
            .select('count');

        if (viewsError) {
            results.errors.push(`Views deletion error: ${viewsError.message}`);
        } else {
            results.views_deleted = viewsCount || 0;
        }

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 3: Delete related flash_replies
        // ═════════════════════════════════════════════════════════════════════════
        const { count: repliesCount, error: repliesError } = await supabase
            .from('flash_replies')
            .delete()
            .in('flash_id', flashIds)
            .select('count');

        if (repliesError) {
            results.errors.push(`Replies deletion error: ${repliesError.message}`);
        } else {
            results.replies_deleted = repliesCount || 0;
        }

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 4: Delete media from storage (fire-and-forget, don't block)
        // ═════════════════════════════════════════════════════════════════════════
        const mediaUrls = expiredFlashes
            .map((f: FlashRecord) => f.media_url)
            .filter((url: string) => url && url.includes('/storage/v1/object/'));

        if (mediaUrls.length > 0) {
            const storagePromises = mediaUrls.map(async (url: string) => {
                try {
                    // Extract path from storage URL
                    const match = url.match(/\/storage\/v1\/object\/public\/flash\/(.*)/);
                    if (match) {
                        const path = match[1];
                        const { error } = await supabase.storage.from('flash').remove([path]);
                        if (error) throw error;
                        return true;
                    }
                    return false;
                } catch (err) {
                    results.errors.push(`Storage deletion error for ${url}: ${(err as Error).message}`);
                    return false;
                }
            });

            const storageResults = await Promise.all(storagePromises);
            results.storage_deleted = storageResults.filter(Boolean).length;
        }

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 5: Delete expired flashes
        // ═════════════════════════════════════════════════════════════════════════
        const { count: flashesCount, error: deleteError } = await supabase
            .from('flash')
            .delete()
            .in('id', flashIds)
            .select('count');

        if (deleteError) {
            throw new Error(`Failed to delete flashes: ${deleteError.message}`);
        }

        results.flashes_deleted = flashesCount || 0;

        // ═════════════════════════════════════════════════════════════════════════
        // STEP 6: Log cleanup for monitoring
        // ═════════════════════════════════════════════════════════════════════════
        console.log('Flash cleanup completed:', {
            timestamp: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime,
            ...results,
        });

        return new Response(
            JSON.stringify({
                success: true,
                processed: results.flashes_deleted,
                details: results,
                execution_time_ms: Date.now() - startTime,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error('Flash cleanup failed:', errorMessage);

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
