const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wggnjfcayfvyritpojaj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ25qZmNheWZ2eXJpdHBvamFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjQ3NDUsImV4cCI6MjA3NTUwMDc0NX0.cqToCy5S_tbrnmm8r9On2FEcVwEWynhgwYFo0AquzgY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyCountFix() {
  console.log('🔧 Applying count system fix...');
  
  try {
    // Create the trigger function
    const { error: functionError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION update_interaction_counts()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            IF TG_TABLE_NAME = 'likes' THEN
              IF NEW.post_id IS NOT NULL THEN
                UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
              ELSIF NEW.boltz_id IS NOT NULL THEN
                UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
              END IF;
            ELSIF TG_TABLE_NAME = 'comments' THEN
              IF NEW.post_id IS NOT NULL THEN
                UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
              ELSIF NEW.boltz_id IS NOT NULL THEN
                UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
              END IF;
            ELSIF TG_TABLE_NAME = 'shares' THEN
              IF NEW.post_id IS NOT NULL THEN
                UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
              ELSIF NEW.boltz_id IS NOT NULL THEN
                UPDATE boltz SET shares_count = shares_count + 1 WHERE id = NEW.boltz_id;
              END IF;
            END IF;
            RETURN NEW;
          ELSIF TG_OP = 'DELETE' THEN
            IF TG_TABLE_NAME = 'likes' THEN
              IF OLD.post_id IS NOT NULL THEN
                UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
              ELSIF OLD.boltz_id IS NOT NULL THEN
                UPDATE boltz SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.boltz_id;
              END IF;
            ELSIF TG_TABLE_NAME = 'comments' THEN
              IF OLD.post_id IS NOT NULL THEN
                UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
              ELSIF OLD.boltz_id IS NOT NULL THEN
                UPDATE boltz SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.boltz_id;
              END IF;
            ELSIF TG_TABLE_NAME = 'shares' THEN
              IF OLD.post_id IS NOT NULL THEN
                UPDATE posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.post_id;
              ELSIF OLD.boltz_id IS NOT NULL THEN
                UPDATE boltz SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.boltz_id;
              END IF;
            END IF;
            RETURN OLD;
          END IF;
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.error('❌ Error creating function:', functionError);
      return;
    }

    console.log('✅ Function created successfully');

    // Create triggers
    const triggers = [
      'DROP TRIGGER IF EXISTS likes_count_trigger ON likes;',
      'DROP TRIGGER IF EXISTS comments_count_trigger ON comments;', 
      'DROP TRIGGER IF EXISTS shares_count_trigger ON shares;',
      'CREATE TRIGGER likes_count_trigger AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_interaction_counts();',
      'CREATE TRIGGER comments_count_trigger AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_interaction_counts();',
      'CREATE TRIGGER shares_count_trigger AFTER INSERT OR DELETE ON shares FOR EACH ROW EXECUTE FUNCTION update_interaction_counts();'
    ];

    for (const trigger of triggers) {
      const { error } = await supabase.rpc('exec', { sql: trigger });
      if (error) {
        console.error('❌ Error with trigger:', error);
        return;
      }
    }

    console.log('✅ Triggers created successfully');

    // Recalculate existing counts
    const { error: postsError } = await supabase.rpc('exec', {
      sql: `
        UPDATE posts SET 
          likes_count = COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = posts.id), 0),
          comments_count = COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = posts.id), 0),
          shares_count = COALESCE((SELECT COUNT(*) FROM shares WHERE post_id = posts.id), 0);
      `
    });

    if (postsError) {
      console.error('❌ Error updating posts counts:', postsError);
      return;
    }

    const { error: boltzError } = await supabase.rpc('exec', {
      sql: `
        UPDATE boltz SET 
          likes_count = COALESCE((SELECT COUNT(*) FROM likes WHERE boltz_id = boltz.id), 0),
          comments_count = COALESCE((SELECT COUNT(*) FROM comments WHERE boltz_id = boltz.id), 0),
          shares_count = COALESCE((SELECT COUNT(*) FROM shares WHERE boltz_id = boltz.id), 0);
      `
    });

    if (boltzError) {
      console.error('❌ Error updating boltz counts:', boltzError);
      return;
    }

    console.log('✅ Count system fix applied successfully!');
    console.log('🎉 Like, comment, and share counts should now work properly');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

applyCountFix();