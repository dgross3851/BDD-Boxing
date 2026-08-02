const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lmrpuxeossmzrnwwpiyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcnB1eGVvc3NtenJud3dwaXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjYxMTMsImV4cCI6MjA5OTUwMjExM30.EoUN4M6NBtpi0c6SjJArIL1MMEUjUgjgo8lhnjq8ckc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('Testing signInWithPassword with dummy credentials...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    console.log('Result data:', data);
    console.log('Result error:', error);
  } catch (err) {
    console.error('Catch error:', err);
  }
}

testAuth();
