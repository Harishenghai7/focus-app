-- EMERGENCY: Create missing tables for Settings

-- user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    location TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_trust_metrics table  
CREATE TABLE IF NOT EXISTS user_trust_metrics (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    trust_score INTEGER DEFAULT 50,
    verification_level INTEGER DEFAULT 0,
    account_age_days INTEGER DEFAULT 0,
    completed_verifications TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own trust" ON user_trust_metrics FOR SELECT USING (auth.uid() = user_id);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
