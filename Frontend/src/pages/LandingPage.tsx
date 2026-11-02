import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native-web";
import Navbar from "../components/Navbar";
import { assets, colors, fonts, Icon } from "../ui";

interface LandingPageProps {
  onNavigate: (page: "landing" | "login" | "register") => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  const features = [
    {
      icon: "camera" as const,
      title: "AI Food Recognition",
      description:
        "Snap a photo of your plate. Our AI vision pipeline identifies items, estimates portions, and computes macros in seconds.",
    },
    {
      icon: "scale" as const,
      title: "Unified Wellness Hub",
      description:
        "Track daily calories, water hydration, step counts, and active workouts on a single centralized dashboard.",
    },
    {
      icon: "sparkles" as const,
      title: "Peer Accountability",
      description:
        "Join private Group Circles with friends, share daily meal snaps, and cheer each other with instant reactions.",
    },
    {
      icon: "flag" as const,
      title: "Streak Rewards & Perks",
      description:
        "Earn points for hitting daily nutrition targets and redeem them for campus lifestyle discounts and vouchers.",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <Navbar currentPage="landing" onNavigate={onNavigate} />

      {/* Hero Section */}
      <View style={styles.heroWrapper}>
        <View style={[styles.heroContent, isWide && styles.heroContentWide]}>
          {/* Left Text Column */}
          <View style={[styles.heroTextCol, isWide && styles.heroTextColWide]}>
            <View style={styles.pillBadge}>
              <Icon name="sparkles" size={16} />
              <Text style={styles.pillText}>AI-Powered Nutrition Tracking</Text>
            </View>

            <Text style={styles.heroHeading}>
              Snap your meal.{"\n"}Share the streak.
            </Text>

            <Text style={styles.heroSubheading}>
              Say goodbye to tedious manual logging. CalorieSnap uses AI vision
              and peer community circles to turn healthy nutrition into a fun,
              rewarding daily habit.
            </Text>

            <View style={styles.ctaRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate("register")}
                style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
              >
                <Text style={styles.primaryCtaText}>Start Free Today</Text>
                <Icon name="arrow" size={16} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => onNavigate("login")}
                style={({ pressed }) => [styles.secondaryCta, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryCtaText}>Sign In</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>&lt; 15s</Text>
                <Text style={styles.statLabel}>Photo to Log</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>Free for Students</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4-in-1</Text>
                <Text style={styles.statLabel}>Diet, Water, Steps, Gym</Text>
              </View>
            </View>
          </View>

          {/* Right Image Card */}
          <View style={[styles.heroCardCol, isWide && styles.heroCardColWide]}>
            <View style={styles.imageCard}>
              <Image
                accessibilityLabel="Colorful balanced nutrition bowl"
                source={{ uri: assets.hero }}
                style={styles.heroImg}
              />
              <View style={styles.floatingBadge}>
                <Icon name="sparklesLg" size={16} />
                <Text style={styles.badgeLabel}>A fresh way to feel good</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Features Overview */}
      <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionPretitle}>WHY CALORIESNAP?</Text>
          <Text style={styles.sectionTitle}>Everything you need to sustain healthy habits</Text>
          <Text style={styles.sectionSubtitle}>
            Built specifically for students and busy young adults who want simple, guilt-free wellness.
          </Text>
        </View>

        <View style={[styles.featureGrid, isWide && styles.featureGridWide]}>
          {features.map((f, i) => (
            <View key={i} style={[styles.featureCard, isWide && styles.featureCardWide]}>
              <View style={styles.featureIconWrap}>
                <Icon name={f.icon} size={24} />
              </View>
              <Text style={styles.featureCardTitle}>{f.title}</Text>
              <Text style={styles.featureCardDesc}>{f.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>CalorieSnap · Developed by Group A TTLS (UTM)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.background,
  },
  heroWrapper: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: "center",
  },
  heroContent: {
    width: "100%",
    maxWidth: 1140,
    flexDirection: "column",
    gap: 40,
    alignItems: "center",
  },
  heroContentWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTextCol: {
    width: "100%",
    gap: 18,
  },
  heroTextColWide: {
    width: "52%",
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.mint,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  pillText: {
    color: colors.mintInk,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  heroHeading: {
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 42,
    fontWeight: "800",
    lineHeight: 50,
    letterSpacing: -1,
  },
  heroSubheading: {
    color: colors.muted,
    fontFamily: fonts.interRegular,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 500,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.yellow,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    cursor: "pointer" as unknown as undefined,
  },
  primaryCtaText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  secondaryCta: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    cursor: "pointer" as unknown as undefined,
  },
  secondaryCtaText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    gap: 2,
  },
  statNumber: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.interMedium,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  heroCardCol: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCardColWide: {
    width: "44%",
  },
  imageCard: {
    position: "relative",
    width: "100%",
    maxWidth: 440,
    height: 400,
    borderRadius: 32,
    overflow: "hidden",
    boxShadow: "0 18px 40px -10px rgba(0, 0, 0, 0.12)",
  },
  heroImg: {
    width: "100%",
    height: "100%",
  },
  floatingBadge: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(8px)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  badgeLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  featuresSection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 60,
    backgroundColor: colors.white,
    alignItems: "center",
  },
  sectionHeader: {
    alignItems: "center",
    textAlign: "center" as unknown as undefined,
    maxWidth: 640,
    gap: 10,
    marginBottom: 44,
  },
  sectionPretitle: {
    color: colors.mintInk,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.interBold,
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 15,
    fontFamily: fonts.interRegular,
    lineHeight: 22,
  },
  featureGrid: {
    width: "100%",
    maxWidth: 1140,
    flexDirection: "column",
    gap: 20,
  },
  featureGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureCardWide: {
    width: "48.5%",
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  featureCardDesc: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.interRegular,
  },
  footer: {
    width: "100%",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  footerBrand: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  footerSub: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.interRegular,
  },
  pressed: {
    opacity: 0.75,
  },
});
