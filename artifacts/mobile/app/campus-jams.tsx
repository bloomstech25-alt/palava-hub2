import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";

// Campus Jams = posts tagged with party / event / music / dance / show
// keywords, OR explicitly categorized as campus_jams.
const JAM_TAGS = [
  "campusjams", "campusjam", "party", "event", "show",
  "concert", "music", "dance", "festival", "afrobeats",
];

export default function CampusJamsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { posts, isLoading, toggleLike, toggleFollow, deletePost } = useFeed();

  const jams = useMemo<Post[]>(() => {
    return posts.filter((p) => {
      if (p.category === "campus_jams") return true;
      const lower = (p.tags ?? []).map((t) => t.toLowerCase());
      return lower.some((t) => JAM_TAGS.includes(t));
    });
  }, [posts]);

  function handleCreate() {
    // Send the user to create-post pre-tagged for Campus Jams.
    router.push("/create-post?category=campus_jams");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Feather name="zap" size={18} color="#DC2626" />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Campus Jams</Text>
        </View>
        <TouchableOpacity onPress={handleCreate} activeOpacity={0.7} style={[styles.newBtn, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: "#0D0A08" }]}>
        <Text style={styles.heroTitle}>What's poppin' on campus?</Text>
        <Text style={styles.heroSub}>
          Parties, shows, music drops, dance battles — share your campus energy with all of Liberia.
        </Text>
        <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} style={styles.heroBtn}>
          <Feather name="zap" size={14} color="#0D0A08" />
          <Text style={styles.heroBtnText}>Post a Jam</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : jams.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="music" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jams yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Be the first to share a party, event, or campus moment. Tag your post with #campusjams.
          </Text>
          <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Start the Jam</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => toggleLike(item.id)}
              onFollow={() => toggleFollow(item.id)}
              // Only show delete affordance to the post owner — prevents
              // any user from triggering deletes on jams they don't own.
              onDelete={
                user && item.author?.id === user.id
                  ? () => deletePost(item.id)
                  : undefined
              }
            />
          )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  newBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  hero: { padding: 18, marginHorizontal: 14, marginTop: 14, borderRadius: 16 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  heroSub: { color: "#E6E0DA", fontSize: 13, lineHeight: 19, marginTop: 6 },
  heroBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    marginTop: 14,
  },
  heroBtnText: { color: "#0D0A08", fontSize: 13, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { padding: 30, alignItems: "center", marginTop: 30 },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 14 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 6 },
  emptyBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, marginTop: 18 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
