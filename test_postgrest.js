const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lmrpuxeossmzrnwwpiyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcnB1eGVvc3NtenJud3dwaXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjYxMTMsImV4cCI6MjA5OTUwMjExM30.EoUN4M6NBtpi0c6SjJArIL1MMEUjUgjgo8lhnjq8ckc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('--- TEST 1: SESSIONS ---');
  const { data: sessions, error: err1 } = await supabase
    .from('sessions')
    .select(`
      id,
      datetime,
      location,
      price_usd,
      max_slots,
      status,
      session_type_id,
      session_types (title, category)
    `)
    .limit(1);

  if (err1) {
    console.error('Error fetching sessions:', err1);
  } else {
    console.log('Sessions query success! First item structure:');
    console.log(JSON.stringify(sessions[0], null, 2));
  }

  console.log('\n--- TEST 2: BOOKINGS ---');
  const { data: bookings, error: err2 } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      payment_status,
      client_id,
      session_id,
      profiles (full_name, email),
      sessions (
        id,
        datetime,
        location,
        price_usd,
        session_types (title, category)
      )
    `)
    .limit(1);

  if (err2) {
    console.error('Error fetching bookings:', err2);
  } else {
    console.log('Bookings query success! First item structure:');
    console.log(JSON.stringify(bookings[0], null, 2));
  }
}

test();
