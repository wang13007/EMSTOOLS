import { createClient } from '@supabase/supabase-js';

// Pull from env first, then fallback for local development.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
