import { Feather } from "@expo/vector-icons";
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

      {/* Subtle red glow behind the brand mark — gives the dark hero a warm
          Liberian-flag feel without competing with the logo. */}
      <LinearGradient
        colors={["#0D0A08", "#1A0A08", "#0D0A08"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.glow} />

      <View style={[styles.content, { paddingTop: topPad + 30, paddingBottom: bottomPad + 24 }]}>
        {/* ─── Logo block ──────────────────────────────────────────────────── */}
        <View style={styles.logoBlock}>
          <View style={styles.logoFrame}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brand}>
            <Text style={styles.brandRed}>Palava </Text>
            <Text style={styles.brandWhite}>Hub</Text>
          </Text>

          <Text style={styles.tagline}>
            Liberia's home for student stories, jams, and big talks.
          </Text>
        </View>

        {/* ─── Quick value props ───────────────────────────────────────────── */}
        <View style={styles.valueRow}>
          <ValueChip icon="users" text="50+ schools" />
          <ValueChip icon="zap" text="Campus Jams" />
          <ValueChip icon="message-circle" text="Anonymous Palava" />
        </View>

        {/* ─── CTAs ───────────────────────────────────────────────────────── */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Feather name="arrow-right" size={17} color="#0D0A08" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Footer ─────────────────────────────────────────────────────── */}
        <Text style={styles.footer}>
          By continuing, you agree to our{" "}
          <Text style={styles.footerLink} onPress={() => router.push("/legal/guidelines")}>
            Community Guidelines
          </Text>{" "}
          and{" "}
          <Text style={styles.footerLink} onPress={() => router.push("/legal/privacy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}

function ValueChip({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.chip}>
      <Feather name={icon} size={12} color="#DC2626" />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0A08" },
  glow: {
    position: "absolute",
    top: -160,
    left: -100,
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: "#DC2626",
    opacity: 0.18,
  },
  content: { flex: 1, paddingHorizontal: 26, justifyContent: "space-between" },

  // Logo
  logoBlock: { alignItems: "center", marginTop: 18 },
  logoFrame: {
    width: 132,
    height: 132,
    borderRadius: 30,
    backgroundColor: "#171210",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A1F1B",
    shadowColor: "#DC2626",
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoImg: { width: 110, height: 110, borderRadius: 22 },
  brand: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 22,
    textAlign: "center",
  },
  brandRed: { color: "#DC2626" },
  brandWhite: { color: "#FFFFFF" },
  tagline: {
    color: "#C5BCB3",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
  },

  // Value chips
  valueRow: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#1A1310",
    borderWidth: 1,
    borderColor: "#2A1F1B",
  },
  chipText: { color: "#E6DDD4", fontSize: 12, fontWeight: "600" },

  // CTAs
  ctaBlock: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  primaryBtnText: { color: "#0D0A08", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  secondaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#2A1F1B",
    backgroundColor: "#11100E",
  },
  secondaryBtnText: { color: "#E6DDD4", fontSize: 15, fontWeight: "700" },

  // Footer
  footer: {
    color: "#7A7269",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  footerLink: { color: "#DC2626", fontWeight: "600" },
});
