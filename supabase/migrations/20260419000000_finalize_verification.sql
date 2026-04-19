CREATE OR REPLACE FUNCTION public.finalize_verification(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET verification_status = 'VERIFIED',
      trust_shield_status = 'VERIFIED',
      updated_at = NOW()
  WHERE id = p_user_id;

  -- The above UPDATE triggers Supabase Realtime 'postgres_changes' on the users table.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
