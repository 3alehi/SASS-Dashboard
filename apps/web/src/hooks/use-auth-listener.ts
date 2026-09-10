import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Subscribes to Supabase auth state once at the app root. Keeps useAuthStore
 * in sync with the current session across sign-in, sign-out, and token
 * refresh, and marks initialization complete once the first session check
 * resolves (used to gate route rendering while we don't yet know auth state).
 */
export function useAuthListener() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.subscription.unsubscribe();
  }, [setSession, setInitialized]);
}
