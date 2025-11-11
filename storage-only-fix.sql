-- STORAGE BUCKETS ONLY FIX

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('posts', 'posts', true),
  ('boltz', 'boltz', true),
  ('flash', 'flash', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Own files delete" ON storage.objects;

-- Storage policies
CREATE POLICY "Public access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Own files delete" ON storage.objects FOR DELETE TO authenticated USING (true);

COMMIT;