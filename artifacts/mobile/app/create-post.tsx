import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
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

  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const charLimit = 280;

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

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setIsPosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addPost(content.trim(), tags, user);
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

          <View style={[styles.charCount, { borderTopColor: colors.border }]}>
            <Text style={[
              styles.charText,
              { color: remaining < 20 ? colors.destructive : colors.mutedForeground },
            ]}>
              {remaining} characters remaining
            </Text>
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
    minHeight: 140,
    textAlignVertical: "top",
  },
  charCount: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: "flex-end",
  },
  charText: { fontSize: 12 },
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
