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
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// ─── Dan Mask — carved oval wood face, narrow slit eyes ──────────────────────
function DanMask({ size = 120, opacity = 0.85 }: { size?: number; opacity?: number }) {
  const s = size / 100;
  return (
    <Svg width={size} height={size * 1.55} viewBox="0 0 100 155" style={{ opacity }}>
      <Defs>
        {/* Main face wood grain gradient — light center, dark edges */}
        <RadialGradient id="danFace" cx="50%" cy="42%" rx="55%" ry="50%">
          <Stop offset="0%" stopColor="#C8845A" />
          <Stop offset="45%" stopColor="#A0622E" />
          <Stop offset="85%" stopColor="#6B3A14" />
          <Stop offset="100%" stopColor="#3D1E06" />
        </RadialGradient>
        {/* Crest gradient */}
        <SvgLinearGradient id="danCrest" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7A4018" />
          <Stop offset="100%" stopColor="#3D1E06" />
        </SvgLinearGradient>
        {/* Eye shadow */}
        <RadialGradient id="danEyeShadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1A0800" />
          <Stop offset="100%" stopColor="#0A0300" />
        </RadialGradient>
        {/* Cheek highlight */}
        <RadialGradient id="danHighlight" cx="50%" cy="30%" rx="50%" ry="60%">
          <Stop offset="0%" stopColor="rgba(220,160,90,0.5)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </RadialGradient>
      </Defs>

      {/* Forehead crest / topknot */}
      <Path
        d="M 42 18 Q 50 2 58 18 Q 54 8 50 6 Q 46 8 42 18 Z"
        fill="url(#danCrest)"
      />
      {/* Crest base connector */}
      <Ellipse cx="50" cy="18" rx="10" ry="5" fill="#7A4018" />

      {/* Main face oval */}
      <Path
        d="M 14 55 Q 12 32 28 22 Q 38 15 50 14 Q 62 15 72 22 Q 88 32 86 55 Q 88 80 76 95 Q 66 108 50 110 Q 34 108 24 95 Q 12 80 14 55 Z"
        fill="url(#danFace)"
      />

      {/* Wood grain texture lines */}
      <Path d="M 30 35 Q 50 28 70 35" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" fill="none" />
      <Path d="M 22 55 Q 50 46 78 55" stroke="rgba(0,0,0,0.10)" strokeWidth="0.6" fill="none" />
      <Path d="M 24 72 Q 50 64 76 72" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" fill="none" />

      {/* Brow ridge — thick carved bar casting shadow */}
      <Path
        d="M 22 40 Q 50 33 78 40 Q 78 46 50 47 Q 22 46 22 40 Z"
        fill="rgba(0,0,0,0.28)"
      />
      {/* Brow highlight (top edge) */}
      <Path d="M 24 40 Q 50 33 76 40" stroke="rgba(200,150,80,0.4)" strokeWidth="1" fill="none" />

      {/* Left eye — narrow carved slit with depth */}
      <Path
        d="M 30 53 Q 37 50 44 53 Q 37 57 30 53 Z"
        fill="url(#danEyeShadow)"
      />
      <Path d="M 30 53 Q 37 51 44 53" stroke="rgba(180,100,40,0.5)" strokeWidth="0.5" fill="none" />
      {/* Left eye inner glint */}
      <Ellipse cx="37" cy="52.5" rx="2" ry="0.8" fill="rgba(255,255,255,0.08)" />

      {/* Right eye */}
      <Path
        d="M 56 53 Q 63 50 70 53 Q 63 57 56 53 Z"
        fill="url(#danEyeShadow)"
      />
      <Path d="M 56 53 Q 63 51 70 53" stroke="rgba(180,100,40,0.5)" strokeWidth="0.5" fill="none" />
      <Ellipse cx="63" cy="52.5" rx="2" ry="0.8" fill="rgba(255,255,255,0.08)" />

      {/* Nose bridge — proud ridge */}
      <Path
        d="M 46 60 Q 50 58 54 60 L 55 76 Q 53 80 50 81 Q 47 80 45 76 Z"
        fill="rgba(0,0,0,0.22)"
      />
      {/* Nose highlight */}
      <Path d="M 49 60 Q 51 58 52 60 L 52 75" stroke="rgba(210,140,70,0.45)" strokeWidth="1" fill="none" />
      {/* Nostrils */}
      <Ellipse cx="44.5" cy="79" rx="3.5" ry="2.5" fill="rgba(0,0,0,0.38)" />
      <Ellipse cx="55.5" cy="79" rx="3.5" ry="2.5" fill="rgba(0,0,0,0.38)" />

      {/* Philtrum */}
      <Path d="M 47 81 Q 50 83 53 81 L 53 85 Q 50 87 47 85 Z" fill="rgba(0,0,0,0.18)" />

      {/* Mouth — small rounded lips */}
      <Path
        d="M 38 90 Q 44 87 50 88 Q 56 87 62 90 Q 56 96 50 96 Q 44 96 38 90 Z"
        fill="rgba(0,0,0,0.45)"
      />
      {/* Upper lip line */}
      <Path d="M 38 90 Q 50 87 62 90" stroke="rgba(160,80,30,0.6)" strokeWidth="0.8" fill="none" />

      {/* Cheekbone highlights */}
      <Ellipse cx="30" cy="65" rx="7" ry="5" fill="url(#danHighlight)" />
      <Ellipse cx="70" cy="65" rx="7" ry="5" fill="url(#danHighlight)" />

      {/* Scarification dots on cheeks — 3 per side */}
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Circle cx={25 + i * 5} cy={70 + i * 2} r="1.8" fill="rgba(0,0,0,0.35)" />
          <Circle cx={75 - i * 5} cy={70 + i * 2} r="1.8" fill="rgba(0,0,0,0.35)" />
        </React.Fragment>
      ))}

      {/* Chin */}
      <Path
        d="M 34 105 Q 50 115 66 105 Q 58 120 50 122 Q 42 120 34 105 Z"
        fill="#6B3A14"
      />

      {/* Overall shading overlay for depth */}
      <Path
        d="M 14 55 Q 12 32 28 22 Q 38 15 50 14 Q 62 15 72 22 Q 88 32 86 55 Q 88 80 76 95 Q 66 108 50 110 Q 34 108 24 95 Q 12 80 14 55 Z"
        fill="rgba(0,0,0,0)"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="3"
      />
    </Svg>
  );
}

// ─── Sande/Sowei Helmet Mask — black polished dome with neck rings ────────────
function SandeMask({ size = 100, opacity = 0.85 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size * 1.7} viewBox="0 0 100 170" style={{ opacity }}>
      <Defs>
        <RadialGradient id="sandeFace" cx="40%" cy="35%" rx="60%" ry="55%">
          <Stop offset="0%" stopColor="#5A4030" />
          <Stop offset="50%" stopColor="#2E1E10" />
          <Stop offset="100%" stopColor="#0A0604" />
        </RadialGradient>
        <SvgLinearGradient id="sandeRing" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#6A4A28" />
          <Stop offset="40%" stopColor="#3A2810" />
          <Stop offset="100%" stopColor="#1A0E06" />
        </SvgLinearGradient>
        <RadialGradient id="sandeShine" cx="35%" cy="25%" rx="45%" ry="40%">
          <Stop offset="0%" stopColor="rgba(200,160,100,0.35)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </RadialGradient>
        <SvgLinearGradient id="sandeTop" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0%" stopColor="#4A3020" />
          <Stop offset="100%" stopColor="#0A0604" />
        </SvgLinearGradient>
      </Defs>

      {/* Head crest — three prongs */}
      <Path d="M 38 22 Q 40 8 44 6 Q 46 4 48 6 Q 50 8 50 22" fill="url(#sandeTop)" />
      <Path d="M 50 22 Q 50 6 52 4 Q 54 2 56 4 Q 58 6 58 18 Q 55 15 50 22" fill="url(#sandeTop)" />
      <Path d="M 30 26 Q 32 14 35 12 Q 37 10 38 14 Q 39 18 38 22" fill="url(#sandeTop)" />

      {/* Dome / skull cap */}
      <Path
        d="M 10 62 Q 8 38 22 24 Q 34 12 50 12 Q 66 12 78 24 Q 92 38 90 62 Q 90 80 78 90 Q 66 98 50 99 Q 34 98 22 90 Q 10 80 10 62 Z"
        fill="url(#sandeFace)"
      />
      {/* High-polish shine patch */}
      <Path
        d="M 10 62 Q 8 38 22 24 Q 34 12 50 12 Q 66 12 78 24 Q 92 38 90 62 Q 90 80 78 90 Q 66 98 50 99 Q 34 98 22 90 Q 10 80 10 62 Z"
        fill="url(#sandeShine)"
      />

      {/* Carved brow line across forehead */}
      <Path d="M 22 50 Q 50 44 78 50" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Brow highlight */}
      <Path d="M 22 49 Q 50 43 78 49" stroke="rgba(150,100,50,0.3)" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Eyes — tiny, serene, barely-open slits */}
      <Path d="M 30 60 Q 38 57 44 60 Q 38 63 30 60 Z" fill="rgba(0,0,0,0.9)" />
      <Path d="M 56 60 Q 62 57 70 60 Q 62 63 56 60 Z" fill="rgba(0,0,0,0.9)" />
      {/* Eye lid highlights */}
      <Path d="M 31 59.5 Q 37 57.5 43 59.5" stroke="rgba(160,110,60,0.4)" strokeWidth="0.6" fill="none" />
      <Path d="M 57 59.5 Q 63 57.5 69 59.5" stroke="rgba(160,110,60,0.4)" strokeWidth="0.6" fill="none" />

      {/* Nose — flat, wide, carved */}
      <Path
        d="M 45 66 Q 50 64 55 66 L 57 78 Q 54 82 50 83 Q 46 82 43 78 Z"
        fill="rgba(0,0,0,0.4)"
      />
      {/* Nostrils wide */}
      <Ellipse cx="43" cy="80" rx="4" ry="3" fill="rgba(0,0,0,0.55)" />
      <Ellipse cx="57" cy="80" rx="4" ry="3" fill="rgba(0,0,0,0.55)" />

      {/* Mouth — barely open, composed */}
      <Path d="M 36 88 Q 50 86 64 88 Q 56 93 50 93 Q 44 93 36 88 Z" fill="rgba(0,0,0,0.7)" />

      {/* Neck rings — Sande's signature feature (3 rings) */}
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Path
            d={`M 20 ${105 + i * 16} Q 50 ${100 + i * 16} 80 ${105 + i * 16} Q 80 ${113 + i * 16} 50 ${115 + i * 16} Q 20 ${113 + i * 16} 20 ${105 + i * 16} Z`}
            fill="url(#sandeRing)"
          />
          {/* Ring highlight */}
          <Path
            d={`M 22 ${104 + i * 16} Q 50 ${99 + i * 16} 78 ${104 + i * 16}`}
            stroke="rgba(150,100,50,0.35)"
            strokeWidth="1"
            fill="none"
          />
        </React.Fragment>
      ))}

      {/* Outer edge shadow */}
      <Path
        d="M 10 62 Q 8 38 22 24 Q 34 12 50 12 Q 66 12 78 24 Q 92 38 90 62 Q 90 80 78 90 Q 66 98 50 99 Q 34 98 22 90 Q 10 80 10 62 Z"
        fill="none"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth="4"
      />
    </Svg>
  );
}

// ─── Grebo/Kru Geometric Mask — tubular eyes, angular face, horns ─────────────
function GreboMask({ size = 90, opacity = 0.85 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={size} height={size * 1.6} viewBox="0 0 100 160" style={{ opacity }}>
      <Defs>
        <SvgLinearGradient id="greBoFace" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0%" stopColor="#C8A44A" />
          <Stop offset="40%" stopColor="#A07828" />
          <Stop offset="100%" stopColor="#5C3E0A" />
        </SvgLinearGradient>
        <RadialGradient id="greboEye" cx="50%" cy="30%" rx="50%" ry="60%">
          <Stop offset="0%" stopColor="#1A0E00" />
          <Stop offset="70%" stopColor="#0A0600" />
          <Stop offset="100%" stopColor="#000000" />
        </RadialGradient>
        <SvgLinearGradient id="greboHorn" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor="#8A6820" />
          <Stop offset="100%" stopColor="#4A3410" />
        </SvgLinearGradient>
        <RadialGradient id="greboHighlight" cx="30%" cy="20%" rx="60%" ry="70%">
          <Stop offset="0%" stopColor="rgba(240,200,100,0.3)" />
          <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </RadialGradient>
      </Defs>

      {/* Left horn */}
      <Path
        d="M 28 28 Q 22 10 26 4 Q 29 0 31 4 Q 33 8 32 20 Q 32 24 28 28 Z"
        fill="url(#greboHorn)"
        transform="rotate(-12 30 16)"
      />
      {/* Right horn */}
      <Path
        d="M 72 28 Q 78 10 74 4 Q 71 0 69 4 Q 67 8 68 20 Q 68 24 72 28 Z"
        fill="url(#greboHorn)"
        transform="rotate(12 70 16)"
      />
      {/* Horn striping */}
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Path
            d={`M ${23 + i} ${27 - i * 4} Q ${24 + i} ${20 - i * 4} ${25 + i} ${14 - i * 3}`}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
            fill="none"
          />
        </React.Fragment>
      ))}

      {/* Main rectangular face */}
      <Path
        d="M 10 30 Q 8 28 10 26 L 20 24 Q 50 18 80 24 L 90 26 Q 92 28 90 30 L 90 110 Q 90 125 80 130 Q 65 136 50 136 Q 35 136 20 130 Q 10 125 10 110 Z"
        fill="url(#greBoFace)"
      />
      {/* Face highlight */}
      <Path
        d="M 10 30 Q 8 28 10 26 L 20 24 Q 50 18 80 24 L 90 26 Q 92 28 90 30 L 90 110 Q 90 125 80 130 Q 65 136 50 136 Q 35 136 20 130 Q 10 125 10 110 Z"
        fill="url(#greboHighlight)"
      />

      {/* Forehead carved band */}
      <Path d="M 10 30 L 90 30 L 90 44 Q 50 38 10 44 Z" fill="rgba(0,0,0,0.22)" />
      <Path d="M 10 30 L 90 30" stroke="rgba(220,180,80,0.4)" strokeWidth="1.5" fill="none" />
      <Path d="M 10 44 Q 50 38 90 44" stroke="rgba(0,0,0,0.4)" strokeWidth="1" fill="none" />

      {/* Left eye cylinder — tubular protrusion (Grebo hallmark) */}
      <Ellipse cx="33" cy="62" rx="13" ry="16" fill="rgba(0,0,0,0.5)" />
      <Ellipse cx="33" cy="62" rx="10" ry="13" fill="url(#greboEye)" />
      {/* Eye rim highlight */}
      <Path d="M 23 55 Q 33 51 43 55" stroke="rgba(200,160,60,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Pupil white glint */}
      <Ellipse cx="30" cy="57" rx="2.5" ry="2" fill="rgba(255,255,255,0.12)" />

      {/* Right eye cylinder */}
      <Ellipse cx="67" cy="62" rx="13" ry="16" fill="rgba(0,0,0,0.5)" />
      <Ellipse cx="67" cy="62" rx="10" ry="13" fill="url(#greboEye)" />
      <Path d="M 57 55 Q 67 51 77 55" stroke="rgba(200,160,60,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Ellipse cx="64" cy="57" rx="2.5" ry="2" fill="rgba(255,255,255,0.12)" />

      {/* Nose — flat vertical ridge */}
      <Rect x="44" y="82" width="12" height="24" rx="3" fill="rgba(0,0,0,0.28)" />
      {/* Nose highlight */}
      <Rect x="46" y="83" width="4" height="22" rx="2" fill="rgba(200,160,60,0.2)" />
      {/* Nostrils */}
      <Ellipse cx="42" cy="106" rx="5" ry="3.5" fill="rgba(0,0,0,0.45)" />
      <Ellipse cx="58" cy="106" rx="5" ry="3.5" fill="rgba(0,0,0,0.45)" />

      {/* Mouth — wide horizontal slit */}
      <Rect x="25" y="112" width="50" height="7" rx="3.5" fill="rgba(0,0,0,0.5)" />
      <Path d="M 25 112 L 75 112" stroke="rgba(180,130,40,0.3)" strokeWidth="1" fill="none" />

      {/* Tribal incision lines — sides */}
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Path
            d={`M 12 ${52 + i * 12} L 20 ${52 + i * 12}`}
            stroke="rgba(0,0,0,0.38)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={`M 80 ${52 + i * 12} L 88 ${52 + i * 12}`}
            stroke="rgba(0,0,0,0.38)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </React.Fragment>
      ))}

      {/* Outer frame border (carved edge) */}
      <Path
        d="M 10 30 Q 8 28 10 26 L 20 24 Q 50 18 80 24 L 90 26 Q 92 28 90 30 L 90 110 Q 90 125 80 130 Q 65 136 50 136 Q 35 136 20 130 Q 10 125 10 110 Z"
        fill="none"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="3.5"
      />
    </Svg>
  );
}

// ─── Kente-inspired geometric strip ────────────────────────────────────────────
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

// ─── Welcome screen ─────────────────────────────────────────────────────────────
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

      {/* Atmospheric glows */}
      <View style={styles.glowRed} />
      <View style={styles.glowBlue} />
      <View style={styles.glowGold} />

      {/* Kente strips top */}
      <View style={[styles.kenteTop, { top: topPad }]}>
        <KenteStrip width={width} opacity={0.18} />
        <View style={{ height: 3 }} />
        <KenteStrip width={width} opacity={0.12} />
      </View>

      {/* ── Decorative Masks (background) ── */}
      {/* Mask 1 — Dan mask, top-left */}
      <Animated.View style={[styles.maskBg1, { opacity: mask1Anim }]}>
        <DanMask size={115} opacity={0.82} />
      </Animated.View>

      {/* Mask 2 — Sande mask, top-right */}
      <Animated.View style={[styles.maskBg2, { opacity: mask2Anim }]}>
        <SandeMask size={98} opacity={0.75} />
      </Animated.View>

      {/* Mask 3 — Grebo mask, bottom-left */}
      <Animated.View style={[styles.maskBg3, { opacity: mask3Anim }]}>
        <GreboMask size={88} opacity={0.70} />
      </Animated.View>

      {/* Mask 4 — small Dan, bottom-right */}
      <Animated.View style={[styles.maskBg4, { opacity: mask1Anim }]}>
        <DanMask size={72} opacity={0.65} />
      </Animated.View>

      {/* ── Main Content ── */}
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: topPad + 24,
            paddingBottom: bottomPad + 16,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Logo section */}
        <View style={styles.logoSection}>
          <View style={styles.starContainer}>
            <Image
              source={require("../assets/images/icon.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
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

  kenteTop: { position: "absolute", left: 0, right: 0 },
  kenteBottom: { position: "absolute", left: 0, right: 0 },

  maskBg1: { position: "absolute", top: height * 0.02, left: -30 },
  maskBg2: { position: "absolute", top: height * 0.04, right: -22 },
  maskBg3: { position: "absolute", bottom: height * 0.16, left: -24 },
  maskBg4: { position: "absolute", bottom: height * 0.10, right: -18 },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },

  logoSection: { alignItems: "center", paddingTop: 24 },
  starContainer: { alignItems: "center", marginBottom: 18 },
  logoImg: { width: 92, height: 92, borderRadius: 20 },
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

  schoolsRow: { alignItems: "center", gap: 4 },
  schoolsLabel: { color: "rgba(212,168,85,0.8)", fontSize: 12, textAlign: "center", letterSpacing: 0.3 },
  schoolsMore: { color: "rgba(212,168,85,0.5)", fontSize: 11 },

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
