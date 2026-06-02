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
  const { isAuthenticated, isLoading } = useAuth();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/(tabs)");
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]).start();
  }, []);

  const pt = Platform.OS === "web" ? 32 : insets.top + 8;
  const pb = Platform.OS === "web" ? 24 : insets.bottom + 10;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0D0A08", "#1A0E06", "#0A1628", "#0D1B3E"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowRed} />
      <View style={styles.glowBlue} />

      <Animated.View
        style={[
          styles.screen,
          { paddingTop: pt, paddingBottom: pb, opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* ── Logo + divider + tagline ──────────────────────────────────── */}
        <View style={styles.logoSection}>
          <Image
            source={require("../assets/images/palava-lockup.png")}
            style={styles.lockup}
            resizeMode="contain"
          />
          <View style={styles.dividerRow}>
            <View style={[styles.divLine, { backgroundColor: "#BF0A30" }]} />
            <Text style={styles.lrBadge}>🇱🇷 LR</Text>
            <View style={[styles.divLine, { backgroundColor: "#002868" }]} />
          </View>
          <Text style={styles.tagline}>Where Liberian students connect, share & grow</Text>
        </View>

        {/* ── Pills + schools + buttons ─────────────────────────────────── */}
        <View style={styles.bottomBlock}>
          <View style={styles.pillsRow}>
            <View style={styles.pill}><Text style={styles.pillIcon}>🎓</Text><Text style={styles.pillLabel}>Campus Stories</Text></View>
            <View style={styles.pill}><Text style={styles.pillIcon}>🔥</Text><Text style={styles.pillLabel}>Trending</Text></View>
          </View>
          <View style={styles.pillsRow}>
            <View style={styles.pill}><Text style={styles.pillIcon}>💬</Text><Text style={styles.pillLabel}>Live Chat</Text></View>
            <View style={styles.pill}><Text style={styles.pillIcon}>📡</Text><Text style={styles.pillLabel}>Go Live</Text></View>
          </View>

          <Text style={styles.schools}>
            UL · Cuttington · CWA · BWI · UMU · Ricks{"  "}
            <Text style={styles.schoolsMore}>+70 schools</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/register")}
            style={styles.primaryBtn}
          >
            <LinearGradient
              colors={["#BF0A30", "#8B0620"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGrad}
            >
              <Text style={styles.primaryTxt}>Join Palava Hub  →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/login")}>
            <Text style={styles.secondaryTxt}>I already have an account</Text>
          </TouchableOpacity>

          <Text style={styles.powered}>Powered by Blooms Technologies</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0A08",
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as object) : {}),
  },

  glowRed: {
    position: "absolute", top: -20, left: -20,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#BF0A30", opacity: 0.10,
  },
  glowBlue: {
    position: "absolute", bottom: -40, right: -20,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#002868", opacity: 0.12,
  },

  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: height * 0.05,
  },

  logoSection: {
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  lockup: {
    width: width * 0.65,
    height: width * 0.65,
  },
  dividerRow: {
    flexDirection: "row", alignItems: "center", gap: 10, width: "72%",
  },
  divLine: { flex: 1, height: 1.5, borderRadius: 1, opacity: 0.55 },
  lrBadge: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  tagline: {
    color: "rgba(255,255,255,0.50)", fontSize: 13, textAlign: "center", lineHeight: 19,
  },

  bottomBlock: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  pillsRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  pillIcon: { fontSize: 13 },
  pillLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  schools: {
    color: "rgba(212,168,85,0.65)", fontSize: 11, textAlign: "center", letterSpacing: 0.2,
  },
  schoolsMore: { color: "rgba(191,10,48,0.80)", fontWeight: "700" },

  primaryBtn: { width: "100%", borderRadius: 14, overflow: "hidden" },
  primaryGrad: { alignItems: "center", justifyContent: "center", paddingVertical: 15 },
  primaryTxt: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  secondaryTxt: { color: "rgba(255,255,255,0.40)", fontSize: 13, paddingVertical: 2 },
  powered: { color: "rgba(255,255,255,0.16)", fontSize: 10, letterSpacing: 0.4 },
});
