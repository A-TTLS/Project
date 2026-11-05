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
    // Ping Supabase public profiles table
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.message && error.message.toLowerCase().includes('failed to fetch')) {
      return {
        connected: false,
        message: 'Could not reach Supabase endpoint',
        projectUrl: supabaseUrl,
      };
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
