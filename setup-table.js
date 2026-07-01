import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqtqeuwrbzgenqpklxeg.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHFldXdyYnpnZW5xcGtseGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODQ2NTcsImV4cCI6MjA5ODQ2MDY1N30.MgRDpRybjbfb3LPklCRaKkyFxEMC-vlv2gQ52-mykv0';

const supabase = createClient(supabaseUrl, anonKey);

async function testAndCreateTable() {
  try {
    console.log('Testing Supabase table access...\n');
    
    const testEntry = {
      user_id: 'test_production_' + Date.now(),
      password: 'encrypted_test_password',
      remember_me: false,
      ip_address: '203.0.113.50',
      user_agent: 'Mozilla/5.0 Test Browser',
      status: 'Attempted'
    };

    const { data, error } = await supabase
      .from('login_attempts')
      .insert([testEntry])
      .select();

    if (!error) {
      console.log('✓ SUCCESS! Entry inserted into Supabase!\n');
      console.log('Entry details:');
      console.log(JSON.stringify(data, null, 2));
      return true;
    } else if (error.message.includes('not found') || error.message.includes('login_attempts')) {
      console.log('⚠ Table does not exist yet.\n');
      console.log('NEXT STEPS:');
      console.log('1. Open: https://app.supabase.com/project/bqtqeuwrbzgenqpklxeg/sql');
      console.log('2. Paste and run this SQL:\n');
      console.log(`
================================================================================
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

CREATE POLICY "Allow anyone to insert" ON login_attempts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anyone to select" ON login_attempts 
  FOR SELECT USING (true);
================================================================================
      `);
      console.log('3. After running, execute: node setup-table.js again\n');
      return false;
    } else {
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      return false;
    }
  } catch (err) {
    console.error('Network error:', err.message);
    return false;
  }
}

testAndCreateTable();

