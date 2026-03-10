import { createClient } from '@supabase/supabase-js';

// Pull from env first, then fallback for local development.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hjehaiqxsekuiwwevpsi.supabase.co';
const builtInServiceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZWhhaXF4c2VrdWl3d2V2cHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTc1NjQ5NSwiZXhwIjoyMDg3MzMyNDk1fQ._zR7GEuX-em9h43KFSv4G1rSGSMPDqa32W_XrEXfcVA';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  builtInServiceRoleKey;

if (!import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[supabase] Missing env key, using built-in service role fallback key.');
}

const detectSupabaseRole = (jwt: string) => {
  try {
    const payload = jwt.split('.')[1];
    if (!payload) return 'unknown';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    const parsed = JSON.parse(json);
    return parsed?.role || 'unknown';
  } catch {
    return 'unknown';
  }
};

console.info('[supabase] client initialized:', {
  url: supabaseUrl,
  keyRole: detectSupabaseRole(supabaseKey),
});

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
