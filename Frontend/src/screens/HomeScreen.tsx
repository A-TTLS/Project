import React, { useState, useEffect } from 'react';
import {
  View,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native-web';
import { useApp, type MealItem } from '../context/AppContext';
import { loadLocalFoods, searchLocalFoods, LocalFood } from '../services/localFoodSearch';
import { EditMealModal } from '../components/EditMealModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { WaterIntakeCard } from '../components/WaterIntakeCard';
import { StepCounterCard } from '../components/StepCounterCard';
import { WeightTrendCard } from '../components/WeightTrendCard';
import {
  Screen,
  Row,
  Txt,
  Card,
  Avatar,
  IconBox,
  SectionHead,
  Btn,
  TwoToneCalorieRing,
  Icon,
  c,
} from '../ui';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const QUICK_WORKOUT_TYPES = [
  'Afternoon strength',
  'Push up',
  'Cycling',
  'Pilates',
  'Campus walk',
  'Running',
];

/**
 * Estimates kcal/min based on workout type + user weight
 * Uses MET-style rates: kcal = MET * weightKg * (minutes / 60)
 */
function estimateWorkoutCalories(minutes: number, workoutType: string, weightKg = 55): number {
  const mins = Math.max(0, Number(minutes) || 0);
  if (mins <= 0) return 0;

  const label = (workoutType || '').toLowerCase();
  const safeWeight = Number(weightKg) > 0 ? Number(weightKg) : 55;

  let met = 4.0;
  if (label.includes('push') || label.includes('strength') || label.includes('gym') || label.includes('weight')) {
    met = 4.5;
  } else if (label.includes('cycl') || label.includes('bike') || label.includes('spin')) {
    met = 6.8;
  } else if (label.includes('pilates') || label.includes('yoga') || label.includes('stretch')) {
    met = 3.2;
  } else if (label.includes('run') || label.includes('jog') || label.includes('hiit') || label.includes('cardio')) {
    met = 8.0;
  } else if (label.includes('walk') || label.includes('stroll')) {
    met = 3.5;
  } else if (label.includes('badminton') || label.includes('futsal') || label.includes('sport') || label.includes('swim')) {
    met = 7.0;
  }

  return Math.max(1, Math.round(met * safeWeight * (mins / 60)));
}

/**
 * Dynamic Emoji Helper for Meals
 * Maps meal name or category to an appropriate food emoji
 */
function getMealEmoji(name: string, category: string): string {
  const n = (name || '').toLowerCase();

  if (n.includes('pizza')) return '🍕';
  if (n.includes('burger')) return '🍔';
  if (n.includes('nasi') || n.includes('rice') || n.includes('biryani')) return '🍛';
  if (n.includes('chicken') || n.includes('ayam') || n.includes('poultry')) return '🍗';
  if (n.includes('meat') || n.includes('beef') || n.includes('steak') || n.includes('rendang')) return '🥩';
  if (n.includes('fish') || n.includes('salmon') || n.includes('tuna') || n.includes('ikan') || n.includes('seafood')) return '🐟';
  if (n.includes('noodle') || n.includes('ramen') || n.includes('mee') || n.includes('pasta') || n.includes('spaghetti')) return '🍜';
  if (n.includes('soup') || n.includes('oden') || n.includes('stew') || n.includes('broth')) return '🍲';
  if (n.includes('salad') || n.includes('veggie') || n.includes('sayur') || n.includes('bowl')) return '🥗';
  if (n.includes('sandwich') || n.includes('subway') || n.includes('wrap') || n.includes('toast')) return '🥪';
  if (n.includes('egg') || n.includes('telur') || n.includes('omelet')) return '🍳';
  if (n.includes('oat') || n.includes('cereal') || n.includes('porridge') || n.includes('bubur')) return '🥣';
  if (n.includes('bread') || n.includes('roti') || n.includes('canai') || n.includes('croissant')) return '🍞';
  if (n.includes('coffee') || n.includes('kopi') || n.includes('latte') || n.includes('espresso') || n.includes('cappuccino')) return '☕';
  if (n.includes('tea') || n.includes('teh') || n.includes('boba') || n.includes('matcha')) return '🧋';
  if (n.includes('juice') || n.includes('smoothie') || n.includes('water') || n.includes('drink')) return '🥤';
  if (n.includes('fruit') || n.includes('banana') || n.includes('apple') || n.includes('berry') || n.includes('avocado')) return '🍎';
  if (n.includes('cake') || n.includes('dessert') || n.includes('donut') || n.includes('cookie') || n.includes('pastry')) return '🍰';
  if (n.includes('snack') || n.includes('chips') || n.includes('fries') || n.includes('popcorn')) return '🍿';
  if (n.includes('sushi')) return '🍣';
  if (n.includes('taco') || n.includes('burrito')) return '🌮';

  switch (category) {
    case 'Breakfast': return '🍳';
    case 'Lunch': return '🍱';
    case 'Dinner': return '🍽️';
    case 'Snacks': return '🍎';
    default: return '🥗';
  }
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 380;
  const stackMetricCards = width < 340;
  const ringSize = width < 360 ? 156 : width < 400 ? 172 : 186;
  const ringStroke = width < 360 ? 12 : 14;

  const {
    userName,
    streakDays,
    snapPoints,
    consumedKcal,
    burnedKcal,
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    currentWeight,
    targetWeight,
    weightLogs,
    waterMl,
    stepsCount,
    workoutMins,
    workoutLabel: savedWorkoutLabel,
    todayMeals,
    addWater,
    updateSteps,
    logWorkout,
    logWeight,
    logMeal,
    updateMeal,
    deleteMeal,
    showToast,
    updateProfile,
  } = useApp();

  // ─── Manual Target Setting Modal (SCRUM-15: Set Own Target Manually) ───
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetKcalInput, setTargetKcalInput] = useState('');
  const [targetProteinInput, setTargetProteinInput] = useState('');
  const [targetCarbsInput, setTargetCarbsInput] = useState('');
  const [targetFatInput, setTargetFatInput] = useState('');

  // ─── Edit / Delete Meal Modal States (PR #14) ───
  const [mealToEdit, setMealToEdit] = useState<MealItem | null>(null);
  const [mealToDelete, setMealToDelete] = useState<MealItem | null>(null);

  // ─── Workout Modal State (PR #11) ───
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutInputMins, setWorkoutInputMins] = useState('30');
  const [workoutInputKcal, setWorkoutInputKcal] = useState(() =>
    String(estimateWorkoutCalories(30, 'Afternoon strength', currentWeight))
  );
  const [workoutInputLabel, setWorkoutInputLabel] = useState('Afternoon strength');
  const [kcalManuallyEdited, setKcalManuallyEdited] = useState(false);

  const handleOpenWorkoutModal = () => {
    const defaultMins = 30;
    const defaultLabel = savedWorkoutLabel || 'Afternoon strength';
    setKcalManuallyEdited(false);
    setWorkoutInputLabel(defaultLabel);
    setWorkoutInputMins(String(defaultMins));
    setWorkoutInputKcal(String(estimateWorkoutCalories(defaultMins, defaultLabel, currentWeight)));
    setShowWorkoutModal(true);
  };

  const handleWorkoutMinutesChange = (val: string) => {
    setWorkoutInputMins(val);
    if (!kcalManuallyEdited) {
      const mins = Math.max(0, parseInt(val, 10) || 0);
      setWorkoutInputKcal(String(estimateWorkoutCalories(mins, workoutInputLabel, currentWeight)));
    }
  };

  const handleWorkoutLabelChange = (val: string) => {
    setWorkoutInputLabel(val);
    if (!kcalManuallyEdited) {
      const mins = Math.max(0, parseInt(workoutInputMins, 10) || 0);
      setWorkoutInputKcal(String(estimateWorkoutCalories(mins, val, currentWeight)));
    }
  };

  const handleSaveWorkout = async () => {
    const mins = Math.max(0, parseInt(workoutInputMins, 10) || 0);
    const label = workoutInputLabel.trim() || 'Campus workout';
    const kcal = kcalManuallyEdited
      ? Math.max(0, parseInt(workoutInputKcal, 10) || 0)
      : estimateWorkoutCalories(mins, label, currentWeight);

    if (mins <= 0 && kcal <= 0) {
      showToast('⚠️ Enter workout minutes or calories burned');
      return;
    }

    await logWorkout(mins, kcal, label);
    setKcalManuallyEdited(false);
    setShowWorkoutModal(false);
  };

  // ─── Meals Listed in Chronological Time Order (SCRUM-33) ───
  const timeOrderMeals = [...todayMeals].sort((a, b) => {
    const parseTimeMinutes = (timeStr?: string) => {
      if (!timeStr || timeStr === 'Logged') return 9999;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 9999;
      let hrs = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && hrs < 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };
    const aMin = parseTimeMinutes(a.time);
    const bMin = parseTimeMinutes(b.time);
    if (aMin !== bMin && aMin !== 9999 && bMin !== 9999) return aMin - bMin;
    const categoryOrder: Record<string, number> = { Breakfast: 1, Lunch: 2, Dinner: 3, Snacks: 4 };
    return (categoryOrder[a.category] || 5) - (categoryOrder[b.category] || 5);
  });

  // ─── Calorie Budget Logic ───
  const safeGoal = Math.max(1, Math.round(Number(calorieGoal) || 2000));
  const safeConsumed = Math.max(0, Math.round(Number(consumedKcal) || 0));
  const safeBurned = Math.max(0, Math.round(Number(burnedKcal) || 0));
  const progressPct = Math.min(100, Math.round((safeConsumed / safeGoal) * 100));
  const remainingKcal = Math.max(0, safeGoal - safeConsumed);

  // ─── Manual Target Setting Handlers (SCRUM-15) ───
  const handleOpenTargetModal = () => {
    setTargetKcalInput(safeGoal.toString());
    setTargetProteinInput(proteinGoal.toString());
    setTargetCarbsInput(carbsGoal.toString());
    setTargetFatInput(fatGoal.toString());
    setShowTargetModal(true);
  };

  const handleAutoBalanceMacros = (kcalOverride?: number) => {
    const kcal = kcalOverride !== undefined ? kcalOverride : (parseInt(targetKcalInput, 10) || safeGoal);
    const p = Math.max(40, Math.round((kcal * 0.25) / 4));
    const f = Math.max(25, Math.round((kcal * 0.25) / 9));
    const cb = Math.max(50, Math.round((kcal - (p * 4 + f * 9)) / 4));
    setTargetProteinInput(p.toString());
    setTargetFatInput(f.toString());
    setTargetCarbsInput(cb.toString());
  };

  const handleApplyPreset = (delta: number) => {
    const current = parseInt(targetKcalInput, 10) || safeGoal;
    const newKcal = Math.max(1000, Math.min(5000, current + delta));
    setTargetKcalInput(newKcal.toString());
    handleAutoBalanceMacros(newKcal);
  };

  const handleSaveTarget = async () => {
    const newGoal = parseInt(targetKcalInput, 10) || safeGoal;
    const newProtein = parseInt(targetProteinInput, 10) || proteinGoal;
    const newCarbs = parseInt(targetCarbsInput, 10) || carbsGoal;
    const newFat = parseInt(targetFatInput, 10) || fatGoal;
    if (newGoal < 800 || newGoal > 6000) {
      showToast('⚠️ Please enter a target between 800 and 6,000 kcal');
      return;
    }
    await updateProfile({
      calorieGoal: newGoal,
      proteinGoal: newProtein,
      carbsGoal: newCarbs,
      fatGoal: newFat,
    });
    setShowTargetModal(false);
    showToast(`🎯 Daily targets updated: ${newGoal.toLocaleString()} kcal!`);
  };

  // Quick Add Meal Modal
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCategory, setMealCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  // Food Search
  const [localFoods, setLocalFoods] = useState<LocalFood[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<LocalFood[]>([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
  const [foodDatasetError, setFoodDatasetError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setIsLoadingFoods(true);
    loadLocalFoods()
      .then((foods) => {
        setLocalFoods(foods);
        setIsLoadingFoods(false);
      })
      .catch((err) => {
        setFoodDatasetError(err.message || 'Dataset not found');
        setIsLoadingFoods(false);
      });
  }, []);

  const handleMealNameChange = (text: string) => {
    setMealName(text);
    if (!text.trim()) {
      setFoodSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setFoodSuggestions(searchLocalFoods(localFoods, text));
    setShowSuggestions(true);
  };

  const handleSelectFood = (food: LocalFood) => {
    setMealName(food.name);
    setMealKcal(food.calories.toString());
    setMealProtein(food.protein_g.toString());
    setMealCarbs(food.carbs_g.toString());
    setMealFat(food.fat_g.toString());
    setShowSuggestions(false);
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleQuickAddMeal = async () => {
    if (!mealName.trim() || !mealKcal) {
      showToast('⚠️ Please enter meal name and calories');
      return;
    }
    await logMeal({
      name: mealName.trim(),
      category: mealCategory,
      meta: `${mealCategory} · Logged`,
      kcal: parseInt(mealKcal, 10) || 0,
      protein: parseFloat(mealProtein) || 0,
      carbs: parseFloat(mealCarbs) || 0,
      fat: parseFloat(mealFat) || 0,
    });
    setShowAddMealModal(false);
    setMealName('');
    setMealKcal('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
  };

  return (
    <Screen
      tab="Home"
      onSelectTab={onNavigate}
      hideTabBar={showAddMealModal || showTargetModal || showWorkoutModal || !!mealToEdit || !!mealToDelete}
    >
      {/* ─── Top Header ─── */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Row style={{ alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 8 }}>
          <Pressable onPress={() => onNavigate('Profile')} style={{ flexShrink: 0 }}>
            <Avatar size={isCompactPhone ? 42 : 46} label={userName.charAt(0)} />
          </Pressable>
          <View style={{ marginLeft: 10, flex: 1, minWidth: 0 }}>
            <Txt s={11} color={c.mute}>{todayFormatted}</Txt>
            <Txt s={isCompactPhone ? 17 : 20} w="800" style={{ lineHeight: isCompactPhone ? 22 : 26 }}>
              Hello, {userName}!
            </Txt>
          </View>
        </Row>
        <Row style={{ gap: 8, flexShrink: 0 }}>
          <IconBox label="cal" onPress={() => onNavigate('Trend · Calendar')} />
          <IconBox
            label="bell"
            onPress={() => showToast('🔔 Daily reminder: Snap your dinner by 8 PM to maintain streak!')}
          />
        </Row>
      </Row>

      {/* ─── Streak & SnapPoints Pill Row ─── */}
      <Row
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Row style={{ gap: 6, flexWrap: 'wrap' }}>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <View
              style={{
                backgroundColor: c.yellow,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#FDE047',
              }}
            >
              <Txt s={12} w="700" color={c.ink}>🔥 {streakDays}-Day Streak</Txt>
            </View>
          </Pressable>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <View
              style={{
                backgroundColor: c.blue,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#BAE6FD',
              }}
            >
              <Txt s={12} w="600" color={c.ink}>🎁 {snapPoints} pts</Txt>
            </View>
          </Pressable>
        </Row>
        <Txt s={11} color={c.mute}>Keep your rhythm</Txt>
      </Row>

      {/* ─── Main Calorie Budget Ring Card (SCRUM-33) ─── */}
      <Card bg={c.blue} style={{ alignItems: 'center', paddingVertical: 18, marginBottom: 12 }}>
        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt s={11} color="#0369A1" w="700" style={{ letterSpacing: 0.5 }}>
              DAILY CALORIE BUDGET
            </Txt>
            <Txt s={isCompactPhone ? 17 : 19} w="800" color={c.ink} style={{ marginTop: 2 }}>
              {progressPct}% of Goal
            </Txt>
          </View>

          <Pressable
            onPress={() => onNavigate('Scan')}
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              opacity: pressed ? 0.8 : 1,
              flexShrink: 0,
              cursor: 'pointer' as any,
            })}
          >
            <Icon name="camera" size={15} color={c.ink} />
            <Txt s={12} w="700">Snap Meal</Txt>
          </Pressable>
        </Row>

        {/* Center Calorie Ring */}
        <View style={{ marginVertical: 18, alignItems: 'center', justifyContent: 'center' }}>
          <TwoToneCalorieRing
            size={ringSize}
            strokeWidth={ringStroke}
            consumed={safeConsumed}
            goal={safeGoal}
            trackColor="#BAE6FD"
            progressColor="#0284C7"
          >
            <View style={{ alignItems: 'center' }}>
              <Txt
                s={isCompactPhone ? 30 : 34}
                w="800"
                color={c.ink}
                style={{ lineHeight: isCompactPhone ? 34 : 38 }}
              >
                {safeConsumed.toLocaleString()}
              </Txt>
              <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>
                / {safeGoal.toLocaleString()} kcal
              </Txt>
              <View
                style={{
                  marginTop: 7,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Txt s={10} w="700" color="#0369A1" style={{ textAlign: 'center' }}>
                  {remainingKcal > 0
                    ? `${remainingKcal.toLocaleString()} kcal left`
                    : 'Goal achieved! 🎉'}
                </Txt>
              </View>
            </View>
          </TwoToneCalorieRing>
        </View>

        {/* Eaten / Target / Remaining Summary Bar (SCRUM-33) */}
        <Row
          style={{
            alignSelf: 'stretch',
            justifyContent: 'space-around',
            paddingTop: 14,
            borderTopWidth: 1,
            borderColor: '#BAE0F3',
          }}
        >
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Txt s={11} color="#0369A1">Eaten</Txt>
            <Txt s={isCompactPhone ? 13 : 15} w="800" color={c.ink}>
              {safeConsumed.toLocaleString()} kcal
            </Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#BAE0F3' }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Txt s={11} color="#0369A1">Target</Txt>
            <Txt s={isCompactPhone ? 13 : 15} w="800">{safeGoal.toLocaleString()} kcal</Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#BAE0F3' }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Txt s={11} color="#0369A1">Remaining</Txt>
            <Txt s={isCompactPhone ? 13 : 15} w="800" color={c.ink}>
              {remainingKcal.toLocaleString()} kcal
            </Txt>
          </View>
        </Row>
      </Card>

      {/* ─── Prominent Set Daily Target CTA (SCRUM-15) ─── */}
      <Pressable
        accessibilityLabel="Set my daily calorie and macro target manually"
        onPress={handleOpenTargetModal}
        style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => ({
          width: '100%',
          backgroundColor: hovered ? '#FFE770' : c.yellow,
          borderRadius: 18,
          paddingVertical: 13,
          paddingHorizontal: 14,
          marginBottom: 14,
          borderWidth: 1.5,
          borderColor: '#F5D033',
          boxShadow: '0 4px 12px rgba(234, 179, 8, 0.22)',
          transform: [{ scale: pressed ? 0.99 : 1 }],
          cursor: 'pointer' as any,
        })}
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Row style={{ alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <Icon name="target" size={18} color="#B45309" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt s={14} w="800" color={c.ink}>Set My Daily Target</Txt>
              <Txt s={11} color="#665200">
                Current goal: {safeGoal.toLocaleString()} kcal · P:{proteinGoal}g C:{carbsGoal}g F:{fatGoal}g
              </Txt>
            </View>
          </Row>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: 999,
              flexShrink: 0,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Txt s={11} w="800" color={c.ink}>Edit ›</Txt>
          </View>
        </Row>
      </Pressable>

      {/* ─── Macronutrient Breakdown ─── */}
      <Card style={{ marginBottom: 14 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Txt w="800">Macronutrients Today</Txt>
          <Txt s={11} color={c.mute}>Target Balance</Txt>
        </Row>

        <View style={{ gap: 12 }}>
          {[
            { label: 'Protein', current: proteinGrams, goal: Math.max(1, proteinGoal), color: '#3E6B52' },
            { label: 'Carbohydrates', current: carbsGrams, goal: Math.max(1, carbsGoal), color: '#EAB308' },
            { label: 'Healthy Fats', current: fatsGrams, goal: Math.max(1, fatGoal), color: '#EF4444' },
          ].map((macro) => {
            const pct = Math.min(100, (macro.current / macro.goal) * 100);
            const over = macro.current > macro.goal;
            return (
              <View key={macro.label}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                  <Row style={{ gap: 6, alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: macro.color }} />
                    <Txt s={12} w="700">{macro.label}</Txt>
                  </Row>
                  <Txt s={12} w="700" color={over ? '#E11D48' : c.ink}>
                    {Math.round(macro.current * 10) / 10}g{' '}
                    <Txt s={11} color={c.mute}>/ {macro.goal}g</Txt>
                  </Txt>
                </Row>
                <View style={{ width: '100%', height: 7, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <View
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: over ? '#E11D48' : macro.color,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ─── Hydration & Activity Dashboard Widgets (PR #14 + Mobile Responsive) ─── */}
      <View
        style={{
          flexDirection: stackMetricCards ? 'column' : 'row',
          gap: 10,
          marginBottom: 12,
          alignItems: 'stretch',
        }}
      >
        <WaterIntakeCard
          waterMl={waterMl}
          targetMl={2000}
          onAddWater={addWater}
        />
        <StepCounterCard
          stepsCount={stepsCount}
          goalSteps={8000}
          workoutMins={workoutMins}
          burnedKcal={safeBurned}
          onUpdateSteps={updateSteps}
        />
      </View>

      {/* ─── Workout Summary Card (PR #11) ─── */}
      <Card
        bg="#FCE1D9"
        style={{
          padding: isCompactPhone ? 12 : 14,
          marginBottom: 14,
          borderColor: '#FECDD3',
        }}
      >
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Row style={{ alignItems: 'center', gap: 10, flex: 1, minWidth: 160 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Txt s={18}>🏋️</Txt>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt s={12} w="700" color="#5C362C">
                Workout · {savedWorkoutLabel || 'Afternoon strength'}
              </Txt>
              <Txt s={14} w="800" color="#2B1915" style={{ marginTop: 1 }}>
                {workoutMins} mins ·{' '}
                <Txt s={12} w="700" color="#A85A47">{safeBurned} kcal burned</Txt>
              </Txt>
            </View>
          </Row>

          <Pressable
            accessibilityLabel="Log workout"
            onPress={handleOpenWorkoutModal}
            style={({ pressed }: { pressed: boolean }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: '#FDA4AF',
              opacity: pressed ? 0.8 : 1,
              flexShrink: 0,
              cursor: 'pointer' as any,
            })}
          >
            <Icon name="plus" size={13} color="#5C362C" />
            <Txt s={11} w="800" color="#5C362C">Log Workout</Txt>
          </Pressable>
        </Row>
      </Card>

      {/* ─── Weight Trend Graph (PR #14) ─── */}
      <WeightTrendCard
        currentWeight={currentWeight}
        targetWeight={targetWeight}
        weightLogs={weightLogs}
        onLogWeight={logWeight}
      />

      {/* ─── Today's Meals Section (SCRUM-33: Listed in chronological time order) ─── */}
      <SectionHead
        title="Today's Meals"
        right={`${timeOrderMeals.length} logged`}
      />

      <Row style={{ gap: 8, marginBottom: 12 }}>
        <Pressable
          onPress={() => onNavigate('Scan')}
          style={({ pressed }: { pressed: boolean }) => ({
            flex: 1,
            minHeight: 44,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 14,
            backgroundColor: c.yellow,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            cursor: 'pointer' as any,
          })}
        >
          <Row style={{ gap: 6, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="camera" size={15} color={c.ink} />
            <Txt s={isCompactPhone ? 12 : 13} w="700">AI Camera Snap</Txt>
          </Row>
        </Pressable>

        <Pressable
          onPress={() => setShowAddMealModal(true)}
          style={({ pressed }: { pressed: boolean }) => ({
            flex: 1,
            minHeight: 44,
            paddingVertical: 10,
            paddingHorizontal: 8,
            borderRadius: 14,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            cursor: 'pointer' as any,
          })}
        >
          <Row style={{ gap: 6, justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="plus" size={14} color={c.ink} />
            <Txt s={isCompactPhone ? 12 : 13} w="700">Manual Entry</Txt>
          </Row>
        </Pressable>
      </Row>

      {/* ─── Chronological Meals List ─── */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        {timeOrderMeals.map((meal) => (
          <Card key={meal.id} style={{ padding: isCompactPhone ? 12 : 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <Row style={{ alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor:
                      meal.category === 'Breakfast' ? '#FFEFA0'
                      : meal.category === 'Lunch' ? '#DDF0D3'
                      : meal.category === 'Dinner' ? '#D8EDF8' : '#FBDAD6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {meal.imageUrl || meal.image ? (
                    <Image source={{ uri: meal.imageUrl || meal.image }} style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' as const }} />
                  ) : (
                    <Txt s={22} style={{ textAlign: 'center', lineHeight: 26 }}>{getMealEmoji(meal.name, meal.category)}</Txt>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt s={14} w="700">{meal.name}</Txt>
                  <Txt s={11} color={c.mute} style={{ marginTop: 2 }}>
                    {meal.category} · {meal.time || 'Logged'}
                  </Txt>
                  <Txt s={10} color={c.mute}>
                    P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                  </Txt>
                </View>
              </Row>

              <Row style={{ alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <View style={{ alignItems: 'flex-end', marginRight: 2 }}>
                  <Txt s={14} w="800">{meal.kcal}</Txt>
                  <Txt s={10} color={c.mute}>kcal</Txt>
                </View>
                <Pressable
                  accessibilityLabel={`Edit ${meal.name}`}
                  onPress={() => setMealToEdit(meal)}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: '#F3F4F6',
                    cursor: 'pointer' as any,
                  }}
                >
                  <Icon name="edit" size={15} color={c.ink} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Delete ${meal.name}`}
                  onPress={() => setMealToDelete(meal)}
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    backgroundColor: '#FEE2E2',
                    cursor: 'pointer' as any,
                  }}
                >
                  <Icon name="trash" size={15} color="#DC2626" />
                </Pressable>
              </Row>
            </Row>
          </Card>
        ))}

        {timeOrderMeals.length === 0 && (
          <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
            <Icon name="camera" size={32} color={c.mute} />
            <Txt s={15} w="700" style={{ marginTop: 8 }}>No meals logged yet today</Txt>
            <Txt s={12} color={c.mute} style={{ marginTop: 4, textAlign: 'center' }}>
              Snap your plate or add a meal manually to start tracking!
            </Txt>
          </Card>
        )}
      </View>

      {/* ─── Quick Log Workout Modal (PR #11) ─── */}
      {showWorkoutModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 14, zIndex: 999 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              maxHeight: '90vh',
              backgroundColor: c.card,
              borderRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Txt s={18} w="800">Log Workout</Txt>
              <Pressable onPress={() => setShowWorkoutModal(false)} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
              <View style={{ gap: 6 }}>
                <Txt s={12} color={c.mute}>Workout Type</Txt>
                <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_WORKOUT_TYPES.map((typeName) => {
                    const active = workoutInputLabel.toLowerCase() === typeName.toLowerCase();
                    return (
                      <Pressable
                        key={typeName}
                        onPress={() => {
                          setKcalManuallyEdited(false);
                          handleWorkoutLabelChange(typeName);
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: active ? c.yellow : c.bg,
                          borderWidth: 1,
                          borderColor: active ? c.ink : c.line,
                        }}
                      >
                        <Txt s={11} w={active ? '700' : '500'}>{typeName}</Txt>
                      </Pressable>
                    );
                  })}
                </Row>
                <TextInput
                  value={workoutInputLabel}
                  onChangeText={handleWorkoutLabelChange}
                  placeholder="Type any workout (e.g. Push up, Cycling, Pilates)"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B', minWidth: 0 }}
                />
              </View>

              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Txt s={12} color={c.mute}>Duration (mins)</Txt>
                  <TextInput
                    value={workoutInputMins}
                    onChangeText={handleWorkoutMinutesChange}
                    inputMode="numeric"
                    placeholder="30"
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B', minWidth: 0, width: '100%' }}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Txt s={12} color={c.mute}>Calories Burned</Txt>
                  <TextInput
                    value={workoutInputKcal}
                    onChangeText={(val: string) => {
                      setKcalManuallyEdited(true);
                      setWorkoutInputKcal(val);
                    }}
                    inputMode="numeric"
                    placeholder="105"
                    placeholderTextColor="#94A3B8"
                    style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B', minWidth: 0, width: '100%' }}
                  />
                </View>
              </Row>

              <Btn bg={c.yellow} onPress={handleSaveWorkout} style={{ marginTop: 4 }}>
                Save Workout
              </Btn>
            </ScrollView>
          </div>
        </View>
      )}

      {/* ─── Manual Add Meal Modal ─── */}
      {showAddMealModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 14, zIndex: 999 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '90vh',
              backgroundColor: c.card,
              borderRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Txt s={18} w="800">Add Meal Entry</Txt>
              <Pressable onPress={() => { setShowAddMealModal(false); setShowSuggestions(false); }} style={{ padding: 4 }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
              {/* Meal Name + Search */}
              <View style={{ gap: 4, position: 'relative', zIndex: 100 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt s={12} color={c.mute}>Meal / Dish Name</Txt>
                  {isLoadingFoods && <Txt s={10} color={c.mute}>Loading dataset...</Txt>}
                </Row>
                <TextInput
                  value={mealName}
                  onChangeText={handleMealNameChange}
                  onFocus={() => { if (mealName.trim()) setShowSuggestions(true); }}
                  placeholder="Type to search (e.g. Nasi Lemak, Chicken)..."
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B', minWidth: 0 }}
                />
                {showSuggestions && (
                  <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, maxHeight: 200, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.line, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9999, overflow: 'hidden' }}>
                    {isLoadingFoods && <View style={{ padding: 14, alignItems: 'center' }}><Txt s={12} color={c.mute}>⏳ Loading dataset...</Txt></View>}
                    {!isLoadingFoods && foodDatasetError && (
                      <View style={{ padding: 14, alignItems: 'center' }}>
                        <Txt s={12} color="#EF4444" style={{ textAlign: 'center' }}>⚠️ {foodDatasetError}</Txt>
                      </View>
                    )}
                    {!isLoadingFoods && !foodDatasetError && mealName.trim().length > 0 && foodSuggestions.length === 0 && (
                      <View style={{ padding: 14, alignItems: 'center' }}>
                        <Txt s={12} color={c.mute}>No results for '{mealName.trim()}'</Txt>
                      </View>
                    )}
                    {!isLoadingFoods && !foodDatasetError && foodSuggestions.length > 0 && (
                      <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled>
                        {foodSuggestions.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => handleSelectFood(item)}
                            style={({ hovered }: { hovered?: boolean }) => ({
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: c.line,
                              backgroundColor: hovered ? '#F3F4F6' : '#FFFFFF',
                              cursor: 'pointer' as any,
                            })}
                          >
                            <Row style={{ alignItems: 'center', gap: 10 }}>
                              {item.image_url ? <Image source={{ uri: item.image_url }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#E5E7EB' }} /> : null}
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                  <Txt s={13} w="700" style={{ flex: 1 }} numberOfLines={1}>
                                    {item.source === 'malaysian' ? '🇲🇾 ' : ''}{item.name}
                                  </Txt>
                                  <Txt s={12} w="800" color="#CA8A04" style={{ flexShrink: 0 }}>{item.calories} kcal</Txt>
                                </Row>
                                <Txt s={10} color={c.mute} style={{ marginTop: 2 }}>
                                  Per {item.serving_size} · P:{item.protein_g}g · C:{item.carbs_g}g · F:{item.fat_g}g
                                </Txt>
                              </View>
                            </Row>
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* Category */}
              <View style={{ gap: 6 }}>
                <Txt s={12} color={c.mute}>Category</Txt>
                <Row style={{ gap: 6, flexWrap: 'wrap' }}>
                  {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setMealCategory(cat)}
                      style={{
                        flex: 1,
                        minWidth: 70,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: mealCategory === cat ? c.yellow : c.bg,
                        borderWidth: 1,
                        borderColor: mealCategory === cat ? c.ink : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Txt s={11} w={mealCategory === cat ? '700' : '500'}>{cat}</Txt>
                    </Pressable>
                  ))}
                </Row>
              </View>

              <View style={{ gap: 4 }}>
                <Txt s={12} color={c.mute}>Calories (kcal)</Txt>
                <TextInput
                  value={mealKcal}
                  onChangeText={setMealKcal}
                  inputMode="numeric"
                  placeholder="e.g. 520"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B', minWidth: 0 }}
                />
              </View>

              <Row style={{ gap: 8 }}>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Protein (g)</Txt>
                  <TextInput value={mealProtein} onChangeText={setMealProtein} inputMode="decimal" placeholder="25" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B', minWidth: 0, width: '100%' }} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Carbs (g)</Txt>
                  <TextInput value={mealCarbs} onChangeText={setMealCarbs} inputMode="decimal" placeholder="55" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B', minWidth: 0, width: '100%' }} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <Txt s={11} color={c.mute}>Fat (g)</Txt>
                  <TextInput value={mealFat} onChangeText={setMealFat} inputMode="decimal" placeholder="14" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B', minWidth: 0, width: '100%' }} />
                </View>
              </Row>

              <Btn bg={c.yellow} onPress={handleQuickAddMeal} style={{ marginTop: 6 }}>
                Log Meal to Diary
              </Btn>
            </ScrollView>
          </div>
        </View>
      )}

      {/* ─── Manual Target Setting Modal (SCRUM-15: Set Own Target Manually) ─── */}
      {showTargetModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 14, zIndex: 9999 }}>
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '90vh',
              backgroundColor: c.card,
              borderRadius: 24,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt s={18} w="800">🎯 Set Daily Targets</Txt>
                <Txt s={11} color={c.mute}>Customize your calorie & macro goals manually</Txt>
              </View>
              <Pressable accessibilityLabel="Close target modal" onPress={() => setShowTargetModal(false)} style={{ padding: 4, flexShrink: 0 }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
              {/* Quick Goal Presets */}
              <View style={{ gap: 6 }}>
                <Txt s={11} w="700" color={c.mute}>QUICK GOAL PRESETS</Txt>
                <Row style={{ gap: 6, flexWrap: 'wrap' }}>
                  <Pressable
                    onPress={() => handleApplyPreset(-500)}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      flex: 1,
                      minWidth: 90,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      borderRadius: 10,
                      backgroundColor: hovered ? '#FDE68A' : '#FEF3C7',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#FDE68A',
                      cursor: 'pointer' as any,
                    })}
                  >
                    <Txt s={11} w="700" color="#92400E">-500 Deficit</Txt>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setTargetKcalInput('2000');
                      handleAutoBalanceMacros(2000);
                    }}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      flex: 1,
                      minWidth: 96,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      borderRadius: 10,
                      backgroundColor: hovered ? '#BAE6FD' : '#E0F2FE',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#BAE6FD',
                      cursor: 'pointer' as any,
                    })}
                  >
                    <Txt s={11} w="700" color="#0369A1">2,000 Standard</Txt>
                  </Pressable>
                  <Pressable
                    onPress={() => handleApplyPreset(300)}
                    style={({ hovered }: { hovered?: boolean }) => ({
                      flex: 1,
                      minWidth: 90,
                      paddingVertical: 8,
                      paddingHorizontal: 6,
                      borderRadius: 10,
                      backgroundColor: hovered ? '#BBF7D0' : '#DCFCE7',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                      cursor: 'pointer' as any,
                    })}
                  >
                    <Txt s={11} w="700" color="#15803D">+300 Surplus</Txt>
                  </Pressable>
                </Row>
              </View>

              {/* Daily Calorie Target Input */}
              <View style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Txt s={12} w="700" color={c.ink}>Daily Calorie Target (kcal)</Txt>
                  <Row style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => {
                        const cur = parseInt(targetKcalInput, 10) || safeGoal;
                        const updated = Math.max(800, cur - 100);
                        setTargetKcalInput(updated.toString());
                        handleAutoBalanceMacros(updated);
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}
                    >
                      <Txt s={11} w="700" color={c.ink}>-100</Txt>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const cur = parseInt(targetKcalInput, 10) || safeGoal;
                        const updated = Math.min(6000, cur + 100);
                        setTargetKcalInput(updated.toString());
                        handleAutoBalanceMacros(updated);
                      }}
                      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }}
                    >
                      <Txt s={11} w="700" color={c.ink}>+100</Txt>
                    </Pressable>
                  </Row>
                </Row>
                <TextInput
                  value={targetKcalInput}
                  onChangeText={(val: string) => {
                    setTargetKcalInput(val);
                    const p = parseInt(val, 10);
                    if (p && p >= 800) handleAutoBalanceMacros(p);
                  }}
                  inputMode="numeric"
                  placeholder="2000"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 11, fontSize: 16, fontWeight: '700', backgroundColor: '#FFFFFF', color: '#1E293B', minWidth: 0 }}
                />
              </View>

              {/* Macronutrient Targets */}
              <View style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <Txt s={12} w="700" color={c.ink}>Macronutrient Targets</Txt>
                  <Pressable
                    onPress={() => handleAutoBalanceMacros()}
                    style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                  >
                    <Txt s={10} w="700" color="#475569">⚡ Auto-Balance</Txt>
                  </Pressable>
                </Row>
                <Row style={{ gap: 8 }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Txt s={11} color="#3E6B52" w="700">Protein (g)</Txt>
                    <TextInput value={targetProteinInput} onChangeText={setTargetProteinInput} inputMode="numeric" placeholder="90" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, fontWeight: '600', color: '#1E293B', minWidth: 0, width: '100%' }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Txt s={11} color="#CA8A04" w="700">Carbs (g)</Txt>
                    <TextInput value={targetCarbsInput} onChangeText={setTargetCarbsInput} inputMode="numeric" placeholder="180" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, fontWeight: '600', color: '#1E293B', minWidth: 0, width: '100%' }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Txt s={11} color="#EF4444" w="700">Fats (g)</Txt>
                    <TextInput value={targetFatInput} onChangeText={setTargetFatInput} inputMode="numeric" placeholder="50" placeholderTextColor="#94A3B8" style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, fontWeight: '600', color: '#1E293B', minWidth: 0, width: '100%' }} />
                  </View>
                </Row>
              </View>

              {/* Calculated Macro Calories Sum */}
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt s={11} color={c.mute}>Macro Calories Sum</Txt>
                  <Txt s={12} w="700" color={c.ink}>
                    {((parseInt(targetProteinInput, 10) || 0) * 4 + (parseInt(targetCarbsInput, 10) || 0) * 4 + (parseInt(targetFatInput, 10) || 0) * 9).toLocaleString()} kcal
                  </Txt>
                </Row>
              </View>

              <Btn bg={c.yellow} onPress={handleSaveTarget}>
                Save Daily Targets
              </Btn>
            </ScrollView>
          </div>
        </View>
      )}

      {/* ─── Edit Meal Modal (PR #14) ─── */}
      {mealToEdit && (
        <EditMealModal
          meal={mealToEdit}
          isOpen={!!mealToEdit}
          onClose={() => setMealToEdit(null)}
          onSave={async (fields) => {
            await updateMeal(mealToEdit.id, fields);
          }}
        />
      )}

      {/* ─── Delete Meal Confirmation Dialog (PR #14) ─── */}
      {mealToDelete && (
        <DeleteConfirmModal
          meal={mealToDelete}
          isOpen={!!mealToDelete}
          onClose={() => setMealToDelete(null)}
          onConfirm={async (id) => {
            await deleteMeal(id);
          }}
        />
      )}
    </Screen>
  );
}
