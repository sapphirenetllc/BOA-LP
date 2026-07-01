CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT NOT NULL,
  password TEXT,
  remember_me BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'Attempted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert" ON login_attempts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anyone to select" ON login_attempts 
  FOR SELECT USING (true);
