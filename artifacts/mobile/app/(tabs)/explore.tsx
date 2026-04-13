import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostCard } from "@/components/PostCard";
import { useFeed, type Post, SCHOOLS_LIST, SAMPLE_USERS } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";

const TRENDING_TAGS = [
  "StudyTips", "AI", "MachineLearning", "Robotics", "StudentLife",
  "Harvard", "Stanford", "NYU", "UCBerkeley", "MIT", "Film", "STEM",
];

type Tab = "trending" | "schools" | "people";

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { trendingPosts, posts, toggleLike, toggleFollow } = useFeed();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("trending");

  const filteredPosts = useMemo(() => {
    if (!query.trim()) return trendingPosts;
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.author.name.toLowerCase().includes(q) ||
        p.author.school.name.toLowerCase().includes(q)
    );
  }, [query, trendingPosts, posts]);

  const filteredSchools = useMemo(() => {
    if (!query.trim()) return SCHOOLS_LIST;
    const q = query.toLowerCase();
    return SCHOOLS_LIST.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
  }, [query]);

  const filteredPeople = useMemo(() => {
    if (!query.trim()) return SAMPLE_USERS;
    const q = query.toLowerCase();
    return SAMPLE_USERS.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.school.name.toLowerCase().includes(q)
    );
  }, [query]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => toggleLike(item.id)}
      onFollow={() => toggleFollow(item.id)}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
    />
  ), [toggleLike, toggleFollow]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "trending", label: "Trending", icon: "trending-up" },
    { key: "schools", label: "Schools", icon: "book-open" },
    { key: "people", label: "People", icon: "users" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Explore</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search posts, schools, people..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[
                styles.tab,
                { backgroundColor: activeTab === t.key ? colors.primary : colors.muted },
              ]}
              activeOpacity={0.8}
            >
              <Feather name={t.icon as any} size={14} color={activeTab === t.key ? "#ffffff" : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: activeTab === t.key ? "#ffffff" : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === "trending" && (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !query ? (
              <View style={styles.tagsSection}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRENDING TOPICS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
                  {TRENDING_TAGS.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagChip, { backgroundColor: colors.accent }]}
                      onPress={() => setQuery(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagChipText, { color: colors.primary }]}>#{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
            </View>
          }
        />
      )}

      {activeTab === "schools" && (
        <FlatList
          data={filteredSchools}
          keyExtractor={(s) => s.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.schoolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.schoolIconWrap, { backgroundColor: item.type === "university" ? colors.accent : colors.secondary }]}>
                <Feather name={item.type === "university" ? "book" : "award"} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.schoolName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.schoolMeta, { color: colors.mutedForeground }]}>
                  {item.type === "university" ? "University" : "High School"} · {item.location}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
          )}
        />
      )}

      {activeTab === "people" && (
        <FlatList
          data={filteredPeople}
          keyExtractor={(u) => u.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.personCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/(tabs)/profile", params: { userId: item.id } })}
            >
              <Image source={{ uri: item.avatar }} style={styles.personAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.personName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.personMeta, { color: colors.mutedForeground }]}>
                  @{item.username} · {item.school.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.followBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.followBtnText, { color: colors.primaryForeground }]}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, paddingTop: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingBottom: 100, paddingTop: 8 },
  tagsSection: { paddingTop: 8, paddingBottom: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10 },
  tagsRow: { paddingHorizontal: 16, gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagChipText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
  schoolCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  schoolIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  schoolName: { fontSize: 15, fontWeight: "600" },
  schoolMeta: { fontSize: 12, marginTop: 2 },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  personAvatar: { width: 48, height: 48, borderRadius: 24 },
  personName: { fontSize: 15, fontWeight: "600" },
  personMeta: { fontSize: 12, marginTop: 2 },
  followBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  followBtnText: { fontSize: 13, fontWeight: "600" },
});
