import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
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
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const IS_WEB = Platform.OS === "web";

const { height } = Dimensions.get("window");

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
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [liveComments, setLiveComments] = useState<LiveComment[]>([]);
  const [ending, setEnding] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

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
    if (!isLive || !sessionId) return;

    durationRef.current = setInterval(() => setDuration((d) => d + 1), 1000);

    const q = query(
      collection(db, "lives", sessionId, "comments"),
      orderBy("ts", "asc")
    );
    unsubRef.current = onSnapshot(q, (snap) => {
      const comments: LiveComment[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user: data.user ?? "User",
          username: data.username ?? "user",
          text: data.text ?? "",
          ts: data.ts?.toMillis?.() ?? Date.now(),
        };
      });
      setLiveComments(comments.slice(-50));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
      if (unsubRef.current) unsubRef.current();
    };
  }, [isLive, sessionId]);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function startLive() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const sid = `${user.id}_${Date.now()}`;
      await setDoc(doc(db, "lives", sid), {
        hostId: user.id,
        hostName: user.name,
        hostUsername: user.username,
        hostAvatar: user.avatar,
        school: user.school?.name ?? "",
        startedAt: serverTimestamp(),
        isActive: true,
        viewers: 0,
      });
      setSessionId(sid);
      setViewers(0);
      setIsLive(true);
    } catch (e) {
      setSessionId(`local_${Date.now()}`);
      setViewers(0);
      setIsLive(true);
    }
  }

  async function endLive() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnding(true);
    if (durationRef.current) clearInterval(durationRef.current);
    if (unsubRef.current) unsubRef.current();
    if (sessionId && !sessionId.startsWith("local_")) {
      try {
        await updateDoc(doc(db, "lives", sessionId), {
          isActive: false,
          endedAt: serverTimestamp(),
          durationSecs: duration,
        });
      } catch {}
    }
    setTimeout(() => router.back(), 2200);
  }

  async function sendComment() {
    if (!chatInput.trim() || !user || !sessionId) return;
    const text = chatInput.trim();
    setChatInput("");
    try {
      await addDoc(collection(db, "lives", sessionId, "comments"), {
        user: user.name,
        username: user.username,
        avatar: user.avatar,
        text,
        ts: serverTimestamp(),
      });
    } catch {
      const c: LiveComment = {
        id: "local_" + Date.now(),
        user: user.name,
        username: user.username,
        text,
        ts: Date.now(),
      };
      setLiveComments((prev) => [...prev.slice(-49), c]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  if (ending) {
    return (
      <View style={[styles.container, { backgroundColor: "#0a0a0a" }]}>
        <StatusBar style="light" />
        <View style={styles.endScreen}>
          <View style={[styles.endIcon, { backgroundColor: "#1f1f1f" }]}>
            <Feather name="radio" size={40} color="#ef4444" />
          </View>
          <Text style={styles.endTitle}>Live Ended</Text>
          <Text style={styles.endMeta}>
            {formatDuration(duration)} · {liveComments.length} comments
          </Text>
          <Text style={styles.endSub}>Thanks for going live on Palava Hub 🇱🇷</Text>
        </View>
      </View>
    );
  }

  if (!isLive) {
    const hasPermission = permission?.granted;

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
          {/* Camera preview or placeholder */}
          <View style={styles.cameraPreviewWrap}>
            {IS_WEB ? (
              <View style={styles.permissionBox}>
                <Feather name="smartphone" size={36} color="rgba(255,255,255,0.5)" />
                <Text style={styles.permissionText}>Open in Expo Go to use camera</Text>
                <Text style={styles.permissionSub}>
                  Scan the QR code in the mobile preview{"\n"}with the Expo Go app on your phone
                </Text>
              </View>
            ) : hasPermission ? (
              <>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                />
                <TouchableOpacity
                  style={styles.flipBtn}
                  onPress={() => setFacing((f) => f === "front" ? "back" : "front")}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={18} color="#ffffff" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.permissionBox}
                onPress={requestPermission}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={36} color="rgba(255,255,255,0.5)" />
                <Text style={styles.permissionText}>Tap to enable camera</Text>
                <Text style={styles.permissionSub}>Allow camera access to go live</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.previewInfo}>
            <View style={styles.userPreviewRow}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: "#BF0A30" }]}>
                <Text style={styles.avatarInitial}>{user?.name?.[0] ?? "U"}</Text>
              </View>
              <View>
                <Text style={styles.previewName}>{user?.name ?? "You"}</Text>
                <Text style={styles.previewSchool}>{user?.school?.name ?? ""}</Text>
              </View>
            </View>

            <Text style={styles.goLiveTitle}>Ready to go live?</Text>
            <Text style={styles.goLiveSub}>
              Start your live session. Anyone can join and comment in real time.
            </Text>

            <View style={styles.previewTips}>
              {[
                { icon: "message-circle", label: "Viewers can comment live in real time" },
                { icon: "mic", label: "Make sure your microphone is on" },
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

      {/* Live camera view */}
      <View style={[styles.cameraView, { height: height * 0.52 }]}>
        {IS_WEB ? (
          <View style={[styles.cameraFallback, { gap: 8 }]}>
            <Feather name="radio" size={28} color="#ef4444" />
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center" }}>
              Camera unavailable in browser{"\n"}Use Expo Go on your phone
            </Text>
          </View>
        ) : permission?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing={facing} />
        ) : (
          <View style={styles.cameraFallback}>
            <Feather name="video" size={32} color="rgba(255,255,255,0.25)" />
          </View>
        )}

        {/* Flip button while live */}
        {permission?.granted && (
          <TouchableOpacity
            style={[styles.flipBtnLive, { top: topPad + 12 }]}
            onPress={() => setFacing((f) => f === "front" ? "back" : "front")}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Top bar */}
        <View style={[styles.liveTopBar, { top: topPad + 8 }]}>
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDotSmall, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={styles.liveViewers}>
            <Feather name="message-circle" size={12} color="#ffffff" />
            <Text style={styles.liveViewersText}>{liveComments.length}</Text>
          </View>
          <Text style={styles.liveDuration}>{formatDuration(duration)}</Text>
        </View>

        {/* User info */}
        <View style={styles.liveUserInfo}>
          <View style={[styles.avatarSmall, { backgroundColor: "#BF0A30" }]}>
            <Text style={styles.avatarInitialSm}>{user?.name?.[0] ?? "U"}</Text>
          </View>
          <Text style={styles.liveUserName}>{user?.name ?? "You"}</Text>
        </View>

        {/* End button */}
        <TouchableOpacity style={styles.endLiveBtn} onPress={endLive} activeOpacity={0.85}>
          <Text style={styles.endLiveBtnText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time chat */}
      <View style={styles.chatArea}>
        {liveComments.length === 0 ? (
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={28} color="rgba(255,255,255,0.15)" />
            <Text style={styles.emptyChatText}>No comments yet — say something!</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.commentScroll}
            contentContainerStyle={styles.commentScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {liveComments.map((c) => (
              <View key={c.id} style={styles.commentBubble}>
                <View style={[styles.commentAvatar, { backgroundColor: "#BF0A3040" }]}>
                  <Text style={styles.commentAvatarText}>{c.user[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentUsername}>@{c.username}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Chat input */}
        <View style={[styles.chatInputRow, { paddingBottom: bottomPad + 8 }]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Say something to your viewers..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={chatInput}
            onChangeText={setChatInput}
            onSubmitEditing={sendComment}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={sendComment}
            style={[styles.sendBtn, { opacity: chatInput.trim() ? 1 : 0.4 }]}
            activeOpacity={0.8}
            disabled={!chatInput.trim()}
          >
            <Feather name="send" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: { position: "absolute", left: 16, zIndex: 10, padding: 8 },
  previewScreen: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  cameraPreviewWrap: {
    width: "100%",
    height: 260,
    backgroundColor: "#111",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  permissionText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },
  permissionSub: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  flipBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  userPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%", marginTop: 20 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  previewName: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  previewSchool: { color: "#9ca3af", fontSize: 12, marginTop: 1 },
  previewInfo: { width: "100%", paddingTop: 12, gap: 10 },
  goLiveTitle: { color: "#ffffff", fontSize: 22, fontWeight: "800", marginTop: 4 },
  goLiveSub: { color: "#9ca3af", fontSize: 14, lineHeight: 20 },
  previewTips: { gap: 10, marginTop: 2 },
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
    marginTop: 12,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ffffff" },
  goLiveBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "800" },
  cameraView: {
    width: "100%",
    backgroundColor: "#111827",
    position: "relative",
    overflow: "hidden",
  },
  cameraFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  flipBtnLive: {
    position: "absolute",
    right: 60,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  liveTopBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
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
  liveViewers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveViewersText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  liveDuration: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveUserInfo: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarInitialSm: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  liveUserName: { color: "#ffffff", fontSize: 13, fontWeight: "700", textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  endLiveBtn: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 10,
  },
  endLiveBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  chatArea: { flex: 1, backgroundColor: "#0f0f0f" },
  emptyChat: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyChatText: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  commentScroll: { flex: 1 },
  commentScrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 10 },
  commentBubble: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  commentUsername: { color: "#f87171", fontSize: 11, fontWeight: "700" },
  commentText: { color: "#e5e7eb", fontSize: 13, marginTop: 2, lineHeight: 18 },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  endScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  endIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  endTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  endMeta: { color: "#9ca3af", fontSize: 15 },
  endSub: { color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center" },
});
