const supabaseUrl = 'https://bqtqeuwrbzgenqpklxeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHFldXdyYnpnZW5xcGtseGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODQ2NTcsImV4cCI6MjA5ODQ2MDY1N30.MgRDpRybjbfb3LPklCRaKkyFxEMC-vlv2gQ52-mykv0';

async function testAndCreateTable() {
  try {
    // First, let's test if we can insert data (which will fail if table doesn't exist but will tell us clearly)
    console.log('Attempting to insert test entry...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: 'test_user_production_001',
        password: 'test_encrypted_password',
        remember_me: false,
        ip_address: '203.0.113.50',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: 'Attempted'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Successfully inserted test entry!');
      console.log('Response:', result);
      return true;
    } else {
      console.log('Error response:', result);
      console.log('Status:', response.status);
      
      if (response.status === 404 || result.message?.includes('not found')) {
        console.log('\n⚠ Table does not exist. Need to create it via Supabase dashboard.');
        console.log('Visit: https://app.supabase.com/project/bqtqeuwrbzgenqpklxeg/sql');
        console.log('\nCreate with this SQL:\n');
        console.log(`
CREATE TABLE login_attempts (
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

CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to insert" ON login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to select" ON login_attempts FOR SELECT USING (true);
        `);
      }
      return false;
    }
  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

testAndCreateTable();
