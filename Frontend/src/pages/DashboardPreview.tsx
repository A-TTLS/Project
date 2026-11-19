import { Pressable, StyleSheet, Text, View } from "react-native-web";
import type { ActivityLevel, UserMeasurements, UserProfile } from "../services/authService";
import { colors, fonts, Icon } from "../ui";
import { estimateTarget } from "./ActivityPage";

interface DashboardPreviewProps {
  user: UserProfile | null;
  measurements: UserMeasurements;
  activity: ActivityLevel;
  onSignOut: () => void;
}

export default function DashboardPreview({
  user,
  measurements,
  activity,
  onSignOut,
}: DashboardPreviewProps) {
  const target = estimateTarget(measurements, activity);
  const displayName = user?.name || "Student";

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandSymbol}>
            <Icon name="scan" size={20} />
          </View>
          <Text style={styles.brandName}>CalorieSnap</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onSignOut}
          style={({ pressed }: { pressed: boolean }) => [styles.signOutBtn, pressed && styles.pressed]}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Welcome greeting */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingText}>
            <Text style={styles.hello}>Hi, {displayName} 👋</Text>
            <Text style={styles.welcomeSub}>
              Your personalized nutrition plan is active. Ready to snap your first meal?
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Icon name="flag" size={16} />
            <Text style={styles.streakText}>1 Day Streak</Text>
          </View>
        </View>

        {/* Daily Calorie Ring Card */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieCardTitle}>Daily Calorie Budget</Text>
          <View style={styles.calorieNumbers}>
            <Text style={styles.currentKcal}>0</Text>
            <Text style={styles.totalKcal}>/ {target.kcal.toLocaleString("en-US")} kcal</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "12%" }]} />
          </View>

          <View style={styles.macroPills}>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroVal}>0 / {target.carbs}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroVal}>0 / {target.protein}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroVal}>0 / {target.fat}g</Text>
            </View>
          </View>
        </View>

        {/* Snap Meal CTA Button */}
        <Pressable
          accessibilityRole="button"
          onPress={() => alert("AI Vision Snap feature is being linked with backend food model!")}
          style={({ pressed }: { pressed: boolean }) => [styles.snapBtn, pressed && styles.pressed]}
        >
          <Icon name="camera" size={24} />
          <Text style={styles.snapBtnText}>Snap a Meal with AI</Text>
        </Pressable>

        {/* Quick Metrics (Hydration & Steps) */}
        <View style={styles.quickMetrics}>
          <View style={styles.metricCard}>
            <View style={styles.metricHead}>
              <Icon name="sprout" size={18} />
              <Text style={styles.metricTitle}>Water Intake</Text>
            </View>
            <Text style={styles.metricVal}>0.5 / 2.5 L</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHead}>
              <Icon name="footprints" size={18} />
              <Text style={styles.metricTitle}>Steps</Text>
            </View>
            <Text style={styles.metricVal}>3,420 / 10,000</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.background,
    alignItems: "center",
  },
  topBar: {
    width: "100%",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandSymbol: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    cursor: "pointer" as unknown as undefined,
  },
  signOutText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  content: {
    width: "100%",
    maxWidth: 580,
    padding: 24,
    gap: 20,
  },
  greetingCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  greetingText: {
    flex: 1,
    gap: 4,
  },
  hello: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  welcomeSub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.interRegular,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.yellow,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  streakText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  calorieCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  calorieCardTitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  calorieNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  currentKcal: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
  },
  totalKcal: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  progressBar: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.yellow,
    borderRadius: 5,
  },
  macroPills: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 6,
  },
  macroPill: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
    gap: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: fonts.interMedium,
  },
  macroVal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: fonts.interBold,
  },
  snapBtn: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    boxShadow: "0 8px 20px -4px rgba(253, 240, 166, 0.7)",
    cursor: "pointer" as unknown as undefined,
  },
  snapBtnText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  quickMetrics: {
    flexDirection: "row",
    gap: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  metricHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricTitle: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.interMedium,
  },
  metricVal: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  pressed: {
    opacity: 0.75,
  },
});
