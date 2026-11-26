import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { authService } from '../services/authService';
import type { VisionRecognitionResult } from '../services/visionService';
import { weightService, type WeightLog } from '../services/weightService';

export interface CapturedMeal {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  imageFile?: Blob | File;
  visionResult: VisionRecognitionResult;
}

export interface MealItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  meta: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  logged: boolean;
  time?: string;
  image?: string;
  imageUrl?: string;
  portionMultiplier?: number;
}

export interface VoucherItem {
  id: string;
  brand: string;
  title: string;
  points: number;
  discount: string;
  color: string;
}

export interface ClaimedVoucher {
  id: string;
  brand: string;
  title: string;
  code: string;
  expiry: string;
}

export interface SocialPost {
  id: string;
  user: string;
  place: string;
  kcal: string;
  pct: string;
  caption: string;
  streak?: number;
  avatarUrl?: string;
  image?: string;
  image_url?: string;
  likes: number;
  liked: boolean;
  comments: string[];
}

export interface GroupMember {
  name: string;
  streak: string;
  pct: string;
  slots: number;
  nudged?: boolean;
}

interface AppContextType {
  // User Authentication & Profile
  userId: string | null;
  userEmail: string;
  userName: string;
  userHandle: string;
  userBio: string;
  streakDays: number;
  snapPoints: number;
  followersCount: number;
  followingCount: number;
  groupsCount: number;
  currentWeight: number;
  targetWeight: number;
  bmi: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  setCurrentUser: (u: { id?: string; email?: string; name?: string; username?: string }) => Promise<void>;
  updateProfile: (profile: Partial<{
    name: string;
    username: string;
    bio: string;
    targetWeight: number;
    currentWeight: number;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  }>) => Promise<boolean>;
  signOut: () => Promise<void>;

  // Daily Nutrition & Metrics
  consumedKcal: number;
  burnedKcal: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterMl: number;
  stepsCount: number;
  workoutMins: number;
  todayMeals: MealItem[];
  capturedMeal: CapturedMeal | null;
  setCapturedMeal: (meal: CapturedMeal | null) => void;
  editingMeal: MealItem | null;
  setEditingMeal: (meal: MealItem | null) => void;
  addWater: (amount?: number) => void;
  updateSteps: (steps: number) => Promise<void>;
  logMeal: (meal: Omit<MealItem, 'id' | 'logged'>) => Promise<void>;
  updateMeal: (id: string, updatedFields: Partial<MealItem>) => Promise<{ success: boolean; error?: string }>;
  deleteMeal: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Weight Tracking & History
  weightLogs: WeightLog[];
  fetchWeightLogs: (timeframe?: '7D' | '30D' | 'All') => Promise<WeightLog[]>;
  logWeight: (weightKg: number, note?: string) => Promise<{ success: boolean; data?: WeightLog; error?: string }>;
  deleteWeightLog: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Rewards & Missions
  claimedVouchers: ClaimedVoucher[];
  availableVouchers: VoucherItem[];
  claimVoucher: (voucher: VoucherItem) => { success: boolean; message: string };

  // Social Community
  followingPosts: SocialPost[];
  discoverPosts: SocialPost[];
  groupMembers: GroupMember[];
  toggleLikePost: (postId: string, isDiscover?: boolean) => void;
  addPostComment: (postId: string, comment: string, isDiscover?: boolean) => void;
  nudgeMember: (memberName: string) => void;

  // Toast / Feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
  reloadUserData: () => Promise<void>;
}

export function getLocalYYYYMMDD(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayTimeRange(d: Date = new Date()): { startIso: string; endIso: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getInitialProfileCache(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const onboarding = localStorage.getItem('caloriesnap_onboarding_data');
    const profile = localStorage.getItem('caloriesnap_profile_cache');
    const parsedOnboarding = onboarding ? JSON.parse(onboarding) : {};
    const parsedProfile = profile ? JSON.parse(profile) : {};
    return { ...parsedOnboarding, ...parsedProfile };
  } catch {
    return {};
  }
}

function getInitialDayState(): {
  meals: MealItem[];
  water: number;
  steps: number;
  workout: number;
  burned: number;
} {
  if (typeof window === 'undefined') {
    return { meals: [], water: 0, steps: 0, workout: 0, burned: 0 };
  }
  try {
    const todayStr = getLocalYYYYMMDD();
    const lastActiveDate = localStorage.getItem('caloriesnap_active_date');
    if (lastActiveDate !== todayStr) {
      // It's a brand new calendar day! Reset daily caches
      localStorage.setItem('caloriesnap_active_date', todayStr);
      localStorage.removeItem('caloriesnap_today_meals');
      localStorage.removeItem('caloriesnap_today_metrics');
      return { meals: [], water: 0, steps: 0, workout: 0, burned: 0 };
    }
    const cachedMeals = localStorage.getItem('caloriesnap_today_meals');
    const cachedMetrics = localStorage.getItem('caloriesnap_today_metrics');
    const parsedMeals = cachedMeals ? JSON.parse(cachedMeals) : [];
    const parsedMetrics = cachedMetrics ? JSON.parse(cachedMetrics) : { water: 0, steps: 0, workout: 0, burned: 0 };
    return {
      meals: parsedMeals,
      water: parsedMetrics.water || 0,
      steps: parsedMetrics.steps || 0,
      workout: parsedMetrics.workout || 0,
      burned: parsedMetrics.burned || 0,
    };
  } catch {
    return { meals: [], water: 0, steps: 0, workout: 0, burned: 0 };
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialCache = getInitialProfileCache();
  const initialDay = getInitialDayState();

  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(initialCache.email || '');

  // User Profile State (Dynamic, never hardcoded to one specific person!)
  const [userName, setUserName] = useState<string>(
    initialCache.name || initialCache.full_name || 'CalorieSnap User'
  );
  const [userHandle, setUserHandle] = useState<string>(
    initialCache.username || '@user'
  );
  const [userBio, setUserBio] = useState<string>(
    initialCache.bio || 'Uni life, good food & little wins'
  );
  const [streakDays, setStreakDays] = useState<number>(initialCache.streak_days ?? 1);
  const [snapPoints, setSnapPoints] = useState<number>(initialCache.snap_points ?? 100);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(1);
  const [userHeightCm, setUserHeightCm] = useState<number>(
    Number(initialCache.height_cm) || 165
  );
  const [currentWeight, setCurrentWeight] = useState<number>(
    Number(initialCache.currentWeight ?? initialCache.current_weight_kg) || 55.0
  );
  const [targetWeight, setTargetWeight] = useState<number>(
    Number(initialCache.targetWeight ?? initialCache.target_weight_kg) || 52.0
  );
  const [bmi, setBmi] = useState<number>(() => {
    const w = Number(initialCache.currentWeight ?? initialCache.current_weight_kg) || 55.0;
    const h = (Number(initialCache.height_cm) || 165) / 100;
    const calc = Math.round((w / (h * h)) * 10) / 10;
    return calc > 10 && calc < 60 ? calc : 21.2;
  });
  const [calorieGoal, setCalorieGoal] = useState<number>(
    Number(initialCache.calorieGoal ?? initialCache.daily_calorie_target) || 1850
  );
  const [proteinGoal, setProteinGoal] = useState<number>(
    Number(initialCache.proteinGoal ?? initialCache.target_protein_g) || 90
  );
  const [carbsGoal, setCarbsGoal] = useState<number>(
    Number(initialCache.carbsGoal ?? initialCache.target_carbs_g) || 180
  );
  const [fatGoal, setFatGoal] = useState<number>(
    Number(initialCache.fatGoal ?? initialCache.target_fat_g) || 50
  );

  // Daily Metrics (Dynamic per day, cleanly resets to 0 on a new day)
  const [burnedKcal, setBurnedKcal] = useState<number>(initialDay.burned);
  const [waterMl, setWaterMl] = useState<number>(initialDay.water);
  const [stepsCount, setStepsCount] = useState<number>(initialDay.steps);
  const [workoutMins, setWorkoutMins] = useState<number>(initialDay.workout);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Meals List (Dynamic per day, clean start for each new calendar day)
  const [todayMeals, setTodayMeals] = useState<MealItem[]>(initialDay.meals);
  const [capturedMeal, setCapturedMeal] = useState<CapturedMeal | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);

  // Derived Macronutrient and Calorie Totals
  const consumedKcal = todayMeals.filter(m => m.logged).reduce((sum, m) => sum + m.kcal, 0);
  const proteinGrams = Math.round(todayMeals.filter(m => m.logged).reduce((sum, m) => sum + m.protein, 0) * 10) / 10;
  const carbsGrams = Math.round(todayMeals.filter(m => m.logged).reduce((sum, m) => sum + m.carbs, 0) * 10) / 10;
  const fatsGrams = Math.round(todayMeals.filter(m => m.logged).reduce((sum, m) => sum + m.fat, 0) * 10) / 10;

  // Rewards and Vouchers
  const [availableVouchers] = useState<VoucherItem[]>([
    {
      id: 'v1',
      brand: 'Salad Atelier',
      title: 'RM5 Off Salad Atelier',
      points: 500,
      discount: 'RM5 Off',
      color: '#DDF0D3',
    },
    {
      id: 'v2',
      brand: 'Boost Juice',
      title: '15% Off Boost Juice',
      points: 650,
      discount: '15% Off',
      color: '#D8EDF8',
    },
    {
      id: 'v3',
      brand: 'Tealive',
      title: 'Tealive Free Upsize',
      points: 300,
      discount: 'Free Upsize',
      color: '#FFEFA0',
    },
    {
      id: 'v4',
      brand: 'Subway',
      title: 'Subway 6-inch Healthy Meal',
      points: 800,
      discount: '20% Off',
      color: '#DDF0D3',
    },
  ]);

  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([
    {
      id: 'c1',
      brand: 'FamilyMart',
      title: 'RM3 Off Oden Set',
      code: 'SNAP-FM-9482',
      expiry: '28 Oct 2026',
    },
  ]);

  // Social Community Feed
  const [followingPosts, setFollowingPosts] = useState<SocialPost[]>([
    {
      id: 'p1',
      user: 'Ryan Koh · Arked Meranti',
      place: 'Lunch snap · 12:45 PM',
      kcal: '540 kcal',
      pct: '29% of daily target',
      caption: 'Nasi campur with steamed chicken, pak choy & tauhu goreng. Staying clean before evening badminton 🏸',
      likes: 18,
      liked: false,
      comments: ['Solid protein ratio bro!', 'Clean macros!'],
    },
    {
      id: 'p2',
      user: 'Aina Sofea · UTM Scholar Inn',
      place: 'Breakfast · 8:10 AM',
      kcal: '380 kcal',
      pct: '21% of daily target',
      caption: 'Avocado sourdough & soft-boiled eggs before morning lab. 8-day streak going strong! 🥑🍳',
      likes: 24,
      liked: true,
      comments: ['Inspiring streak Aina!', 'Love the aesthetic'],
    },
  ]);

  const [discoverPosts, setDiscoverPosts] = useState<SocialPost[]>([
    {
      id: 'd1',
      user: 'Marcus Chen · SUB6 Cafe',
      place: 'Post-Workout · 3:30 PM',
      kcal: '620 kcal',
      pct: '34% of daily target',
      caption: 'Grilled chicken breast wrap + iced americano. Post gym refuel! 💪',
      likes: 42,
      liked: false,
      comments: ['Gym grind!'],
    },
    {
      id: 'd2',
      user: 'Priya Nair · Scholar Mart',
      place: 'Snack snap · 4:15 PM',
      kcal: '160 kcal',
      pct: '9% of daily target',
      caption: 'Greek yogurt with fresh blueberries and chia seeds. 🫐',
      likes: 31,
      liked: false,
      comments: ['So refreshing!'],
    },
  ]);

  // Group Circle
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { name: 'Marcus Chen', streak: '🔥 14-day streak', pct: '88% of daily goal', slots: 3 },
    { name: 'Sarah Lee', streak: '🔥 9-day streak', pct: '74% of daily goal', slots: 2 },
    { name: 'Amirul Hakim', streak: '🔥 4-day streak', pct: '52% of daily goal', slots: 2 },
    { name: 'Chloe Lim', streak: '🔥 1-day streak', pct: '38% of daily goal', slots: 1 },
  ]);

  // Set Current User manually (e.g. upon login/registration)
  const setCurrentUser = async (u: { id?: string; email?: string; name?: string; username?: string }) => {
    if (u.id) setUserId(u.id);
    if (u.email) setUserEmail(u.email);
    if (u.name) setUserName(u.name);
    if (u.username) {
      const clean = u.username.startsWith('@') ? u.username : `@${u.username}`;
      setUserHandle(clean);
    }
    try {
      const prev = JSON.parse(localStorage.getItem('caloriesnap_profile_cache') || '{}');
      localStorage.setItem('caloriesnap_profile_cache', JSON.stringify({
        ...prev,
        email: u.email || prev.email,
        name: u.name || prev.name,
        username: u.username || prev.username,
      }));
    } catch {}
  };

  // Load live Supabase user & data
  const loadUserData = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setUserId(null);
        return;
      }

      setUserId(user.id);
      if (user.email) setUserEmail(user.email);

      // Immediately extract full name from auth metadata if present
      const metaFullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
      const metaUsername = user.user_metadata?.username || `@${user.email?.split('@')[0] || 'student'}`;
      setUserName(metaFullName);
      setUserHandle(metaUsername.startsWith('@') ? metaUsername : `@${metaUsername}`);

      // 1. Fetch user profile from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setUserName(profile.full_name);
        if (profile.username) {
          const raw = profile.username.startsWith('@') ? profile.username : `@${profile.username}`;
          setUserHandle(raw);
        }
        if (profile.bio) setUserBio(profile.bio);
        if (profile.streak_days !== undefined && profile.streak_days !== null) setStreakDays(profile.streak_days);
        if (profile.snap_points !== undefined && profile.snap_points !== null) setSnapPoints(profile.snap_points);
        if (profile.height_cm) setUserHeightCm(Number(profile.height_cm));
        if (profile.current_weight_kg) setCurrentWeight(Number(profile.current_weight_kg));
        if (profile.target_weight_kg) setTargetWeight(Number(profile.target_weight_kg));
        if (profile.daily_calorie_target) setCalorieGoal(profile.daily_calorie_target);
        if (profile.target_protein_g) setProteinGoal(Number(profile.target_protein_g));
        if (profile.target_carbs_g) setCarbsGoal(Number(profile.target_carbs_g));
        if (profile.target_fat_g) setFatGoal(Number(profile.target_fat_g));

        const curW = Number(profile.current_weight_kg) || currentWeight;
        const curH = Number(profile.height_cm) || userHeightCm;
        if (curH && curW) {
          const hM = curH / 100;
          const calculatedBmi = Math.round((curW / (hM * hM)) * 10) / 10;
          if (calculatedBmi > 10 && calculatedBmi < 60) setBmi(calculatedBmi);
        }

        try {
          localStorage.setItem('caloriesnap_profile_cache', JSON.stringify({
            name: profile.full_name,
            username: profile.username,
            bio: profile.bio,
            height_cm: profile.height_cm,
            currentWeight: profile.current_weight_kg,
            targetWeight: profile.target_weight_kg,
            calorieGoal: profile.daily_calorie_target,
            proteinGoal: profile.target_protein_g,
            carbsGoal: profile.target_carbs_g,
            fatGoal: profile.target_fat_g,
            streak_days: profile.streak_days,
            snap_points: profile.snap_points,
          }));
        } catch {}
      } else {
        // Self-heal: ensure profiles row exists in database for this authenticated user
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: metaFullName,
          username: metaUsername.startsWith('@') ? metaUsername : `@${metaUsername}`,
          bio: 'Uni life, good food & little wins',
          daily_calorie_target: 1850,
          streak_days: 1,
          snap_points: 100,
        }).then(() => { });
      }

      // 2. Fetch today's metrics (water, steps, workout)
      const todayStr = getLocalYYYYMMDD();
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_date', todayStr)
        .maybeSingle();

      if (metrics) {
        setWaterMl(metrics.water_ml ?? 0);
        setStepsCount(metrics.steps_count ?? 0);
        setWorkoutMins(metrics.workout_minutes ?? 0);
        setBurnedKcal(metrics.workout_calories_burned ?? 0);
        try {
          localStorage.setItem('caloriesnap_today_metrics', JSON.stringify({
            water: metrics.water_ml ?? 0,
            steps: metrics.steps_count ?? 0,
            workout: metrics.workout_minutes ?? 0,
            burned: metrics.workout_calories_burned ?? 0,
          }));
        } catch {}
      } else {
        // Clean new day metrics reset
        setWaterMl(0);
        setStepsCount(0);
        setWorkoutMins(0);
        setBurnedKcal(0);
        try {
          localStorage.setItem('caloriesnap_today_metrics', JSON.stringify({
            water: 0,
            steps: 0,
            workout: 0,
            burned: 0,
          }));
        } catch {}
      }

      // 3. Fetch today's meals within exact local day boundaries
      const { startIso, endIso } = getTodayTimeRange();
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startIso)
        .lte('logged_at', endIso)
        .order('logged_at', { ascending: false });

      if (meals && meals.length > 0) {
        const mapped: MealItem[] = meals.map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          meta: `${m.category} · Logged`,
          kcal: m.calories,
          protein: Number(m.protein_g) || 0,
          carbs: Number(m.carbs_g) || 0,
          fat: Number(m.fat_g) || 0,
          logged: true,
          time: new Date(m.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          image: m.image_url,
          imageUrl: m.image_url,
        }));
        setTodayMeals(mapped);
        try {
          localStorage.setItem('caloriesnap_today_meals', JSON.stringify(mapped));
        } catch {}
      } else {
        // Clean new day with 0 meals logged yet
        setTodayMeals([]);
        try {
          localStorage.setItem('caloriesnap_today_meals', JSON.stringify([]));
        } catch {}
      }

      // 4. Fetch All Public Posts from Supabase social_posts joined with author profile, likes, and comments
      await fetchPublicPosts(user.id);

      // 5. Fetch Weight Tracking History
      try {
        const logs = await weightService.fetchWeightLogs(user.id, 'All');
        setWeightLogs(logs);
      } catch (err) {
        console.warn('Failed to load weight logs from Supabase:', err);
      }
    } catch (err) {
      console.warn('Failed to load user data from Supabase:', err);
    }
  };

  // Helper to fetch all public social posts joined across all accounts
  const fetchPublicPosts = async (currentUserId?: string | null) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: dbPosts, error } = await supabase
        .from('social_posts')
        .select(`
          id,
          caption,
          location_name,
          image_url,
          calories,
          pct_daily_goal,
          visibility,
          created_at,
          profiles:user_id (
            full_name,
            username,
            avatar_url,
            streak_days
          ),
          post_likes (
            user_id
          ),
          post_comments (
            id,
            content,
            created_at,
            profiles:user_id (
              username,
              full_name
            )
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (dbPosts && dbPosts.length > 0) {
        const mappedPosts: SocialPost[] = dbPosts.map((p: any) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          const authorName = profile?.full_name || profile?.username || 'Campus Foodie';
          const authorStreak = profile?.streak_days || 1;
          const authorAvatar = profile?.avatar_url || undefined;
          const location = p.location_name || 'Campus Spot';
          const postDate = new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

          const likesArr = p.post_likes || [];
          const commentsArr = p.post_comments || [];

          const hasLiked = currentUserId ? likesArr.some((l: any) => l.user_id === currentUserId) : false;
          const formattedComments = commentsArr.map((cm: any) => {
            const cmAuthor = Array.isArray(cm.profiles) ? cm.profiles[0] : cm.profiles;
            const uname = cmAuthor?.username || cmAuthor?.full_name || 'peer';
            return `${uname.startsWith('@') ? uname : `@${uname}`}  ${cm.content}`;
          });

          return {
            id: p.id,
            user: authorName,
            place: `${location} · ${postDate}`,
            kcal: `${p.calories || 0} kcal`,
            pct: `${p.pct_daily_goal || 0}% of daily target`,
            caption: p.caption || '',
            streak: authorStreak,
            avatarUrl: authorAvatar,
            image: p.image_url,
            image_url: p.image_url,
            likes: likesArr.length,
            liked: hasLiked,
            comments: formattedComments,
          };
        });

        setDiscoverPosts(mappedPosts);
      }
    } catch (err) {
      console.warn('Failed to load public posts:', err);
    }
  };

  useEffect(() => {
    loadUserData();

    // ─── Realtime Subscription for social_posts across all users ───────────
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('public:social_posts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'social_posts' },
          () => {
            // Re-fetch all public posts whenever any user inserts, updates, or deletes
            void fetchPublicPosts(userId);
          }
        )
        .subscribe();
    }

    // Listen for auth state changes (login, logout, token refresh)
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          if (session.user.email) setUserEmail(session.user.email);
          const fName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student';
          const uName = session.user.user_metadata?.username || `@${session.user.email?.split('@')[0] || 'student'}`;
          setUserName(fName);
          setUserHandle(uName.startsWith('@') ? uName : `@${uName}`);
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserEmail('');
          setUserName('CalorieSnap User');
          setUserHandle('@user');
        }
      });

      return () => {
        subscription.unsubscribe();
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, []);

  useEffect(() => {
    // Check if the calendar date rolled over while app was in background or open
    const checkDayRollover = () => {
      const todayStr = getLocalYYYYMMDD();
      const lastActiveDate = localStorage.getItem('caloriesnap_active_date');
      if (lastActiveDate && lastActiveDate !== todayStr) {
        localStorage.setItem('caloriesnap_active_date', todayStr);
        setTodayMeals([]);
        setWaterMl(0);
        setStepsCount(0);
        setWorkoutMins(0);
        setBurnedKcal(0);
        try {
          localStorage.removeItem('caloriesnap_today_meals');
          localStorage.removeItem('caloriesnap_today_metrics');
        } catch {}
        void loadUserData();
      }
    };

    window.addEventListener('focus', checkDayRollover);
    document.addEventListener('visibilitychange', checkDayRollover);
    const interval = setInterval(checkDayRollover, 60000); // Check once per minute

    return () => {
      window.removeEventListener('focus', checkDayRollover);
      document.removeEventListener('visibilitychange', checkDayRollover);
      clearInterval(interval);
    };
  }, []);

  // Water Hydration Action (+250ml)
  const addWater = async (amount = 250) => {
    const newWater = Math.max(0, waterMl + amount);
    setWaterMl(newWater);
    try {
      const prevMetrics = JSON.parse(localStorage.getItem('caloriesnap_today_metrics') || '{}');
      localStorage.setItem('caloriesnap_today_metrics', JSON.stringify({ ...prevMetrics, water: newWater }));
    } catch {}
    showToast(`💧 ${amount > 0 ? '+' : ''}${amount}ml Water logged (${newWater}ml total)`);

    if (isSupabaseConfigured && userId) {
      try {
        const todayStr = getLocalYYYYMMDD();
        await supabase.from('daily_metrics').upsert({
          user_id: userId,
          metric_date: todayStr,
          water_ml: newWater,
        }, { onConflict: 'user_id,metric_date' });
      } catch (err) {
        console.warn('Failed to persist water to Supabase:', err);
      }
    }
  };

  // Log Meal Action
  const logMeal = async (newMeal: Omit<MealItem, 'id' | 'logged'>) => {
    const tempId = `m_${Date.now()}`;
    const mealItem: MealItem = {
      ...newMeal,
      imageUrl: newMeal.imageUrl || newMeal.image,
      id: tempId,
      logged: true,
      time: newMeal.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Immediately update local state and local storage cache
    setTodayMeals((prev) => {
      const updated = [mealItem, ...prev];
      try {
        localStorage.setItem('caloriesnap_today_meals', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showToast(`🥗 Logged "${newMeal.name}" (+${newMeal.kcal} kcal)`);

    // 2. Persist to Supabase if configured and authenticated
    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase.from('meals').insert({
          user_id: userId,
          name: newMeal.name,
          category: newMeal.category,
          calories: Math.round(newMeal.kcal),
          protein_g: Number(newMeal.protein) || 0,
          carbs_g: Number(newMeal.carbs) || 0,
          fat_g: Number(newMeal.fat) || 0,
          image_url: newMeal.imageUrl || newMeal.image || null,
          is_public: true, // Shared meals are viewable by all users under RLS
          logged_at: new Date().toISOString(),
        }).select().single();

        if (data) {
          setTodayMeals((prev) => {
            const updated = prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m));
            try {
              localStorage.setItem('caloriesnap_today_meals', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        if (error) {
          console.warn('Supabase meals insert error:', error.message);
        }

        // Auto-post to Discover feed after a successful meal log
        const dailyGoal = calorieGoal || 1850;
        const pct = Math.round((newMeal.kcal / dailyGoal) * 100);
        // Use the meal's image if available, otherwise a food placeholder
        const postImage =
          newMeal.image && /^https?:\/\//.test(newMeal.image) ? newMeal.image : null;

        const caption = `Just logged ${newMeal.name} for ${newMeal.category.toLowerCase()} 🍽️ ${newMeal.kcal} kcal · ${newMeal.protein}g protein`;

        await supabase.from('social_posts').insert({
          user_id: userId,
          meal_id: data?.id || null,
          location_name: 'UTM Campus',
          caption,
          image_url: postImage,
          calories: newMeal.kcal,
          pct_daily_goal: pct,
          visibility: 'public', // Explicitly public for Discover feed
          created_at: new Date().toISOString(),
        });

        // Trigger feed reload to fetch joined profiles & likes
        void fetchPublicPosts(userId);
      } catch (err) {
        console.warn('Failed to save meal to Supabase:', err);
      }
    }
  };

  // Update Steps Action
  const updateSteps = async (steps: number) => {
    const cleanSteps = Math.max(0, Math.round(steps));
    setStepsCount(cleanSteps);
    try {
      const prevMetrics = JSON.parse(localStorage.getItem('caloriesnap_today_metrics') || '{}');
      localStorage.setItem('caloriesnap_today_metrics', JSON.stringify({ ...prevMetrics, steps: cleanSteps }));
    } catch {}
    showToast(`👟 Steps updated: ${cleanSteps.toLocaleString()} steps`);

    if (isSupabaseConfigured && userId) {
      try {
        const todayStr = getLocalYYYYMMDD();
        await supabase.from('daily_metrics').upsert({
          user_id: userId,
          metric_date: todayStr,
          steps_count: cleanSteps,
        }, { onConflict: 'user_id,metric_date' });
      } catch (err) {
        console.warn('Failed to persist steps to Supabase:', err);
      }
    }
  };

  // Delete Meal Action
  const deleteMeal = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setTodayMeals((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem('caloriesnap_today_meals', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Meal removed from diary.');

    if (isSupabaseConfigured && userId && !id.startsWith('m_')) {
      try {
        const { error } = await supabase.from('meals').delete().eq('id', id).eq('user_id', userId);
        if (error) {
          console.warn('Supabase meal delete error:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.warn('Failed to delete meal in Supabase:', err);
        return { success: false, error: err?.message };
      }
    }
    return { success: true };
  };

  const updateMeal = async (id: string, updatedFields: Partial<MealItem>): Promise<{ success: boolean; error?: string }> => {
    const existing = todayMeals.find((meal) => meal.id === id);
    if (!existing) return { success: false, error: 'Meal not found' };
    const updatedMeal: MealItem = {
      ...existing,
      ...updatedFields,
      id: existing.id,
      logged: existing.logged,
      imageUrl: updatedFields.imageUrl || updatedFields.image || existing.imageUrl || existing.image,
    };
    setTodayMeals((prev) => {
      const updated = prev.map((meal) => meal.id === id ? updatedMeal : meal);
      try { localStorage.setItem('caloriesnap_today_meals', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured && userId && !id.startsWith('m_')) {
      try {
        const { error } = await supabase.from('meals').update({
          name: updatedMeal.name,
          category: updatedMeal.category,
          calories: Math.round(updatedMeal.kcal),
          protein_g: Number(updatedMeal.protein) || 0,
          carbs_g: Number(updatedMeal.carbs) || 0,
          fat_g: Number(updatedMeal.fat) || 0,
          portion_multiplier: updatedMeal.portionMultiplier ?? 1.0,
          image_url: updatedMeal.imageUrl || null,
        }).eq('id', id).eq('user_id', userId);

        if (error) {
          console.warn('Supabase meal update error:', error.message);
          showToast(`⚠️ Saved locally (cloud sync: ${error.message})`);
          return { success: false, error: error.message };
        }
      } catch (error: any) {
        console.warn('Failed to update meal in Supabase:', error);
        return { success: false, error: error?.message };
      }
    }
    showToast(`🥗 Updated "${updatedMeal.name}" (${updatedMeal.kcal} kcal)`);
    return { success: true };
  };

  // Weight Tracking Actions
  const fetchWeightLogs = async (timeframe: '7D' | '30D' | 'All' = '7D') => {
    if (!userId) return weightLogs;
    const logs = await weightService.fetchWeightLogs(userId, timeframe);
    setWeightLogs(logs);
    return logs;
  };

  const logWeight = async (weightKg: number, note?: string) => {
    const rounded = Math.round(weightKg * 10) / 10;
    setCurrentWeight(rounded);
    const hM = (userHeightCm || 165) / 100;
    const calculatedBmi = Math.round((rounded / (hM * hM)) * 10) / 10;
    if (calculatedBmi > 10 && calculatedBmi < 60) setBmi(calculatedBmi);

    const res = await weightService.logWeight(userId || 'local_user', rounded, note);
    if (res.success && res.data) {
      setWeightLogs((prev) => {
        const withoutOld = prev.filter((l) => l.id !== res.data!.id);
        const updated = [...withoutOld, res.data!].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
        return updated;
      });
      showToast(`⚖️ Weight logged: ${rounded} kg`);
    } else {
      showToast(`⚖️ Weight logged: ${rounded} kg (local)`);
    }
    return res;
  };

  const deleteWeightLog = async (id: string) => {
    const res = await weightService.deleteWeightLog(id, userId || '');
    if (res.success) {
      setWeightLogs((prev) => prev.filter((l) => l.id !== id));
      showToast('Weight log deleted.');
    }
    return res;
  };

  // Profile Update Action
  const updateProfile = async (patch: Partial<{
    name: string;
    username: string;
    bio: string;
    targetWeight: number;
    currentWeight: number;
    calorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
  }>): Promise<boolean> => {
    if (patch.name !== undefined) setUserName(patch.name);
    if (patch.username !== undefined) setUserHandle(patch.username);
    if (patch.bio !== undefined) setUserBio(patch.bio);
    if (patch.targetWeight !== undefined) setTargetWeight(patch.targetWeight);
    if (patch.currentWeight !== undefined) {
      setCurrentWeight(patch.currentWeight);
      const hM = (userHeightCm || 165) / 100;
      const calculatedBmi = Math.round((patch.currentWeight / (hM * hM)) * 10) / 10;
      if (calculatedBmi > 10 && calculatedBmi < 60) setBmi(calculatedBmi);
    }
    if (patch.calorieGoal !== undefined) setCalorieGoal(patch.calorieGoal);
    if (patch.proteinGoal !== undefined) setProteinGoal(patch.proteinGoal);
    if (patch.carbsGoal !== undefined) setCarbsGoal(patch.carbsGoal);
    if (patch.fatGoal !== undefined) setFatGoal(patch.fatGoal);

    try {
      const prev = JSON.parse(localStorage.getItem('caloriesnap_profile_cache') || '{}');
      localStorage.setItem('caloriesnap_profile_cache', JSON.stringify({
        ...prev,
        ...patch,
      }));
    } catch {}

    showToast('Profile & Goals updated!');

    if (isSupabaseConfigured && userId) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (patch.name !== undefined) updatePayload.full_name = patch.name;
        if (patch.username !== undefined) updatePayload.username = patch.username;
        if (patch.bio !== undefined) updatePayload.bio = patch.bio;
        if (patch.targetWeight !== undefined) updatePayload.target_weight_kg = patch.targetWeight;
        if (patch.currentWeight !== undefined) updatePayload.current_weight_kg = patch.currentWeight;
        if (patch.calorieGoal !== undefined) updatePayload.daily_calorie_target = patch.calorieGoal;
        if (patch.proteinGoal !== undefined) updatePayload.target_protein_g = patch.proteinGoal;
        if (patch.carbsGoal !== undefined) updatePayload.target_carbs_g = patch.carbsGoal;
        if (patch.fatGoal !== undefined) updatePayload.target_fat_g = patch.fatGoal;

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId);

        if (error) {
          console.warn('Supabase profile update warning:', error.message);
        }
      } catch (err) {
        console.warn('Failed to persist profile to Supabase:', err);
      }
    }
    return true;
  };

  // Sign Out
  const signOut = async () => {
    await authService.signOut();
    setUserId(null);
    setUserEmail('');
    setUserName('CalorieSnap User');
    setUserHandle('@user');
    setUserBio('Uni life, good food & little wins');
    setTodayMeals([]);
    setCapturedMeal(null);
    setEditingMeal(null);
    setWaterMl(0);
    setStepsCount(0);
    setWorkoutMins(0);
    setBurnedKcal(0);
    try {
      localStorage.removeItem('caloriesnap_profile_cache');
      localStorage.removeItem('caloriesnap_onboarding_data');
      localStorage.removeItem('caloriesnap_today_meals');
      localStorage.removeItem('caloriesnap_today_metrics');
    } catch {}
    showToast('Signed out successfully.');
  };

  // Claim Voucher
  const claimVoucher = (voucher: VoucherItem) => {
    if (snapPoints < voucher.points) {
      return { success: false, message: `Need ${voucher.points - snapPoints} more SnapPoints to claim this voucher.` };
    }
    setSnapPoints((p) => p - voucher.points);
    const code = `SNAP-${voucher.brand.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const claimed: ClaimedVoucher = {
      id: `c_${Date.now()}`,
      brand: voucher.brand,
      title: voucher.title,
      code,
      expiry: '31 Dec 2026',
    };
    setClaimedVouchers((prev) => [claimed, ...prev]);
    showToast(`🎁 Claimed ${voucher.title}! Code: ${code}`);

    if (isSupabaseConfigured && userId) {
      supabase.from('claimed_vouchers').insert({
        user_id: userId,
        voucher_id: voucher.id,
        voucher_code: code,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }).then(() => { });
    }

    return { success: true, message: `Claimed! Voucher added to My Wallet.` };
  };

  // Social actions
  const toggleLikePost = async (postId: string, isDiscover = false) => {
    const setter = isDiscover ? setDiscoverPosts : setFollowingPosts;
    let willLike = false;
    setter((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          willLike = !p.liked;
          return { ...p, liked: willLike, likes: willLike ? p.likes + 1 : Math.max(0, p.likes - 1) };
        }
        return p;
      })
    );

    if (isSupabaseConfigured && userId && !postId.startsWith('p') && !postId.startsWith('d')) {
      try {
        if (willLike) {
          await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
        } else {
          await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
        }
      } catch (err) {
        console.warn('Failed to persist post like to Supabase:', err);
      }
    }
  };

  const addPostComment = async (postId: string, comment: string, isDiscover = false) => {
    if (!comment.trim()) return;
    const cleanComment = comment.trim();
    const setter = isDiscover ? setDiscoverPosts : setFollowingPosts;
    setter((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, `${userHandle}  ${cleanComment}`] };
        }
        return p;
      })
    );
    showToast('Comment posted!');

    if (isSupabaseConfigured && userId && !postId.startsWith('p') && !postId.startsWith('d')) {
      try {
        await supabase.from('post_comments').insert({
          post_id: postId,
          user_id: userId,
          content: cleanComment,
        });
      } catch (err) {
        console.warn('Failed to persist post comment to Supabase:', err);
      }
    }
  };

  const nudgeMember = (memberName: string) => {
    setGroupMembers((prev) =>
      prev.map((m) => (m.name === memberName ? { ...m, nudged: true } : m))
    );
    showToast(`🔔 Nudged ${memberName} to log dinner!`);
  };

  return (
    <AppContext.Provider
      value={{
        userId,
        userEmail,
        userName,
        userHandle,
        userBio,
        streakDays,
        snapPoints,
        followersCount,
        followingCount,
        groupsCount,
        currentWeight,
        targetWeight,
        bmi,
        calorieGoal,
        proteinGoal,
        carbsGoal,
        fatGoal,
        setCurrentUser,
        updateProfile,
        signOut,

        consumedKcal,
        burnedKcal,
        proteinGrams,
        carbsGrams,
        fatsGrams,
        waterMl,
        stepsCount,
        workoutMins,
        todayMeals,
        capturedMeal,
        setCapturedMeal,
        editingMeal,
        setEditingMeal,
        addWater,
        updateSteps,
        logMeal,
        updateMeal,
        deleteMeal,

        weightLogs,
        fetchWeightLogs,
        logWeight,
        deleteWeightLog,

        claimedVouchers,
        availableVouchers,
        claimVoucher,

        followingPosts,
        discoverPosts,
        groupMembers,
        toggleLikePost,
        addPostComment,
        nudgeMember,

        toastMessage,
        showToast,
        reloadUserData: loadUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
