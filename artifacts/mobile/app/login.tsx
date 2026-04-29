import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const { login, isAuthenticated, resetPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Mirrors register.tsx — users can sign in with the same identifier
  // they signed up with. Phone gets converted to the synthetic email
  // (lr{e164digits}@palavahub.lr) that backs Firebase Auth.
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function phoneToSyntheticEmail(raw: string): string | null {
    // Strip everything except digits, then prepend Liberia country code if missing.
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    const e164 = digits.startsWith("231") ? digits : `231${digits.replace(/^0+/, "")}`;
    if (e164.length < 11 || e164.length > 13) return null;
    return `lr${e164}@palavahub.lr`;
  }

  // Navigate only once Firebase has confirmed the user — avoids the race
  // condition where router.replace("/(tabs)") fires before onAuthStateChanged
  // has set isAuthenticated, causing the tab guard to boot the user back out.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    let identifier = "";
    if (method === "email") {
      if (!email.trim() || !password.trim()) {
        setError("Please fill in all fields");
        return;
      }
      identifier = email.trim();
    } else {
      if (!phone.trim() || !password.trim()) {
        setError("Please fill in all fields");
        return;
      }
      const synth = phoneToSyntheticEmail(phone.trim());
      if (!synth) {
        setError("Please enter a valid Liberian phone number.");
        return;
      }
      identifier = synth;
    }
    setIsLoading(true);
    setError("");
    const result = await login(identifier, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed");
    }
    // Navigation is handled by the useEffect above once isAuthenticated flips to true
  };

  // Password reset — only works for email accounts (phone-signup users
  // have synthetic emails that they can't actually receive mail at).
  const handleForgotPassword = async () => {
    if (method === "phone") {
      Alert.alert(
        "Phone accounts",
        "Password reset over email isn't available for phone-based accounts yet. Please contact support to recover your account.",
      );
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email above first, then tap Forgot password.");
      return;
    }
    const result = await resetPassword(email.trim());
    if (result.success) {
      Alert.alert(
        "Check your email",
        "If an account exists for that email, a password-reset link is on its way. Check your spam folder if you don't see it.",
      );
    } else {
      setError(result.error ?? "Could not send reset email.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Sign in to your Palava Hub account
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email / Phone toggle — must mirror register.tsx so phone-signup
                users can actually sign back in. */}
            <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  method === "email" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setMethod("email")}
                activeOpacity={0.8}
              >
                <Feather name="mail" size={14} color={method === "email" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[
                  styles.toggleText,
                  { color: method === "email" ? colors.primaryForeground : colors.mutedForeground },
                ]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  method === "phone" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setMethod("phone")}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={14} color={method === "phone" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[
                  styles.toggleText,
                  { color: method === "phone" ? colors.primaryForeground : colors.mutedForeground },
                ]}>Phone</Text>
              </TouchableOpacity>
            </View>

            {method === "email" ? (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
                <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Feather name="mail" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>Phone number</Text>
                <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={[styles.prefix, { color: colors.mutedForeground }]}>+231</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="77 000 0000"
                    placeholderTextColor={colors.mutedForeground}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.like_bg }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push("/register")} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}> Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32, width: 40 },
  heading: { marginBottom: 36 },
  title: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  prefix: { fontSize: 15, fontWeight: "600", marginRight: 8 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: { fontSize: 14, fontWeight: "600" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13, flex: 1 },
  loginBtn: {
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginBtnText: { fontSize: 16, fontWeight: "700" },
  forgotBtn: { alignSelf: "center", paddingVertical: 12, marginTop: 4 },
  forgotText: { fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
});
