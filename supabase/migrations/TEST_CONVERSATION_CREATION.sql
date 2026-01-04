-- ═══════════════════════════════════════════════════════════════════════
-- TEST: get_or_create_conversation RPC Function
-- Run this to verify the function works correctly
-- ═══════════════════════════════════════════════════════════════════════

-- Test 1: Check if function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_or_create_conversation'
  ) THEN
    RAISE NOTICE '✅ Function get_or_create_conversation EXISTS';
  ELSE
    RAISE NOTICE '❌ Function get_or_create_conversation NOT FOUND!';
    RAISE NOTICE '   Run 100_focus_messages_production.sql to create it';
  END IF;
END $$;

-- Test 2: Get two random user IDs from profiles
DO $$
DECLARE
  user1 UUID;
  user2 UUID;
  conv_id UUID;
BEGIN
  -- Get two different users
  SELECT id INTO user1 FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 0;
  SELECT id INTO user2 FROM profiles ORDER BY created_at DESC LIMIT 1 OFFSET 1;
  
  IF user1 IS NULL OR user2 IS NULL THEN
    RAISE NOTICE '❌ Not enough users in database!';
    RAISE NOTICE '   Need at least 2 users to test conversation creation';
    RAISE NOTICE '   Run CREATE_TEST_USERS.sql to create test users';
    RETURN;
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 Testing get_or_create_conversation';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE 'User 1 ID: %', user1;
  RAISE NOTICE 'User 2 ID: %', user2;
  
  -- Test creating conversation
  BEGIN
    SELECT get_or_create_conversation(user1, user2) INTO conv_id;
    
    IF conv_id IS NOT NULL THEN
      RAISE NOTICE '✅ Conversation created/retrieved: %', conv_id;
      
      -- Verify conversation exists
      IF EXISTS (SELECT 1 FROM conversations WHERE id = conv_id) THEN
        RAISE NOTICE '✅ Conversation exists in database';
      ELSE
        RAISE NOTICE '❌ Conversation NOT found in database!';
      END IF;
      
      -- Verify participants were added
      IF EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conv_id AND user_id = user1
      ) THEN
        RAISE NOTICE '✅ User 1 is a participant';
      ELSE
        RAISE NOTICE '❌ User 1 NOT a participant!';
      END IF;
      
      IF EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conv_id AND user_id = user2
      ) THEN
        RAISE NOTICE '✅ User 2 is a participant';
      ELSE
        RAISE NOTICE '❌ User 2 NOT a participant!';
      END IF;
      
      -- Test calling again (should return same conversation)
      DECLARE
        conv_id_2 UUID;
      BEGIN
        SELECT get_or_create_conversation(user1, user2) INTO conv_id_2;
        
        IF conv_id = conv_id_2 THEN
          RAISE NOTICE '✅ Returns same conversation on second call';
        ELSE
          RAISE NOTICE '❌ Created duplicate conversation!';
        END IF;
      END;
      
    ELSE
      RAISE NOTICE '❌ Function returned NULL!';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
    RAISE NOTICE '   This might be an RLS policy issue';
  END;
  
  RAISE NOTICE '════════════════════════════════════════════════════════';
  
END $$;

-- Test 3: Show recent conversations
SELECT 
  c.id as conversation_id,
  c.type,
  c.created_at,
  COUNT(cp.user_id) as participant_count
FROM conversations c
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
GROUP BY c.id, c.type, c.created_at
ORDER BY c.created_at DESC
LIMIT 5;
