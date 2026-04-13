import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// ─── Liberian Dan-style mask (abstract/stylized) ───────────────────────────
function DanMask({ size = 120, color = "#C17A54", opacity = 0.18 }: { size?: number; color?: string; opacity?: number }) {
  const faceH = size * 1.4;
  const eyeW = size * 0.18;
  const eyeH = size * 0.07;
  return (
    <View style={{ width: size, height: faceH, alignItems: "center", opacity }}>
      {/* Crest / topknot */}
      <View style={{
        width: size * 0.18, height: size * 0.32, borderRadius: size * 0.09,
        backgroundColor: color, marginBottom: -size * 0.04,
      }} />
      {/* Forehead brow bar */}
      <View style={{
        width: size * 0.72, height: size * 0.09, borderTopLeftRadius: size * 0.3,
        borderTopRightRadius: size * 0.3, backgroundColor: color,
      }} />
      {/* Face oval */}
      <View style={{
        width: size, height: faceH * 0.65, borderRadius: size * 0.5,
        backgroundColor: color, alignItems: "center", justifyContent: "center",
      }}>
        {/* Eyes */}
        <View style={{ flexDirection: "row", gap: size * 0.16, marginTop: -size * 0.1 }}>
          <View style={{
            width: eyeW, height: eyeH, borderRadius: eyeH / 2,
            backgroundColor: "rgba(0,0,0,0.6)",
          }} />
          <View style={{
            width: eyeW, height: eyeH, borderRadius: eyeH / 2,
            backgroundColor: "rgba(0,0,0,0.6)",
          }} />
        </View>
        {/* Nose bridge */}
        <View style={{
          width: size * 0.08, height: size * 0.2, borderRadius: size * 0.04,
          backgroundColor: "rgba(0,0,0,0.2)", marginTop: size * 0.04,
        }} />
        {/* Mouth slit */}
        <View style={{
          width: size * 0.28, height: size * 0.045, borderRadius: size * 0.02,
          backgroundColor: "rgba(0,0,0,0.35)", marginTop: size * 0.06,
        }} />
        {/* Cheek scarification dots */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: size * 0.78, marginTop: size * 0.04 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{
              width: size * 0.07, height: size * 0.07, borderRadius: size * 0.035,
              backgroundColor: "rgba(0,0,0,0.25)",
            }} />
          ))}
        </View>
      </View>
      {/* Chin */}
      <View style={{
        width: size * 0.42, height: size * 0.16, borderBottomLeftRadius: size * 0.2,
        borderBottomRightRadius: size * 0.2, backgroundColor: color, marginTop: -size * 0.04,
      }} />
    </View>
  );
}

// ─── Sande / Sowei helmet mask ─────────────────────────────────────────────
function SandeMask({ size = 100, color = "#8B4513", opacity = 0.15 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <View style={{ width: size, height: size * 1.6, alignItems: "center", opacity }}>
      {/* Elaborate crest / headpiece */}
      <View style={{ flexDirection: "row", gap: size * 0.06, marginBottom: -size * 0.06 }}>
        {[0.6, 1, 0.7].map((h, i) => (
          <View key={i} style={{
            width: size * 0.14, height: size * 0.28 * h,
            borderTopLeftRadius: size * 0.07, borderTopRightRadius: size * 0.07,
            backgroundColor: color,
          }} />
        ))}
      </View>
      {/* Head dome */}
      <View style={{
        width: size * 0.9, height: size * 0.5, borderTopLeftRadius: size * 0.45,
        borderTopRightRadius: size * 0.45, backgroundColor: color,
      }} />
      {/* Face area */}
      <View style={{
        width: size * 0.76, height: size * 0.72, borderRadius: size * 0.38,
        backgroundColor: color, alignItems: "center", justifyContent: "center",
        marginTop: -size * 0.1,
      }}>
        {/* Brow ridge */}
        <View style={{
          width: size * 0.55, height: size * 0.07, borderRadius: size * 0.035,
          backgroundColor: "rgba(0,0,0,0.3)", marginBottom: size * 0.08,
        }} />
        {/* Narrow eyes */}
        <View style={{ flexDirection: "row", gap: size * 0.12 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{
              width: size * 0.15, height: size * 0.045, borderRadius: size * 0.022,
              backgroundColor: "rgba(0,0,0,0.55)",
            }} />
          ))}
        </View>
        {/* Rings around neck */}
        <View style={{ marginTop: size * 0.14, gap: size * 0.04 }}>
          {[0.52, 0.6, 0.52].map((w, i) => (
            <View key={i} style={{
              width: size * w, height: size * 0.048,
              borderRadius: size * 0.024, backgroundColor: "rgba(0,0,0,0.2)",
            }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Grebo / Kru geometric mask ────────────────────────────────────────────
function GreboMask({ size = 90, color = "#D4A855", opacity = 0.15 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <View style={{ width: size, height: size * 1.5, alignItems: "center", opacity }}>
      {/* Horns */}
      <View style={{ flexDirection: "row", gap: size * 0.3, marginBottom: -size * 0.05 }}>
        {[-18, 18].map((rot, i) => (
          <View key={i} style={{
            width: size * 0.12, height: size * 0.35, borderTopLeftRadius: size * 0.06,
            borderTopRightRadius: size * 0.06, backgroundColor: color,
            transform: [{ rotate: `${rot}deg` }],
          }} />
        ))}
      </View>
      {/* Rectangular face */}
      <View style={{
        width: size, height: size * 1.05, borderRadius: size * 0.12,
        backgroundColor: color, alignItems: "center",
      }}>
        {/* Horizontal brow band */}
        <View style={{
          width: size, height: size * 0.12, backgroundColor: "rgba(0,0,0,0.22)", marginTop: size * 0.18,
        }} />
        {/* Cylindrical eyes */}
        <View style={{ flexDirection: "row", gap: size * 0.14, marginTop: size * 0.08 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{
              width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1,
              backgroundColor: "rgba(0,0,0,0.5)", borderWidth: size * 0.025,
              borderColor: "rgba(255,255,255,0.15)",
            }} />
          ))}
        </View>
        {/* Vertical nose slit */}
        <View style={{
          width: size * 0.07, height: size * 0.22, borderRadius: size * 0.035,
          backgroundColor: "rgba(0,0,0,0.3)", marginTop: size * 0.06,
        }} />
        {/* Geometric mouth */}
        <View style={{
          width: size * 0.5, height: size * 0.08, borderRadius: size * 0.04,
          backgroundColor: "rgba(0,0,0,0.35)", marginTop: size * 0.06,
        }} />
        {/* Side tribal lines */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: size * 0.9, marginTop: size * 0.06 }}>
          {[0, 1].map((side) => (
            <View key={side} style={{ gap: size * 0.03 }}>
              {[0, 1, 2].map((line) => (
                <View key={line} style={{
                  width: size * 0.14, height: size * 0.025,
                  borderRadius: size * 0.012, backgroundColor: "rgba(0,0,0,0.2)",
                }} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Kente-inspired geometric strip ───────────────────────────────────────
function KenteStrip({ width: w, opacity = 0.12 }: { width: number; opacity?: number }) {
  const colors = ["#BF0A30", "#D4A855", "#002868", "#C17A54", "#BF0A30", "#D4A855", "#002868"];
  const blockW = w / colors.length;
  return (
    <View style={{ flexDirection: "row", width: w, height: 8, opacity }}>
      {colors.map((c, i) => (
        <View key={i} style={{ width: blockW, height: 8, backgroundColor: c }} />
      ))}
    </View>
  );
}

// ─── Welcome screen ────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const mask1Anim = useRef(new Animated.Value(0)).current;
  const mask2Anim = useRef(new Animated.Value(0)).current;
  const mask3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mask1Anim, { toValue: 1, duration: 1000, useNativeDriver: false }),
      Animated.timing(mask2Anim, { toValue: 1, duration: 1200, useNativeDriver: false }),
      Animated.timing(mask3Anim, { toValue: 1, duration: 1100, useNativeDriver: false }),
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Rich Liberian-themed background */}
      <LinearGradient
        colors={["#0D0A08", "#1A0E06", "#0A1628", "#0D1B3E"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Subtle red glow top-left (Liberian flag red) */}
      <View style={styles.glowRed} />
      {/* Blue glow bottom-right (Liberian flag blue) */}
      <View style={styles.glowBlue} />
      {/* Gold glow center */}
      <View style={styles.glowGold} />

      {/* Kente strips top */}
      <View style={[styles.kenteTop, { top: topPad }]}>
        <KenteStrip width={width} opacity={0.18} />
        <View style={{ height: 3 }} />
        <KenteStrip width={width} opacity={0.12} />
      </View>

      {/* ── Decorative Masks (background) ── */}
      {/* Mask 1 — Dan mask, top-left, tilted */}
      <Animated.View style={[styles.maskBg1, { opacity: mask1Anim }]}>
        <DanMask size={110} color="#C17A54" opacity={1} />
      </Animated.View>

      {/* Mask 2 — Sande mask, top-right */}
      <Animated.View style={[styles.maskBg2, { opacity: mask2Anim }]}>
        <SandeMask size={95} color="#8B6914" opacity={1} />
      </Animated.View>

      {/* Mask 3 — Grebo mask, bottom-left */}
      <Animated.View style={[styles.maskBg3, { opacity: mask3Anim }]}>
        <GreboMask size={85} color="#D4A855" opacity={1} />
      </Animated.View>

      {/* Mask 4 — small Dan, bottom-right */}
      <Animated.View style={[styles.maskBg4, { opacity: mask1Anim }]}>
        <DanMask size={70} color="#BF0A30" opacity={1} />
      </Animated.View>

      {/* ── Main Content ── */}
      <Animated.View style={[styles.content, { paddingTop: topPad + 24, paddingBottom: bottomPad + 16, opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* Logo section */}
        <View style={styles.logoSection}>
          {/* Liberian star emblem */}
          <View style={styles.starContainer}>
            <Text style={styles.starEmoji}>⭐</Text>
            <View style={styles.flagStripe1} />
            <View style={styles.flagStripe2} />
          </View>

          <Text style={styles.appName}>Palava</Text>
          <View style={styles.nameDivider}>
            <View style={[styles.divLine, { backgroundColor: "#BF0A30" }]} />
            <Text style={styles.lrBadge}>🇱🇷 LR</Text>
            <View style={[styles.divLine, { backgroundColor: "#002868" }]} />
          </View>
          <Text style={styles.tagline}>Where Liberian students connect, share & grow</Text>
        </View>

        {/* Feature pills */}
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

        {/* Schools snippet */}
        <View style={styles.schoolsRow}>
          <Text style={styles.schoolsLabel}>UL · Cuttington · CWA · BWI · UMU · Ricks</Text>
          <Text style={styles.schoolsMore}>+22 schools</Text>
        </View>

        {/* CTA buttons */}
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
              <Text style={styles.primaryBtnText}>Join Palava</Text>
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
      </Animated.View>

      {/* Kente strips bottom */}
      <View style={[styles.kenteBottom, { bottom: bottomPad }]}>
        <KenteStrip width={width} opacity={0.12} />
        <View style={{ height: 3 }} />
        <KenteStrip width={width} opacity={0.18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },

  // Atmospheric glows
  glowRed: {
    position: "absolute", top: -80, left: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: "#BF0A30", opacity: 0.12,
  },
  glowBlue: {
    position: "absolute", bottom: -100, right: -80,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: "#002868", opacity: 0.18,
  },
  glowGold: {
    position: "absolute", top: height * 0.35, left: width * 0.2,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "#D4A855", opacity: 0.05,
  },

  // Kente strips
  kenteTop: { position: "absolute", left: 0, right: 0 },
  kenteBottom: { position: "absolute", left: 0, right: 0 },

  // Mask positions (all very transparent background deco)
  maskBg1: { position: "absolute", top: height * 0.04, left: -28, opacity: 0.22 },
  maskBg2: { position: "absolute", top: height * 0.06, right: -20, opacity: 0.18 },
  maskBg3: { position: "absolute", bottom: height * 0.18, left: -22, opacity: 0.15 },
  maskBg4: { position: "absolute", bottom: height * 0.12, right: -16, opacity: 0.16 },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  // Logo
  logoSection: { alignItems: "center", paddingTop: 24 },
  starContainer: { alignItems: "center", marginBottom: 18 },
  starEmoji: { fontSize: 36 },
  flagStripe1: { width: 48, height: 3, backgroundColor: "#BF0A30", borderRadius: 2, marginTop: 8 },
  flagStripe2: { width: 32, height: 3, backgroundColor: "#002868", borderRadius: 2, marginTop: 4 },

  appName: {
    fontSize: 62,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -2,
    textShadowColor: "rgba(212, 168, 85, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  nameDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  divLine: { flex: 1, height: 2, borderRadius: 1, opacity: 0.7 },
  lrBadge: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", letterSpacing: 1 },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },

  // Pills
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillIcon: { fontSize: 16 },
  pillLabel: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "600" },

  // Schools
  schoolsRow: { alignItems: "center", gap: 4 },
  schoolsLabel: { color: "rgba(212,168,85,0.8)", fontSize: 12, textAlign: "center", letterSpacing: 0.3 },
  schoolsMore: { color: "rgba(212,168,85,0.5)", fontSize: 11 },

  // Actions
  actions: { gap: 12 },
  primaryBtn: { borderRadius: 18, overflow: "hidden" },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  primaryBtnText: { color: "#ffffff", fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  primaryBtnArrow: { color: "rgba(255,255,255,0.8)", fontSize: 20 },
  secondaryBtn: { alignItems: "center", paddingVertical: 14 },
  secondaryBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 15 },
});
