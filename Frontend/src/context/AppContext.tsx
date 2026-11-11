import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { authService } from '../services/authService';

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
  addWater: (amount?: number) => void;
  logMeal: (meal: Omit<MealItem, 'id' | 'logged'>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;

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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('student@utm.my');

  // User Profile State
  const [userName, setUserName] = useState('Hui Zhen');
  const [userHandle, setUserHandle] = useState('@huizhen');
  const [userBio, setUserBio] = useState('UTM Software Engineering · Uni life, good food & little wins');
  const [streakDays, setStreakDays] = useState(12);
  const [snapPoints, setSnapPoints] = useState(1450);
  const [followersCount, setFollowersCount] = useState(248);
  const [followingCount, setFollowingCount] = useState(182);
  const [groupsCount, setGroupsCount] = useState(3);
  const [currentWeight, setCurrentWeight] = useState(48.5);
  const [targetWeight, setTargetWeight] = useState(48.0);
  const [bmi, setBmi] = useState(19.4);
  const [calorieGoal, setCalorieGoal] = useState(1850);
  const [proteinGoal, setProteinGoal] = useState(90);
  const [carbsGoal, setCarbsGoal] = useState(180);
  const [fatGoal, setFatGoal] = useState(50);

  // Daily Metrics
  const [burnedKcal, setBurnedKcal] = useState(220);
  const [waterMl, setWaterMl] = useState(1500);
  const [stepsCount, setStepsCount] = useState(6840);
  const [workoutMins, setWorkoutMins] = useState(30);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Meals List
  const [todayMeals, setTodayMeals] = useState<MealItem[]>([
    {
      id: 'm1',
      name: 'Berry overnight oats',
      category: 'Breakfast',
      meta: 'Breakfast · Logged',
      kcal: 320,
      protein: 14,
      carbs: 48,
      fat: 8,
      logged: true,
      time: '8:15 AM',
    },
    {
      id: 'm2',
      name: 'Hainanese Chicken Rice',
      category: 'Lunch',
      meta: 'Lunch · Planned',
      kcal: 580,
      protein: 38,
      carbs: 65,
      fat: 18,
      logged: false,
      time: '12:45 PM',
    },
    {
      id: 'm3',
      name: 'Salmon nourish bowl',
      category: 'Dinner',
      meta: 'Dinner · Planned',
      kcal: 420,
      protein: 32,
      carbs: 40,
      fat: 15,
      logged: false,
      time: '7:10 PM',
    },
    {
      id: 'm4',
      name: 'Yogurt & berries',
      category: 'Snacks',
      meta: 'Snacks · Logged',
      kcal: 180,
      protein: 10,
      carbs: 22,
      fat: 4,
      logged: true,
      time: '4:20 PM',
    },
  ]);

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

  // Load live Supabase user & data
  const loadUserData = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        return;
      }

      setUserId(user.id);
      if (user.email) setUserEmail(user.email);

      // 1. Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) setUserName(profile.full_name);
        if (profile.username) setUserHandle(profile.username);
        if (profile.bio) setUserBio(profile.bio);
        if (profile.streak_days !== undefined && profile.streak_days !== null) setStreakDays(profile.streak_days);
        if (profile.snap_points !== undefined && profile.snap_points !== null) setSnapPoints(profile.snap_points);
        if (profile.current_weight_kg) setCurrentWeight(Number(profile.current_weight_kg));
        if (profile.target_weight_kg) setTargetWeight(Number(profile.target_weight_kg));
        if (profile.daily_calorie_target) setCalorieGoal(profile.daily_calorie_target);
        if (profile.target_protein_g) setProteinGoal(Number(profile.target_protein_g));
        if (profile.target_carbs_g) setCarbsGoal(Number(profile.target_carbs_g));
        if (profile.target_fat_g) setFatGoal(Number(profile.target_fat_g));

        // BMI Calculation
        if (profile.height_cm && profile.current_weight_kg) {
          const hM = Number(profile.height_cm) / 100;
          const calculatedBmi = Math.round((Number(profile.current_weight_kg) / (hM * hM)) * 10) / 10;
          if (calculatedBmi > 10 && calculatedBmi < 60) setBmi(calculatedBmi);
        }
      }

      // 2. Fetch today's metrics (water, steps, workout)
      const today = new Date().toISOString().split('T')[0];
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_date', today)
        .maybeSingle();

      if (metrics) {
        if (metrics.water_ml !== undefined) setWaterMl(metrics.water_ml);
        if (metrics.steps_count !== undefined) setStepsCount(metrics.steps_count);
        if (metrics.workout_minutes !== undefined) setWorkoutMins(metrics.workout_minutes);
        if (metrics.workout_calories_burned !== undefined) setBurnedKcal(metrics.workout_calories_burned);
      }

      // 3. Fetch today's meals
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfToday.toISOString())
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
        }));
        setTodayMeals(mapped);
      }
    } catch (err) {
      console.warn('Failed to load user data from Supabase:', err);
    }
  };

  useEffect(() => {
    loadUserData();

    // Listen for auth state changes (login, logout, token refresh)
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
          setUserEmail('');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Water Hydration Action (+250ml)
  const addWater = async (amount = 250) => {
    const newWater = Math.max(0, waterMl + amount);
    setWaterMl(newWater);
    showToast(`💧 ${amount > 0 ? '+' : ''}${amount}ml Water logged (${newWater}ml total)`);

    if (isSupabaseConfigured && userId) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('daily_metrics').upsert({
          user_id: userId,
          metric_date: today,
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
      id: tempId,
      logged: true,
      time: newMeal.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTodayMeals((prev) => [mealItem, ...prev]);
    showToast(`🥗 Logged "${newMeal.name}" (+${newMeal.kcal} kcal)`);

    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase.from('meals').insert({
          user_id: userId,
          name: newMeal.name,
          category: newMeal.category,
          calories: newMeal.kcal,
          protein_g: newMeal.protein,
          carbs_g: newMeal.carbs,
          fat_g: newMeal.fat,
          image_url: newMeal.image,
          logged_at: new Date().toISOString(),
        }).select().single();

        if (data) {
          // Replace temp ID with Supabase UUID
          setTodayMeals((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m)));
        }
        if (error) throw error;
      } catch (err) {
        console.warn('Failed to save meal to Supabase:', err);
      }
    }
  };

  // Delete Meal Action
  const deleteMeal = async (id: string) => {
    setTodayMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Meal removed from today.');

    if (isSupabaseConfigured && userId && !id.startsWith('m_')) {
      try {
        await supabase.from('meals').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete meal in Supabase:', err);
      }
    }
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
    if (patch.currentWeight !== undefined) setCurrentWeight(patch.currentWeight);
    if (patch.calorieGoal !== undefined) setCalorieGoal(patch.calorieGoal);
    if (patch.proteinGoal !== undefined) setProteinGoal(patch.proteinGoal);
    if (patch.carbsGoal !== undefined) setCarbsGoal(patch.carbsGoal);
    if (patch.fatGoal !== undefined) setFatGoal(patch.fatGoal);

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
      }).then(() => {});
    }

    return { success: true, message: `Claimed! Voucher added to My Wallet.` };
  };

  // Social actions
  const toggleLikePost = (postId: string, isDiscover = false) => {
    const setter = isDiscover ? setDiscoverPosts : setFollowingPosts;
    setter((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.liked;
          return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
        }
        return p;
      })
    );
  };

  const addPostComment = (postId: string, comment: string, isDiscover = false) => {
    if (!comment.trim()) return;
    const setter = isDiscover ? setDiscoverPosts : setFollowingPosts;
    setter((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, `${userHandle}  ${comment.trim()}`] };
        }
        return p;
      })
    );
    showToast('Comment posted!');
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
        addWater,
        logMeal,
        deleteMeal,

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
