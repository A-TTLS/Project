import React, { useState, useEffect } from 'react';
import { View, Pressable, TextInput, ScrollView, Image } from 'react-native-web';
import { useApp } from '../context/AppContext';
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
  Ring,
  Icon,
  c,
} from '../ui';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

/**
 * Dynamic Emoji Helper for Meals
 * Maps meal name or category to an appropriate, vibrant food emoji
 */
function getMealEmoji(name: string, category: string): string {
  const n = (name || '').toLowerCase();
  
  // Specific food items
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

  // Category fallback
  switch (category) {
    case 'Breakfast': return '🍳';
    case 'Lunch': return '🍱';
    case 'Dinner': return '🍽️';
    case 'Snacks': return '🍎';
    default: return '🥗';
  }
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
    waterMl,
    stepsCount,
    workoutMins,
    todayMeals,
    addWater,
    logMeal,
    deleteMeal,
    setEditingMeal,
    setCapturedMeal,
    showToast,
  } = useApp();

  // Water undo — remembers the last quick-add amount so undo subtracts it.
  // Undo stays pressable as long as there is any water logged today (waterMl > 0).
  const [lastWaterAdded, setLastWaterAdded] = useState<number>(250);

  const handleAddWater = (amount: number) => {
    setLastWaterAdded(amount);   // remember which button was pressed last
    addWater(amount);
  };

  const handleUndoWater = () => {
    if (waterMl > 0) {
      // Subtract the last-used amount, but never go below 0
      addWater(-Math.min(lastWaterAdded, waterMl));
    }
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

  // Mount effect: Fetch optimized food dataset
  useEffect(() => {
    console.log('[HomeScreen] Component mounted. Attempting to fetch dataset from /datasets/optimized_foods.json (or .csv)...');
    setIsLoadingFoods(true);
    setFoodDatasetError(null);

    loadLocalFoods()
      .then((foods) => {
        console.log(`[HomeScreen] Dataset successfully loaded! Total items in memory: ${foods.length}`);
        setLocalFoods(foods);
        setIsLoadingFoods(false);
      })
      .catch((err) => {
        console.error('[HomeScreen] Failed to fetch or parse food dataset:', err);
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
    console.log(`[HomeScreen search] User query (q): "${text}" | Filtered results count: ${filtered.length}`, filtered);
    setFoodSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleSelectFood = (food: LocalFood) => {
    console.log('[HomeScreen] Selected food from suggestions:', food);
    setMealName(food.name);
    setMealKcal(food.calories.toString());
    setMealProtein(food.protein_g.toString());
    setMealCarbs(food.carbs_g.toString());
    setMealFat(food.fat_g.toString());
    setShowSuggestions(false);
  };

  const progressPct = Math.min(100, Math.round((consumedKcal / calorieGoal) * 100));
  const remainingKcal = Math.max(0, calorieGoal - consumedKcal);

  // Today formatted date
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
      kcal: parseInt(mealKcal) || 0,
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
    <Screen tab="Home" onSelectTab={onNavigate}>
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

        {/* Center Ring Display */}
        <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Ring size={190} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Txt s={38} w="800">{consumedKcal.toLocaleString()}</Txt>
            <Txt s={12} color={c.mute}>/ {calorieGoal.toLocaleString()} kcal</Txt>
            <View style={{ marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E2F1F8' }}>
              <Txt s={10} w="700" color="#2F586E">
                {remainingKcal > 0 ? `${remainingKcal.toLocaleString()} kcal left` : 'Goal achieved! 🎉'}
              </Txt>
            </View>
          </View>
        </View>

        {/* Consumed vs Burned vs Remaining */}
        <Row style={{ alignSelf: 'stretch', justifyContent: 'space-around', paddingTop: 14, borderTopWidth: 1, borderColor: '#C4E4F3' }}>
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Consumed</Txt>
            <Txt s={15} w="800">{consumedKcal} kcal</Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#C4E4F3' }} />
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Burned</Txt>
            <Txt s={15} w="800">{burnedKcal} kcal</Txt>
          </View>
          <View style={{ height: 28, width: 1, backgroundColor: '#C4E4F3' }} />
          <View style={{ alignItems: 'center' }}>
            <Txt s={11} color="#527D93">Remaining</Txt>
            <Txt s={15} w="800">{remainingKcal} kcal</Txt>
          </View>
        </Row>
      </Card>

      {/* Macronutrient Breakdown */}
      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Txt w="800">Macronutrients Today</Txt>
          <Txt s={11} color={c.mute}>Target Balance</Txt>
        </Row>

        <View style={{ gap: 12 }}>
          {/* Protein */}
          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3E6B52' }} />
                <Txt s={12} w="700">Protein</Txt>
              </Row>
              <Txt s={12} w="700">{proteinGrams}g <Txt s={11} color={c.mute}>/ {proteinGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (proteinGrams / proteinGoal) * 100)}%`, height: '100%', backgroundColor: '#3E6B52', borderRadius: 4 }} />
            </View>
          </View>

          {/* Carbs */}
          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EAB308' }} />
                <Txt s={12} w="700">Carbohydrates</Txt>
              </Row>
              <Txt s={12} w="700">{carbsGrams}g <Txt s={11} color={c.mute}>/ {carbsGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (carbsGrams / carbsGoal) * 100)}%`, height: '100%', backgroundColor: '#EAB308', borderRadius: 4 }} />
            </View>
          </View>

          {/* Fat */}
          <View>
            <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Row style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                <Txt s={12} w="700">Healthy Fats</Txt>
              </Row>
              <Txt s={12} w="700">{fatsGrams}g <Txt s={11} color={c.mute}>/ {fatGoal}g</Txt></Txt>
            </Row>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (fatsGrams / fatGoal) * 100)}%`, height: '100%', backgroundColor: '#EF4444', borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </Card>

      {/* Hydration & Daily Activity Cards */}
      <Row style={{ gap: 12, marginBottom: 16 }}>
        {/* Water Tracker */}
        <Card style={{ flex: 1, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="water" size={16} color="#0284C7" />
            </View>
            <Txt s={11} color={c.mute}>Goal 2,000ml</Txt>
          </Row>

          <Txt s={20} w="800" style={{ marginTop: 8 }}>{waterMl.toLocaleString()} <Txt s={11} color={c.mute}>ml</Txt></Txt>
          <Txt s={11} color="#0284C7" style={{ marginBottom: 10 }}>
            {Math.round((waterMl / 2000) * 100)}% Hydrated
          </Txt>

          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => handleAddWater(250)}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E0F2FE', alignItems: 'center' }}
            >
              <Txt s={11} w="700" color="#0369A1">+250ml</Txt>
            </Pressable>
            <Pressable
              onPress={() => handleAddWater(500)}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#BAE6FD', alignItems: 'center' }}
            >
              <Txt s={11} w="700" color="#0369A1">+500ml</Txt>
            </Pressable>
            <Pressable
              onPress={() => handleAddWater(1000)}
              style={{ flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#7DD3FC', alignItems: 'center' }}
            >
              <Txt s={11} w="700" color="#0C4A6E">+1L</Txt>
            </Pressable>
            <Pressable
              onPress={handleUndoWater}
              disabled={waterMl === 0}
              style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: waterMl > 0 ? '#FEF3C7' : c.bg, alignItems: 'center' }}
            >
              <Txt s={11} color={waterMl > 0 ? '#92400E' : c.mute}>↩</Txt>
            </Pressable>
          </Row>
        </Card>

        {/* Steps & Movement */}
        <Card style={{ flex: 1, padding: 14 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="footprints" size={16} color="#15803D" />
            </View>
            <Txt s={11} color={c.mute}>Goal 8,000</Txt>
          </Row>

          <Txt s={20} w="800" style={{ marginTop: 8 }}>{stepsCount.toLocaleString()} <Txt s={11} color={c.mute}>steps</Txt></Txt>
          <Txt s={11} color="#15803D" style={{ marginBottom: 10 }}>
            {workoutMins}m gym · {burnedKcal} kcal
          </Txt>

          <Pressable
            onPress={() => onNavigate('Trend')}
            style={{ width: '100%', paddingVertical: 6, borderRadius: 8, backgroundColor: c.bg, alignItems: 'center' }}
          >
            <Txt s={11} w="600" color={c.ink}>View Activity ›</Txt>
          </Pressable>
        </Card>
      </Row>

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
        {todayMeals.map((meal) => (
          <Card key={meal.id} style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Row style={{ alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: meal.category === 'Breakfast' ? '#FFEFA0' : meal.category === 'Lunch' ? '#DDF0D3' : meal.category === 'Dinner' ? '#D8EDF8' : '#FBDAD6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {meal.imageUrl || meal.image ? <Image source={{ uri: meal.imageUrl || meal.image }} style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' as const }} /> : <Txt s={22} style={{ textAlign: 'center', lineHeight: 26 }}>{getMealEmoji(meal.name, meal.category)}</Txt>}
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
                  onPress={() => { setEditingMeal(meal); setCapturedMeal(null); onNavigate('Scan Result'); }}
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

      {/* Manual Add Meal Modal */}
      {showAddMealModal && (
        <View style={{ position: 'fixed' as any, top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 999 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: c.card, borderRadius: 24, padding: 22, gap: 14, overflow: 'visible' }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt s={18} w="800">Add Meal Entry</Txt>
              <Pressable onPress={() => { setShowAddMealModal(false); setShowSuggestions(false); }}>
                <Icon name="close" size={20} color={c.mute} />
              </Pressable>
            </Row>

            {/* Meal / Dish Name with Search Dropdown */}
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
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14, backgroundColor: '#FFFFFF' }}
              />

              {/* Search Results Dropdown with High Z-Index */}
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
                  {/* Feedback State 1: Loading */}
                  {isLoadingFoods && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color={c.mute}>⏳ Loading dataset...</Txt>
                    </View>
                  )}

                  {/* Feedback State 2: Fetch / Parse Error */}
                  {!isLoadingFoods && foodDatasetError && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color="#EF4444" style={{ textAlign: 'center' }}>
                        ⚠️ Error loading dataset: {foodDatasetError}
                      </Txt>
                    </View>
                  )}

                  {/* Feedback State 3: No Results Found */}
                  {!isLoadingFoods && !foodDatasetError && mealName.trim().length > 0 && foodSuggestions.length === 0 && (
                    <View style={{ padding: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt s={12} color={c.mute}>
                        No results found for '{mealName.trim()}'
                      </Txt>
                    </View>
                  )}

                  {/* Filtered Results List */}
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
                          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Txt s={13} w="700" style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>
                              {item.name}
                            </Txt>
                            <Txt s={12} w="800" color="#EAB308">
                              {item.calories} kcal
                            </Txt>
                          </Row>
                          <Txt s={10} color={c.mute} style={{ marginTop: 2 }}>
                            Per {item.serving_size} · P: {item.protein_g}g · C: {item.carbs_g}g · F: {item.fat_g}g
                          </Txt>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            {/* Category Select */}
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
                style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, fontSize: 14 }}
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
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13 }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={11} color={c.mute}>Carbs (g)</Txt>
                <TextInput
                  value={mealCarbs}
                  onChangeText={setMealCarbs}
                  inputMode="decimal"
                  placeholder="55"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13 }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt s={11} color={c.mute}>Fat (g)</Txt>
                <TextInput
                  value={mealFat}
                  onChangeText={setMealFat}
                  inputMode="decimal"
                  placeholder="14"
                  style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, fontSize: 13 }}
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
