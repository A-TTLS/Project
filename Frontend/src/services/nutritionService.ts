/**
 * CalorieSnap - Clinical Nutrition & Macronutrient Calculation Engine
 * Aligned with RiceCal (apps/mobile/src/lib/nutrition.ts) & Academy of Nutrition and Dietetics
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

const KCAL_PER_KG = 7700;
const NOMINAL_LOSS_KG_PER_WEEK = 0.5;
const NOMINAL_GAIN_KG_PER_WEEK = 0.25;
const TARGET_DEADBAND_KG = 0.5;
const MIN_WEEKS_TO_TARGET = 4;
const MAX_DEFICIT_SHARE = 0.2;
const MAX_SURPLUS_SHARE = 0.15;
const PROTEIN_G_PER_KG = 1.6;
const REFERENCE_BMI = 25;
const EXCESS_WEIGHT_SHARE = 0.25;
const PROTEIN_MAX_SHARE = 0.35;
const FAT_SHARE = 0.25;
const CEILING_KCAL = 10000;

/**
 * 1. Mifflin-St Jeor Formula for Basal Metabolic Rate (BMR)
 */
export function calculateBMR(
  gender: 'Female' | 'Male' | 'Other' | string,
  age: number,
  weightKg: number,
  heightCm: number
): number {
  const offset = gender === 'Male' ? 5 : gender === 'Female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset;
}

/**
 * 2. Activity Level Multiplier
 */
export function getActivityMultiplier(level: ActivityLevel): number {
  switch (level) {
    case 'seated':
      return 1.2;
    case 'light':
      return 1.375;
    case 'moderate':
      return 1.55;
    case 'very':
      return 1.725;
    default:
      return 1.375;
  }
}

/**
 * Safe clinical calorie floor by biological sex (RiceCal standard: 1200 F / 1500 M).
 */
export function getCalorieFloor(gender: 'Female' | 'Male' | 'Other' | string): number {
  if (gender === 'Female') return 1200;
  if (gender === 'Male') return 1500;
  return 1350;
}

/**
 * 3. Adjusted Body Weight (ABW) for Clinical Protein Target
 * Uses actual weight inside the healthy BMI band (<= 25), and
 * reference weight + 25% of excess weight above BMI 25.
 */
export function calculateAdjustedWeight(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return weightKg;
  const heightM = heightCm / 100;
  const ibw = REFERENCE_BMI * (heightM * heightM);

  if (weightKg > ibw) {
    return ibw + EXCESS_WEIGHT_SHARE * (weightKg - ibw);
  }
  return weightKg;
}

/**
 * Tapered daily calorie delta (RiceCal intendedPace + energyDelta):
 * - Within ±0.5 kg deadband -> maintenance (0 kcal)
 * - Loss: up to 0.5 kg/wk (~550 kcal/day), tapered in final 2 kg, capped at 20% of TDEE
 * - Gain: up to 0.25 kg/wk (~275 kcal/day), tapered in final 1 kg, capped at 15% of TDEE
 */
export function calculateWeightGoalDelta(
  tdee: number,
  currentWeightKg: number,
  targetWeightKg?: number | null
): number {
  if (targetWeightKg === undefined || targetWeightKg === null || targetWeightKg <= 0) {
    return 0;
  }
  const remaining = targetWeightKg - currentWeightKg;
  if (Math.abs(remaining) < TARGET_DEADBAND_KG) {
    return 0;
  }

  const nominalPace = remaining < 0 ? NOMINAL_LOSS_KG_PER_WEEK : NOMINAL_GAIN_KG_PER_WEEK;
  const paceKgPerWeek = Math.min(nominalPace, Math.abs(remaining) / MIN_WEEKS_TO_TARGET);
  const fromPace = (paceKgPerWeek * KCAL_PER_KG) / 7;
  const shareCap = tdee * (remaining < 0 ? MAX_DEFICIT_SHARE : MAX_SURPLUS_SHARE);
  const magnitude = Math.min(fromPace, shareCap);

  return remaining < 0 ? -magnitude : magnitude;
}

/**
 * RiceCal macroSplit helper:
 * - Protein: 1.6 g/kg of Adjusted Body Weight, capped at 35% of energy
 * - Fat: 25% of energy (9 kcal/g)
 * - Carbs: remaining energy (4 kcal/g)
 */
export function calculateMacroSplit(
  kcal: number,
  weightKg: number,
  heightCm: number
): { proteinGrams: number; carbsGrams: number; fatGrams: number } {
  const basisKg = calculateAdjustedWeight(weightKg, heightCm);
  const proteinGrams = Math.round(
    Math.min(basisKg * PROTEIN_G_PER_KG, (kcal * PROTEIN_MAX_SHARE) / 4)
  );
  const fatGrams = Math.round((kcal * FAT_SHARE) / 9);
  const remainingKcal = Math.max(0, kcal - proteinGrams * 4 - fatGrams * 9);
  const carbsGrams = Math.round(remainingKcal / 4);

  return { proteinGrams, carbsGrams, fatGrams };
}

/**
 * 4. Master Nutrition Target Calculator
 * Accepts either explicit `targetWeightKg` (RiceCal tapered pace) or discrete `goal`.
 */
export function calculateNutritionTargets(params: {
  gender: 'Female' | 'Male' | 'Other' | string;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  targetWeightKg?: number | null;
  goal?: FitnessGoal;
}): NutritionTargets {
  const { gender, age, weightKg, heightCm, activityLevel, targetWeightKg, goal } = params;

  const bmrRaw = calculateBMR(gender, age, weightKg, heightCm);
  const tdeeRaw = bmrRaw * getActivityMultiplier(activityLevel);
  const bmr = Math.round(bmrRaw);
  const tdee = Math.round(tdeeRaw);

  let delta = 0;
  if (targetWeightKg !== undefined && targetWeightKg !== null) {
    delta = calculateWeightGoalDelta(tdeeRaw, weightKg, targetWeightKg);
  } else if (goal === 'loss') {
    delta = -Math.min(550, tdeeRaw * MAX_DEFICIT_SHARE);
  } else if (goal === 'gain') {
    delta = Math.min(275, tdeeRaw * MAX_SURPLUS_SHARE);
  }

  const floor = getCalorieFloor(gender);
  const dailyCalories = Math.min(
    CEILING_KCAL,
    Math.max(floor, Math.round((tdeeRaw + delta) / 10) * 10)
  );

  const { proteinGrams, carbsGrams, fatGrams } = calculateMacroSplit(
    dailyCalories,
    weightKg,
    heightCm
  );

  return {
    dailyCalories,
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
