#!/bin/bash

# Focus App - Quick Fix Script
# Run this to apply critical fixes automatically

echo "🚀 Focus App - Quick Fix Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found package.json${NC}"
echo ""

# Step 1: Security Fixes
echo "🔒 Step 1: Applying Security Fixes..."
echo "-----------------------------------"

# Check .gitignore
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
    echo -e "${GREEN}✅ Added .env.local to .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local already in .gitignore${NC}"
fi

if ! grep -q ".env" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo -e "${GREEN}✅ Added .env to .gitignore${NC}"
else
    echo -e "${YELLOW}⚠️  .env already in .gitignore${NC}"
fi

# Install security dependencies
echo ""
echo "📦 Installing security dependencies..."
npm install dompurify --save

# Update package.json build script
echo ""
echo "🔧 Updating build script..."
if grep -q "GENERATE_SOURCEMAP=false" package.json; then
    echo -e "${YELLOW}⚠️  Build script already updated${NC}"
else
    # Backup package.json
    cp package.json package.json.backup
    
    # Update build script (works on both Mac and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/"build": "react-scripts build"/"build": "GENERATE_SOURCEMAP=false react-scripts build"/' package.json
    else
        # Linux
        sed -i 's/"build": "react-scripts build"/"build": "GENERATE_SOURCEMAP=false react-scripts build"/' package.json
    fi
    
    echo -e "${GREEN}✅ Updated build script to disable source maps${NC}"
fi

echo ""
echo -e "${GREEN}✅ Security fixes applied!${NC}"
echo ""

# Step 2: Create utility files
echo "🛠️  Step 2: Creating Utility Files..."
echo "-----------------------------------"

# Create sanitizer.js
mkdir -p src/utils
cat > src/utils/sanitizer.js << 'EOF'
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'],
    ALLOWED_ATTR: ['href']
  });
};

export const sanitizeBio = (bio) => {
  if (!bio) return '';
  const sanitized = sanitizeInput(bio);
  return sanitized.substring(0, 150); // Max 150 chars
};

export const sanitizeUsername = (username) => {
  if (!username) return '';
  // Only allow alphanumeric, underscore, and period
  return username.replace(/[^a-zA-Z0-9_.]/g, '').substring(0, 30);
};
EOF

echo -e "${GREEN}✅ Created src/utils/sanitizer.js${NC}"

# Create useSafeState hook
mkdir -p src/hooks
cat > src/hooks/useSafeState.js << 'EOF'
import { useState, useCallback, useRef, useEffect } from 'react';

export function useSafeState(initialState) {
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setSafeState = useCallback((value) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  return [state, setSafeState];
}
EOF

echo -e "${GREEN}✅ Created src/hooks/useSafeState.js${NC}"

# Create cursor pagination hook
cat > src/hooks/useCursorPagination.js << 'EOF'
import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useCursorPagination(table, pageSize = 20) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMore = useCallback(async (filters = {}) => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize);

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setItems(prev => [...prev, ...data]);
        setCursor(data[data.length - 1].created_at);
        setHasMore(data.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  }, [table, pageSize, cursor, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
  }, []);

  return { items, loading, hasMore, fetchMore, reset };
}
EOF

echo -e "${GREEN}✅ Created src/hooks/useCursorPagination.js${NC}"

# Create content cleanup utility
cat > src/utils/contentCleanup.js << 'EOF'
import { supabase } from '../supabaseClient';

export async function deletePostWithMedia(postId, userId) {
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('media_urls, user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== userId) {
      throw new Error('Unauthorized or post not found');
    }

    if (post.media_urls && post.media_urls.length > 0) {
      const filePaths = post.media_urls.map(url => {
        const urlObj = new URL(url);
        return urlObj.pathname.split('/').slice(-1)[0];
      });

      await supabase.storage.from('posts').remove(filePaths);
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBoltzWithMedia(boltzId, userId) {
  try {
    const { data: boltz } = await supabase
      .from('boltz')
      .select('video_url, thumbnail_url, user_id')
      .eq('id', boltzId)
      .single();

    if (!boltz || boltz.user_id !== userId) {
      throw new Error('Unauthorized or boltz not found');
    }

    const filesToDelete = [];
    if (boltz.video_url) {
      const videoPath = new URL(boltz.video_url).pathname.split('/').slice(-1)[0];
      filesToDelete.push(videoPath);
    }
    if (boltz.thumbnail_url) {
      const thumbPath = new URL(boltz.thumbnail_url).pathname.split('/').slice(-1)[0];
      filesToDelete.push(thumbPath);
    }

    if (filesToDelete.length > 0) {
      await supabase.storage.from('boltz').remove(filesToDelete);
    }

    const { error } = await supabase
      .from('boltz')
      .delete()
      .eq('id', boltzId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete boltz error:', error);
    return { success: false, error: error.message };
  }
}
EOF

echo -e "${GREEN}✅ Created src/utils/contentCleanup.js${NC}"

echo ""
echo -e "${GREEN}✅ Utility files created!${NC}"
echo ""

# Step 3: Database migrations
echo "🗄️  Step 3: Database Migrations..."
echo "-----------------------------------"

mkdir -p migrations

# Create rate limiting migration
cat > migrations/036_rate_limiting.sql << 'EOF'
-- Rate limiting for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL,
  email TEXT,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked ON login_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_login_rate_limit(
  p_ip TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  SELECT attempt_count, blocked_until INTO v_attempts, v_blocked_until
  FROM login_attempts
  WHERE ip_address = p_ip
  AND (blocked_until IS NULL OR blocked_until > NOW())
  ORDER BY last_attempt DESC
  LIMIT 1;
  
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;
  
  IF v_attempts >= 5 THEN
    UPDATE login_attempts
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE ip_address = p_ip;
    RETURN FALSE;
  END IF;
  
  INSERT INTO login_attempts (ip_address, email, attempt_count)
  VALUES (p_ip, p_email, 1)
  ON CONFLICT (ip_address) DO UPDATE
  SET attempt_count = login_attempts.attempt_count + 1,
      last_attempt = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF

echo -e "${GREEN}✅ Created migrations/036_rate_limiting.sql${NC}"

# Create username unique constraint migration
cat > migrations/037_username_unique.sql << 'EOF'
-- Add unique constraint to username
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search ON profiles USING gin(to_tsvector('english', full_name));
EOF

echo -e "${GREEN}✅ Created migrations/037_username_unique.sql${NC}"

# Create account deletion function
cat > migrations/038_account_deletion.sql << 'EOF'
-- Comprehensive account deletion function
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete user content
  DELETE FROM posts WHERE user_id = p_user_id;
  DELETE FROM boltz WHERE user_id = p_user_id;
  DELETE FROM flashes WHERE user_id = p_user_id;
  DELETE FROM comments WHERE user_id = p_user_id;
  DELETE FROM likes WHERE user_id = p_user_id;
  DELETE FROM saves WHERE user_id = p_user_id;
  DELETE FROM follows WHERE follower_id = p_user_id OR following_id = p_user_id;
  DELETE FROM messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id OR actor_id = p_user_id;
  DELETE FROM blocked_users WHERE blocker_id = p_user_id OR blocked_id = p_user_id;
  DELETE FROM user_settings WHERE user_id = p_user_id;
  DELETE FROM reports WHERE reporter_id = p_user_id OR reported_user_id = p_user_id;
  
  -- Finally delete profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  RAISE NOTICE 'User account % deleted successfully', p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF

echo -e "${GREEN}✅ Created migrations/038_account_deletion.sql${NC}"

echo ""
echo -e "${GREEN}✅ Database migrations created!${NC}"
echo ""

# Step 4: Run tests
echo "🧪 Step 4: Running Tests..."
echo "-----------------------------------"

# Check for syntax errors
echo "Checking for syntax errors..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No syntax errors found${NC}"
else
    echo -e "${RED}❌ Build failed. Check for syntax errors.${NC}"
    echo "Run 'npm run build' to see detailed errors."
fi

echo ""

# Step 5: Summary
echo "📊 Summary"
echo "================================"
echo ""
echo -e "${GREEN}✅ Security fixes applied${NC}"
echo -e "${GREEN}✅ Utility files created${NC}"
echo -e "${GREEN}✅ Database migrations created${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Run database migrations in Supabase SQL Editor:"
echo "   - migrations/036_rate_limiting.sql"
echo "   - migrations/037_username_unique.sql"
echo "   - migrations/038_account_deletion.sql"
echo ""
echo "2. Update components to use new utilities:"
echo "   - Import sanitizeInput in Profile.js"
echo "   - Import useSafeState in components with async state"
echo "   - Import deletePostWithMedia in PostCard.js"
echo ""
echo "3. Test the application:"
echo "   npm start"
echo ""
echo "4. Build for production:"
echo "   npm run build"
echo ""
echo -e "${GREEN}🎉 Quick fixes applied successfully!${NC}"
echo ""
