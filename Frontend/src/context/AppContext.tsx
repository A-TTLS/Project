import React, { createContext, useContext, useState, type ReactNode } from 'react';

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
  // User Profile
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
  updateProfile: (profile: Partial<{ name: string; bio: string; targetWeight: number; calorieGoal: number }>) => void;

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
  logMeal: (meal: Omit<MealItem, 'id' | 'logged'>) => void;
  deleteMeal: (id: string) => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // User Profile State
  const [userName, setUserName] = useState('Hailey Tan');
  const [userHandle] = useState('@hailey.tan');
  const [userBio, setUserBio] = useState('Uni life, good food & little wins');
  const [streakDays, setStreakDays] = useState(12);
  const [snapPoints, setSnapPoints] = useState(1450);
  const [followersCount] = useState(248);
  const [followingCount] = useState(182);
  const [groupsCount] = useState(3);
  const [currentWeight] = useState(48.5);
  const [targetWeight, setTargetWeight] = useState(48.0);
  const [bmi] = useState(19.4);
  const [calorieGoal, setCalorieGoal] = useState(1850);

  // Daily Metrics
  const [consumedKcal, setConsumedKcal] = useState(500);
  const [burnedKcal] = useState(220);
  const [proteinGrams, setProteinGrams] = useState(62.5);
  const [carbsGrams, setCarbsGrams] = useState(45.7);
  const [fatsGrams, setFatsGrams] = useState(23.6);
  const [waterMl, setWaterMl] = useState(1500);
  const [stepsCount] = useState(6840);
  const [workoutMins] = useState(30);

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
      time: '4:00 PM',
    },
  ]);

  // Vouchers
  const [availableVouchers] = useState<VoucherItem[]>([
    { id: 'v1', brand: 'Salad Atelier', title: 'RM5 Off Salad Atelier', points: 500, discount: 'RM5 Off', color: '#DDF0D3' },
    { id: 'v2', brand: 'Boost Juice', title: '15% Off Boost Juice', points: 650, discount: '15% Off', color: '#D8EDF8' },
    { id: 'v3', brand: 'Tealive', title: 'Tealive Free Upsize', points: 300, discount: 'Free Upsize', color: '#FFEFA0' },
  ]);

  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([
    { id: 'c1', brand: 'Salad Atelier', title: 'RM5 Off Salad Atelier', code: 'SNAP-SALAD-892', expiry: '30 Nov 2026' },
    { id: 'c2', brand: 'Tealive', title: 'Free Upsize Voucher', code: 'SNAP-TEA-104', expiry: '15 Dec 2026' },
  ]);

  // Social Posts
  const [followingPosts, setFollowingPosts] = useState<SocialPost[]>([
    {
      id: 'p1',
      user: '@mia.eats',
      place: 'Campus café · 24 min ago',
      kcal: 'Lunch · 490 kcal',
      pct: '72% of daily goal',
      caption: "A little colour between lectures. Who's joining me at the café tomorrow?",
      likes: 124,
      liked: false,
      comments: ['@sara  The best lunch spot on campus!'],
    },
    {
      id: 'p2',
      user: '@aiden.moves',
      place: 'North campus · 45 min ago',
      kcal: 'Lunch · 540 kcal',
      pct: '79% of daily goal',
      caption: 'Post-gym bowl secured. Now back to that assignment.',
      likes: 89,
      liked: false,
      comments: ['@hailey.tan  Great protein macro split!'],
    },
  ]);

  const [discoverPosts, setDiscoverPosts] = useState<SocialPost[]>([
    {
      id: 'd1',
      user: '@chloe.cooks',
      place: 'UTM food finds · 1 hr ago',
      kcal: 'Lunch · 490 kcal',
      pct: '72% of daily goal',
      caption: 'RM12 lunch find near the library. Fresh, filling, and just what I needed.',
      likes: 215,
      liked: false,
      comments: ['Looks amazing! Which stall?'],
    },
    {
      id: 'd2',
      user: '@sara.snaps',
      place: 'The study café · 2 hrs ago',
      kcal: 'Lunch · 380 kcal',
      pct: '65% of daily goal',
      caption: 'Study break = toast break. Keeping this one on repeat.',
      likes: 178,
      liked: false,
      comments: [],
    },
  ]);

  // Group Members
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([
    { name: 'Hailey', streak: '12d', pct: '27%', slots: 2 },
    { name: 'Mia', streak: '8d', pct: '72%', slots: 3 },
    { name: 'Aiden', streak: '14d', pct: '79%', slots: 3 },
    { name: 'Sara', streak: '8d', pct: '80%', slots: 2, nudged: false },
  ]);

  // Actions
  const addWater = (amount = 250) => {
    const next = waterMl + amount;
    setWaterMl(next);
    if (next >= 2000 && waterMl < 2000) {
      setSnapPoints((p) => p + 20);
      showToast('🎉 Reached 2L water goal! +20 SnapPoints awarded.');
    } else {
      showToast(`💧 Added ${amount}ml water (${next} / 2,000ml)`);
    }
  };

  const logMeal = (newMeal: Omit<MealItem, 'id' | 'logged'>) => {
    const id = `m_${Date.now()}`;
    const meal: MealItem = {
      ...newMeal,
      id,
      logged: true,
      meta: `${newMeal.category} · Logged`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTodayMeals((prev) => [meal, ...prev]);
    setConsumedKcal((k) => k + newMeal.kcal);
    setProteinGrams((p) => Math.round((p + newMeal.protein) * 10) / 10);
    setCarbsGrams((c) => Math.round((c + newMeal.carbs) * 10) / 10);
    setFatsGrams((f) => Math.round((f + newMeal.fat) * 10) / 10);

    // Award SnapPoints for meal logging
    setSnapPoints((pts) => pts + 50);
    showToast(`📸 Logged "${newMeal.name}" (+${newMeal.kcal} kcal) · +50 SnapPoints earned!`);
  };

  const deleteMeal = (id: string) => {
    const target = todayMeals.find((m) => m.id === id);
    if (target && target.logged) {
      setConsumedKcal((k) => Math.max(0, k - target.kcal));
      setProteinGrams((p) => Math.max(0, Math.round((p - target.protein) * 10) / 10));
      setCarbsGrams((c) => Math.max(0, Math.round((c - target.carbs) * 10) / 10));
      setFatsGrams((f) => Math.max(0, Math.round((f - target.fat) * 10) / 10));
    }
    setTodayMeals((prev) => prev.filter((m) => m.id !== id));
    showToast('Meal removed from today.');
  };

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
    return { success: true, message: `Claimed! Voucher added to My Wallet.` };
  };

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

  const updateProfile = (patch: Partial<{ name: string; bio: string; targetWeight: number; calorieGoal: number }>) => {
    if (patch.name !== undefined) setUserName(patch.name);
    if (patch.bio !== undefined) setUserBio(patch.bio);
    if (patch.targetWeight !== undefined) setTargetWeight(patch.targetWeight);
    if (patch.calorieGoal !== undefined) setCalorieGoal(patch.calorieGoal);
    showToast('Profile updated!');
  };

  return (
    <AppContext.Provider
      value={{
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
        updateProfile,

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
