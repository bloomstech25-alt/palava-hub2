import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, type User as AppUser } from "@/context/AuthContext";
import { useMessaging, type Message } from "@/context/MessagingContext";
import { useColors } from "@/hooks/useColors";
import { db, storage } from "@/lib/firebase";
import { ref } from "firebase/storage";
import { uploadUriToStorage } from "@/utils/uploadBlob";
import { doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import VoiceCallModal from "@/components/VoiceCallModal";
import VideoCallModal from "@/components/VideoCallModal";
import EmojiPicker from "@/components/EmojiPicker";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric" });
}

// Animated waveform bars for voice messages
function WaveformBars({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1, 0.6, 0.8, 0.5];
  const anims = useRef(bars.map(() => new Animated.Value(0.4))).current;

  useEffect(() => {
    if (isPlaying) {
      const loops = anims.map((a, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(a, { toValue: bars[i], duration: 300 + i * 40, useNativeDriver: true }),
            Animated.timing(a, { toValue: 0.3, duration: 300 + i * 40, useNativeDriver: true }),
          ])
        )
      );
      loops.forEach((l) => l.start());
      return () => loops.forEach((l) => l.stop());
    } else {
      anims.forEach((a) => a.setValue(0.4));
    }
  }, [isPlaying]);

  return (
    <View style={wfStyles.row}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[wfStyles.bar, { backgroundColor: color, transform: [{ scaleY: a }] }]}
        />
      ))}
    </View>
  );
}

const wfStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2, height: 28 },
  bar: { width: 3, height: 20, borderRadius: 2 },
});

// Voice message bubble
function VoiceBubble({ msg, isMe, colors }: { msg: Message; isMe: boolean; colors: any }) {
  const [playing, setPlaying] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      progress.stopAnimation();
    } else {
      setPlaying(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: (msg.audioDuration ?? 5) * 1000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setPlaying(false);
      });
    }
  };

  return (
    <View style={[vbStyles.container, { backgroundColor: isMe ? colors.primary : colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={toggle} style={vbStyles.playBtn} activeOpacity={0.8}>
        <Feather name={playing ? "pause" : "play"} size={16} color={isMe ? "#fff" : colors.primary} />
      </TouchableOpacity>
      <WaveformBars isPlaying={playing} color={isMe ? "rgba(255,255,255,0.8)" : colors.primary} />
      <Text style={[vbStyles.dur, { color: isMe ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
        {msg.audioDuration ?? 5}s
      </Text>
    </View>
  );
}

const vbStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 160,
  },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  dur: { fontSize: 12, fontWeight: "600" },
});

// Voice recording UI
function RecordingBar({ duration, onCancel, onSend, colors }: {
  duration: number; onCancel: () => void; onSend: () => void; colors: any;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[recStyles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <TouchableOpacity onPress={onCancel} style={recStyles.cancelBtn} activeOpacity={0.8}>
        <Feather name="x" size={20} color="#ef4444" />
      </TouchableOpacity>
      <View style={recStyles.center}>
        <Animated.View style={[recStyles.dot, { transform: [{ scale: pulse }] }]} />
        <Text style={[recStyles.durText, { color: colors.foreground }]}>
          {Math.floor(duration / 60).toString().padStart(2, "0")}:{(duration % 60).toString().padStart(2, "0")}
        </Text>
        <Text style={[recStyles.hint, { color: colors.mutedForeground }]}>Recording...</Text>
      </View>
      <TouchableOpacity onPress={onSend} style={recStyles.sendBtn} activeOpacity={0.8}>
        <Feather name="send" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const recStyles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 12 },
  cancelBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center" },
  center: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" },
  durText: { fontSize: 18, fontWeight: "600", letterSpacing: 1 },
  hint: { fontSize: 13 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" },
});

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const { userId, name, username, avatar, school } = useLocalSearchParams<{
    userId: string; name: string; username: string; avatar: string; school: string;
  }>();
  const { user } = useAuth();
  const { messages, sendMessage, markRead, subscribeToConversation } = useMessaging();
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeCallId, setActiveCallId] = useState("");
  const textInputRef = useRef<TextInput>(null);
  const flatRef = useRef<FlatList>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatMessages = useMemo(() => messages[userId] ?? [], [messages, userId]);

  // Mutual-follow gate. Both users must follow each other before a chat
  // can begin. We snapshot the other user's profile so the input unlocks
  // as soon as they accept a follow.
  const [otherUser, setOtherUser] = useState<AppUser | null>(null);
  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      doc(db, "users", userId),
      (snap) => {
        if (snap.exists()) setOtherUser({ ...(snap.data() as AppUser), id: snap.id });
        else setOtherUser(null);
      },
      () => setOtherUser(null)
    );
    return unsub;
  }, [userId]);

  const iFollowThem = !!user && (user.followingIds ?? []).includes(userId);
  const theyFollowMe = !!otherUser && !!user && (otherUser.followingIds ?? []).includes(user.id);
  const isMutual = iFollowThem && theyFollowMe;
  // If we already have at least one message in this thread, the conversation
  // was started before the gate was enforced — don't lock existing chats out.
  const hasExistingThread = chatMessages.length > 0;
  const canMessage = isMutual || hasExistingThread;

  useEffect(() => {
    if (!user?.id || !userId) return;
    const unsub = subscribeToConversation(user.id, userId);
    return unsub;
  }, [user?.id, userId, subscribeToConversation]);

  useEffect(() => { markRead(userId); }, [userId, markRead]);
  useEffect(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
  }, [chatMessages.length]);

  const startCall = useCallback(async (type: "voice" | "video") => {
    if (!user?.id || !userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const callId = `${user.id}_${userId}_${Date.now()}`;
    setActiveCallId(callId);
    if (type === "voice") setShowVoiceCall(true);
    else setShowVideoCall(true);

    try {
      await setDoc(doc(db, "calls", callId), {
        callId,
        callerId: user.id,
        callerName: user.name,
        callerAvatar: user.avatar,
        calleeId: userId,
        calleeName: name ?? "",
        type,
        status: "ringing",
        startedAt: serverTimestamp(),
      });
    } catch { /* Firestore unavailable — call still opens locally */ }

    // Request a Daily.co room from the API and store its URL (or the
    // failure reason) on the call doc so the modal can show the user
    // exactly what's wrong instead of spinning forever.
    //
    // React Native's fetch does NOT accept relative URLs the way a browser
    // does — it needs a fully-qualified https://. So we MUST resolve a
    // domain. We try the EXPO_PUBLIC_DOMAIN that the dev script bakes into
    // the bundle, and only as a last resort surface a clear error.
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) {
      // eslint-disable-next-line no-console
      console.warn("[call] EXPO_PUBLIC_DOMAIN missing — bundle was built without API base URL");
      try {
        await updateDoc(doc(db, "calls", callId), {
          errorMessage: "Calling isn't configured for this build. Please reload the app.",
        });
      } catch { /* ignore */ }
      return;
    }
    const callsUrl = `https://${domain}/api/calls/room`;
    // eslint-disable-next-line no-console
    console.log("[call] requesting Daily room from", callsUrl);
    try {
      const res = await fetch(callsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, type }),
      });
      if (res.ok) {
        const { url } = await res.json();
        // eslint-disable-next-line no-console
        console.log("[call] got room url", url);
        if (url) {
          try { await updateDoc(doc(db, "calls", callId), { roomUrl: url }); } catch { /* ignore */ }
        } else {
          try { await updateDoc(doc(db, "calls", callId), { errorMessage: "Server didn't return a call link." }); } catch { /* ignore */ }
        }
      } else {
        const body = await res.json().catch(() => ({} as { error?: string }));
        // eslint-disable-next-line no-console
        console.warn("[call] server error", res.status, body);
        const reason = body?.error === "calling_not_configured"
          ? "Calling isn't set up yet. Ask the admin to add the Daily.co API key."
          : `Could not start the call (${res.status}). Please try again in a moment.`;
        try { await updateDoc(doc(db, "calls", callId), { errorMessage: reason }); } catch { /* ignore */ }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[call] fetch threw", (e as Error)?.message);
      try {
        await updateDoc(doc(db, "calls", callId), {
          errorMessage: `Network error starting the call: ${(e as Error)?.message ?? "unknown"}`,
        });
      } catch { /* ignore */ }
    }
  }, [user, userId, name]);

  const doSend = useCallback(async (
    txt: string,
    media?: { uri: string; type: "image" | "video" | "audio"; duration?: number }
  ) => {
    if (!user) return;
    if (!canMessage) return;
    setText("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3500);
    try {
      await sendMessage(
        userId, name ?? "", username ?? "", avatar ?? "", school ?? "",
        txt,
        user.id, user.name ?? "", user.username ?? "", user.avatar ?? "", user.school?.name ?? "",
        media
      );
    } catch (e) {
      console.error("sendMessage error:", e);
    }
  }, [user, userId, name, username, avatar, school, sendMessage, canMessage]);

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    doSend(text.trim());
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textInputRef.current?.focus();
  };

  const toggleEmoji = () => {
    setShowEmoji((v) => !v);
    if (!showEmoji) {
      textInputRef.current?.blur();
    } else {
      textInputRef.current?.focus();
    }
  };

  const uploadMediaToStorage = async (localUri: string, mediaType: "image" | "video"): Promise<string | null> => {
    try {
      const ext = mediaType === "video" ? "mp4" : "jpg";
      const contentType = mediaType === "video" ? "video/mp4" : "image/jpeg";
      const storageRef = ref(storage, `chats/${user?.id}/${Date.now()}.${ext}`);
      // Compress chat images the same way we compress feed images — saves
      // a lot of bytes on mobile data so the picture appears in the bubble
      // noticeably faster. Videos are left alone (re-encoding on-device
      // would be slow and lossy).
      return await uploadUriToStorage(localUri, storageRef, contentType, {
        compress: mediaType === "image",
      });
    } catch (err) {
      // Surface why the upload failed so we can debug picker / network /
      // permissions issues instead of just sending a text bubble silently.
      // eslint-disable-next-line no-console
      console.warn("[chat] uploadMediaToStorage failed", (err as { code?: string })?.code, (err as Error)?.message);
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uploadedUri = await uploadMediaToStorage(result.assets[0].uri, "image");
      if (uploadedUri) doSend("", { uri: uploadedUri, type: "image" });
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uploadedUri = await uploadMediaToStorage(result.assets[0].uri, "video");
      if (uploadedUri) doSend("", { uri: uploadedUri, type: "video" });
    }
  };

  const startRecording = () => {
    setRecording(true);
    setRecordDuration(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recTimerRef.current = setInterval(() => setRecordDuration((d) => d + 1), 1000);
  };

  const cancelRecording = () => {
    setRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    setRecordDuration(0);
  };

  const sendVoice = () => {
    setRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const dur = Math.max(1, recordDuration);
    setRecordDuration(0);
    doSend("", { uri: "audio://voice_" + Date.now(), type: "audio", duration: dur });
  };

  const isMe = (msg: Message) => msg.fromId === "me" || msg.fromId === user?.id;

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const mine = isMe(item);
    const prev = index > 0 ? chatMessages[index - 1] : null;
    const showDate = !prev || formatDateHeader(item.createdAt) !== formatDateHeader(prev.createdAt);

    return (
      <>
        {showDate && (
          <View style={styles.dateDivider}>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateText, { color: colors.mutedForeground, backgroundColor: colors.background }]}>
              {formatDateHeader(item.createdAt)}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          </View>
        )}
        <View style={[styles.msgRow, mine ? styles.msgRowMe : styles.msgRowThem]}>
          {!mine && <Image source={{ uri: avatar }} style={styles.msgAvatar} />}
          <View style={styles.msgContent}>
            {/* Message bubble */}
            {item.mediaType === "audio" ? (
              <VoiceBubble msg={item} isMe={mine} colors={colors} />
            ) : item.mediaType === "image" && item.mediaUri ? (
              <View style={[styles.imageBubble, { borderColor: colors.border }]}>
                <Image source={{ uri: item.mediaUri }} style={styles.msgImage} />
              </View>
            ) : item.mediaType === "video" && item.mediaUri ? (
              <View style={[styles.imageBubble, { borderColor: colors.border, backgroundColor: "#000" }]}>
                <Image source={{ uri: item.mediaUri }} style={styles.msgImage} blurRadius={2} />
                <View style={styles.playOverlay}>
                  <View style={[styles.playCircle, { backgroundColor: colors.primary }]}>
                    <Feather name="play" size={18} color="#fff" />
                  </View>
                  <Text style={styles.videoLabel}>Video</Text>
                </View>
              </View>
            ) : (
              <View style={[
                styles.bubble,
                mine
                  ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                  : [styles.bubbleThem, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}>
                <Text style={[styles.bubbleText, { color: mine ? "#fff" : colors.foreground }]}>
                  {item.text}
                </Text>
              </View>
            )}
            {/* Time + lock */}
            <View style={[styles.metaRow, mine && styles.metaRowMe]}>
              <Feather name="lock" size={9} color={colors.mutedForeground} />
              <Text style={[styles.msgTime, { color: colors.mutedForeground }]}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        </View>
      </>
    );
  }, [user, avatar, chatMessages, colors]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemedStatusBar />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatar }} style={styles.headerAvatar} />
            <View style={[styles.onlineDot, { backgroundColor: "#22c55e", borderColor: colors.background }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>{name}</Text>
            <View style={styles.headerSubRow}>
              <Feather name="lock" size={10} color="#22c55e" />
              <Text style={[styles.headerSub, { color: "#22c55e" }]}>End-to-end encrypted</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => startCall("voice")}
          style={styles.callBtn} activeOpacity={0.7}
        >
          <Feather name="phone" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => startCall("video")}
          style={styles.callBtn} activeOpacity={0.7}
        >
          <Feather name="video" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListHeaderComponent={
          <View style={styles.e2eBanner}>
            <Feather name="lock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.e2eBannerText, { color: colors.mutedForeground }]}>
              Messages are end-to-end encrypted. Only you and {name?.split(" ")[0]} can read them.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={[styles.emptyChatIcon, { backgroundColor: colors.accent }]}>
              <Feather name="message-circle" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>Say hi to {name?.split(" ")[0]}!</Text>
            <Text style={[styles.emptyChatSub, { color: colors.mutedForeground }]}>
              You're both students on Palava Hub. Start the conversation!
            </Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={[styles.typingRow, { paddingHorizontal: 16 }]}>
          <Image source={{ uri: avatar }} style={styles.typingAvatar} />
          <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.typingDots, { color: colors.mutedForeground }]}>• • •</Text>
          </View>
        </View>
      )}

      {/* Mutual-follow gate — both users must follow each other before
          starting a brand-new chat. Existing threads are grandfathered in. */}
      {!canMessage ? (
        <View
          style={[
            styles.gateBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 14,
            },
          ]}
        >
          <View style={[styles.gateIcon, { backgroundColor: colors.accent }]}>
            <Feather name="user-plus" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.gateTitle, { color: colors.foreground }]}>
              Follow each other to start chatting
            </Text>
            <Text style={[styles.gateSub, { color: colors.mutedForeground }]}>
              {!iFollowThem && !theyFollowMe
                ? `Follow ${name?.split(" ")[0] ?? "this student"} and ask them to follow you back.`
                : !iFollowThem
                  ? `Follow ${name?.split(" ")[0] ?? "this student"} to start the conversation.`
                  : `Waiting for ${name?.split(" ")[0] ?? "this student"} to follow you back.`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/(tabs)/profile", params: { userId } })
            }
            style={[styles.gateBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.gateBtnText}>View profile</Text>
          </TouchableOpacity>
        </View>
      ) : recording ? (
        <RecordingBar
          duration={recordDuration}
          onCancel={cancelRecording}
          onSend={sendVoice}
          colors={colors}
        />
      ) : (
        /* Input bar */
        <View>
          <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: showEmoji ? 8 : bottomPad + 8 }]}>
            {/* Media buttons */}
            <TouchableOpacity onPress={pickImage} style={styles.mediaBtn} activeOpacity={0.7}>
              <Feather name="image" size={21} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickVideo} style={styles.mediaBtn} activeOpacity={0.7}>
              <Feather name="film" size={21} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Text input */}
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                ref={textInputRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder={`Message ${name?.split(" ")[0] ?? ""}...`}
                placeholderTextColor={colors.mutedForeground}
                value={text}
                onChangeText={setText}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                onFocus={() => setShowEmoji(false)}
              />
              {/* Emoji toggle inside input */}
              <TouchableOpacity onPress={toggleEmoji} activeOpacity={0.7} style={styles.emojiBtn}>
                <Text style={styles.emojiBtnText}>{showEmoji ? "⌨️" : "😊"}</Text>
              </TouchableOpacity>
            </View>

            {/* Send or mic */}
            {text.trim() ? (
              <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
                <Feather name="send" size={18} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startRecording}
                onLongPress={startRecording}
                style={[styles.sendBtn, { backgroundColor: colors.accent }]}
                activeOpacity={0.8}
              >
                <Feather name="mic" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Emoji picker panel */}
          {showEmoji && (
            <EmojiPicker onSelect={handleEmojiSelect} />
          )}
          {/* Safe area bottom padding when emoji is open */}
          {showEmoji && <View style={{ height: bottomPad, backgroundColor: colors.card }} />}
        </View>
      )}

      {/* Call modals */}
      <VoiceCallModal
        visible={showVoiceCall}
        callId={activeCallId}
        name={name ?? ""}
        avatar={avatar ?? ""}
        school={school ?? ""}
        onEnd={() => { setShowVoiceCall(false); setActiveCallId(""); }}
      />
      <VideoCallModal
        visible={showVideoCall}
        callId={activeCallId}
        name={name ?? ""}
        avatar={avatar ?? ""}
        school={school ?? ""}
        myAvatar={user?.avatar ?? ""}
        onEnd={() => { setShowVideoCall(false); setActiveCallId(""); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  backBtn: { padding: 8 },
  headerUser: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: { position: "relative" },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerSub: { fontSize: 11, fontWeight: "600" },
  callBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  e2eBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 24,
    marginVertical: 20,
    padding: 12,
  },
  e2eBannerText: { fontSize: 12, lineHeight: 17, flex: 1, textAlign: "center" },
  msgList: { paddingHorizontal: 12, paddingTop: 8 },
  dateDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 16 },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 12, fontWeight: "600", paddingHorizontal: 8 },
  msgRow: { marginBottom: 6, maxWidth: "80%" },
  msgRowMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  msgRowThem: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 16 },
  msgContent: { gap: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, maxWidth: 280 },
  bubbleMe: { borderBottomRightRadius: 6 },
  bubbleThem: { borderWidth: 1, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  imageBubble: { borderRadius: 18, overflow: "hidden", borderWidth: 1, width: 220, height: 180, position: "relative" },
  msgImage: { width: "100%", height: "100%", resizeMode: "cover" },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 6 },
  playCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  videoLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaRowMe: { justifyContent: "flex-end" },
  msgTime: { fontSize: 11 },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 6 },
  typingAvatar: { width: 28, height: 28, borderRadius: 14 },
  typingBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 6, borderWidth: 1 },
  typingDots: { fontSize: 16, letterSpacing: 2 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 8, paddingTop: 10, borderTopWidth: 1, gap: 6 },
  mediaBtn: { width: 38, height: 44, alignItems: "center", justifyContent: "center" },
  inputWrap: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 120, flexDirection: "row", alignItems: "flex-end", gap: 6 },
  input: { flex: 1, fontSize: 15, lineHeight: 20, paddingBottom: 2 },
  emojiBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", marginBottom: 1 },
  emojiBtnText: { fontSize: 20 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyChat: { alignItems: "center", paddingTop: 40, paddingHorizontal: 32, gap: 14 },
  emptyChatIcon: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  emptyChatTitle: { fontSize: 18, fontWeight: "700" },
  emptyChatSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  gateBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  gateIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 14, fontWeight: "700" },
  gateSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  gateBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  gateBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
