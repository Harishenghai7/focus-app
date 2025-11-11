-- PRODUCTION TRIGGERS & FUNCTIONS

-- Function to update counters
CREATE OR REPLACE FUNCTION update_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    CASE TG_TABLE_NAME
      WHEN 'likes' THEN
        IF NEW.post_id IS NOT NULL THEN
          UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.boltz_id IS NOT NULL THEN
          UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
        END IF;
      WHEN 'comments' THEN
        IF NEW.post_id IS NOT NULL THEN
          UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.boltz_id IS NOT NULL THEN
          UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
        END IF;
      WHEN 'saved_posts' THEN
        IF NEW.post_id IS NOT NULL THEN
          UPDATE posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.boltz_id IS NOT NULL THEN
          UPDATE boltz SET save_count = save_count + 1 WHERE id = NEW.boltz_id;
        END IF;
      WHEN 'flash_views' THEN
        UPDATE flash SET views_count = views_count + 1 WHERE id = NEW.flash_id;
      WHEN 'follows' THEN
        UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
      WHEN 'posts' THEN
        UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
    END CASE;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    CASE TG_TABLE_NAME
      WHEN 'likes' THEN
        IF OLD.post_id IS NOT NULL THEN
          UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.boltz_id IS NOT NULL THEN
          UPDATE boltz SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.boltz_id;
        END IF;
      WHEN 'comments' THEN
        IF OLD.post_id IS NOT NULL THEN
          UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.boltz_id IS NOT NULL THEN
          UPDATE boltz SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.boltz_id;
        END IF;
      WHEN 'saved_posts' THEN
        IF OLD.post_id IS NOT NULL THEN
          UPDATE posts SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.post_id;
        ELSIF OLD.boltz_id IS NOT NULL THEN
          UPDATE boltz SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.boltz_id;
        END IF;
      WHEN 'follows' THEN
        UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
      WHEN 'posts' THEN
        UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.user_id;
    END CASE;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS likes_counter_trigger ON likes;
DROP TRIGGER IF EXISTS comments_counter_trigger ON comments;
DROP TRIGGER IF EXISTS saved_posts_counter_trigger ON saved_posts;
DROP TRIGGER IF EXISTS flash_views_counter_trigger ON flash_views;
DROP TRIGGER IF EXISTS follows_counter_trigger ON follows;
DROP TRIGGER IF EXISTS posts_counter_trigger ON posts;

CREATE TRIGGER likes_counter_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER comments_counter_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER saved_posts_counter_trigger
  AFTER INSERT OR DELETE ON saved_posts
  FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER flash_views_counter_trigger
  AFTER INSERT ON flash_views
  FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER follows_counter_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER posts_counter_trigger
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_counters();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boltz_updated_at BEFORE UPDATE ON boltz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get signed URL for media
CREATE OR REPLACE FUNCTION get_signed_url(bucket_name text, file_path text, expires_in integer DEFAULT 3600)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  SELECT storage.url(bucket_name, file_path, expires_in) INTO signed_url;
  RETURN signed_url;
END;
$$;

-- Function to calculate explore scores
CREATE OR REPLACE FUNCTION calculate_explore_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clear old scores
  DELETE FROM explore_scores WHERE calculated_at < NOW() - INTERVAL '1 hour';
  
  -- Calculate trending posts
  INSERT INTO explore_scores (content_id, content_type, score, category)
  SELECT 
    p.id,
    'post',
    (p.likes_count * 2 + p.comments_count * 3 + p.save_count * 1.5) / 
    EXTRACT(EPOCH FROM (NOW() - p.created_at)) * 3600 as score,
    'trending'
  FROM posts p
  WHERE p.created_at > NOW() - INTERVAL '24 hours'
    AND p.visibility = 'public'
  ON CONFLICT (content_id, content_type, category) 
  DO UPDATE SET score = EXCLUDED.score, calculated_at = NOW();
  
  -- Calculate trending boltz
  INSERT INTO explore_scores (content_id, content_type, score, category)
  SELECT 
    b.id,
    'boltz',
    (b.likes_count * 2 + b.comments_count * 3 + b.views_count * 0.1) / 
    EXTRACT(EPOCH FROM (NOW() - b.created_at)) * 3600 as score,
    'trending'
  FROM boltz b
  WHERE b.created_at > NOW() - INTERVAL '24 hours'
    AND b.visibility = 'public'
  ON CONFLICT (content_id, content_type, category) 
  DO UPDATE SET score = EXCLUDED.score, calculated_at = NOW();
END;
$$;