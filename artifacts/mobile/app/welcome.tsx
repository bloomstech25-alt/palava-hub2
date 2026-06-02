import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : insets.bottom;
  const { isAuthenticated, isLoading } = useAuth();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background */}
      <LinearGradient
        colors={["#0D0A08", "#1A0E06", "#0A1628", "#0D1B3E"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glow accents */}
      <View style={styles.glowRed} />
      <View style={styles.glowBlue} />
      <View style={styles.glowGold} />

      {/* Main content — fills screen, no scrolling */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: topPad + 20,
            paddingBottom: bottomPad + 8,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* ── Logo section ─────────────────────────────────────────────── */}
        <View style={styles.logoSection}>
          <Image
            source={require("../assets/images/palava-lockup.png")}
            style={styles.lockupImg}
            resizeMode="contain"
          />
          <View style={styles.nameDivider}>
            <View style={[styles.divLine, { backgroundColor: "#BF0A30" }]} />
            <Text style={styles.lrBadge}>🇱🇷 LR</Text>
            <View style={[styles.divLine, { backgroundColor: "#002868" }]} />
          </View>
          <Text style={styles.tagline}>Where Liberian students connect, share & grow</Text>
        </View>

        {/* ── Feature pills ─────────────────────────────────────────────── */}
        <View style={styles.pills}>
          {[
            { icon: "🎓", label: "Campus Stories" },
            { icon: "🔥", label: "Trending" },
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
          <Text style={styles.schoolsLabel}>UL · Cuttington · CWA · BWI · UMU · Ricks</Text>
          <Text style={styles.schoolsMore}>+70 schools</Text>
        </View>

        {/* ── CTA buttons ───────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={() => router.push("/register")}
          >
            <LinearGradient
              colors={["#BF0A30", "#8B0620"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryBtnText}>Join Palava Hub</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <Text style={styles.poweredBy}>Powered by Blooms Technologies</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    web: { minHeight: "100vh" as unknown as number, position: "relative" as const },
    default: { flex: 1 },
  })!,

  glowRed: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#BF0A30",
    opacity: 0.13,
  },
  glowBlue: {
    position: "absolute",
    bottom: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#002868",
    opacity: 0.18,
  },
  glowGold: {
    position: "absolute",
    top: height * 0.38,
    left: width * 0.15,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#D4A855",
    opacity: 0.05,
  },

  content: Platform.select({
    web: {
      minHeight: "100vh" as unknown as number,
      paddingHorizontal: 28,
      justifyContent: "space-between" as const,
    },
    default: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: "space-between" as const,
    },
  })!,

  logoSection: {
    alignItems: "center",
    gap: 10,
  },
  lockupImg: {
    width: width * 0.55,
    height: width * 0.55,
  },
  nameDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "80%",
    marginTop: 2,
  },
  divLine: { flex: 1, height: 1.5, borderRadius: 1, opacity: 0.6 },
  lrBadge: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },

  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },
  pillIcon: { fontSize: 14 },
  pillLabel: { color: "rgba(255,255,255,0.88)", fontSize: 12, fontWeight: "600" },

  schoolsRow: { alignItems: "center", gap: 3 },
  schoolsLabel: {
    color: "rgba(212,168,85,0.75)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  schoolsMore: { color: "rgba(212,168,85,0.5)", fontSize: 10 },

  actions: { gap: 11 },
  primaryBtn: { borderRadius: 16, overflow: "hidden" },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  primaryBtnArrow: { color: "rgba(255,255,255,0.8)", fontSize: 18 },

  secondaryBtn: { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: { color: "rgba(255,255,255,0.55)", fontSize: 14 },

  poweredBy: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
