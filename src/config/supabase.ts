import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[supabase] Missing VITE_SUPABASE_URL and anon/publishable key configuration.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
