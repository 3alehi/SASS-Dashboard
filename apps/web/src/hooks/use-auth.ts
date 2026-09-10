import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  return {
    session,
    user,
    isAuthenticated: Boolean(session),
    isInitialized,
    fullName: (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? '',
    isEmailVerified: Boolean(user?.email_confirmed_at),
  };
}
