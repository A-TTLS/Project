import React, { useState, useEffect } from 'react';
import { View, Pressable, TextInput, ScrollView, Image } from 'react-native-web';
import { useApp, WeightLogItem } from '../context/AppContext';
import { loadLocalFoods, searchLocalFoods, LocalFood } from '../services/localFoodSearch';
import {
  Screen,
  Row,
  Txt,
  Card,
  Pill,
  Avatar,
  IconBox,
  SectionHead,
  Btn,
  TwoToneCalorieRing,
  Icon,
  ModalOverlay,
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
 * Estimates kcal burned from minutes + workout type + current weight (kg).
 * Formula: kcal = MET * weightKg * (minutes / 60)
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

function buildRealWeightSparkline(logs: WeightLogItem[], width = 120, height = 40): string {
  const values = logs
    .map((entry) => Number(entry.weightKg))
    .filter((v) => Number.isFinite(v) && v > 0);
/**
 * Animated Athlete Lifting Dumbbells SVG for Workout Card
 */
function AnimatedWorkoutIcon({ active }: { active: boolean }) {
  const dur = active ? '0.85s' : '1.45s';
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FECDD3',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        style={{ overflow: 'visible' }}
      >
        {/* Subtle peak energy sparks */}
        <g className="cs-workout-spark" style={{ animationDuration: dur }}>
          <line x1="14" y1="1.8" x2="14" y2="4" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10.2" y1="3.2" x2="11.5" y2="4.9" stroke="#FB7185" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="17.8" y1="3.2" x2="16.5" y2="4.9" stroke="#FB7185" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Torso & head with gentle press brace */}
        <g className="cs-workout-torso" style={{ animationDuration: dur }}>
          <circle cx="14" cy="14" r="2.3" fill="#7F1D1D" />
          <path d="M10.2 18.2 C10.2 16.5, 17.8 16.5, 17.8 18.2 L17.1 24.5 L10.9 24.5 Z" fill="#9F1239" />
          <path d="M10.4 18 L6.2 15.5" stroke="#9F1239" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M17.6 18 L21.8 15.5" stroke="#9F1239" strokeWidth="2.1" strokeLinecap="round" />
        </g>

        {/* Forearms synced with dumbbell press height */}
        <g className="cs-workout-arm" style={{ transformOrigin: '6.2px 15.5px', animationDuration: dur }}>
          <line x1="6.2" y1="15.5" x2="6.2" y2="9.5" stroke="#7F1D1D" strokeWidth="2.1" strokeLinecap="round" />
        </g>
        <g className="cs-workout-arm" style={{ transformOrigin: '21.8px 15.5px', animationDuration: dur }}>
          <line x1="21.8" y1="15.5" x2="21.8" y2="9.5" stroke="#7F1D1D" strokeWidth="2.1" strokeLinecap="round" />
        </g>

        {/* Dumbbells pressing up and down */}
        <g className="cs-workout-lift" style={{ animationDuration: dur }}>
          <line x1="2.9" y1="9.5" x2="9.5" y2="9.5" stroke="#5C362C" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="2.1" y="7.1" width="1.9" height="4.8" rx="0.8" fill="#E11D48" />
          <rect x="8.4" y="7.1" width="1.9" height="4.8" rx="0.8" fill="#E11D48" />
          <line x1="18.5" y1="9.5" x2="25.1" y2="9.5" stroke="#5C362C" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="17.7" y="7.1" width="1.9" height="4.8" rx="0.8" fill="#E11D48" />
          <rect x="24" y="7.1" width="1.9" height="4.8" rx="0.8" fill="#E11D48" />
        </g>
      </svg>
    </View>
  );
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const isCompactPhone = width < 380;
  const stackMetricCards = width < 340;
  const ringSize = width < 360 ? 156 : width < 400 ? 172 : 186;
  const ringStroke = width < 360 ? 12 : 14;

  if (values.length < 2) {
    const midY = height / 2;
    return `M 4 ${midY} L ${width - 4} ${midY}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padX = 4;
  const padY = 6;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const pts = values.map((val, idx) => {
    const x = padX + (idx / (values.length - 1)) * usableW;
    const norm = max === min ? 0.5 : (max - val) / (max - min);
    const y = padY + norm * usableH;
    return { x, y };
  });

  return pts.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = arr[i - 1];
    const cx = ((prev.x + pt.x) / 2).toFixed(1);
    return `${acc} C ${cx} ${prev.y.toFixed(1)}, ${cx} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
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
    weightHistory = [],
    waterMl,
    stepsCount,
    workoutMins,
    workoutLabel: contextWorkoutLabel,
    todayMeals,
    addWater,
    addSteps,
    logWeight,
    logWorkout,
    logMeal,
    deleteMeal,
    setEditingMeal,
    setCapturedMeal,
    showToast,
  } = useApp();

  // Water history stack for reliable Undo (Ctrl+Z style)
  const [waterHistory, setWaterHistory] = useState<number[]>([]);
  const [workoutLabel, setWorkoutLabel] = useState<string>(contextWorkoutLabel || 'Afternoon strength');

  useEffect(() => {
    if (contextWorkoutLabel) {
      setWorkoutLabel(contextWorkoutLabel);
    }
  }, [contextWorkoutLabel]);

  // Weight Modal State
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInputKg, setWeightInputKg] = useState('');
  const [weightInputNote, setWeightInputNote] = useState('');

  // Steps Modal State
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [stepsInput, setStepsInput] = useState('1500');

  // Workout Modal State
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutInputMins, setWorkoutInputMins] = useState('30');
  const [workoutInputKcal, setWorkoutInputKcal] = useState(() =>
    String(estimateWorkoutCalories(30, 'Afternoon strength', currentWeight))
  );
  const [workoutInputLabel, setWorkoutInputLabel] = useState('Afternoon strength');
  const [kcalManuallyEdited, setKcalManuallyEdited] = useState(false);

  const handleAddWater = (amount: number) => {
    setWaterHistory((prev) => [...prev, amount]);
    addWater(amount);
  };

  const handleUndoWater = () => {
    const currentWater = Number(waterMl) || 0;
    if (currentWater <= 0) return;

    const lastAmount = waterHistory.length > 0 ? waterHistory[waterHistory.length - 1] : 250;
    const undoAmount = Math.min(lastAmount, currentWater);

    setWaterHistory((prev) => prev.slice(0, -1));
    addWater(-undoAmount);
  };

  const handleOpenWeightModal = () => {
    setWeightInputKg(currentWeight ? Number(currentWeight).toFixed(1) : '');
    setWeightInputNote('');
    setShowWeightModal(true);
  };

  const handleSaveWeight = async () => {
    const parsed = parseFloat(weightInputKg);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast('⚠️ Please enter a valid weight in kg');
      return;
    }
    await logWeight(parsed, weightInputNote);
    setShowWeightModal(false);
  };

  const handleSaveSteps = async () => {
    const added = Math.max(0, parseInt(stepsInput, 10) || 0);
    if (added <= 0) {
      showToast('⚠️ Please enter steps greater than 0');
      return;
    }
    await addSteps(added);
    setShowStepsModal(false);
  };

  const handleOpenWorkoutModal = () => {
    const defaultMins = 30;
    const defaultLabel = 'Afternoon strength';
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

    setWorkoutLabel(label);
    await logWorkout(mins, kcal, label);
    setKcalManuallyEdited(false);
    setShowWorkoutModal(false);
  };

  // Quick Add Meal Modal State
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCategory, setMealCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch');
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  // Food Search Dataset & Autocomplete State
  const [localFoods, setLocalFoods] = useState<LocalFood[]>([]);
  const [foodSuggestions, setFoodSuggestions] = useState<LocalFood[]>([]);
  const [isLoadingFoods, setIsLoadingFoods] = useState(false);
  const [foodDatasetError, setFoodDatasetError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setIsLoadingFoods(true);
    setFoodDatasetError(null);

    loadLocalFoods()
      .then((foods) => {
        setLocalFoods(foods);
        setIsLoadingFoods(false);
      })
      .catch((err) => {
        setFoodDatasetError(err.message || 'Dataset file not found or failed to parse');
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
    const filtered = searchLocalFoods(localFoods, text);
    setFoodSuggestions(filtered);
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

  const displayWorkoutMins = Math.max(0, Number(workoutMins) || 0);
  const displayBurnedKcal = Math.max(0, Number(burnedKcal) || 0);

  const safeGoal = Math.max(1, Number(calorieGoal) || 2000);
  const safeConsumed = Math.max(0, Number(consumedKcal) || 0);
  const safeBurned = Math.max(0, displayBurnedKcal);
  const remainingKcal = Math.max(0, Math.round(safeGoal - safeConsumed + safeBurned));
  const progressPct = Math.min(100, Math.round((safeConsumed / safeGoal) * 100));

  const safeCurrentWeight = Number(currentWeight) || 0;
  const safeTargetWeight = Number(targetWeight) || 0;
  const realWeightSeries: WeightLogItem[] =
    Array.isArray(weightHistory) && weightHistory.length > 0
      ? weightHistory
      : safeCurrentWeight > 0
      ? [{ id: 'current-only', weightKg: safeCurrentWeight, recordedAt: new Date().toISOString() }]
      : [];
  const hasMultipleWeightPoints = realWeightSeries.length >= 2;
  const weightSparkPath = buildRealWeightSparkline(realWeightSeries);

  const safeWaterMl = Math.max(0, Number(waterMl) || 0);
  const waterGoalMl = 2000;
  const waterSegments = 8;
  const filledWaterSegments = Math.min(
    waterSegments,
    Math.max(0, Math.floor(safeWaterMl / (waterGoalMl / waterSegments)))
  );

  const safeSteps = Math.max(0, Number(stepsCount) || 0);
  const stepsGoal = 10000;
  const stepsRatio = Math.min(1, safeSteps / stepsGoal);
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - stepsRatio);

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
      hideTabBar={showAddMealModal || showWorkoutModal || showWeightModal || showStepsModal}
    >
      {/* Top Header */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Row style={{ alignItems: 'center' }}>
          <Pressable onPress={() => onNavigate('Profile')}>
            <Avatar size={46} label={userName.charAt(0)} />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Txt s={11} color={c.mute}>{todayFormatted}</Txt>
            <Txt s={20} w="800">Hello, {userName}!</Txt>
          </View>
        </Row>
        <Row style={{ gap: 8 }}>
          <IconBox
            label="cal"
            onPress={() => onNavigate('Trend · Calendar')}
          />
          <IconBox
            label="bell"
            onPress={() => showToast('🔔 Daily reminder: Snap your dinner by 8 PM to maintain streak!')}
          />
        </Row>
      </Row>

      {/* Streak & SnapPoints Pill Row */}
      <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Row style={{ gap: 8 }}>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <Pill active bg={c.yellow}>🔥 {streakDays}-Day Streak</Pill>
          </Pressable>
          <Pressable onPress={() => onNavigate('Rewards')}>
            <Pill bg={c.blue}>🎁 {snapPoints} pts</Pill>
          </Pressable>
        </Row>
        <Txt s={11} color={c.mute}>Keep your rhythm</Txt>
      </Row>

      {/* Main Calorie Budget Ring Card */}
      <Card bg={c.blue} style={{ alignItems: 'center', paddingVertical: 20, marginBottom: 16 }}>
        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Txt s={12} color="#40718A" w="700">DAILY CALORIE BUDGET</Txt>
            <Txt s={18} w="800">{progressPct}% of Goal</Txt>
          </View>
          <Pressable
            onPress={() => onNavigate('Scan')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fff',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <Icon name="camera" size={16} color={c.ink} />
            <Txt s={12} w="700">Snap Meal</Txt>
          </Pressable>
        </Row>

        <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <TwoToneCalorieRing
            size={190}
            strokeWidth={14}
            consumed={safeConsumed}
            goal={safeGoal}
            trackColor="#E0F2FE"
            progressColor="#0284C7"
          >
            <View style={{ alignItems: 'center' }}>
              <Txt s={38} w="800">{safeConsumed.toLocaleString()}</Txt>
              <Txt s={12} color={c.mute}>/ {safeGoal.toLocaleString()} kcal</Txt>
              <View style={{ marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: '#E0F2FE' }}>
                <Txt s={10} w="700" color="#0369A1">
                  {remainingKcal > 0 ? `${remainingKcal.toLocaleString()} kcal left` : 'Goal achieved! 🎉'}
                </Txt>
              </View>
            </View>
          </TwoToneCalorieRing>
        </View>

        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-around', paddingTop: 14, borderTopWidth: 1, borderColor: '#C4E4F3' }}>
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Consumed</Txt>
            <Txt s={15} w="800">{safeConsumed} kcal</Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#C4E4F3' }} />
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Burned</Txt>
            <Txt s={15} w="800">{safeBurned} kcal</Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#C4E4F3' }} />
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Remaining</Txt>
            <Txt s={15} w="800">{remainingKcal} kcal</Txt>
          </View>
        </Row>
      </Card>

      {/* Macronutrient Breakdown */}
      <Card style={{ marginBottom: 18 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Txt w="800">Macronutrients Today</Txt>
          <Txt s={11} color={c.mute}>Target Balance</Txt>
        </Row>

        <View style={{ gap: 12 }}>
          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3E6B52' }} />
                <Txt s={12} w="700">Protein</Txt>
              </Row>
              <Txt s={12} w="700">{proteinGrams}g <Txt s={11} color={c.mute}>/ {proteinGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (proteinGrams / Math.max(1, proteinGoal)) * 100)}%`, height: '100%', backgroundColor: '#3E6B52', borderRadius: 4 }} />
            </View>
          </View>

          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAB308' }} />
                <Txt s={12} w="700">Carbohydrates</Txt>
              </Row>
              <Txt s={12} w="700">{carbsGrams}g <Txt s={11} color={c.mute}>/ {carbsGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (carbsGrams / Math.max(1, carbsGoal)) * 100)}%`, height: '100%', backgroundColor: '#EAB308', borderRadius: 4 }} />
            </View>
          </View>

          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                <Txt s={12} w="700">Healthy Fats</Txt>
              </Row>
              <Txt s={12} w="700">{fatsGrams}g <Txt s={11} color={c.mute}>/ {fatGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (fatsGrams / Math.max(1, fatGoal)) * 100)}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </Card>

      {/* A Little Everyday Balance (2x2 Grid: Weight, Water, Steps, Workout) */}
      <View style={{ marginBottom: 18 }}>
        <Txt s={18} w="800" color="#1E293B" style={{ marginBottom: 12 }}>
          A little everyday balance
        </Txt>

        {/* Row 1: Weight + Water */}
        <Row style={{ gap: 12, marginBottom: 12, alignItems: 'stretch' }}>
          {/* 1. Weight Card */}
          <Pressable
            accessibilityLabel="Log weight"
            onPress={handleOpenWeightModal}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 16,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.04)',
              justifyContent: 'space-between',
              minHeight: 205,
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={13} w="600" color="#64748B">Weight</Txt>
              <Txt s={14} color="#334155">⚖️</Txt>
            </Row>

            <View style={{ marginVertical: 6 }}>
              <Row style={{ alignItems: 'baseline', gap: 4 }}>
                <Txt s={30} w="800" color="#0F172A">
                  {safeCurrentWeight > 0 ? safeCurrentWeight.toFixed(1) : '--'}
                </Txt>
                <Txt s={13} w="500" color="#64748B">kg</Txt>
              </Row>

              <svg
                viewBox="0 0 120 40"
                style={{ width: '100%', height: 40, marginTop: 8, overflow: 'visible' }}
                aria-label="Real weight history sparkline"
              >
                <path
                  d={weightSparkPath}
                  fill="none"
                  stroke="#4D7C43"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {!hasMultipleWeightPoints && (
                  <circle cx="60" cy="20" r="4" fill="#4D7C43" />
                )}
              </svg>
            </View>

            <View>
              <Txt s={11} w="500" color="#64748B">
                {safeTargetWeight > 0 ? `Target ${safeTargetWeight.toFixed(1)} kg` : 'Tap to log weight'}
              </Txt>
              {!hasMultipleWeightPoints && (
                <Txt s={10} color="#94A3B8" style={{ marginTop: 2 }}>
                  Log 2+ weights for trend curve
                </Txt>
              )}
            </View>
          </Pressable>

          {/* 2. Water Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#DDF2FC',
              borderRadius: 24,
              padding: 16,
              justifyContent: 'space-between',
              minHeight: 205,
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={13} w="600" color="#334155">Water</Txt>
              <Icon name="water" size={16} color="#1E293B" />
            </Row>

            <View style={{ marginVertical: 4 }}>
              <Txt s={28} w="800" color="#0F172A">
                {safeWaterMl.toLocaleString()}
              </Txt>
              <Txt s={11} w="500" color="#475569" style={{ marginBottom: 10 }}>
                / {waterGoalMl.toLocaleString()} ml
              </Txt>

              <Row style={{ gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                {Array.from({ length: waterSegments }).map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      height: 22,
                      borderRadius: 999,
                      backgroundColor: idx < filledWaterSegments ? '#2B5B78' : 'rgba(255,255,255,0.85)',
                    }}
                  />
                ))}
              </Row>
            </View>

            <Row style={{ gap: 6, alignItems: 'center' }}>
              <Pressable
                onPress={() => handleAddWater(250)}
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 999,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                }}
              >
                <Txt s={12} w="800" color="#0F172A">+250ml</Txt>
              </Pressable>

              <Pressable
                accessibilityLabel="Undo water entry"
                disabled={safeWaterMl <= 0}
                onPress={handleUndoWater}
                style={{
                  backgroundColor: safeWaterMl > 0 ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: safeWaterMl > 0 ? '0 2px 6px rgba(15, 23, 42, 0.05)' : undefined,
                }}
              >
                <Txt s={11} w="700" color={safeWaterMl > 0 ? '#334155' : '#94A3B8'}>
                  ↩ Undo
                </Txt>
              </Pressable>
            </Row>
          </View>
        </Row>

        {/* Row 2: Steps + Workout */}
        <Row style={{ gap: 12, alignItems: 'stretch' }}>
          {/* 3. Steps Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#DCF3D4',
              borderRadius: 24,
              padding: 16,
              justifyContent: 'space-between',
              minHeight: 200,
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={13} w="600" color="#2D4729">Steps</Txt>
              <Pressable
                accessibilityLabel="Add steps"
                onPress={() => setShowStepsModal(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
                }}
              >
                <Icon name="plus" size={14} color="#2D4729" />
              </Pressable>
            </Row>

            <Pressable
              onPress={() => onNavigate('Trend')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 }}
            >
              <svg width="52" height="52" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  fill="none"
                  stroke="#B6DFAB"
                  strokeWidth="5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={ringRadius}
                  fill="none"
                  stroke="#436F3B"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringDashOffset}
                />
              </svg>

              <Txt s={24} w="800" color="#1A2E18">
                {safeSteps.toLocaleString()}
              </Txt>
            </Pressable>

            <View>
              <Txt s={11} w="500" color="#3C5E37">
                / {stepsGoal.toLocaleString()} steps
              </Txt>
              <Txt s={11} w="500" color="#3C5E37" style={{ marginTop: 2 }}>
                Your campus walks count.
              </Txt>
            </View>
          </View>

          {/* 4. Workout Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FCE1D9',
              borderRadius: 24,
              padding: 16,
              justifyContent: 'space-between',
              minHeight: 200,
            }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={13} w="600" color="#5C362C">Workout</Txt>
              <Pressable
                accessibilityLabel="Log workout"
                onPress={handleOpenWorkoutModal}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.06)',
                }}
              >
                <Icon name="plus" size={14} color="#334155" />
              </Pressable>
            </Row>

            <View style={{ marginVertical: 6 }}>
              <Row style={{ alignItems: 'baseline', gap: 4 }}>
                <Txt s={30} w="800" color="#2B1915">{displayWorkoutMins}</Txt>
                <Txt s={13} w="500" color="#6E453B">mins</Txt>
              </Row>

              <Txt s={11} w="700" color="#A85A47" style={{ marginTop: 6 }}>
                {displayBurnedKcal} kcal burned
              </Txt>
            </View>

            <Row style={{ alignItems: 'center', gap: 5 }}>
              <Txt s={12} color="#9E5644">🏋️</Txt>
              <Txt s={11} w="500" color="#9E5644" numberOfLines={1} style={{ flex: 1 }}>
                {workoutLabel}
              </Txt>
            </Row>
          </View>
        </Row>
      </View>

      {/* Today's Meals Section */}
      <SectionHead
        title="Today's Meals"
        right={`${todayMeals.length} logged`}
      />

      <Row style={{ gap: 8, marginBottom: 12 }}>
        <Btn
          bg={c.yellow}
          onPress={() => onNavigate('Scan')}
          style={{ flex: 1, height: 42, borderRadius: 12 }}
        >
          <Row style={{ gap: 6, justifyContent: 'center' }}>
            <Icon name="camera" size={16} color={c.ink} />
            <Txt s={13} w="700">AI Camera Snap</Txt>
          </Row>
        </Btn>
        <Btn
          bg={c.card}
          onPress={() => setShowAddMealModal(true)}
          style={{ flex: 1, height: 42, borderRadius: 12, borderWidth: 1, borderColor: c.line }}
        >
          <Row style={{ gap: 6, justifyContent: 'center' }}>
            <Icon name="plus" size={14} color={c.ink} />
            <Txt s={13} w="700">Manual Entry</Txt>
          </Row>
        </Btn>
      </Row>

      {/* Meals List */}
      <View style={{ gap: 10, marginBottom: 24 }}>
        {todayMeals.map((meal: any) => (
          <Card key={meal.id} style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Row style={{ alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor:
                      meal.category === 'Breakfast'
                        ? '#FFEFA0'
                        : meal.category === 'Lunch'
                        ? '#DDF0D3'
                        : meal.category === 'Dinner'
                        ? '#D8EDF8'
                        : '#FBDAD6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {meal.imageUrl || meal.image ? (
                    <Image
                      source={{ uri: meal.imageUrl || meal.image }}
                      style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' as const }}
                    />
                  ) : (
                    <Txt s={22} style={{ textAlign: 'center', lineHeight: 26 }}>
                      {getMealEmoji(meal.name, meal.category)}
                    </Txt>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Row style={{ alignItems: 'center', gap: 6 }}>
                    <Txt s={14} w="700">{meal.name}</Txt>
                  </Row>
                  <Txt s={11} color={c.mute}>
                    {meal.category} · {meal.time || 'Logged'} · P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                  </Txt>
                </View>
              </Row>

              <Row style={{ alignItems: 'center', gap: 8 }}>
                <Txt s={15} w="800">{meal.kcal} <Txt s={11} color={c.mute}>kcal</Txt></Txt>
                <Pressable
                  accessibilityLabel={`Edit ${meal.name}`}
                  onPress={() => {
                    setEditingMeal(meal);
                    setCapturedMeal(null);
                    onNavigate('Scan Result');
                  }}
                  style={{ padding: 4 }}
                >
                  <Icon name="edit" size={16} color={c.ink} />
                </Pressable>
                <Pressable
                  onPress={() => deleteMeal(meal.id)}
                  style={{ padding: 4 }}
                >
                  <Icon name="trash" size={16} color="#C0504A" />
                </Pressable>
              </Row>
            </Row>
          </Card>
        ))}

        {todayMeals.length === 0 && (
          <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Icon name="camera" size={32} color={c.mute} />
            <Txt s={15} w="700" style={{ marginTop: 8 }}>No meals logged yet today</Txt>
            <Txt s={12} color={c.mute} style={{ marginTop: 4 }}>Snap your plate or log a meal to start your streak!</Txt>
          </Card>
        )}
      </View>

      {/* Quick Log Weight Modal */}
      {showWeightModal && (
        <View
          style={{
            position: 'fixed' as any,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 999,
          }}
        >
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Log Weight</Txt>
              <Pressable onPress={() => setShowWeightModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Current Weight (kg)</Txt>
              <TextInput
                value={weightInputKg}
                onChangeText={setWeightInputKg}
                inputMode="decimal"
                placeholder="e.g. 54.5"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Note (optional)</Txt>
              <TextInput
                value={weightInputNote}
                onChangeText={setWeightInputNote}
                placeholder="e.g. Morning weigh-in"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
              />
            </View>

            <Btn bg={c.yellow} onPress={handleSaveWeight} style={{ marginTop: 4 }}>
              Save Weight Entry
            </Btn>
          </View>
        </View>
      )}

      {/* Quick Log Steps Modal */}
      {showStepsModal && (
        <View
          style={{
            position: 'fixed' as any,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 999,
          }}
        >
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Add Campus Steps</Txt>
              <Pressable onPress={() => setShowStepsModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <View style={{ gap: 4 }}>
              <Txt s={12} color={c.mute}>Steps to Add</Txt>
              <TextInput
                value={stepsInput}
                onChangeText={setStepsInput}
                inputMode="numeric"
                placeholder="e.g. 1500"
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
              />
            </View>

            <Btn bg={c.yellow} onPress={handleSaveSteps} style={{ marginTop: 4 }}>
              Add Steps
            </Btn>
          </View>
        </View>
      )}

      {/* Quick Log Workout Modal */}
      {showWorkoutModal && (
        <View
          style={{
            position: 'fixed' as any,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 999,
          }}
        >
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Log Workout</Txt>
              <Pressable onPress={() => setShowWorkoutModal(false)}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

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
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
              />
            </View>

            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={12} color={c.mute}>Duration (mins)</Txt>
                <TextInput
                  value={workoutInputMins}
                  onChangeText={handleWorkoutMinutesChange}
                  inputMode="numeric"
                  placeholder="30"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={12} color={c.mute}>Calories Burned (auto/edit)</Txt>
                <TextInput
                  value={workoutInputKcal}
                  onChangeText={(val) => {
                    setKcalManuallyEdited(true);
                    setWorkoutInputKcal(val);
                  }}
                  inputMode="numeric"
                  placeholder="105"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
                />
              </View>
            </Row>

            <Btn bg={c.yellow} onPress={handleSaveWorkout} style={{ marginTop: 4 }}>
              Save Workout
            </Btn>
          </View>
        </View>
      )}

      {/* Manual Add Meal Modal */}
      {showAddMealModal && (
        <View
          style={{
            position: 'fixed' as any,
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
            zIndex: 999,
          }}
        >
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14, overflow: 'visible' }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Add Meal Entry</Txt>
              <Pressable onPress={() => { setShowAddMealModal(false); setShowSuggestions(false); }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            <View style={{ gap: 4, position: 'relative', zIndex: 100 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt s={12} color={c.mute}>Meal / Dish Name</Txt>
                {isLoadingFoods && <Txt s={10} color={c.mute}>Loading dataset...</Txt>}
              </Row>
              <TextInput
                value={mealName}
                onChangeText={handleMealNameChange}
                onFocus={() => {
                  if (mealName.trim()) setShowSuggestions(true);
                }}
                placeholder="Type to search (e.g. Chicken, Rice, Apple, Egg)..."
                placeholderTextColor="#94A3B8"
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF', color: '#1E293B' }}
              />

              {showSuggestions && (
                <View
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    maxHeight: 220,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: c.line,
                    borderRadius: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    zIndex: 9999,
                    elevation: 50,
                    overflow: 'hidden',
                  }}
                >
                  {isLoadingFoods && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color={c.mute}>⏳ Loading dataset...</Txt>
                    </View>
                  )}

                  {!isLoadingFoods && foodDatasetError && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color="#EF4444" style={{ textAlign: 'center' }}>
                        ⚠️ Error loading dataset: {foodDatasetError}
                      </Txt>
                    </View>
                  )}

                  {!isLoadingFoods && !foodDatasetError && mealName.trim().length > 0 && foodSuggestions.length === 0 && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color={c.mute}>
                        No results found for '{mealName.trim()}'
                      </Txt>
                    </View>
                  )}

                  {!isLoadingFoods && !foodDatasetError && foodSuggestions.length > 0 && (
                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {foodSuggestions.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => handleSelectFood(item)}
                          style={({ hovered }: any) => ({
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: c.line,
                            backgroundColor: hovered ? '#F3F4F6' : '#FFFFFF',
                            cursor: 'pointer',
                          })}
                        >
                          <Row style={{ alignItems: 'center', gap: 10 }}>
                            {item.image_url ? (
                              <Image
                                source={{ uri: item.image_url }}
                                style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#E5E7EB' }}
                              />
                            ) : null}
                            <View style={{ flex: 1 }}>
                              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <Txt s={13} w="700" style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>
                                  {item.source === 'malaysian' ? '🇲🇾 ' : ''}{item.name}
                                </Txt>
                                <Txt s={12} w="800" color="#EAB308">
                                  {item.calories} kcal
                                </Txt>
                              </Row>
                              <Txt s={10} color={c.mute} style={{ marginTop: 2 }}>
                                Per {item.serving_size} · P: {item.protein_g}g · C: {item.carbs_g}g · F: {item.fat_g}g
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

            <View style={{ gap: 6 }}>
              <Txt s={12} color={c.mute}>Category</Txt>
              <Row style={{ gap: 6 }}>
                {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setMealCategory(cat)}
                    style={{
                      flex: 1,
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
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, color: '#1E293B' }}
              />
            </View>

            <Row style={{ gap: 8 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={11} color={c.mute}>Protein (g)</Txt>
                <TextInput
                  value={mealProtein}
                  onChangeText={setMealProtein}
                  inputMode="decimal"
                  placeholder="25"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={11} color={c.mute}>Carbs (g)</Txt>
                <TextInput
                  value={mealCarbs}
                  onChangeText={setMealCarbs}
                  inputMode="decimal"
                  placeholder="55"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={11} color={c.mute}>Fat (g)</Txt>
                <TextInput
                  value={mealFat}
                  onChangeText={setMealFat}
                  inputMode="decimal"
                  placeholder="14"
                  placeholderTextColor="#94A3B8"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13, color: '#1E293B' }}
                />
              </View>
            </Row>

            <Btn bg={c.yellow} onPress={handleQuickAddMeal} style={{ marginTop: 8 }}>
              Log Meal to Diary
            </Btn>
          </View>
        </View>
      )}
    </Screen>
  );
}