import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/PostCard";
import { useFeed, type Post, SCHOOLS_LIST } from "@/context/FeedContext";
import { useAuth } from "@/context/AuthContext";
import type { School, User } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const TRENDING_TAGS = [
  "StudentLife", "STEM", "Liberia", "UL", "Cuttington", "CWA",
  "Academics", "Research", "Campus", "Sports", "Culture",
];

type Tab = "trending" | "schools" | "people";

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, followUser, unfollowUser } = useAuth();
  const { trendingPosts, posts, toggleLike, toggleFollow, deletePost, sharePost } = useFeed();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const [firestoreUsers, setFirestoreUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeTab !== "people") return;
    let cancelled = false;
    setUsersLoading(true);
    const q = query(
      collection(db, "users"),
      orderBy("followers", "desc"),
      limit(80)
    );
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const fetched: User[] = snap.docs
          .map((d) => ({ ...(d.data() as User), id: d.id }))
          .filter((u) => u.id !== user?.id);
        setFirestoreUsers(fetched);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, user?.id]);

  const followingIds = user?.followingIds ?? [];

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return trendingPosts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.author.name.toLowerCase().includes(q) ||
        p.author.school.name.toLowerCase().includes(q)
    );
  }, [searchQuery, trendingPosts, posts]);

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return SCHOOLS_LIST;
    const q = searchQuery.toLowerCase();
    return SCHOOLS_LIST.filter((s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return firestoreUsers;
    const q = searchQuery.toLowerCase();
    return firestoreUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.school?.name?.toLowerCase().includes(q)
    );
  }, [searchQuery, firestoreUsers]);

  const schoolTrendingPosts = useMemo(() => {
    if (!selectedSchool) return [];
    return [...posts]
      .filter((p) => p.author.school.id === selectedSchool.id)
      .sort((a, b) => b.likes - a.likes);
  }, [selectedSchool, posts]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => toggleLike(item.id)}
      onFollow={() => toggleFollow(item.id)}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
      onDelete={user?.id === item.authorId ? () => deletePost(item.id) : undefined}
      onShare={() => sharePost(item.id)}
    />
  ), [toggleLike, toggleFollow, deletePost, sharePost, user?.id]);

  async function handleFollowToggle(targetId: string) {
    if (followingInProgress[targetId]) return;
    setFollowingInProgress((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (followingIds.includes(targetId)) {
        await unfollowUser(targetId);
      } else {
        await followUser(targetId);
      }
    } finally {
      setFollowingInProgress((prev) => ({ ...prev, [targetId]: false }));
    }
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "trending", label: "Trending", icon: "trending-up" },
    { key: "schools", label: "Schools", icon: "book-open" },
    { key: "people", label: "People", icon: "users" },
  ];

  if (selectedSchool) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setSelectedSchool(null)} style={styles.backRow} activeOpacity={0.7}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Schools</Text>
          </TouchableOpacity>
          <View style={styles.schoolDetailHeader}>
            <View style={[styles.schoolDetailIcon, { backgroundColor: selectedSchool.type === "university" ? colors.accent : colors.secondary }]}>
              <Feather name={selectedSchool.type === "university" ? "book" : "award"} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.schoolDetailName, { color: colors.foreground }]} numberOfLines={2}>{selectedSchool.name}</Text>
              <Text style={[styles.schoolDetailMeta, { color: colors.mutedForeground }]}>
                {selectedSchool.type === "university" ? "University" : "Senior High School"} · {selectedSchool.location}
              </Text>
            </View>
          </View>
          <View style={[styles.trendingBadge, { backgroundColor: colors.accent }]}>
            <Feather name="trending-up" size={13} color={colors.primary} />
            <Text style={[styles.trendingBadgeText, { color: colors.primary }]}>Trending at this school</Text>
          </View>
        </View>
        {schoolTrendingPosts.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No one from {selectedSchool.name} has posted yet.</Text>
          </View>
        ) : (
          <FlatList data={schoolTrendingPosts} keyExtractor={(item) => item.id} renderItem={renderPost} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} />
        )}
      </View>
    );
  }

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
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.tabs}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, { backgroundColor: activeTab === t.key ? colors.primary : colors.muted }]}
              activeOpacity={0.8}
            >
              <Feather name={t.icon as any} size={14} color={activeTab === t.key ? "#ffffff" : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: activeTab === t.key ? "#ffffff" : colors.mutedForeground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TRENDING TAB */}
      {activeTab === "trending" && (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery ? (
              <View style={styles.tagsSection}>
                <View style={styles.sectionLabelRow}>
                  <Feather name="globe" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRENDING ACROSS ALL SCHOOLS</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
                  {TRENDING_TAGS.map((tag) => (
                    <TouchableOpacity key={tag} style={[styles.tagChip, { backgroundColor: colors.accent }]} onPress={() => setSearchQuery(tag)} activeOpacity={0.7}>
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
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results found</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Try a different search term</Text>
            </View>
          }
        />
      )}

      {/* SCHOOLS TAB */}
      {activeTab === "schools" && (
        <FlatList
          data={filteredSchools}
          keyExtractor={(s) => s.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery ? (
              <View style={styles.sectionLabelRow2}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TAP A SCHOOL TO SEE WHAT'S TRENDING</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.schoolCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.75} onPress={() => setSelectedSchool(item)}>
              <View style={[styles.schoolIconWrap, { backgroundColor: item.type === "university" ? colors.accent : colors.secondary }]}>
                <Feather name={item.type === "university" ? "book" : "award"} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.schoolName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.schoolMeta, { color: colors.mutedForeground }]}>{item.type === "university" ? "University" : "Senior High School"} · {item.location}</Text>
              </View>
              <View style={[styles.schoolArrow, { backgroundColor: colors.accent }]}>
                <Feather name="trending-up" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="book-open" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No schools found</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Try a different search</Text>
            </View>
          }
        />
      )}

      {/* PEOPLE TAB — real Firestore users */}
      {activeTab === "people" && (
        <FlatList
          data={filteredPeople}
          keyExtractor={(u) => u.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery ? (
              <View style={styles.sectionLabelRow2}>
                <Feather name="users" size={12} color={colors.mutedForeground} />
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  {usersLoading ? "LOADING..." : `${firestoreUsers.length} STUDENTS ON PALAVA HUB`}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isFollowing = followingIds.includes(item.id);
            const inProgress = !!followingInProgress[item.id];
            const rank = index + 1;
            const isTopThree = rank <= 3;
            const rankColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

            return (
              <TouchableOpacity
                style={[styles.personCard, { backgroundColor: colors.card, borderColor: isTopThree ? colors.primary + "30" : colors.border }]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: "/(tabs)/profile", params: { userId: item.id } })}
              >
                <View style={[styles.rankBadge, { backgroundColor: isTopThree ? rankColors[rank - 1] + "20" : colors.muted }]}>
                  <Text style={[styles.rankText, { color: isTopThree ? rankColors[rank - 1] : colors.mutedForeground }]}>#{rank}</Text>
                </View>

                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.personAvatar} />
                ) : (
                  <View style={[styles.personAvatar, styles.personAvatarFallback, { backgroundColor: colors.primary }]}>
                    <Text style={styles.personAvatarInitial}>{item.name?.[0]?.toUpperCase() ?? "?"}</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <View style={styles.personNameRow}>
                    <Text style={[styles.personName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                    {isTopThree && (
                      <View style={[styles.hotBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Feather name="zap" size={10} color={colors.primary} />
                        <Text style={[styles.hotBadgeText, { color: colors.primary }]}>Top</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.personMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                    @{item.username} · {item.school?.name ?? ""}
                  </Text>
                  <View style={styles.personStats}>
                    <Text style={[styles.personStatVal, { color: colors.foreground }]}>
                      {(item.followers ?? 0) >= 1000 ? `${((item.followers ?? 0) / 1000).toFixed(1)}k` : (item.followers ?? 0)}
                    </Text>
                    <Text style={[styles.personStatLabel, { color: colors.mutedForeground }]}> followers</Text>
                    <Text style={[styles.personStatSep, { color: colors.mutedForeground }]}>·</Text>
                    <Text style={[styles.personStatVal, { color: colors.foreground }]}>{item.posts ?? 0}</Text>
                    <Text style={[styles.personStatLabel, { color: colors.mutedForeground }]}> posts</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    {
                      backgroundColor: isFollowing ? colors.muted : colors.primary,
                      borderWidth: isFollowing ? 1 : 0,
                      borderColor: colors.border,
                      opacity: inProgress ? 0.6 : 1,
                    },
                  ]}
                  onPress={(e) => { e.stopPropagation(); handleFollowToggle(item.id); }}
                  disabled={inProgress}
                  activeOpacity={0.8}
                >
                  {inProgress ? (
                    <ActivityIndicator size="small" color={isFollowing ? colors.mutedForeground : "#fff"} />
                  ) : (
                    <Text style={[styles.followBtnText, { color: isFollowing ? colors.foreground : colors.primaryForeground }]}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            usersLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Finding students...</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Feather name="users" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {searchQuery ? "No students found" : "No students yet"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {searchQuery ? "Try a different name or school" : "Be the first to join Palava Hub!"}
                </Text>
              </View>
            )
          }
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
  tagsSection: { paddingTop: 4, paddingBottom: 4 },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionLabelRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  tagsRow: { paddingHorizontal: 16, gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagChipText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
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
  schoolName: { fontSize: 14, fontWeight: "600" },
  schoolMeta: { fontSize: 12, marginTop: 2 },
  schoolArrow: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 12, fontWeight: "800" },
  personAvatar: { width: 46, height: 46, borderRadius: 23 },
  personAvatarFallback: { alignItems: "center", justifyContent: "center" },
  personAvatarInitial: { color: "#fff", fontSize: 18, fontWeight: "800" },
  personNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  personName: { fontSize: 14, fontWeight: "700", flexShrink: 1 },
  hotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hotBadgeText: { fontSize: 10, fontWeight: "700" },
  personMeta: { fontSize: 12, marginTop: 1 },
  personStats: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  personStatVal: { fontSize: 12, fontWeight: "700" },
  personStatLabel: { fontSize: 12 },
  personStatSep: { fontSize: 12, marginHorizontal: 5 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, minWidth: 80, alignItems: "center" },
  followBtnText: { fontSize: 13, fontWeight: "600" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -4 },
  backText: { fontSize: 15, fontWeight: "600" },
  schoolDetailHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  schoolDetailIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  schoolDetailName: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  schoolDetailMeta: { fontSize: 12, marginTop: 3 },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trendingBadgeText: { fontSize: 12, fontWeight: "700" },
});
