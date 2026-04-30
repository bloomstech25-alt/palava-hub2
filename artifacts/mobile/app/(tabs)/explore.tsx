import { Feather } from "@expo/vector-icons";
import { PalavaStar } from "@/components/PalavaStar";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
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
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/PostCard";
import { useFeed, type Post, SCHOOLS_LIST } from "@/context/FeedContext";
import { useAuth } from "@/context/AuthContext";
import type { School, User } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { collectPostTags } from "@/utils/tags";

// Fallback "suggested" topics shown only when no posts contain hashtags yet
// (e.g. fresh install / brand-new account). Once real activity exists, the
// trends list is built entirely from real posts.
const SUGGESTED_TOPICS = [
  "StudentLife", "Liberia", "Campus", "Academics", "UL", "Cuttington",
];

type Tab = "trending" | "jams" | "schools" | "people";

interface TrendingTopic {
  tag: string;
  count: number;
  posters: number;
  isSuggested?: boolean;
}

// Same keyword set used by the standalone Campus Jams screen — keeps both
// surfaces in sync so a post that shows up there also shows up in the
// Explore "Jams" tab.
const JAM_TAGS = [
  "campusjams", "campusjam", "party", "event", "show",
  "concert", "music", "dance", "festival", "afrobeats",
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, followUser, unfollowUser } = useAuth();
  const { posts, toggleLike, toggleFollow, deletePost } = useFeed();
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
    // Fetch without orderBy so users missing the "followers" field aren't silently excluded.
    // Sort client-side instead, treating missing followers as 0.
    const q = query(collection(db, "users"), limit(200));
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const fetched: User[] = snap.docs
          .map((d) => ({ ...(d.data() as User), id: d.id }))
          .filter((u) => u.id !== user?.id)
          .sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0))
          .slice(0, 80);
        setFirestoreUsers(fetched);
      })
      .catch((err) => {
        // Surface what's actually going wrong instead of silently showing
        // an empty list. Most common causes: Firestore offline in proxied
        // environment, or rules rejecting the read.
        // eslint-disable-next-line no-console
        console.warn("[explore] people fetch failed", err?.code, err?.message, err);
      })
      .finally(() => { if (!cancelled) setUsersLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, user?.id]);

  const followingIds = user?.followingIds ?? [];

  // Build trending topics from real posts. Twitter-style: aggregate hashtags
  // (from the explicit `tags` array AND any `#word` parsed from post content)
  // via the shared `collectPostTags` helper — which dedupes by lowercase key
  // PER POST so the same `#foo` in both `tags` and `content` only counts
  // once. Falls back to suggested topics when there's literally nothing to
  // trend on.
  const trendingTopics = useMemo<TrendingTopic[]>(() => {
    const counts = new Map<string, { display: string; count: number; posters: Set<string> }>();
    for (const p of posts) {
      const tagsForPost = collectPostTags(p);
      for (const [key, display] of tagsForPost) {
        const existing = counts.get(key) ?? { display, count: 0, posters: new Set<string>() };
        existing.count += 1;
        if (p.authorId) existing.posters.add(p.authorId);
        counts.set(key, existing);
      }
    }

    const real = Array.from(counts.values())
      .map((t) => ({ tag: t.display, count: t.count, posters: t.posters.size }))
      .sort((a, b) => b.count - a.count || b.posters - a.posters)
      .slice(0, 25);

    if (real.length > 0) return real;

    return SUGGESTED_TOPICS.map((t) => ({ tag: t, count: 0, posters: 0, isSuggested: true }));
  }, [posts]);

  const filteredTopics = useMemo<TrendingTopic[]>(() => {
    if (!searchQuery.trim()) return trendingTopics;
    const q = searchQuery.toLowerCase();
    return trendingTopics.filter((t) => t.tag.toLowerCase().includes(q));
  }, [searchQuery, trendingTopics]);

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
      .filter((p) => p.author.school?.id === selectedSchool.id)
      .sort((a, b) => b.likes - a.likes);
  }, [selectedSchool, posts]);

  // Build the Jams list from the global feed by matching the post's category
  // OR any of its tags against the JAM_TAGS list. If the user is searching,
  // narrow further by the search query so people can find a specific party
  // or event by name.
  const jamPosts = useMemo<Post[]>(() => {
    const matches = posts.filter((p) => {
      if (p.category === "campus_jams") return true;
      const lower = (p.tags ?? []).map((t) => t.toLowerCase());
      return lower.some((t) => JAM_TAGS.includes(t));
    });
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter(
      (p) =>
        (p.content ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (p.author?.name ?? "").toLowerCase().includes(q),
    );
  }, [posts, searchQuery]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => toggleLike(item.id)}
      onFollow={() => toggleFollow(item.id)}
      onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
      onDelete={user?.id === item.authorId ? () => deletePost(item.id) : undefined}
    />
  ), [toggleLike, toggleFollow, deletePost, user?.id]);

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
    { key: "jams", label: "Jams", icon: "zap" },
    { key: "schools", label: "Schools", icon: "book-open" },
    { key: "people", label: "People", icon: "users" },
  ];

  if (selectedSchool) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedStatusBar />
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
      <ThemedStatusBar />

      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Explore</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={
              activeTab === "trending"
                ? "Search topics..."
                : activeTab === "schools"
                  ? "Search schools..."
                  : activeTab === "people"
                    ? "Search people..."
                    : "Search jams..."
            }
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

      {/* TRENDING TAB — Twitter-style topics list, not a feed */}
      {activeTab === "trending" && (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.tag.toLowerCase()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.trendsHeader}>
              <Text style={[styles.trendsTitle, { color: colors.foreground }]}>Trends for Liberia</Text>
              <Text style={[styles.trendsSub, { color: colors.mutedForeground }]}>
                {trendingTopics[0]?.isSuggested
                  ? "Suggested topics — start posting with #hashtags to set the trends."
                  : "What students are talking about right now."}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const rank = index + 1;
            const postWord = item.count === 1 ? "post" : "posts";
            return (
              <TouchableOpacity
                style={[styles.trendRow, { borderBottomColor: colors.border }]}
                activeOpacity={0.6}
                onPress={() => router.push({ pathname: "/topic/[tag]", params: { tag: item.tag } })}
              >
                <View style={styles.trendLeft}>
                  <Text style={[styles.trendRank, { color: colors.mutedForeground }]}>
                    {rank} · {item.isSuggested ? "Suggested" : "Trending"}
                  </Text>
                  <Text style={[styles.trendTag, { color: colors.foreground }]} numberOfLines={1}>
                    #{item.tag}
                  </Text>
                  {!item.isSuggested && (
                    <Text style={[styles.trendCount, { color: colors.mutedForeground }]}>
                      {item.count} {postWord}
                      {item.posters > 1 ? ` · ${item.posters} students` : ""}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No trends match</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Try a different search term.
              </Text>
            </View>
          }
        />
      )}

      {/* JAMS TAB — campus party / event posts */}
      {activeTab === "jams" && (
        <FlatList
          data={jamPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            !searchQuery ? (
              <View style={[styles.jamsHero, { backgroundColor: "#0D0A08" }]}>
                <View style={styles.jamsHeroRow}>
                  <Feather name="zap" size={16} color="#FFD166" />
                  <Text style={styles.jamsHeroTitle}>What's poppin' on campus?</Text>
                </View>
                <Text style={styles.jamsHeroSub}>
                  Parties, shows, music drops, dance battles — share your campus energy with all of Liberia.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/create-post?category=campus_jams")}
                  activeOpacity={0.85}
                  style={styles.jamsHeroBtn}
                >
                  <Feather name="plus" size={14} color="#0D0A08" />
                  <Text style={styles.jamsHeroBtnText}>Post a Jam</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="music" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No jams yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Be the first to share a party or campus moment. Tag your post with #campusjams.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/create-post?category=campus_jams")}
                activeOpacity={0.85}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Start the Jam</Text>
              </TouchableOpacity>
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
                    {item.verificationStatus === "approved" && <PalavaStar size={14} />}
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
  trendsHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  trendsTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  trendsSub: { fontSize: 13, lineHeight: 18 },
  trendRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trendLeft: { flex: 1, gap: 2 },
  trendRank: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  trendTag: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  trendCount: { fontSize: 12, marginTop: 2 },
  sectionLabelRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
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
  jamsHero: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    borderRadius: 16,
  },
  jamsHeroRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  jamsHeroTitle: { color: "#fff", fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  jamsHeroSub: { color: "#E6E0DA", fontSize: 12, lineHeight: 18, marginTop: 6 },
  jamsHeroBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFD166",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  jamsHeroBtnText: { color: "#0D0A08", fontSize: 13, fontWeight: "800" },
  emptyBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, marginTop: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
