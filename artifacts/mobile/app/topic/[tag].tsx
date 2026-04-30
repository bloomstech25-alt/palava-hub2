import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useCallback, useMemo } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";
import { normalizeTagDisplay, postHasTag } from "@/utils/tags";

export default function TopicScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { tag: rawTag } = useLocalSearchParams<{ tag: string }>();
  const tag = normalizeTagDisplay(rawTag ?? "");

  const { user } = useAuth();
  const { posts, toggleLike, toggleFollow, deletePost } = useFeed();

  const matched = useMemo(() => {
    if (!tag) return [];
    return posts
      .filter((p) => postHasTag(p, tag))
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return tb - ta;
      });
  }, [posts, tag]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onLike={() => toggleLike(item.id)}
        onFollow={() => toggleFollow(item.id)}
        onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
        onDelete={user?.id === item.authorId ? () => deletePost(item.id) : undefined}
      />
    ),
    [toggleLike, toggleFollow, deletePost, user?.id],
  );

  const postWord = matched.length === 1 ? "post" : "posts";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />

      <View
        style={[
          styles.header,
          { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <View style={[styles.tagIcon, { backgroundColor: colors.accent }]}>
            <Feather name="hash" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Trending topic</Text>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              #{tag}
            </Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {matched.length} {postWord}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={matched}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="hash" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No posts for #{tag} yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Be the first to post about this — tag your post with #{tag}.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/create-post")}
              activeOpacity={0.85}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Create a post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  backText: { fontSize: 15, fontWeight: "600" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  tagIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  smallLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  count: { fontSize: 12, marginTop: 2 },
  listContent: { paddingBottom: 100, paddingTop: 8 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  emptyBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, marginTop: 16 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
