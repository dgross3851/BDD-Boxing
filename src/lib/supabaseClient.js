import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmrpuxeossmzrnwwpiyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcnB1eGVvc3NtenJud3dwaXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjYxMTMsImV4cCI6MjA5OTUwMjExM30.EoUN4M6NBtpi0c6SjJArIL1MMEUjUgjgo8lhnjq8ckc';

let supabaseUrl = rawUrl.trim();
try {
  supabaseUrl = new URL(supabaseUrl).origin;
} catch (e) {
  supabaseUrl = supabaseUrl.replace(/(\/rest\/v1|\/auth\/v1|\/)+$/g, '');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


