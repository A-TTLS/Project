/**
 * CalorieSnap - Clinical Nutrition & Macronutrient Calculation Engine
 * Extracted from RiceCal & clinical dietetic standards (Academy of Nutrition and Dietetics)
 */

export type ActivityLevel = 'seated' | 'light' | 'moderate' | 'very';
export type FitnessGoal = 'loss' | 'maintain' | 'gain';

export interface NutritionTargets {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  bmr: number;
  tdee: number;
}

/**
 * 1. Mifflin-St Jeor Formula for Basal Metabolic Rate (BMR)
 * The most accurate indirect calorimetry approximation in clinical practice.
 */
export function calculateBMR(
  gender: 'Female' | 'Male' | 'Other',
  age: number,
  weightKg: number,
  heightCm: number
): number {
  if (gender === 'Female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  // Default to male equation for male or unspecified
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

/**
 * 2. Activity Level Multiplier
 */
export function getActivityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'seated':
      return 1.2; // Sedentary, desk work
    case 'light':
      return 1.375; // Light exercise 1-3 days/wk
    case 'moderate':
      return 1.55; // Moderate exercise 3-5 days/wk
    case 'very':
      return 1.725; // Hard training 6-7 days/wk
    default:
      return 1.375;
  }
}

/**
 * 3. Adjusted Body Weight (ABW) for Clinical Protein Target
 * Standard prescription (1.6 g/kg) on an overweight individual asks for too much protein.
 * Uses Ideal Body Weight (IBW) at BMI 25 anchor + 25% of excess body weight.
 */
export function calculateAdjustedWeight(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const ibw = 25.0 * (heightM * heightM); // Ideal weight at upper normal BMI (25)

  if (weightKg > ibw) {
    return ibw + 0.25 * (weightKg - ibw);
  }
  return weightKg;
}

/**
 * 4. Master Nutrition Target Calculator
 */
export function calculateNutritionTargets(params: {
  gender: 'Female' | 'Male' | 'Other';
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal?: FitnessGoal;
}): NutritionTargets {
  const { gender, age, weightKg, heightCm, activityLevel, goal = 'maintain' } = params;

  // 1. Calculate BMR & TDEE
  const bmr = Math.round(calculateBMR(gender, age, weightKg, heightCm));
  const tdee = Math.round(bmr * getActivityMultiplier(activityLevel));

  // 2. Goal delta
  let targetCalories = tdee;
  if (goal === 'loss') targetCalories = tdee - 500;
  if (goal === 'gain') targetCalories = tdee + 300;

  // Metabolic safety guardrails
  targetCalories = Math.max(1200, Math.min(10000, targetCalories));

  // 3. Protein: 1.6 g/kg of Adjusted Body Weight
  const adjWeight = calculateAdjustedWeight(weightKg, heightCm);
  const proteinGrams = Math.round(adjWeight * 1.6);

  // 4. Fat: 25% of total calories (9 kcal/g)
  const fatGrams = Math.round((targetCalories * 0.25) / 9);

  // 5. Carbs: Remaining calories (4 kcal/g)
  const remainingKcal = Math.max(0, targetCalories - proteinGrams * 4 - fatGrams * 9);
  const carbsGrams = Math.round(remainingKcal / 4);

  return {
    dailyCalories: targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    bmr,
    tdee,
  };
}

/**
 * 5. Streak Calculator (Gaps & Islands)
 * Accepts runs ending today or yesterday so the streak does not read 0 before breakfast.
 */
export function calculateStreakFromDates(loggedDates: string[]): { current: number; longest: number } {
  if (!loggedDates || loggedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Deduplicate and sort dates ascending
  const uniqueDates = Array.from(new Set(loggedDates.map(d => d.slice(0, 10)))).sort();
  const dateObjs = uniqueDates.map(d => new Date(d));

  let longest = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const d of dateObjs) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longest) longest = currentRun;
    prevDate = d;
  }

  // Current streak check: must end today or yesterday
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const lastDateStr = uniqueDates[uniqueDates.length - 1];
  const isActive = lastDateStr === todayStr || lastDateStr === yesterdayStr;

  return {
    current: isActive ? currentRun : 0,
    longest,
  };
}

