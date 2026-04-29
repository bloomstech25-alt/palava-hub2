import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { isAuthenticated, isLoading } = useAuth();

  // If a session is already alive (token persisted), skip the welcome screen.
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Pure-black hero with soft red wash matching the flyer mockup. */}
      <LinearGradient
        colors={["#000000", "#0A0202", "#000000"]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Two layered glows — a brighter core and a softer halo — recreate the
          red bloom that surrounds the logo on the flyer's phone screen. */}
      <View style={styles.glowHalo} />
      <View style={styles.glowCore} />

      <View style={[styles.content, { paddingTop: topPad + 60, paddingBottom: bottomPad + 28 }]}>
        {/* ─── Logo + brand block ─────────────────────────────────────────── */}
        <View style={styles.brandBlock}>
          <Image
            source={require("../assets/images/palava-z-icon.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />

          <Text style={styles.brandRed}>Palava</Text>
          <Text style={styles.brandWhite}>Hub</Text>

          <Text style={styles.tagline}>Real people. Real talk.{"\n"}Real connections.</Text>
        </View>

        {/* ─── CTAs ──────────────────────────────────────────────────────── */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.primaryBtnText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>Log In</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            By continuing, you agree to our{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/legal/guidelines")}>
              Community Guidelines
            </Text>{" "}
            &{" "}
            <Text style={styles.footerLink} onPress={() => router.push("/legal/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },

  // Two-layer red glow centered behind the logo
  glowHalo: {
    position: "absolute",
    top: "8%",
    alignSelf: "center",
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "#DC2626",
    opacity: 0.16,
  },
  glowCore: {
    position: "absolute",
    top: "16%",
    alignSelf: "center",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#EF4444",
    opacity: 0.22,
  },

  content: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },

  // Brand
  brandBlock: { alignItems: "center" },
  logoImg: {
    width: 168,
    height: 168,
    borderRadius: 36,
  },
  brandRed: {
    color: "#EF4444",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 28,
    lineHeight: 48,
  },
  brandWhite: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  tagline: {
    color: "#E6DDD4",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },

  // CTAs
  ctaBlock: { gap: 14 },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DC2626",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
  secondaryBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  secondaryBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },

  footer: {
    color: "#7A7269",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 10,
  },
  footerLink: { color: "#EF4444", fontWeight: "600" },
});
