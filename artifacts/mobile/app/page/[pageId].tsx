import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const PAGE_TYPE_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  business: "briefcase",
  organization: "users",
  community: "globe",
  nonprofit: "heart",
  education: "book-open",
  entertainment: "music",
};

interface PageData {
  id: string;
  name: string;
  type: string;
  description: string;
  website: string;
  logo: string | null;
  ownerId: string;
  ownerName: string;
  ownerSchool: string;
  followers: number;
  posts: number;
  verified: boolean;
  createdAt: { seconds: number } | null;
}

export default function PageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { user } = useAuth();

  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!pageId) return;
    getDoc(doc(db, "pages", pageId)).then((snap) => {
      if (snap.exists()) {
        setPage({ id: snap.id, ...snap.data() } as PageData);
      }
      setLoading(false);
    });
  }, [pageId]);

  const handleFollow = async () => {
    if (!page) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFollowing = !following;
    setFollowing(newFollowing);
    setPage((p) => p ? { ...p, followers: p.followers + (newFollowing ? 1 : -1) } : p);
    try {
      await updateDoc(doc(db, "pages", page.id), {
        followers: increment(newFollowing ? 1 : -1),
      });
    } catch {
      setFollowing(!newFollowing);
    }
  };

  const isOwner = user?.id === page?.ownerId;
  const typeIcon = PAGE_TYPE_ICONS[page?.type ?? ""] ?? "flag";
  const typeName = page?.type ? (page.type.charAt(0).toUpperCase() + page.type.slice(1)) : "";

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!page) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Page not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
          <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{page.name}</Text>
        {isOwner ? (
          <TouchableOpacity activeOpacity={0.7}>
            <Feather name="edit-2" size={20} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Cover / Logo */}
        <View style={[styles.coverArea, { backgroundColor: colors.primary + "22" }]}>
          {page.logo ? (
            <Image source={{ uri: page.logo }} style={styles.logo} />
          ) : (
            <View style={[styles.logoFallback, { backgroundColor: colors.primary }]}>
              <Feather name={typeIcon} size={36} color="#ffffff" />
            </View>
          )}
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.nameRow}>
            <Text style={[styles.pageName, { color: colors.foreground }]}>{page.name}</Text>
            {page.verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={10} color="#ffffff" />
              </View>
            )}
          </View>

          <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
            <Feather name={typeIcon} size={12} color={colors.primary} />
            <Text style={[styles.typeText, { color: colors.primary }]}>{typeName} Page</Text>
          </View>

          {page.description ? (
            <Text style={[styles.description, { color: colors.foreground }]}>{page.description}</Text>
          ) : null}

          {page.website ? (
            <View style={styles.websiteRow}>
              <Feather name="link" size={14} color={colors.primary} />
              <Text style={[styles.websiteText, { color: colors.primary }]}>{page.website}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Feather name="book-open" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{page.ownerSchool}</Text>
          </View>

          {/* Stats */}
          <View style={[styles.stats, { borderTopColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{page.followers}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{page.posts}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Posts</Text>
            </View>
          </View>

          {!isOwner && (
            <TouchableOpacity
              onPress={handleFollow}
              style={[
                styles.followBtn,
                { backgroundColor: following ? colors.muted : colors.primary, borderColor: following ? colors.border : colors.primary },
              ]}
              activeOpacity={0.85}
            >
              <Feather name={following ? "user-check" : "user-plus"} size={16} color={following ? colors.foreground : "#ffffff"} />
              <Text style={[styles.followBtnText, { color: following ? colors.foreground : "#ffffff" }]}>
                {following ? "Following" : "Follow Page"}
              </Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <View style={[styles.ownerBadge, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.ownerBadgeText, { color: colors.primary }]}>You manage this page</Text>
            </View>
          )}
        </View>

        {/* Empty posts state */}
        <View style={[styles.emptyPosts, { borderColor: colors.border }]}>
          <Feather name="file-text" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No posts yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {isOwner ? "Start posting to share updates with your followers." : "This page hasn't posted anything yet."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 12 },
  content: { paddingBottom: 40 },
  coverArea: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 96, height: 96, borderRadius: 24, borderWidth: 3, borderColor: "#ffffff" },
  logoFallback: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  infoCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageName: { fontSize: 22, fontWeight: "700", flex: 1 },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeText: { fontSize: 12, fontWeight: "600" },
  description: { fontSize: 15, lineHeight: 22 },
  websiteRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  websiteText: { fontSize: 14, fontWeight: "500" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13 },
  stats: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 14,
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: 32 },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  followBtnText: { fontSize: 15, fontWeight: "700" },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  ownerBadgeText: { fontSize: 14, fontWeight: "600" },
  emptyPosts: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
