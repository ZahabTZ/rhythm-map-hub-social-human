import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseServiceKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured in backend. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env');
} else {
  console.log('✅ Supabase connected in backend');
}


