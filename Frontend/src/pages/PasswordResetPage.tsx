import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native-web";
import { ActionButton, colors, fonts, Icon } from "../ui";
import {
  checkNewPassword,
  MIN_PASSWORD_LENGTH,
  requestPasswordReset,
  updatePassword,
} from "../services/passwordService";

// Member 5 · Forgot / reset password.
//   mode "request": enter email → Supabase sends a reset link
//   mode "update":  opened from that link → choose a new password
// Styling mirrors LoginPage so the auth screens look the same.

interface PasswordResetPageProps {
  mode: "request" | "update";
  onGoBack: () => void;
  /** Called after a new password is saved (user is signed in). */
  onDone: () => void;
}

type Message = { type: "error" | "info" | "success"; text: string } | null;

export default function PasswordResetPage({ mode, onGoBack, onDone }: PasswordResetPageProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequest = async () => {
    setIsSubmitting(true);
    setMessage(null);
    const res = await requestPasswordReset(email);
    setIsSubmitting(false);
    if (res.success) {
      setEmailSent(true);
      setMessage({
        type: "success",
        text: `If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox (and spam folder).`,
      });
    } else {
      setMessage({ type: "error", text: res.error || "Could not send the reset email." });
    }
  };

  const handleUpdate = async () => {
    const problem = checkNewPassword(password, confirm);
    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    const res = await updatePassword(password);
    setIsSubmitting(false);
    if (res.success) {
      setMessage({ type: "success", text: "Password updated. Taking you to your dashboard…" });
      setTimeout(onDone, 900);
    } else {
      setMessage({ type: "error", text: res.error || "Could not update your password." });
    }
  };

  const isRequest = mode === "request";

  return (
    <View style={styles.screen}>
      <View style={[styles.card, isWide && styles.cardWide]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
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
          <Text style={styles.title}>{isRequest ? "Forgot password?" : "Set a new password"}</Text>
          <Text style={styles.subtitle}>
            {isRequest
              ? "Enter the email you signed up with and we'll send you a reset link."
              : `Choose a new password with at least ${MIN_PASSWORD_LENGTH} characters, using letters and numbers.`}
          </Text>
        </View>

        {message && (
          <View
            style={[
              styles.alertBox,
              message.type === "error" ? styles.alertError : message.type === "success" ? styles.alertSuccess : styles.alertInfo,
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

        {isRequest ? (
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
                  onSubmitEditing={handleRequest}
                  placeholder="e.g. yourname@utm.my"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={email}
                />
                <Icon name="mail" size={18} />
              </View>
            </View>
            <ActionButton
              disabled={isSubmitting || !email.trim()}
              label={isSubmitting ? "Sending..." : emailSent ? "Send again" : "Send reset link"}
              onPress={handleRequest}
              primary
            />
          </View>
        ) : (
          <View style={styles.form}>
            {[
              { label: "New password", value: password, set: setPassword, auto: "new-password" },
              { label: "Confirm new password", value: confirm, set: setConfirm, auto: "new-password" },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.inputShell}>
                  <TextInput
                    accessibilityLabel={f.label}
                    autoComplete={f.auto}
                    onChangeText={f.set}
                    onSubmitEditing={handleUpdate}
                    placeholder={f.label}
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    value={f.value}
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
              </View>
            ))}
            <ActionButton
              disabled={isSubmitting}
              label={isSubmitting ? "Saving..." : "Save new password"}
              onPress={handleUpdate}
              primary
            />
          </View>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{isRequest ? "Remembered it?" : "Changed your mind?"}</Text>
          <Pressable onPress={onGoBack} style={styles.switchBtn}>
            <Text style={styles.switchLink}>Back to sign in</Text>
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
