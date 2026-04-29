import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
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
import { useFeed } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";

const SUGGESTED_TAGS = [
  "StudentLife", "StudyTips", "Academic", "STEM", "Sports",
  "Arts", "Technology", "Campus", "Research", "Internship",
];

export default function CreatePostScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const { addPost } = useFeed();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const params = useLocalSearchParams<{ category?: string }>();
  const isCampusJam = params.category === "campus_jams";

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>(isCampusJam ? ["CampusJams"] : []);
  const [customTag, setCustomTag] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | null>(null);

  // Audio recording state — uses expo-av (already in deps).
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [audioDurationSec, setAudioDurationSec] = useState<number | undefined>();
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup any in-flight recording when the modal closes.
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const charLimit = 1000;

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else if (tags.length < 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const clean = customTag.replace(/[^a-zA-Z0-9]/g, "").trim();
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags([...tags, clean]);
      setCustomTag("");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("image");
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to attach videos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType("video");
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
    setAudioDurationSec(undefined);
    setRecordSecs(0);
  };

  // ─── Audio recording ───────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone needed", "Allow microphone access to record audio posts.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recordingRef.current = rec;
      setIsRecording(true);
      setRecordSecs(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      recordTimerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          // Cap to 3 minutes for posts.
          if (s >= 180) {
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      Alert.alert("Recording failed", "Could not start audio recording. Please try again.");
    }
  }

  async function stopRecording() {
    const rec = recordingRef.current;
    if (!rec) return;
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const status = await rec.getStatusAsync();
      const dur = status?.durationMillis ? Math.round(status.durationMillis / 1000) : recordSecs;
      if (uri) {
        setMediaUri(uri);
        setMediaType("audio");
        setAudioDurationSec(dur);
      }
    } catch {
      Alert.alert("Recording failed", "Could not finish recording. Please try again.");
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      // Restore default audio session — without this iOS stays in record-mode
      // and other apps' audio (and the inline player) get silenced/muffled.
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch { /* best effort */ }
    }
  }

  function fmtSecs(s: number) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addPost(
      content.trim(),
      tags,
      user,
      mediaUri ?? undefined,
      mediaType ?? undefined,
      {
        category: isCampusJam ? "campus_jams" : "general",
        audioDurationSec,
      },
    );
    setIsPosting(false);
    router.back();
  };

  const remaining = charLimit - content.length;
  const canPost = content.trim().length > 0 && content.length <= charLimit;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost || isPosting}
            style={[
              styles.postBtn,
              {
                backgroundColor: canPost ? colors.primary : colors.muted,
                opacity: isPosting ? 0.7 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.postBtnText, { color: canPost ? colors.primaryForeground : colors.mutedForeground }]}>
              {isPosting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.mutedForeground}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            maxLength={charLimit + 50}
          />

          {/* Media preview */}
          {mediaUri && (
            <View style={styles.mediaPreviewWrap}>
              {mediaType === "image" ? (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
              ) : mediaType === "video" ? (
                <View style={[styles.videoPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.videoPlayIcon, { backgroundColor: colors.primary }]}>
                    <Feather name="play" size={24} color="#ffffff" />
                  </View>
                  <Text style={[styles.videoLabel, { color: colors.mutedForeground }]}>Video selected</Text>
                </View>
              ) : (
                <View style={[styles.videoPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.videoPlayIcon, { backgroundColor: colors.primary }]}>
                    <Feather name="mic" size={22} color="#ffffff" />
                  </View>
                  <Text style={[styles.videoLabel, { color: colors.mutedForeground }]}>
                    Audio clip {audioDurationSec ? `· ${fmtSecs(audioDurationSec)}` : ""}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeMediaBtn} onPress={removeMedia} activeOpacity={0.8}>
                <Feather name="x-circle" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.charCount, { borderTopColor: colors.border }]}>
            <Text style={[
              styles.charText,
              { color: remaining < 20 ? colors.destructive : colors.mutedForeground },
            ]}>
              {remaining} characters remaining
            </Text>
          </View>

          {/* Media buttons */}
          <View style={[styles.mediaButtons, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADD MEDIA</Text>
            <View style={styles.mediaButtonRow}>
              <TouchableOpacity
                style={[styles.mediaBtn, { backgroundColor: mediaType === "image" ? colors.primary + "20" : colors.card, borderColor: mediaType === "image" ? colors.primary : colors.border }]}
                onPress={pickImage}
                activeOpacity={0.8}
                disabled={isRecording}
              >
                <Feather name="image" size={18} color={mediaType === "image" ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.mediaBtnText, { color: mediaType === "image" ? colors.primary : colors.foreground }]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mediaBtn, { backgroundColor: mediaType === "video" ? colors.primary + "20" : colors.card, borderColor: mediaType === "video" ? colors.primary : colors.border }]}
                onPress={pickVideo}
                activeOpacity={0.8}
                disabled={isRecording}
              >
                <Feather name="video" size={18} color={mediaType === "video" ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.mediaBtnText, { color: mediaType === "video" ? colors.primary : colors.foreground }]}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mediaBtn,
                  {
                    backgroundColor: isRecording
                      ? "#DC262620"
                      : mediaType === "audio"
                      ? colors.primary + "20"
                      : colors.card,
                    borderColor: isRecording
                      ? "#DC2626"
                      : mediaType === "audio"
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                <Feather
                  name={isRecording ? "square" : "mic"}
                  size={18}
                  color={isRecording ? "#DC2626" : mediaType === "audio" ? colors.primary : colors.mutedForeground}
                />
                <Text style={[
                  styles.mediaBtnText,
                  {
                    color: isRecording
                      ? "#DC2626"
                      : mediaType === "audio"
                      ? colors.primary
                      : colors.foreground,
                  },
                ]}>
                  {isRecording ? `Stop · ${fmtSecs(recordSecs)}` : "Audio"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADD TAGS (up to 5)</Text>

            <View style={styles.tagChips}>
              {SUGGESTED_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.muted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.tagChipText, { color: selected ? "#ffffff" : colors.foreground }]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.customTagRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.customTagInput, { color: colors.foreground }]}
                placeholder="Add custom tag..."
                placeholderTextColor={colors.mutedForeground}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={addCustomTag}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={addCustomTag}
                disabled={!customTag.trim()}
                style={[styles.addTagBtn, { backgroundColor: customTag.trim() ? colors.primary : colors.muted }]}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={16} color={customTag.trim() ? "#ffffff" : colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.selectedTags}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setTags(tags.filter((t) => t !== tag))}
                    style={[styles.selectedTag, { backgroundColor: colors.accent }]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.selectedTagText, { color: colors.primary }]}>#{tag}</Text>
                    <Feather name="x" size={12} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: { fontSize: 15, fontWeight: "700" },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  textInput: {
    fontSize: 17,
    lineHeight: 26,
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediaPreviewWrap: { position: "relative", marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  mediaPreview: { width: "100%", height: 220, borderRadius: 16 },
  videoPreview: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  videoPlayIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  videoLabel: { fontSize: 14 },
  removeMediaBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    padding: 2,
  },
  charCount: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: "flex-end",
  },
  charText: { fontSize: 12 },
  mediaButtons: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  mediaButtonRow: { flexDirection: "row", gap: 10 },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  mediaBtnText: { fontSize: 14, fontWeight: "600" },
  tagsSection: { gap: 12 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  tagChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: { fontSize: 13, fontWeight: "500" },
  customTagRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    height: 46,
  },
  customTagInput: { flex: 1, fontSize: 15 },
  addTagBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  selectedTagText: { fontSize: 13, fontWeight: "600" },
});
