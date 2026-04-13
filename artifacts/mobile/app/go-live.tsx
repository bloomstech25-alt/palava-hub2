import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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

const { width, height } = Dimensions.get("window");

const LIVE_COMMENTS = [
  { id: "lc1", user: "Fatima Kollie", username: "fatima_k", text: "Yoooo this is great! 🔥" },
  { id: "lc2", user: "Emmanuel Flomo", username: "eflomo", text: "First!! 👀" },
  { id: "lc3", user: "Mary Sumo", username: "marysumo", text: "What's the topic today?" },
  { id: "lc4", user: "James Nyekan", username: "jnyekan", text: "Let's gooo! Tuning in from Monrovia 🇱🇷" },
  { id: "lc5", user: "Grace Tarwoe", username: "gracet", text: "Love this! Keep going!" },
  { id: "lc6", user: "user_789", username: "tmyoung", text: "Sharing this with my class rn" },
  { id: "lc7", user: "Fatima Kollie", username: "fatima_k", text: "❤️❤️❤️" },
  { id: "lc8", user: "student_kpb", username: "kpb_ricks", text: "Are you from UL?" },
  { id: "lc9", user: "Emmanuel Flomo", username: "eflomo", text: "Can you talk about the internship fair?" },
  { id: "lc10", user: "viewer_042", username: "mv_042", text: "🔥🔥🔥 amazing vibes" },
  { id: "lc11", user: "Grace Tarwoe", username: "gracet", text: "How long have you been studying this?" },
  { id: "lc12", user: "user_mnrv", username: "mnrv_student", text: "So helpful, thank you!" },
];

interface LiveComment {
  id: string;
  user: string;
  username: string;
  text: string;
  ts: number;
}

export default function GoLiveScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [liveComments, setLiveComments] = useState<LiveComment[]>([]);
  const [commentIndex, setCommentIndex] = useState(0);
  const [ending, setEnding] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!isLive) return;

    durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    viewerRef.current = setInterval(() => {
      setViewers((v) => {
        const delta = Math.floor(Math.random() * 8) - 2;
        return Math.max(1, v + delta);
      });
    }, 2500);
    commentRef.current = setInterval(() => {
      setCommentIndex((ci) => {
        const next = ci % LIVE_COMMENTS.length;
        const src = LIVE_COMMENTS[next];
        const newComment: LiveComment = { ...src, id: src.id + Date.now(), ts: Date.now() };
        setLiveComments((prev) => [...prev.slice(-30), newComment]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        return ci + 1;
      });
    }, 1800);

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
      if (viewerRef.current) clearInterval(viewerRef.current);
      if (commentRef.current) clearInterval(commentRef.current);
    };
  }, [isLive]);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function startLive() {
    setViewers(Math.floor(Math.random() * 5) + 1);
    setIsLive(true);
  }

  function endLive() {
    setEnding(true);
    if (durationRef.current) clearInterval(durationRef.current);
    if (viewerRef.current) clearInterval(viewerRef.current);
    if (commentRef.current) clearInterval(commentRef.current);
    setTimeout(() => router.back(), 2000);
  }

  function sendComment() {
    if (!chatInput.trim() || !user) return;
    const c: LiveComment = {
      id: "mine_" + Date.now(),
      user: user.name,
      username: user.username,
      text: chatInput.trim(),
      ts: Date.now(),
    };
    setLiveComments((prev) => [...prev.slice(-30), c]);
    setChatInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  if (ending) {
    return (
      <View style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
        <StatusBar style="light" />
        <View style={styles.endScreen}>
          <View style={[styles.endIcon, { backgroundColor: "#1a1a2e" }]}>
            <Feather name="radio" size={40} color="#6366f1" />
          </View>
          <Text style={styles.endTitle}>Live Ended</Text>
          <Text style={styles.endMeta}>
            {formatDuration(duration)} · {viewers} peak viewers
          </Text>
          <Text style={styles.endSub}>Thanks for going live on Palava Hub 🇱🇷</Text>
        </View>
      </View>
    );
  }

  if (!isLive) {
    return (
      <View style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
        <StatusBar style="light" />
        <TouchableOpacity
          style={[styles.closeBtn, { top: topPad + 8 }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="x" size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={[styles.previewScreen, { paddingTop: topPad }]}>
          <View style={styles.cameraPlaceholder}>
            <View style={styles.cameraIconCircle}>
              <Feather name="video" size={40} color="#ffffff" />
            </View>
            <Text style={styles.cameraText}>Camera preview</Text>
            <Text style={styles.cameraSubText}>Your audience will see you here</Text>
          </View>

          <View style={styles.previewInfo}>
            <View style={styles.userPreviewRow}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: "#6366f1" }]}>
                <Text style={styles.avatarInitial}>{user?.name?.[0] ?? "U"}</Text>
              </View>
              <View>
                <Text style={styles.previewName}>{user?.name ?? "You"}</Text>
                <Text style={styles.previewSchool}>{user?.school?.name ?? ""}</Text>
              </View>
            </View>

            <Text style={styles.goLiveTitle}>Ready to go live?</Text>
            <Text style={styles.goLiveSub}>
              Your followers will be notified and can join to watch and comment in real time.
            </Text>

            <View style={styles.previewTips}>
              {[
                { icon: "eye", label: "Viewers can see and comment live" },
                { icon: "mic", label: "Make sure your mic is on" },
                { icon: "wifi", label: "Use a stable internet connection" },
              ].map((tip) => (
                <View key={tip.label} style={styles.tipRow}>
                  <Feather name={tip.icon as any} size={15} color="#9ca3af" />
                  <Text style={styles.tipText}>{tip.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.goLiveBtn} onPress={startLive} activeOpacity={0.85}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <View style={styles.liveDot} />
              </Animated.View>
              <Text style={styles.goLiveBtnText}>Go Live</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: "#0a0a0a" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      {/* Camera view background */}
      <View style={[styles.cameraView, { height: height * 0.55 }]}>
        <View style={styles.cameraOverlay} />
        <View style={styles.cameraIconCentered}>
          <Feather name="video" size={32} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Top bar */}
        <View style={[styles.liveTopBar, { top: topPad + 8 }]}>
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDotSmall, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={styles.liveViewers}>
            <Feather name="eye" size={13} color="#ffffff" />
            <Text style={styles.liveViewersText}>{viewers}</Text>
          </View>
          <Text style={styles.liveDuration}>{formatDuration(duration)}</Text>
        </View>

        {/* User info */}
        <View style={styles.liveUserInfo}>
          <View style={[styles.avatarSmall, { backgroundColor: "#6366f1" }]}>
            <Text style={styles.avatarInitialSm}>{user?.name?.[0] ?? "U"}</Text>
          </View>
          <Text style={styles.liveUserName}>{user?.name ?? "You"}</Text>
        </View>

        {/* End live button */}
        <TouchableOpacity style={styles.endLiveBtn} onPress={endLive} activeOpacity={0.85}>
          <Text style={styles.endLiveBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Chat area */}
      <View style={styles.chatArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.commentScroll}
          contentContainerStyle={styles.commentScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {liveComments.map((c) => (
            <View key={c.id} style={styles.commentBubble}>
              <View style={[styles.commentAvatar, { backgroundColor: "#6366f1" + "40" }]}>
                <Text style={styles.commentAvatarText}>{c.user[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentUsername}>@{c.username}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Chat input */}
        <View style={[styles.chatInputRow, { paddingBottom: bottomPad + 8 }]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={sendComment}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendComment}
            style={[styles.sendBtn, { opacity: chatInput.trim() ? 1 : 0.5 }]}
            activeOpacity={0.8}
          >
            <Feather name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", left: 16, zIndex: 10, padding: 8 },
  // Pre-live screen
  previewScreen: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  cameraPlaceholder: {
    width: "100%",
    height: 260,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cameraIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraText: { color: "#9ca3af", fontSize: 14, fontWeight: "600" },
  cameraSubText: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  userPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, width: "100%" },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  previewName: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  previewSchool: { color: "#9ca3af", fontSize: 12, marginTop: 1 },
  previewInfo: { width: "100%", paddingTop: 16, gap: 12 },
  goLiveTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 8 },
  goLiveSub: { color: "#9ca3af", fontSize: 14, lineHeight: 20 },
  previewTips: { gap: 10, marginTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipText: { color: "#9ca3af", fontSize: 13 },
  goLiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 16,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ffffff" },
  goLiveBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  // Live screen
  cameraView: {
    width: "100%",
    backgroundColor: "#111827",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cameraIconCentered: {
    position: "absolute",
    alignSelf: "center",
  },
  liveTopBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ffffff" },
  liveBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  liveViewers: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveViewersText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  liveDuration: { color: "#ffffff", fontSize: 13, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveUserInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarInitialSm: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  liveUserName: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  endLiveBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  endLiveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  chatArea: { flex: 1, backgroundColor: "#0f0f0f" },
  commentScroll: { flex: 1 },
  commentScrollContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, gap: 8 },
  commentBubble: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  commentUsername: { color: "#a78bfa", fontSize: 11, fontWeight: "700" },
  commentText: { color: "#e5e7eb", fontSize: 13, marginTop: 1 },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center" },
  // End screen
  endScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  endIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  endTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  endMeta: { color: "#9ca3af", fontSize: 15 },
  endSub: { color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center" },
});
