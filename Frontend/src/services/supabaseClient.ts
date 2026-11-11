import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://muwicchqaayarwrsjhrp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_n1ZwdrtpHh-VyvwBbfKYxQ_w3G0l77Q';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  message: string;
  projectUrl: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Supabase keys not configured in .env',
      projectUrl: supabaseUrl,
    };
  }

  try {
    // 1. Check Auth service session reachability
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      return {
        connected: false,
        message: `Auth check: ${authError.message}`,
        projectUrl: supabaseUrl,
      };
    }

    // 2. Ping Supabase public profiles table
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    if (dbError) {
      const lower = dbError.message ? dbError.message.toLowerCase() : '';
      if (lower.includes('api key') || lower.includes('failed to fetch') || dbError.code === 'PGRST301') {
        return {
          connected: false,
          message: `Database check: ${dbError.message}`,
          projectUrl: supabaseUrl,
        };
      }
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL',
      projectUrl: supabaseUrl,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Connection error',
      projectUrl: supabaseUrl,
    };
  }
}
