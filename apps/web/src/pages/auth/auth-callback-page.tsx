import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { supabase } from '@/lib/supabase';

/**
 * Landing page for Supabase email-confirmation and magic-link redirects.
 * Supabase's client parses the URL fragment automatically (detectSessionInUrl),
 * so this page just waits for a session to appear and then routes onward.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/app/dashboard' : '/login', { replace: true });
    });
  }, [navigate]);

  return <AuthLoadingScreen />;
}
