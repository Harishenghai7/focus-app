import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Archive expired flashes using the database function
    const { data: archiveResult, error: archiveError } = await supabaseClient
      .rpc('archive_expired_flashes')

    if (archiveError) {
      throw archiveError
    }

    const archivedCount = archiveResult?.[0]?.archived_count || 0
    const archivedIds = archiveResult?.[0]?.flash_ids || []

    if (archivedCount === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired flashes to archive', count: 0 }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Archived ${archivedCount} expired flashes`)

    return new Response(
      JSON.stringify({
        message: 'Expired flashes archived successfully',
        archived_count: archivedCount,
        archived_ids: archivedIds,
        note: 'Flashes are archived instead of deleted and can be restored to highlights'
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in delete-expired-flashes function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
