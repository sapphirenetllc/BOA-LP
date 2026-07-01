import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqtqeuwrbzgenqpklxeg.supabase.co';
// Using service role key for admin operations
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHFldXdyYnpnZW5xcGtseGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg4NDY1NywiZXhwIjoyMDk4NDYwNjU3fQ.wDWMBZ5bP_gfqiMzQJ0c-0aDpMfLN4MgTGTGPzEsLvg';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTableAndInsertData() {
  try {
    console.log('Creating login_attempts table...');

    // Create table using raw SQL
    const { data, error } = await supabase.rpc('sql_exec', {
      query: `
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
      `
    });

    if (error) {
      console.log('Note: RPC might not exist, trying direct insertion...');
    } else {
      console.log('✓ Table created successfully');
    }

    // Try inserting test data
    console.log('\nInserting test entry...');
    const { data: insertData, error: insertError } = await supabase
      .from('login_attempts')
      .insert([
        {
          user_id: 'test_user_production_001',
          password: 'test_encrypted_password',
          remember_me: false,
          ip_address: '203.0.113.50',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'Attempted'
        }
      ])
      .select();

    if (insertError) {
      console.log('Error inserting entry:', insertError.message);
    } else {
      console.log('✓ Successfully inserted test entry!');
      console.log('Data:', insertData);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createTableAndInsertData();
