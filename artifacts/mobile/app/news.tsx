import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

type NewsPage = {
  id: string;
  name: string;
  handle: string;
  category: "news" | "sports" | "entertainment";
  description: string;
  color: string;
};

type NewsItem = {
  pageId: string;
  pageName: string;
  pageColor: string;
  category: string;
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string;
};

const FOLLOW_KEY = "palavahub:news:followed:v1";
const TAB_KEY = "palavahub:news:lastTab:v1";

const CATEGORIES: { key: "all" | "news" | "sports" | "entertainment"; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "globe" },
  { key: "news", label: "News", icon: "file-text" },
  { key: "sports", label: "Sports", icon: "activity" },
  { key: "entertainment", label: "Entertainment", icon: "music" },
];

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function apiBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }
  return "";
}

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [view, setView] = useState<"feed" | "discover">("feed");
  const [tab, setTab] = useState<"all" | "news" | "sports" | "entertainment">("all");
  const [pages, setPages] = useState<NewsPage[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followed, setFollowed] = useState<string[]>([]);

  // Restore followed pages and last tab from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FOLLOW_KEY);
        if (raw) setFollowed(JSON.parse(raw));
        const t = await AsyncStorage.getItem(TAB_KEY);
        if (t === "news" || t === "sports" || t === "entertainment" || t === "all") setTab(t);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load page catalog once
  useEffect(() => {
    fetch(`${apiBase()}/api/news/pages`)
      .then((r) => r.json())
      .then((data: NewsPage[]) => setPages(data))
      .catch(() => setPages([]));
  }, []);

  const loadFeed = useCallback(async () => {
    if (followed.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = `${apiBase()}/api/news/feed?pages=${followed.join(",")}`;
      const res = await fetch(url);
      const data = await res.json() as { items?: NewsItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [followed]);

  // Only fetch feed when user is actually viewing the feed; skip while in Discover mode
  useEffect(() => {
    if (view === "feed") loadFeed();
  }, [loadFeed, view]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const toggleFollow = useCallback(async (pageId: string) => {
    setFollowed((prev) => {
      const next = prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId];
      AsyncStorage.setItem(FOLLOW_KEY, JSON.stringify(next)).catch(() => { /* ignore */ });
      return next;
    });
  }, []);

  const switchTab = useCallback(async (next: typeof tab) => {
    setTab(next);
    AsyncStorage.setItem(TAB_KEY, next).catch(() => { /* ignore */ });
  }, []);

  const filteredItems = useMemo(() => {
    if (tab === "all") return items;
    return items.filter((i) => i.category === tab);
  }, [items, tab]);

  const filteredPages = useMemo(() => {
    if (tab === "all") return pages;
    return pages.filter((p) => p.category === tab);
  }, [pages, tab]);

  function openLink(url: string) {
    Linking.openURL(url).catch(() => { /* ignore */ });
  }

  const renderArticle = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={[styles.article, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.85}
      onPress={() => openLink(item.link)}
    >
      <View style={styles.articleHeader}>
        <View style={[styles.pageDot, { backgroundColor: item.pageColor }]} />
        <Text style={[styles.pageName, { color: colors.foreground }]}>{item.pageName}</Text>
        <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>· {timeAgo(item.publishedAt)}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>{item.title}</Text>
      {item.summary ? (
        <Text style={[styles.summary, { color: colors.mutedForeground }]} numberOfLines={3}>{item.summary}</Text>
      ) : null}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.articleImage} resizeMode="cover" />
      ) : null}
      <View style={styles.readMoreRow}>
        <Text style={[styles.readMore, { color: colors.primary }]}>Read full story</Text>
        <Feather name="external-link" size={13} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Liberian News</Text>
        <TouchableOpacity
          onPress={() => setView(view === "feed" ? "discover" : "feed")}
          style={[styles.discoverBtn, { backgroundColor: view === "discover" ? colors.primary : colors.muted }]}
          activeOpacity={0.85}
        >
          <Feather name={view === "discover" ? "check" : "plus"} size={13} color={view === "discover" ? colors.primaryForeground : colors.foreground} />
          <Text style={[styles.discoverText, { color: view === "discover" ? colors.primaryForeground : colors.foreground }]}>
            {view === "discover" ? "Done" : "Discover"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {CATEGORIES.map((c) => {
          const active = tab === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.tabPill, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
              onPress={() => switchTab(c.key)}
              activeOpacity={0.85}
            >
              <Feather name={c.icon as any} size={13} color={active ? colors.primaryForeground : colors.foreground} />
              <Text style={[styles.tabText, { color: active ? colors.primaryForeground : colors.foreground }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {view === "discover" ? (
        // Discover view — list of pages user can follow
        <ScrollView contentContainerStyle={styles.discoverContent}>
          <Text style={[styles.discoverHeading, { color: colors.mutedForeground }]}>
            Follow Liberian pages to see their stories in your feed
          </Text>
          {filteredPages.map((page) => {
            const isFollowing = followed.includes(page.id);
            return (
              <View
                key={page.id}
                style={[styles.pageRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.pageAvatar, { backgroundColor: page.color }]}>
                  <Text style={styles.pageAvatarText}>{page.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pageRowName, { color: colors.foreground }]}>{page.name}</Text>
                  <Text style={[styles.pageHandle, { color: colors.mutedForeground }]}>@{page.handle} · {page.category}</Text>
                  <Text style={[styles.pageDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{page.description}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFollow(page.id)}
                  style={[styles.followBtn, isFollowing
                    ? { backgroundColor: colors.muted, borderColor: colors.border }
                    : { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.followText, { color: isFollowing ? colors.foreground : colors.primaryForeground }]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        // Feed view — articles from followed pages
        <FlatList
          data={filteredItems}
          keyExtractor={(item, idx) => `${item.link}-${idx}`}
          renderItem={renderArticle}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            loading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground, marginTop: 12 }]}>Loading latest stories...</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                  <Feather name="globe" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {followed.length === 0 ? "Follow some pages to get started" : "No stories yet"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {followed.length === 0
                    ? "Tap Discover to find Liberian news, sports, and entertainment pages."
                    : "Pull down to refresh."}
                </Text>
                {followed.length === 0 && (
                  <TouchableOpacity
                    style={[styles.discoverCta, { backgroundColor: colors.primary }]}
                    onPress={() => setView("discover")}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.discoverCtaText, { color: colors.primaryForeground }]}>Browse Pages</Text>
                  </TouchableOpacity>
                )}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1 },
  discoverBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  discoverText: { fontSize: 13, fontWeight: "700" },
  tabsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  discoverContent: { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 32, gap: 8 },
  discoverHeading: { fontSize: 12, marginBottom: 4, paddingHorizontal: 4 },
  pageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pageAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
  },
  pageAvatarText: { color: "white", fontSize: 18, fontWeight: "800" },
  pageRowName: { fontSize: 14, fontWeight: "700" },
  pageHandle: { fontSize: 11, marginTop: 1 },
  pageDesc: { fontSize: 12, marginTop: 3, lineHeight: 16 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  followText: { fontSize: 12, fontWeight: "700" },
  article: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  articleHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageDot: { width: 8, height: 8, borderRadius: 4 },
  pageName: { fontSize: 13, fontWeight: "700" },
  timeAgo: { fontSize: 12 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 21, letterSpacing: -0.2 },
  summary: { fontSize: 13, lineHeight: 19 },
  articleImage: { width: "100%", height: 170, borderRadius: 10, marginTop: 4 },
  readMoreRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  readMore: { fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  discoverCta: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, marginTop: 6 },
  discoverCtaText: { fontSize: 14, fontWeight: "700" },
});
