import { supabase, isSupabaseConfigured } from './supabaseClient';

// Member 5 · Forgot / reset password (Supabase Auth).
//
// Step 1: requestPasswordReset(email) → Supabase emails a reset link.
// Step 2: the link opens the app with a recovery session; Supabase fires the
//         PASSWORD_RECOVERY auth event, and the app shows the new-password form.
// Step 3: updatePassword(newPassword) saves it for the signed-in recovery session.

export const MIN_PASSWORD_LENGTH = 8;

type Result = { success: boolean; error?: string };

export async function requestPasswordReset(email: string): Promise<Result> {
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@')) return { success: false, error: 'Please enter a valid email address.' };
  if (!isSupabaseConfigured) return { success: false, error: 'Password reset needs the Supabase connection.' };

  const { error } = await supabase.auth.resetPasswordForEmail(clean, {
    // The link in the email comes back to this app (must be listed in
    // Supabase → Authentication → URL Configuration → Redirect URLs).
    redirectTo: window.location.origin,
  });

  if (error) {
    // Supabase limits how many emails can be sent per hour on the free plan.
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      return { success: false, error: 'Too many reset emails. Please wait a few minutes and try again.' };
    }
    return { success: false, error: error.message };
  }
  // Same message whether or not the email has an account, so the form does
  // not reveal who is registered.
  return { success: true };
}

export function checkNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Use both letters and numbers.';
  if (password !== confirm) return "The two passwords don't match.";
  return null;
}

export async function updatePassword(password: string): Promise<Result> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return { success: false, error: 'This reset link has expired. Please request a new one.' };
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same.*password|different from the old/i.test(error.message)) {
      return { success: false, error: 'Choose a password different from your current one.' };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}
