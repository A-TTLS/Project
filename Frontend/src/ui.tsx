import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native-web";

export const assets = {
  hero: "/assets/72efe.png",
  scan: "/assets/fb8e5.svg",
  sparkles: "/assets/dc79a.svg",
  sparklesLg: "/assets/7a87f.svg",
  mail: "/assets/a49e2.svg",
  eyeOff: "/assets/bf239.svg",
  arrow: "/assets/8ba74.svg",
  arrowLeft: "/assets/e30c5.svg",
  chrome: "/assets/3d675.svg",
  apple: "/assets/c766b.svg",
  sprout: "/assets/b524f.svg",
  user: "/assets/b47f9.svg",
  at: "/assets/919d1.svg",
  check: "/assets/53645.svg",
  lock: "/assets/671fc.svg",
  scale: "/assets/35815.svg",
  flag: "/assets/277b4.svg",
  armchair: "/assets/19d39.svg",
  circle: "/assets/bab11.svg",
  footprints: "/assets/b787b.svg",
  bike: "/assets/8cf17.svg",
  circleCheck: "/assets/4f007.svg",
  dumbbell: "/assets/cbe69.svg",
  camera: "/assets/3fb17.svg",
};

export const colors = {
  background: "#faf9f6",
  ink: "#1e293b",
  muted: "#64748b",
  border: "#eaede9",
  white: "#ffffff",
  yellow: "#fdf0a6",
  mint: "#ddf3d5",
  mintInk: "#4a7051",
  sky: "#d8f0fa",
  skyInk: "#40718a",
  skyLine: "#bbdce9",
  error: "#b4533f",
  primary: "#10b981",
};

export const fonts = {
  interRegular: "'Inter', sans-serif",
  interMedium: "'Inter', sans-serif",
  interSemiBold: "'Inter', sans-serif",
  interBold: "'Inter', sans-serif",
  interExtraBold: "'Inter', sans-serif",
  jakartaExtraBold: "'Plus Jakarta Sans', sans-serif",
};

export type IconName = keyof typeof assets;

export function Icon({ name, size }: { name: IconName; size: number }) {
  return (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri: assets[name] }}
      style={{ width: size, height: size }}
    />
  );
}

export function ActionButton({
  icon,
  label,
  primary = false,
  onPress,
  style,
  disabled = false,
}: {
  icon?: IconName;
  label: string;
  primary?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary ? styles.primaryAction : styles.secondaryAction,
        pressed && styles.pressed,
        disabled && styles.disabledAction,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={20} /> : null}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

/** Shared page container: fluid layout with max width */
export function Page({ children }: { children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.pageColumn}>{children}</View>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingRow}>
        {onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Icon name="arrowLeft" size={20} />
          </Pressable>
        ) : null}
        <Text style={styles.headingTitle}>{title}</Text>
      </View>
      <Text style={styles.headingSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.stepBar}>
      <View style={styles.stepSegment} />
      <View style={[styles.stepSegment, step < 2 && styles.stepIdle]} />
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export const styles = StyleSheet.create({
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.background,
    alignItems: "center",
  },
  pageColumn: {
    width: "100%",
    maxWidth: 520,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  action: {
    width: "100%",
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 32,
    cursor: "pointer" as unknown as undefined,
  },
  primaryAction: {
    borderColor: colors.yellow,
    backgroundColor: colors.yellow,
  },
  secondaryAction: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  disabledAction: {
    opacity: 0.5,
    cursor: "not-allowed" as unknown as undefined,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
  actionLabel: {
    color: colors.ink,
    fontFamily: fonts.interBold,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21.75,
  },
  heading: {
    width: "100%",
    gap: 8,
  },
  headingRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as unknown as undefined,
  },
  headingTitle: {
    flex: 1,
    minWidth: 1,
    color: colors.ink,
    fontFamily: fonts.jakartaExtraBold,
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 36.25,
  },
  headingSubtitle: {
    width: "100%",
    color: colors.muted,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20.3,
  },
  stepBar: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  stepSegment: {
    flex: 1,
    minWidth: 1,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.yellow,
  },
  stepIdle: {
    backgroundColor: colors.border,
  },
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.interSemiBold,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17.4,
  },
});
