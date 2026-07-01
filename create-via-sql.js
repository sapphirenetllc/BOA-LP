import fetch from 'node-fetch';

const supabaseUrl = 'https://bqtqeuwrbzgenqpklxeg.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHFldXdyYnpnZW5xcGtseGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg4NDY1NywiZXhwIjoyMDk4NDYwNjU3fQ.wDWMBZ5bP_gfqiMzQJ0c-0aDpMfLN4MgTGTGPzEsLvg';

async function createTableViaSql() {
  try {
    console.log('Attempting to create login_attempts table...\n');
    
    const sql = `
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

CREATE POLICY IF NOT EXISTS "Allow anyone to insert" ON login_attempts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow anyone to select" ON login_attempts 
  FOR SELECT USING (true);
    `;

    // Use REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok || response.status === 200) {
      console.log('\n✓ Table created successfully!');
    } else {
      console.log('\nAttempting direct insert instead...');
      
      // Try direct insertion (which will fail if table doesn't exist, but gives us the table structure)
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/login_attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: 'test_user_' + Date.now(),
          password: 'encrypted_test',
          ip_address: '203.0.113.50',
          user_agent: 'test-agent',
          status: 'Attempted'
        })
      });

      const insertResult = await insertResponse.json();
      if (insertResponse.ok) {
        console.log('✓ Table exists and test entry inserted!');
        console.log('Entry:', insertResult);
      } else {
        console.log('Table creation needed via Supabase dashboard');
        console.log('Visit: https://app.supabase.com/project/bqtqeuwrbzgenqpklxeg/sql');
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTableViaSql();
