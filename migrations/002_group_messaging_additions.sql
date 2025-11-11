-- Additional setup for group messaging
-- Date: 2025-11-08
-- Description: Storage bucket and helper functions for group messaging

-- Create group-avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES
  ('group-avatars', 'group-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group-avatars bucket
CREATE POLICY "Group Avatars bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'group-avatars');

CREATE POLICY "Group Avatars bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'group-avatars');

CREATE POLICY "Group Avatars bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'group-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create search_users function if it doesn't exist
CREATE OR REPLACE FUNCTION search_users(search_query TEXT, page_size INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.is_verified
  FROM profiles p
  WHERE 
    p.id != auth.uid() AND
    (
      p.username ILIKE '%' || search_query || '%' OR
      p.full_name ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_query || '%' THEN 1
      WHEN p.full_name ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    p.username
  LIMIT page_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_users IS 'Search for users by username or full name';

