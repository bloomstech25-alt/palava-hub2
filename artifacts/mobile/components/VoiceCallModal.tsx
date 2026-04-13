import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  name: string;
  avatar: string;
  school: string;
  onEnd: () => void;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VoiceCallModal({ visible, name, avatar, school, onEnd }: Props) {
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [connected, setConnected] = useState(false);
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setDuration(0);
      setConnected(false);
      setMuted(false);
      setSpeaker(false);

      // Connecting animation pulses
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulse1, { toValue: 1.4, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse2, { toValue: 1.8, duration: 800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse1, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(pulse2, { toValue: 1, duration: 800, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();

      // Connect after 2s
      connectRef.current = setTimeout(() => {
        setConnected(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }, 2000);

      return () => {
        loop.stop();
        if (connectRef.current) clearTimeout(connectRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [visible]);

  const handleEnd = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (connectRef.current) clearTimeout(connectRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onEnd();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Background gradient effect */}
        <View style={[styles.bg, { backgroundColor: "#0f172a" }]} />
        <View style={[styles.bgOverlay, { backgroundColor: "#1e3a5f" }]} />

        <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
          {/* Status */}
          <Text style={styles.statusText}>
            {connected ? "🔒 Encrypted Voice Call" : "Connecting..."}
          </Text>

          {/* Avatar with pulse rings */}
          <View style={styles.avatarSection}>
            <Animated.View style={[styles.ring2, { transform: [{ scale: pulse2 }] }]} />
            <Animated.View style={[styles.ring1, { transform: [{ scale: pulse1 }] }]} />
            <Image source={{ uri: avatar }} style={styles.avatar} />
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.school}>{school}</Text>

          <Text style={styles.timer}>
            {connected ? fmtDuration(duration) : "Calling..."}
          </Text>

          {/* E2E badge */}
          <View style={styles.e2eBadge}>
            <Feather name="lock" size={12} color="#22c55e" />
            <Text style={styles.e2eText}>End-to-end encrypted</Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]}
              onPress={() => { setMuted(!muted); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.8}
            >
              <Feather name={muted ? "mic-off" : "mic"} size={22} color="#ffffff" />
              <Text style={styles.ctrlLabel}>{muted ? "Unmute" : "Mute"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.8}>
              <Feather name="phone-off" size={28} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, speaker && styles.ctrlBtnActive]}
              onPress={() => { setSpeaker(!speaker); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.8}
            >
              <Feather name="volume-2" size={22} color="#ffffff" />
              <Text style={styles.ctrlLabel}>{speaker ? "Earpiece" : "Speaker"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  content: { flex: 1, alignItems: "center", justifyContent: "space-between" },
  statusText: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "500" },
  avatarSection: { alignItems: "center", justifyContent: "center", width: 200, height: 200 },
  ring1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)" },
  ring2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.04)" },
  avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  name: { color: "#ffffff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" },
  school: { color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center" },
  timer: { color: "#ffffff", fontSize: 20, fontWeight: "300", letterSpacing: 2 },
  e2eBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(34,197,94,0.15)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  e2eText: { color: "#22c55e", fontSize: 12, fontWeight: "600" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 },
  ctrlBtn: { alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.12)", width: 64, height: 64, borderRadius: 32, justifyContent: "center" },
  ctrlBtnActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  ctrlLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, position: "absolute", bottom: -20 },
  endBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
});
