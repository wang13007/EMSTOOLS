import { createClient } from '@supabase/supabase-js';

// Pull from env first, then fallback for local development.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'sb_publishable_uMjNKMcl2FYKnYz52bBqAw_24x8ootw';

if (!import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[supabase] Missing VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_SERVICE_ROLE_KEY, using fallback key.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
