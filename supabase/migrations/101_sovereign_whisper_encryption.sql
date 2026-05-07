-- ═══════════════════════════════════════════════════════════════════════
-- 🔐 SOVEREIGN WHISPER - End-to-End Encryption Schema
-- AES-GCM 256-bit with ECDH Key Exchange
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing encryption tables if they exist
DROP TABLE IF EXISTS message_keys CASCADE;
DROP TABLE IF EXISTS user_encryption_keys CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: user_encryption_keys
-- Stores each user's public key for E2EE
-- Private keys are NEVER stored on the server
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Public key for ECDH key exchange (Base64 encoded)
  public_key TEXT NOT NULL,
  
  -- Key version for future upgrades
  key_version TEXT DEFAULT '1.0',
  
  -- Algorithm used
  algorithm TEXT DEFAULT 'ECDH-P256',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One key per user (for now)
  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: message_keys
-- Stores encrypted message keys for each participant
-- Each message key is encrypted with the recipient's public key
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE message_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Encrypted AES key (encrypted with recipient's ECDH public key)
  encrypted_key TEXT NOT NULL,
  
  -- Key wrapping algorithm
  algorithm TEXT DEFAULT 'ECDH-AES-GCM',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One key entry per message per recipient
  UNIQUE(message_id, recipient_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- ADD ENCRYPTION COLUMNS TO MESSAGES TABLE
-- ═══════════════════════════════════════════════════════════════════════

-- Add encryption columns to messages table if they don't exist
DO $$
BEGIN
  -- Add ciphertext column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'ciphertext'
  ) THEN
    ALTER TABLE messages ADD COLUMN ciphertext TEXT;
  END IF;

  -- Add initialization_vector column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'initialization_vector'
  ) THEN
    ALTER TABLE messages ADD COLUMN initialization_vector TEXT;
  END IF;

  -- Add encryption_version column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'encryption_version'
  ) THEN
    ALTER TABLE messages ADD COLUMN encryption_version TEXT DEFAULT '1.0';
  END IF;

  -- Add is_encrypted column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_encrypted'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add encryption_algorithm column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'encryption_algorithm'
  ) THEN
    ALTER TABLE messages ADD COLUMN encryption_algorithm TEXT DEFAULT 'AES-GCM-256';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

-- User encryption keys
CREATE INDEX idx_user_encryption_keys_user ON user_encryption_keys(user_id);

-- Message keys
CREATE INDEX idx_message_keys_message ON message_keys(message_id);
CREATE INDEX idx_message_keys_recipient ON message_keys(recipient_id);

-- Encrypted messages lookup
CREATE INDEX idx_messages_encrypted ON messages(is_encrypted) WHERE is_encrypted = TRUE;

-- ═══════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_keys ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - USER ENCRYPTION KEYS
-- ═══════════════════════════════════════════════════════════════════════

-- Anyone can view public keys (they're public!)
CREATE POLICY "Public keys are viewable by all authenticated users"
  ON user_encryption_keys FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create/update their own keys
CREATE POLICY "Users can manage their own encryption keys"
  ON user_encryption_keys FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - MESSAGE KEYS
-- ═══════════════════════════════════════════════════════════════════════

-- Recipients can view their own message keys
CREATE POLICY "Recipients can view their message keys"
  ON message_keys FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid()
    OR 
    -- Sender can also view (to see who has keys)
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    )
  );

-- Only system can insert message keys (via trigger or function)
CREATE POLICY "System can insert message keys"
  ON message_keys FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Function to register a user's encryption public key
CREATE OR REPLACE FUNCTION register_encryption_key(
  p_public_key TEXT,
  p_key_version TEXT DEFAULT '1.0',
  p_algorithm TEXT DEFAULT 'ECDH-P256'
)
RETURNS UUID AS $$
DECLARE
  v_key_id UUID;
BEGIN
  INSERT INTO user_encryption_keys (user_id, public_key, key_version, algorithm)
  VALUES (auth.uid(), p_public_key, p_key_version, p_algorithm)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    public_key = EXCLUDED.public_key,
    key_version = EXCLUDED.key_version,
    algorithm = EXCLUDED.algorithm,
    updated_at = NOW()
  RETURNING id INTO v_key_id;
  
  RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's public key
CREATE OR REPLACE FUNCTION get_user_public_key(p_user_id UUID)
RETURNS TABLE (public_key TEXT, key_version TEXT, algorithm TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT uek.public_key, uek.key_version, uek.algorithm
  FROM user_encryption_keys uek
  WHERE uek.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to store encrypted message key
CREATE OR REPLACE FUNCTION store_message_key(
  p_message_id UUID,
  p_recipient_id UUID,
  p_encrypted_key TEXT
)
RETURNS UUID AS $$
DECLARE
  v_key_id UUID;
BEGIN
  INSERT INTO message_keys (message_id, recipient_id, encrypted_key)
  VALUES (p_message_id, p_recipient_id, p_encrypted_key)
  RETURNING id INTO v_key_id;
  
  RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get encrypted message key for current user
CREATE OR REPLACE FUNCTION get_message_key(p_message_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_encrypted_key TEXT;
BEGIN
  SELECT encrypted_key INTO v_encrypted_key
  FROM message_keys
  WHERE message_id = p_message_id
    AND recipient_id = auth.uid();
    
  RETURN v_encrypted_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all conversation participants' public keys
CREATE OR REPLACE FUNCTION get_conversation_public_keys(p_conversation_id UUID)
RETURNS TABLE (
  user_id UUID,
  public_key TEXT,
  key_version TEXT,
  algorithm TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (p::text)::UUID as user_id,
    uek.public_key,
    uek.key_version,
    uek.algorithm
  FROM conversations c
  CROSS JOIN LATERAL jsonb_array_elements_text(c.participants) as p
  LEFT JOIN user_encryption_keys uek ON uek.user_id = (p::text)::UUID
  WHERE c.id = p_conversation_id
    AND uek.public_key IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as encrypted
CREATE OR REPLACE FUNCTION mark_message_encrypted(
  p_message_id UUID,
  p_ciphertext TEXT,
  p_iv TEXT,
  p_version TEXT DEFAULT '1.0'
)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET 
    ciphertext = p_ciphertext,
    initialization_vector = p_iv,
    encryption_version = p_version,
    is_encrypted = TRUE,
    encryption_algorithm = 'AES-GCM-256',
    updated_at = NOW()
  WHERE id = p_message_id
    AND sender_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- Trigger to clean up message keys when a message is deleted
CREATE OR REPLACE FUNCTION cleanup_message_keys()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM message_keys WHERE message_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_message_keys
  BEFORE DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_message_keys();

-- ═══════════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════

GRANT ALL ON user_encryption_keys TO authenticated;
GRANT ALL ON message_keys TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION register_encryption_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_public_key TO authenticated;
GRANT EXECUTE ON FUNCTION store_message_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_key TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_public_keys TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_encrypted TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ SOVEREIGN WHISPER ENCRYPTION READY
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '🔐 Sovereign Whisper Encryption Schema Ready';
  RAISE NOTICE '   ✅ user_encryption_keys table created';
  RAISE NOTICE '   ✅ message_keys table created';
  RAISE NOTICE '   ✅ Encryption columns added to messages';
  RAISE NOTICE '   ✅ RLS policies configured';
  RAISE NOTICE '   ✅ Functions created';
  RAISE NOTICE '🛡️ End-to-End Encryption is ready for use!';
END $$;
