import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={["#0D0000", "#130202", "#0A0000"]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Red glow behind logo */}
      <View style={styles.glowHalo} />
      <View style={styles.glowCore} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BLOOMS TECHNOLOGIES PRESENTS ─────────────────────────────── */}
        <Text style={styles.presenter}>Blooms Technologies Presents</Text>

        {/* ── Logo + Title row ─────────────────────────────────────────── */}
        <View style={styles.brandRow}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandName}>PALAVA HUB</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.flag}>🇱🇷</Text>
              <Text style={styles.subtitle}>LIBERIA'S OWN SOCIAL MEDIA</Text>
            </View>
          </View>
        </View>

        {/* ── Tagline ───────────────────────────────────────────────────── */}
        <Text style={styles.tagline}>
          Where Liberian students{" "}
          <Text style={styles.taglineAccent}>connect</Text>,{" "}
          <Text style={styles.taglineAccent}>share</Text> &{" "}
          <Text style={styles.taglineAccent}>grow</Text> together
        </Text>

        {/* ── Feature pills ─────────────────────────────────────────────── */}
        <View style={styles.pillsGrid}>
          {[
            { icon: "🎓", label: "Campus Stories" },
            { icon: "🔥", label: "Trending Feed" },
            { icon: "💬", label: "Live Chat" },
            { icon: "📡", label: "Go Live" },
          ].map((f) => (
            <View key={f.label} style={styles.pill}>
              <Text style={styles.pillIcon}>{f.icon}</Text>
              <Text style={styles.pillLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Schools strip ─────────────────────────────────────────────── */}
        <View style={styles.schoolsRow}>
          <Text style={styles.schoolsText}>UL · Cuttington · CWA · BWI · UMU · Ricks</Text>
          <Text style={styles.schoolsMore}>+70 schools</Text>
        </View>

        {/* ── CTA buttons ───────────────────────────────────────────────── */}
        <View style={styles.ctaBlock}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.primaryBtnText}>Join Palava Hub  →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/legal/guidelines")}>
              Community Guidelines
            </Text>{" "}
            &{" "}
            <Text style={styles.legalLink} onPress={() => router.push("/legal/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <Text style={styles.poweredBy}>Powered by Blooms Technologies</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0000",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as object) : {}),
  },

  glowHalo: {
    position: "absolute",
    top: "5%",
    alignSelf: "center",
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "#BF0A30",
    opacity: 0.14,
  },
  glowCore: {
    position: "absolute",
    top: "12%",
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#DC2626",
    opacity: 0.20,
  },

  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 0,
  },

  presenter: {
    color: "#D4A855",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.9,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  brandText: {
    gap: 6,
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flag: { fontSize: 14 },
  subtitle: {
    color: "#D4A855",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  tagline: {
    color: "#C9C0B8",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  taglineAccent: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    width: "100%",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillIcon: { fontSize: 14 },
  pillLabel: {
    color: "#E0D8D0",
    fontSize: 13,
    fontWeight: "600",
  },

  schoolsRow: {
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
  },
  schoolsText: {
    color: "#7A7269",
    fontSize: 12,
    textAlign: "center",
  },
  schoolsMore: {
    color: "#BF0A30",
    fontSize: 11,
    fontWeight: "700",
  },

  ctaBlock: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: "#BF0A30",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#BF0A30",
    shadowOpacity: 0.50,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#9A9089",
    fontSize: 15,
    fontWeight: "600",
  },

  legalText: {
    color: "#5A5248",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: {
    color: "#BF0A30",
    fontWeight: "600",
  },

  poweredBy: {
    color: "#4A4440",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 4,
  },
});
