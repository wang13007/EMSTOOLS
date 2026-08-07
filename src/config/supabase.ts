import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[supabase] Missing VITE_SUPABASE_URL and anon/publishable key configuration.');
}

const getJwtRole = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return String(decoded?.role || '');
  } catch {
    return '';
  }
};

if (getJwtRole(supabaseKey) === 'service_role') {
  throw new Error('[supabase] Service role keys must not be used in browser builds. Use the anon/publishable key instead.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
