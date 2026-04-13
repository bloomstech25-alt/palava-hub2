import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  name: string;
  avatar: string;
  school: string;
  myAvatar: string;
  onEnd: () => void;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoCallModal({ visible, name, avatar, school, myAvatar, onEnd }: Props) {
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDuration(0);
      setConnected(false);
      setMuted(false);
      setCameraOff(false);

      connectRef.current = setTimeout(() => {
        setConnected(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(connectAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      }, 2200);

      return () => {
        if (connectRef.current) clearTimeout(connectRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        connectAnim.setValue(0);
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
        {/* Remote video (full screen) */}
        {connected ? (
          <Animated.View style={[styles.remoteVideo, { opacity: connectAnim }]}>
            <Image source={{ uri: avatar }} style={styles.remoteAvatar} blurRadius={connected ? 0 : 30} />
            <View style={styles.remoteOverlay} />
          </Animated.View>
        ) : (
          <View style={[styles.remoteVideo, { backgroundColor: "#1e293b" }]}>
            <Image source={{ uri: avatar }} style={[styles.remoteAvatar, { opacity: 0.3 }]} />
            <View style={styles.remoteOverlay} />
            <View style={styles.connectingOverlay}>
              <Text style={styles.connectingText}>Connecting...</Text>
              <Text style={styles.connectingName}>{name}</Text>
            </View>
          </View>
        )}

        {/* Top info bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.e2eBadge}>
            <Feather name="lock" size={11} color="#22c55e" />
            <Text style={styles.e2eText}>End-to-end encrypted</Text>
          </View>
          <Text style={styles.timerText}>{connected ? fmtDuration(duration) : ""}</Text>
        </View>

        {/* My video (PiP) */}
        <View style={[styles.pip, { top: insets.top + 52 }]}>
          {cameraOff ? (
            <View style={[styles.pip, { backgroundColor: "#334155", alignItems: "center", justifyContent: "center", top: 0 }]}>
              <Feather name="video-off" size={20} color="rgba(255,255,255,0.5)" />
            </View>
          ) : (
            <Image source={{ uri: myAvatar }} style={styles.pipImage} />
          )}
          <View style={styles.pipOverlay} />
        </View>

        {/* Name overlay */}
        {connected && (
          <View style={styles.nameOverlay}>
            <Text style={styles.remoteName}>{name}</Text>
            <Text style={styles.remoteSchool}>{school}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity
            style={[styles.ctrlBtn, muted && styles.ctrlActive]}
            onPress={() => { setMuted(!muted); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <Feather name={muted ? "mic-off" : "mic"} size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.85}>
            <Feather name="phone-off" size={26} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, cameraOff && styles.ctrlActive]}
            onPress={() => { setCameraOff(!cameraOff); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <Feather name={cameraOff ? "video-off" : "video"} size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctrlBtn}
            onPress={() => { setFlipped(!flipped); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  remoteAvatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  remoteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  connectingText: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  connectingName: { color: "#ffffff", fontSize: 24, fontWeight: "700" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  e2eBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  e2eText: { color: "#22c55e", fontSize: 11, fontWeight: "600" },
  timerText: { color: "#ffffff", fontSize: 14, fontWeight: "500" },
  pip: {
    position: "absolute",
    right: 16,
    width: 90,
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  pipImage: { width: "100%", height: "100%", resizeMode: "cover" },
  pipOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  nameOverlay: {
    position: "absolute",
    bottom: 140,
    left: 20,
  },
  remoteName: { color: "#ffffff", fontSize: 22, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.7)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  remoteSchool: { color: "rgba(255,255,255,0.7)", fontSize: 13, textShadowColor: "rgba(0,0,0,0.7)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlActive: { backgroundColor: "rgba(255,255,255,0.4)" },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
});
