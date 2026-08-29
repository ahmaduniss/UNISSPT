import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client — uses service_role key, bypasses Row Level Security
export const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
