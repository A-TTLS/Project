import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface UserProfile {
  name: string;
  username: string;
  email: string;
}

export interface UserMeasurements {
  gender: string;
  age: string;
  height: string;
  weight: string;
  target: string;
  units: "metric" | "imperial";
}

export type ActivityLevel = "seated" | "light" | "moderate" | "very";

export const authService = {
  /**
   * Google OAuth Sign-In via Supabase
   */
  async signInWithGoogle(): Promise<{ success: boolean; user?: { email: string; name: string }; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase Google OAuth fallback:', err.message);
      }
    }

    // Demo fallback for instant UI testing if OAuth is not yet enabled in Supabase dashboard
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            email: "student@utm.my",
            name: "UTM Student",
          },
        });
      }, 500);
    });
  },

  /**
   * Email/Password Sign-In via Supabase Auth
   */
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        const fullName = data.user.user_metadata?.full_name || email.split('@')[0];
        const rawUsername = data.user.user_metadata?.username || `@${email.split('@')[0]}`;
        const username = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;

        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: fullName,
            username: username,
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to sign in." };
      }
    }

    // Offline demo fallback
    return {
      success: true,
      user: {
        email: email.trim(),
        name: email.split('@')[0],
        username: `@${email.split('@')[0]}`,
      },
    };
  },

  /**
   * New User Registration via Supabase Auth
   */
  async register(profile: UserProfile, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    if (!profile.name || !profile.username || !profile.email || !password) {
      return { success: false, error: "All registration fields are required." };
    }

    const cleanUsername = profile.username.startsWith('@') ? profile.username : `@${profile.username.trim()}`;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: profile.email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: profile.name.trim(),
              username: cleanUsername,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Also ensure a profiles row is created or synced
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: profile.email.trim().toLowerCase(),
            full_name: profile.name.trim(),
            username: cleanUsername,
            daily_calorie_target: 1850,
            streak_days: 1,
            snap_points: 100,
          }).then(() => {});
        }

        return {
          success: true,
          user: {
            id: data.user?.id,
            email: profile.email.trim(),
            name: profile.name.trim(),
            username: cleanUsername,
          },
        };
      } catch (err: any) {
        return { success: false, error: err.message || "Registration failed." };
      }
    }

    return {
      success: true,
      user: {
        email: profile.email.trim(),
        name: profile.name.trim(),
        username: cleanUsername,
      },
    };
  },

  /**
   * Save user measurement and activity goals to Supabase `profiles` table
   */
  async saveOnboarding(measurements: UserMeasurements, activity: ActivityLevel): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const imperial = measurements.units === 'imperial';
          const kg = (parseFloat(measurements.weight) || 0) / (imperial ? 2.20462 : 1);
          const targetKg = (parseFloat(measurements.target) || 0) / (imperial ? 2.20462 : 1);
          const cm = (parseFloat(measurements.height) || 0) / (imperial ? 0.393701 : 1);

          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            gender: measurements.gender,
            age: parseInt(measurements.age) || null,
            height_cm: Math.round(cm * 10) / 10,
            current_weight_kg: Math.round(kg * 10) / 10,
            target_weight_kg: Math.round(targetKg * 10) / 10,
            activity_level: activity,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase onboarding save error:', err);
      }
    }

    return true;
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
