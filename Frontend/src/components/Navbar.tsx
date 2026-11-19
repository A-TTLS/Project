import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native-web";
import { colors, fonts, Icon } from "../ui";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: "landing" | "login" | "register") => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={styles.navContainer}>
      <View style={styles.navContent}>
        {/* Brand Logo & Name */}
        <Pressable
          accessibilityRole="button"
          onPress={() => onNavigate("landing")}
          style={styles.brand}
        >
          <View style={styles.brandSymbol}>
            <Icon name="scan" size={20} />
          </View>
          <Text style={styles.brandName}>CalorieSnap</Text>
        </Pressable>

        {/* Center Navigation Links (Wide Screen) */}
        {isWide && (
          <View style={styles.navLinks}>
            <Pressable
              onPress={() => onNavigate("landing")}
              style={[styles.navLink, currentPage === "landing" && styles.navLinkActive]}
            >
              <Text
                style={[
                  styles.navLinkText,
                  currentPage === "landing" && styles.navLinkTextActive,
                ]}
              >
                Home
              </Text>
            </Pressable>
            <View style={styles.navLink}>
              <Text style={styles.navLinkText}>AI Vision</Text>
            </View>
            <View style={styles.navLink}>
              <Text style={styles.navLinkText}>Community</Text>
            </View>
            <View style={styles.navLink}>
              <Text style={styles.navLinkText}>Rewards</Text>
            </View>
          </View>
        )}

        {/* Auth CTA Buttons */}
        <View style={styles.authButtons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onNavigate("login")}
            style={({ pressed }: { pressed: boolean }) => [
              styles.signInBtn,
              currentPage === "login" && styles.btnSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => onNavigate("register")}
            style={({ pressed }: { pressed: boolean }) => [
              styles.getStartedBtn,
              currentPage === "register" && styles.btnSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    width: "100%",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingVertical: 14,
    position: "sticky" as unknown as undefined,
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: 1200,
    width: "100%",
    marginHorizontal: "auto" as unknown as undefined,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    cursor: "pointer" as unknown as undefined,
  },
  brandSymbol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  navLink: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    cursor: "pointer" as unknown as undefined,
  },
  navLinkActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.mintInk,
  },
  navLinkText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: fonts.interMedium,
  },
  navLinkTextActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  authButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signInBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    cursor: "pointer" as unknown as undefined,
  },
  signInText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  getStartedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.yellow,
    borderWidth: 1,
    borderColor: colors.yellow,
    cursor: "pointer" as unknown as undefined,
  },
  getStartedText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.interBold,
  },
  btnSelected: {
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.7,
  },
});
