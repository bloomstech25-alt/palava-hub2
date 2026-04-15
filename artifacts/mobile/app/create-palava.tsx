import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Alert,
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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 300;

const PROMPT_IDEAS = [
  "That professor who always shows up late... 👀",
  "The Wi-Fi at school be doing the most 😩",
  "Someone in my class smells like they skipped a week...",
  "My crush finally noticed me today 🫠",
  "I copied the assignment and still failed 💀",
  "This cafeteria food needs prayers 🙏",
  "I fell asleep in lecture and the whole class heard me snore",
  "Campus security be on their phone while we hustle 😂",
  "I lied on my CV and now they're calling me...",
  "Why do people clap when the plane lands in Liberia 🤣",
];

export default function CreatePalavaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const charsLeft = MAX_CHARS - text.length;
  const canPost = text.trim().length >= 10 && !isPosting;

  function useSuggestion(s: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText(s);
    inputRef.current?.focus();
  }

  async function handlePost() {
    if (!canPost || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPosting(true);
    try {
      const now = serverTimestamp();
      await addDoc(collection(db, "palavaroomPosts"), {
        text: text.trim(),
        schoolName: user.school?.name ?? "A Liberian School",
        schoolType: user.school?.type ?? "university",
        reactions: { wahala: 0, funny: 0, realTalk: 0, spill: 0 },
        wahalaBy: [],
        funnyBy: [],
        realTalkBy: [],
        spillBy: [],
        createdAt: now,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/palava-room");
    } catch {
      setIsPosting(false);
      Alert.alert("Error", "Could not post. Please check your connection and try again.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Palava</Text>
        <TouchableOpacity
          style={[
            styles.postBtn,
            { backgroundColor: canPost ? colors.primary : colors.muted },
          ]}
          onPress={handlePost}
          disabled={!canPost}
          activeOpacity={0.85}
        >
          <Text style={[styles.postBtnText, { color: canPost ? colors.primaryForeground : colors.mutedForeground }]}>
            {isPosting ? "Posting..." : "Post 🔥"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Anonymity notice */}
        <View style={[styles.anonNotice, { backgroundColor: "#7c3aed15", borderColor: "#7c3aed25" }]}>
          <Text style={[styles.anonEmoji]}>🕶️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.anonTitle, { color: "#7c3aed" }]}>100% Anonymous</Text>
            <Text style={[styles.anonSub, { color: "#7c3aed" + "99" }]}>
              Only your school name is shown. Your post disappears in 24 hours.
            </Text>
          </View>
        </View>

        {/* School attribution preview */}
        <View style={[styles.previewRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={styles.previewEmoji}>🕶️</Text>
          <Text style={[styles.previewText, { color: colors.mutedForeground }]}>
            This will show as:{" "}
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>
              A {user?.school?.name ?? "Liberian school"} student
            </Text>
          </Text>
        </View>

        {/* Text input */}
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="What's the palava today? 👀&#10;Vent, confess, spill the tea..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
            multiline
            autoFocus
            maxLength={MAX_CHARS}
            textAlignVertical="top"
          />
          <Text style={[
            styles.charCount,
            { color: charsLeft < 30 ? (charsLeft < 10 ? "#ef4444" : "#f97316") : colors.mutedForeground }
          ]}>
            {charsLeft}
          </Text>
        </View>

        {/* Prompt ideas */}
        <Text style={[styles.ideasTitle, { color: colors.mutedForeground }]}>Need ideas? Tap one:</Text>
        <View style={styles.ideas}>
          {PROMPT_IDEAS.map((idea) => (
            <TouchableOpacity
              key={idea}
              style={[styles.ideaChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => useSuggestion(idea)}
              activeOpacity={0.75}
            >
              <Text style={[styles.ideaText, { color: colors.foreground }]}>{idea}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  postBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  postBtnText: { fontSize: 14, fontWeight: "700" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  anonNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  anonEmoji: { fontSize: 22, marginTop: 1 },
  anonTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  anonSub: { fontSize: 12, lineHeight: 17 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewEmoji: { fontSize: 16 },
  previewText: { fontSize: 13, flex: 1 },
  inputWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 140,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 100,
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  ideasTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  ideas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ideaChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  ideaText: { fontSize: 13 },
});
