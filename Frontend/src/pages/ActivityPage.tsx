import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native-web";
import { authService, type ActivityLevel, type UserMeasurements } from "../services/authService";
import {
  ActionButton,
  colors,
  fonts,
  Icon,
  Page,
  PageHeader,
  StepBar,
  type IconName,
} from "../ui";

interface LevelOption {
  id: ActivityLevel;
  icon: IconName;
  title: string;
  detail: string;
  factor: number;
}

const levels: LevelOption[] = [
  { id: "seated", icon: "armchair", title: "Mostly seated", detail: "Classes, studying & desk work", factor: 1.2 },
  { id: "light", icon: "footprints", title: "Lightly active", detail: "Walking between campus halls, 1–2 workouts/wk", factor: 1.375 },
  { id: "moderate", icon: "bike", title: "Moderately active", detail: "Regular exercise, 3–4 sports/gym sessions/wk", factor: 1.55 },
  { id: "very", icon: "dumbbell", title: "Very active", detail: "High-intensity training, sports athlete routine", factor: 1.725 },
];

/**
 * Mifflin-St Jeor formula calculating resting basal metabolic rate (BMR)
 * multiplied by physical activity level (PAL).
 */
export function estimateTarget(m: UserMeasurements, level: ActivityLevel) {
  const imperial = m.units === "imperial";
  const weightVal = parseFloat(m.weight) || 60;
  const targetVal = parseFloat(m.target) || weightVal;
  const heightVal = parseFloat(m.height) || 165;
  const ageVal = parseFloat(m.age) || 21;

  const kg = weightVal / (imperial ? 2.20462 : 1);
  const targetKg = targetVal / (imperial ? 2.20462 : 1);
  const cm = heightVal / (imperial ? 0.393701 : 1);

  const offset = m.gender === "Male" ? 5 : m.gender === "Female" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * ageVal + offset;
  const factor = levels.find((l) => l.id === level)?.factor || 1.375;

  // Small caloric deficit or surplus based on target goal
  const adjust = targetKg < kg ? -250 : targetKg > kg ? 250 : 0;
  const kcal = Math.max(1200, Math.round((bmr * factor + adjust) / 10) * 10);

  return {
    kcal,
    carbs: Math.round((kcal * 0.5) / 4), // 50% calories from carbs (4 kcal/g)
    protein: Math.round((kcal * 0.25) / 4), // 25% calories from protein (4 kcal/g)
    fat: Math.round((kcal * 0.25) / 9), // 25% calories from fat (9 kcal/g)
  };
}

interface ActivityPageProps {
  measurements: UserMeasurements;
  level: ActivityLevel;
  onLevelChange: (level: ActivityLevel) => void;
  onBack: () => void;
  onComplete: () => void;
}

export default function ActivityPage({
  measurements,
  level,
  onLevelChange,
  onBack,
  onComplete,
}: ActivityPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const target = estimateTarget(measurements, level);

  const macros = [
    { label: "Carbs", grams: target.carbs, color: "#38bdf8" },
    { label: "Protein", grams: target.protein, color: "#4ade80" },
    { label: "Fat", grams: target.fat, color: "#fbbf24" },
  ];

  const handleFinish = async () => {
    setIsSaving(true);
    await authService.saveOnboarding(measurements, level);
    setIsSaving(false);
    onComplete();
  };

  return (
    <Page>
      <StepBar step={2} />
      <PageHeader
        onBack={onBack}
        subtitle="Step 2 of 2 · Daily Activity & Nutrition"
        title="Find your daily rhythm."
      />

      {/* Activity Level Selector */}
      <View style={styles.levels}>
        {levels.map((l) => {
          const selected = l.id === level;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={l.id}
              onPress={() => onLevelChange(l.id)}
              style={[styles.levelCard, selected && styles.levelCardSelected]}
            >
              <View style={[styles.levelIconWrap, selected && styles.levelIconSelected]}>
                <Icon name={l.icon} size={22} />
              </View>
              <View style={styles.levelCopy}>
                <Text style={styles.levelTitle}>{l.title}</Text>
                <Text style={styles.levelDetail}>{l.detail}</Text>
              </View>
              <Icon name={selected ? "circleCheck" : "circle"} size={20} />
            </Pressable>
          );
        })}
      </View>

      {/* Daily Calories & Macros Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <Icon name="sparklesLg" size={18} />
          <Text style={styles.summaryHeadText}>Your Recommended Daily Target</Text>
        </View>

        <View style={styles.kcalBlock}>
          <Text style={styles.kcalNumber}>{target.kcal.toLocaleString("en-US")}</Text>
          <Text style={styles.kcalCaption}>kcal / day · estimated energy budget</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.macroBlock}>
          <Text style={styles.macroHeading}>Recommended Daily Macronutrients</Text>
          <View style={styles.macroRow}>
            {macros.map((m) => (
              <View key={m.label} style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <Text style={styles.macroLabel}>{m.label}</Text>
                <Text style={styles.macroValue}>{m.grams}g</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.disclaimerText}>
        Calculated using the validated Mifflin-St Jeor algorithm. You can adjust your targets anytime in Profile.
      </Text>

      <ActionButton
        disabled={isSaving}
        icon="camera"
        label={isSaving ? "Setting Up..." : "Start Snapping Meals"}
        onPress={handleFinish}
        primary
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  levels: {
    width: "100%",
    gap: 10,
  },
  levelCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    cursor: "pointer" as unknown as undefined,
  },
  levelCardSelected: {
    borderColor: colors.mintInk,
    backgroundColor: "#f7fcf5",
  },
  levelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  levelIconSelected: {
    backgroundColor: colors.mint,
  },
  levelCopy: {
    flex: 1,
    gap: 2,
  },
  levelTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  levelDetail: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.interRegular,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  summaryHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryHeadText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  kcalBlock: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  kcalNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
  },
  kcalCaption: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fonts.interMedium,
  },
  rule: {
    width: "100%",
    height: 1,
    backgroundColor: colors.border,
  },
  macroBlock: {
    gap: 12,
  },
  macroHeading: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    fontFamily: fonts.interSemiBold,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  macroItem: {
    alignItems: "center",
    gap: 4,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: fonts.interMedium,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: fonts.interBold,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center" as unknown as undefined,
    fontFamily: fonts.interRegular,
    lineHeight: 18,
  },
});
