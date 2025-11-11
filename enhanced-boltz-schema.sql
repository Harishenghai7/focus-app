-- ENHANCED BOLTZ SYSTEM - Professional TikTok-like Short Videos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing boltz tables
DROP TABLE IF EXISTS boltz_reports CASCADE;
DROP TABLE IF EXISTS boltz_views CASCADE;
DROP TABLE IF EXISTS boltz_comments CASCADE;
DROP TABLE IF EXISTS boltz_likes CASCADE;
DROP TABLE IF EXISTS boltz CASCADE;

-- Enhanced Boltz table
CREATE TABLE public.boltz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  signed_url_ttl integer DEFAULT 3600,
  thumbnail_path text,
  duration_seconds integer,
  caption text,
  audio_track text,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Boltz likes
CREATE TABLE public.boltz_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boltz_id uuid REFERENCES public.boltz(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (boltz_id, user_id)
);

-- Boltz comments
CREATE TABLE public.boltz_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boltz_id uuid REFERENCES public.boltz(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Boltz views tracking
CREATE TABLE public.boltz_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boltz_id uuid REFERENCES public.boltz(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id),
  watch_duration integer DEFAULT 0,
  completion_rate decimal DEFAULT 0,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE (boltz_id, viewer_id)
);

-- Boltz reports for moderation
CREATE TABLE public.boltz_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boltz_id uuid REFERENCES public.boltz(id),
  reporter_id uuid REFERENCES public.profiles(id),
  reason text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('boltz', 'boltz', false),
  ('boltz_thumbs', 'boltz_thumbs', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_reports ENABLE ROW LEVEL SECURITY;

-- Boltz RLS Policies
CREATE POLICY "Boltz view access" ON public.boltz FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (visibility = 'followers' AND EXISTS (
     SELECT 1 FROM public.follows f
     WHERE f.follower_id = auth.uid() AND f.following_id = public.boltz.user_id
  ))
);

CREATE POLICY "Insert boltz" ON public.boltz FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modify own boltz" ON public.boltz FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Delete own boltz" ON public.boltz FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Boltz likes policies
CREATE POLICY "View boltz likes" ON public.boltz_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert like by self" ON public.boltz_likes FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete like by self" ON public.boltz_likes FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Boltz comments policies
CREATE POLICY "View boltz comments" ON public.boltz_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert comment by self" ON public.boltz_comments FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own comment" ON public.boltz_comments FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);
CREATE POLICY "Delete own comment" ON public.boltz_comments FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- Boltz views policies
CREATE POLICY "View own boltz views" ON public.boltz_views FOR SELECT TO authenticated 
USING (viewer_id = auth.uid() OR EXISTS (
  SELECT 1 FROM boltz WHERE boltz.id = boltz_views.boltz_id AND boltz.user_id = auth.uid()
));
CREATE POLICY "Insert view by self" ON public.boltz_views FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = viewer_id);

-- Boltz reports policies
CREATE POLICY "View own reports" ON public.boltz_reports FOR SELECT TO authenticated 
USING (reporter_id = auth.uid());
CREATE POLICY "Insert report by self" ON public.boltz_reports FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- Storage policies for boltz
CREATE POLICY "Boltz storage access" ON storage.objects FOR SELECT USING (bucket_id IN ('boltz', 'boltz_thumbs'));
CREATE POLICY "Authenticated boltz upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('boltz', 'boltz_thumbs') AND auth.role() = 'authenticated'
);
CREATE POLICY "Users update own boltz files" ON storage.objects FOR UPDATE USING (
  bucket_id IN ('boltz', 'boltz_thumbs') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete own boltz files" ON storage.objects FOR DELETE USING (
  bucket_id IN ('boltz', 'boltz_thumbs') AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Indexes for performance
CREATE INDEX idx_boltz_user_id ON boltz(user_id);
CREATE INDEX idx_boltz_created_at ON boltz(created_at DESC);
CREATE INDEX idx_boltz_visibility ON boltz(visibility);
CREATE INDEX idx_boltz_likes_boltz_id ON boltz_likes(boltz_id);
CREATE INDEX idx_boltz_comments_boltz_id ON boltz_comments(boltz_id);
CREATE INDEX idx_boltz_views_boltz_id ON boltz_views(boltz_id);

-- Triggers for counter updates
CREATE OR REPLACE FUNCTION update_boltz_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boltz SET likes_count = likes_count - 1 WHERE id = OLD.boltz_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_boltz_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE boltz SET comments_count = comments_count - 1 WHERE id = OLD.boltz_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_boltz_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE boltz SET views_count = views_count + 1 WHERE id = NEW.boltz_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER boltz_likes_count_trigger
  AFTER INSERT OR DELETE ON boltz_likes
  FOR EACH ROW EXECUTE FUNCTION update_boltz_likes_count();

CREATE TRIGGER boltz_comments_count_trigger
  AFTER INSERT OR DELETE ON boltz_comments
  FOR EACH ROW EXECUTE FUNCTION update_boltz_comments_count();

CREATE TRIGGER boltz_views_count_trigger
  AFTER INSERT ON boltz_views
  FOR EACH ROW EXECUTE FUNCTION update_boltz_views_count();

COMMIT;