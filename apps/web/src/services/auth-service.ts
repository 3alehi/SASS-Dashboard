import { supabase } from '@/lib/supabase';

export interface AuthResult {
  error: string | null;
}

function toMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { full_name: params.fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { error: error ? toMessage(error) : null };
}

export async function signIn(params: { email: string; password: string }): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword(params);
  return { error: error ? toMessage(error) : null };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? toMessage(error) : null };
}

export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error ? toMessage(error) : null };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ? toMessage(error) : null };
}

/**
 * Changes the password for the signed-in user, first re-verifying
 * currentPassword by re-authenticating. supabase-js's updateUser() does not
 * check the old password on its own, so we confirm it explicitly here before
 * calling updateUser — otherwise "current password" would be theater.
 */
export async function changePassword(params: {
  email: string;
  currentPassword: string;
  newPassword: string;
}): Promise<AuthResult> {
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.currentPassword,
  });
  if (reauthError) {
    return { error: 'Current password is incorrect.' };
  }

  const { error } = await supabase.auth.updateUser({ password: params.newPassword });
  return { error: error ? toMessage(error) : null };
}

export async function updateProfileMetadata(params: {
  fullName: string;
  phone?: string;
}): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({
    data: { full_name: params.fullName, phone: params.phone },
  });
  return { error: error ? toMessage(error) : null };
}

export async function resendVerificationEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  return { error: error ? toMessage(error) : null };
}
