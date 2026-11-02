/**
 * CalorieSnap Authentication & User Service
 * Designed for integration with Supabase backend (handled by Aloysius).
 */

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
   * Google Sign-In Handler
   * Triggers Supabase OAuth when backend credentials are provided,
   * or provides interactive feedback during frontend testing.
   */
  async signInWithGoogle(): Promise<{ success: boolean; user?: { email: string; name: string }; error?: string }> {
    // In production with Supabase:
    // const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return demo response for immediate UI testing
        resolve({
          success: true,
          user: {
            email: "student@utm.my",
            name: "UTM Student",
          },
        });
      }, 700);
    });
  },

  /**
   * Email/Password Sign-In
   */
  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }
    // Ready for Aloysius: await supabase.auth.signInWithPassword({ email, password });
    return { success: true };
  },

  /**
   * New User Registration
   */
  async register(profile: UserProfile, password: string): Promise<{ success: boolean; error?: string }> {
    if (!profile.name || !profile.username || !profile.email || !password) {
      return { success: false, error: "All registration fields are required." };
    }
    // Ready for Aloysius: await supabase.auth.signUp({ email, password, options: { data: profile } });
    return { success: true };
  },

  /**
   * Save user measurement and activity goals
   */
  async saveOnboarding(measurements: UserMeasurements, activity: ActivityLevel): Promise<boolean> {
    // Ready for Aloysius: await supabase.from('profiles').insert([{ ...measurements, activity }]);
    console.log("Onboarding profile saved:", { measurements, activity });
    return true;
  },
};
