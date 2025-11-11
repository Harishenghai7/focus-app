-- STORAGE BUCKETS SETUP FOR CREATE SYSTEM

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('boltz', 'boltz', true),
  ('flash', 'flash', true),
  ('messages', 'messages', true),
  ('voice-messages', 'voice-messages', true),
  ('dm-photos', 'dm-photos', true),
  ('dm-videos', 'dm-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for posts bucket
CREATE POLICY "Posts bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Posts bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Posts bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for boltz bucket
CREATE POLICY "Boltz bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'boltz');

CREATE POLICY "Boltz bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'boltz');

CREATE POLICY "Boltz bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for flash bucket
CREATE POLICY "Flash bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'flash');

CREATE POLICY "Flash bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'flash');

CREATE POLICY "Flash bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket
CREATE POLICY "Avatars bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatars bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatars bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for messages bucket
CREATE POLICY "Messages bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'messages');

CREATE POLICY "Messages bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'messages');

CREATE POLICY "Messages bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for voice-messages bucket
CREATE POLICY "Voice Messages bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-messages');

CREATE POLICY "Voice Messages bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'voice-messages');

CREATE POLICY "Voice Messages bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for dm-photos bucket
CREATE POLICY "DM Photos bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dm-photos');

CREATE POLICY "DM Photos bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'dm-photos');

CREATE POLICY "DM Photos bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'dm-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for dm-videos bucket
CREATE POLICY "DM Videos bucket: authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dm-videos');

CREATE POLICY "DM Videos bucket: users can view public files" ON storage.objects
FOR SELECT USING (bucket_id = 'dm-videos');

CREATE POLICY "DM Videos bucket: users can delete own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'dm-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

COMMIT;
