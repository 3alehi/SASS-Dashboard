import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env.js';

/**
 * Service-role Supabase client. Bypasses Row Level Security — use only for
 * operations that have already been authorized by application logic (e.g.
 * verifying a JWT, or reads/writes gated by an explicit permission check).
 * Never expose this client or its key to the frontend.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
