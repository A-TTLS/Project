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
import { authService, type UserProfile } from "../services/authService";
import { useApp } from "../context/AppContext";
import { ActionButton, colors, fonts, Icon, type IconName } from "../ui";

interface RegisterPageProps {
  onCreated: (profile: UserProfile) => void;
  onGoToLogin: () => void;
  onGoBack: () => void;
}

export default function RegisterPage({
  onCreated,
  onGoToLogin,
  onGoBack,
}: RegisterPageProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const { setCurrentUser, reloadUserData } = useApp();

  // Clean, empty initial inputs so real users can fill in their details
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info" | "success"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (!username.trim()) {
      setMessage({ type: "error", text: "Please choose a username." });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid university or personal email." });
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setMessage({ type: "error", text: "Password must be at least 8 characters and include a number." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (!agreed) {
      setMessage({ type: "error", text: "Please agree to the Terms of Service & Privacy Policy." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const profile: UserProfile = {
      name: name.trim(),
      username: username.startsWith("@") ? username.trim() : `@${username.trim()}`,
      email: email.trim(),
    };

    const res = await authService.register(profile, password);
    setIsSubmitting(false);

    if (res.success) {
      if (res.user) await setCurrentUser(res.user);
      await reloadUserData();
      setMessage({ type: "success", text: "Account created successfully!" });
      setTimeout(() => {
        onCreated(profile);
      }, 500);
    } else {
      setMessage({ type: "error", text: res.error || "Registration failed." });
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setMessage({ type: "info", text: "Connecting to Google..." });

    const res = await authService.signInWithGoogle();
    setIsGoogleLoading(false);

    if (res.success && res.user) {
      await setCurrentUser(res.user);
      await reloadUserData();
      const profile: UserProfile = {
        name: res.user.name,
        username: `@${res.user.email.split("@")[0]}`,
        email: res.user.email,
      };
      setMessage({ type: "success", text: `Welcome, ${res.user.name}!` });
      setTimeout(() => {
        onCreated(profile);
      }, 500);
    } else {
      setMessage({ type: "error", text: res.error || "Google sign in failed." });
    }
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    placeholder: string,
    icon: IconName,
    isSecure = false,
    inputMode?: "text" | "email"
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          inputMode={inputMode || "text"}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          secureTextEntry={isSecure && !showPassword}
          style={styles.input}
          value={value}
        />
        {isSecure ? (
          <Pressable
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            hitSlop={10}
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Icon name="eyeOff" size={18} />
          </Pressable>
        ) : (
          <Icon name={icon} size={18} />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.card, isWide && styles.cardWide]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onGoBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join your campus friends and start snapping meals</Text>
        </View>

        {/* Quick OAuth Signup */}
        <Pressable
          accessibilityRole="button"
          disabled={isGoogleLoading}
          onPress={handleGoogleSignUp}
          style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={colors.ink} size="small" />
          ) : (
            <>
              <Icon name="chrome" size={18} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or register with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Alert Box */}
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

        {/* Input Fields */}
        <View style={styles.form}>
          {renderField("Full name", name, setName, "e.g. Harry Potter", "user")}
          {renderField("Username", username, setUsername, "e.g. harry_potter", "at")}
          {renderField("University or personal email", email, setEmail, "e.g. student@utm.my", "mail", false, "email")}
          {renderField("Password", password, setPassword, "At least 8 characters + 1 number", "lock", true)}
          {renderField("Confirm password", confirm, setConfirm, "Re-enter your password", "lock", true)}

          {/* Terms checkbox */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            onPress={() => setAgreed(!agreed)}
            style={styles.checkboxRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Icon name="check" size={14} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to CalorieSnap's{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </Pressable>

          <ActionButton
            disabled={isSubmitting}
            label={isSubmitting ? "Creating Account..." : "Create Account"}
            onPress={handleRegister}
            primary
          />
        </View>

        {/* Switch to Login */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <Pressable onPress={onGoToLogin} style={styles.switchBtn}>
            <Text style={styles.switchLink}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxWidth: 480,
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 30,
    gap: 16,
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
    gap: 4,
    marginTop: 4,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    fontFamily: fonts.jakartaExtraBold,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.interRegular,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    cursor: "pointer" as unknown as undefined,
  },
  googleBtnText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
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
    textAlign: "center" as unknown as undefined,
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
    textAlign: "center" as unknown as undefined,
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
    textAlign: "center" as unknown as undefined,
  },
  form: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.interSemiBold,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    outlineStyle: "none" as unknown as undefined,
    fontFamily: fonts.interRegular,
  },
  eyeBtn: {
    cursor: "pointer" as unknown as undefined,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
    cursor: "pointer" as unknown as undefined,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: colors.mintInk,
    backgroundColor: colors.mint,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.interRegular,
  },
  linkText: {
    color: colors.ink,
    fontWeight: "600",
    textDecorationLine: "underline" as unknown as undefined,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
