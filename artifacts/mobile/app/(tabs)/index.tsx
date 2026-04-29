import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { AdCard } from "@/components/AdCard";
import { useAuth } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { useAds, type Ad } from "@/context/AdsContext";
import { useColors } from "@/hooks/useColors";
import { useState } from "react";

type FeedItem = { type: "post"; data: Post } | { type: "ad"; data: Ad };

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();

  const { posts, isLoading, toggleLike, toggleFollow, deletePost } = useFeed();
  const { getActiveAds } = useAds();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  // Interleave ads into posts — insert an ad every 3 posts
  const feedItems = useMemo((): FeedItem[] => {
    const activeAds = getActiveAds();
    if (activeAds.length === 0) return posts.map((p) => ({ type: "post", data: p }));
    const items: FeedItem[] = [];
    let adIndex = 0;
    posts.forEach((post, i) => {
      items.push({ type: "post", data: post });
      if ((i + 1) % 3 === 0 && adIndex < activeAds.length) {
        items.push({ type: "ad", data: activeAds[adIndex] });
        adIndex = (adIndex + 1) % activeAds.length;
      }
    });
    return items;
  }, [posts, getActiveAds]);

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === "ad") {
      return <AdCard ad={item.data} />;
    }
    const isOwn = user?.id === item.data.authorId;
    return (
      <PostCard
        post={item.data}
        onLike={() => toggleLike(item.data.id)}
        onFollow={() => toggleFollow(item.data.id)}
        onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.data.id } })}
        onDelete={isOwn ? () => deletePost(item.data.id) : undefined}
      />
    );
  }, [toggleLike, toggleFollow, deletePost, user?.id]);

  const keyExtractor = useCallback((item: FeedItem) => {
    return item.type === "post" ? `post_${item.data.id}` : `ad_${item.data.id}`;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Palava Hub</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/campus-jams")}
            style={[styles.advertiseBtn, { backgroundColor: colors.accent, borderColor: colors.primary + "30" }]}
            activeOpacity={0.8}
          >
            <Feather name="music" size={13} color={colors.primary} />
            <Text style={[styles.advertiseBtnText, { color: colors.primary }]}>Jams</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/go-live")}
            style={[styles.liveBtn, { backgroundColor: "#ef4444" + "15", borderColor: "#ef444440" }]}
            activeOpacity={0.8}
          >
            <View style={styles.liveDotBtn} />
            <Text style={[styles.liveBtnText, { color: "#ef4444" }]}>Live</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/create-post")}
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Feather name="edit-3" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Be the first to share something!</Text>
            </View>
          }
        />
      )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDotBtn: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#ef4444" },
  liveBtnText: { fontSize: 13, fontWeight: "700" },
  advertiseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  advertiseBtnText: { fontSize: 13, fontWeight: "700" },
  createBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingVertical: 8, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14 },
});
