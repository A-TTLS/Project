import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native-web";
import { authService } from "../services/authService";
import { useApp } from "../context/AppContext";
import { ActionButton, colors, fonts, Icon } from "../ui";

interface LoginPageProps {
  onSignedIn: (email: string) => void;
  onGoToRegister: () => void;
  onGoBack: () => void;
  onForgotPassword?: () => void;
}

export default function LoginPage({
  onSignedIn,
  onGoToRegister,
  onGoBack,
  onForgotPassword,
}: LoginPageProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const isCompact = width < 440;
  const { setCurrentUser, reloadUserData } = useApp();

  // Clean empty inputs - allowing the user to type their real info!
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "Please enter your email and password." });
      return;
    }
    if (!email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const res = await authService.signInWithEmail(email.trim(), password);
    setIsSubmitting(false);

    if (res.success) {
      if (res.user) await setCurrentUser(res.user);
      await reloadUserData();
      onSignedIn(email.trim());
    } else {
      const errText = res.error || "Failed to sign in.";
      if (errText.toLowerCase().includes("email not confirmed")) {
        setMessage({
          type: "error",
          text: "Email not confirmed. In Supabase Dashboard, go to Authentication > Providers > Email and turn OFF 'Confirm email', or run the confirmation SQL in Supabase.",
        });
      } else {
        setMessage({ type: "error", text: errText });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setMessage({ type: "info", text: "Redirecting to Google..." });

    const res = await authService.signInWithGoogle();

    // signInWithOAuth triggers a browser redirect — it never returns a user object.
    // Only treat it as an error if the service explicitly signals failure.
    if (res.success) {
      // If a user is returned it means the demo fallback ran (OAuth not yet configured).
      // Otherwise the browser is already navigating to Google — do nothing.
      if (res.user) {
        await setCurrentUser(res.user);
        await reloadUserData();
        setMessage({ type: "success", text: `Welcome back, ${res.user.name}!` });
        setTimeout(() => {
          onSignedIn(res.user!.email);
        }, 500);
      }
      // No else needed: browser redirect is in progress
    } else {
      setIsGoogleLoading(false);
      setMessage({ type: "error", text: res.error || "Google sign in failed. Please try again." });
    }
  };

  return (
    <View style={[styles.screen, isCompact && { padding: 12 }]}>
      <View style={[styles.card, isWide && styles.cardWide, isCompact && { padding: 20, borderRadius: 22 }]}>
        {/* Header / Brand */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onGoBack}
            style={({ pressed }: { pressed: boolean }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Icon name="arrowLeft" size={18} />
          </Pressable>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Icon name="scan" size={20} />
            </View>
            <Text style={styles.brandTitle}>CalorieSnap</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your details to access your nutrition streak</Text>
        </View>

        {/* Message Alert */}
        {message && (
          <View
            style={[
              styles.alertBox,
              message.type === "error"
                ? styles.alertError
                : message.type === "success"
                ? styles.alertSuccess
                : styles.alertInfo,
            ]}
          >
            <Text
              style={[
                styles.alertText,
                message.type === "error"
                  ? styles.alertErrorText
                  : message.type === "success"
                  ? styles.alertSuccessText
                  : styles.alertInfoText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                onChangeText={setEmail}
                placeholder="e.g. yourname@utm.my"
                placeholderTextColor="#94a3b8"
                returnKeyType="next"
                style={styles.input}
                value={email}
              />
              <Icon name="mail" size={18} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputShell}>
              <TextInput
                accessibilityLabel="Password"
                autoComplete="current-password"
                onChangeText={setPassword}
                onSubmitEditing={handleEmailSignIn}
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                returnKeyType="go"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
              />
              <Pressable
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={10}
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Icon name="eyeOff" size={18} />
              </Pressable>
            </View>
            {onForgotPassword && (
              <Pressable accessibilityRole="link" onPress={onForgotPassword} style={styles.forgotBtn}>
                <Text style={styles.switchLink}>Forgot password?</Text>
              </Pressable>
            )}
          </View>

          <ActionButton
            disabled={isSubmitting}
            label={isSubmitting ? "Signing in..." : "Sign In with Email"}
            onPress={handleEmailSignIn}
            primary
          />
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Third Party OAuth */}
        <View style={styles.oauthRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isGoogleLoading}
            onPress={handleGoogleSignIn}
            style={({ pressed }: { pressed: boolean }) => [styles.oauthBtn, pressed && styles.pressed]}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <>
                <Icon name="chrome" size={18} />
                <Text style={styles.oauthBtnText}>Google</Text>
              </>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setMessage({ type: "info", text: "Apple Sign-In is configured for iOS devices." })}
            style={({ pressed }: { pressed: boolean }) => [styles.oauthBtn, pressed && styles.pressed]}
          >
            <Icon name="apple" size={18} />
            <Text style={styles.oauthBtnText}>Apple</Text>
          </Pressable>
        </View>

        {/* Switch to Register */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account yet?</Text>
          <Pressable onPress={onGoToRegister} style={styles.switchBtn}>
            <Text style={styles.switchLink}>Sign up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  forgotBtn: {
    alignSelf: "flex-end",
    cursor: "pointer" as unknown as undefined,
  },
  screen: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 32,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
  },
  cardWide: {
    padding: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as unknown as undefined,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  titleBlock: {
    gap: 6,
    marginTop: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontFamily: fonts.interRegular,
  },
  alertBox: {
    padding: 12,
    borderRadius: 14,
  },
  alertError: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  alertErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  alertSuccess: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  alertSuccessText: {
    color: "#15803d",
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  alertInfo: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  alertInfoText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontFamily: fonts.interMedium,
  },
  alertText: {
    textAlign: "center" as unknown as undefined,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
  },
  input: {
    flex: 1,
    minWidth: 1,
    fontSize: 14,
    color: colors.ink,
    outlineStyle: "none" as unknown as undefined,
    fontFamily: fonts.interRegular,
  },
  eyeBtn: {
    cursor: "pointer" as unknown as undefined,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.interMedium,
  },
  oauthRow: {
    flexDirection: "row",
    gap: 12,
  },
  oauthBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    cursor: "pointer" as unknown as undefined,
  },
  oauthBtnText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
  },
  switchText: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.interRegular,
  },
  switchBtn: {
    cursor: "pointer" as unknown as undefined,
  },
  switchLink: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.interBold,
    textDecorationLine: "underline" as unknown as undefined,
  },
  pressed: {
    opacity: 0.7,
  },
});
