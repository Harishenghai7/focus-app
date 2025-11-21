-- Flash (stories) system
CREATE TABLE IF NOT EXISTS public.flash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_path text NOT NULL,
  media_type text NOT NULL, -- 'image' | 'video'
  caption text,
  visibility text DEFAULT 'public', -- 'public' | 'followers' | 'private'
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  is_archived boolean DEFAULT false
);

-- Views tracking
CREATE TABLE IF NOT EXISTS public.flash_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_id uuid REFERENCES public.flash(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles(id),
  viewed_at timestamptz DEFAULT now(),
  UNIQUE (flash_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_views ENABLE ROW LEVEL SECURITY;

-- Flash policies
CREATE POLICY "Flash view access" ON public.flash FOR SELECT TO authenticated
USING (
  expires_at > now()
  AND (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM public.followers f WHERE f.follower_id = auth.uid() AND f.following_id = public.flash.user_id
    ))
  )
);

CREATE POLICY "Users can insert flash" ON public.flash FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flash" ON public.flash FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flash" ON public.flash FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Flash views policies
CREATE POLICY "Users can insert flash views" ON public.flash_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view own flash_views" ON public.flash_views FOR SELECT TO authenticated
USING (auth.uid() = viewer_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('flashes', 'flashes', false) ON CONFLICT DO NOTHING;