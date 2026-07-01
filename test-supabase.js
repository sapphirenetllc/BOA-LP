import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bqtqeuwrbzgenqpklxeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdHFldXdyYnpnZW5xcGtseGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODQ2NTcsImV4cCI6MjA5ODQ2MDY1N30.MgRDpRybjbfb3LPklCRaKkyFxEMC-vlv2gQ52-mykv0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');

    // Insert a test entry
    const { data, error } = await supabase
      .from('login_attempts')
      .insert([
        {
          user_id: 'test_user_001',
          password: 'test_password_encrypted',
          remember_me: false,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 Test Browser',
          status: 'Attempted'
        }
      ])
      .select();

    if (error) {
      console.log('Error inserting entry:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✓ Successfully inserted test entry!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSupabase();
