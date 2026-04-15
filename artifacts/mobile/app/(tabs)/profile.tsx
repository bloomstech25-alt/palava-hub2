import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard } from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, followUser, unfollowUser } = useAuth();
  const { posts, toggleLike, toggleFollow, deletePost, sharePost } = useFeed();
  const params = useLocalSearchParams<{ userId?: string }>();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);

  const isViewingOther = !!params.userId && params.userId !== user?.id;

  useEffect(() => {
    if (!isViewingOther || !params.userId) { setOtherUser(null); return; }
    setOtherLoading(true);
    const unsub = onSnapshot(
      doc(db, "users", params.userId),
      (snap) => {
        if (snap.exists()) setOtherUser({ ...(snap.data() as User), id: snap.id });
        else setOtherUser(null);
        setOtherLoading(false);
      },
      () => { setOtherUser(null); setOtherLoading(false); }
    );
    return unsub;
  }, [params.userId, isViewingOther]);

  const profileUser = isViewingOther ? otherUser : user;

  const isOwnProfile = profileUser?.id === user?.id;

  const userPosts = useMemo(
    () => posts.filter((p) => p.author.id === profileUser?.id),
    [posts, profileUser]
  );

  if (isViewingOther && otherLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profileUser) return null;

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      <FlatList
        data={userPosts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={() => toggleLike(item.id)}
            onFollow={() => toggleFollow(item.id)}
            onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id } })}
            onDelete={isOwnProfile ? () => deletePost(item.id) : undefined}
            onShare={() => sharePost(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
              {!isOwnProfile && (
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                  <Feather name="arrow-left" size={22} color={colors.foreground} />
                </TouchableOpacity>
              )}
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                {isOwnProfile ? "Profile" : profileUser.name}
              </Text>
              {isOwnProfile && (
                <TouchableOpacity
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await logout();
                    router.replace("/welcome");
                  }}
                  style={styles.logoutBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="log-out" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.profileTop}>
                <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
                {!isOwnProfile ? (
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        {
                          backgroundColor: (user?.followingIds ?? []).includes(profileUser.id) ? colors.muted : colors.primary,
                          borderWidth: (user?.followingIds ?? []).includes(profileUser.id) ? 1 : 0,
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if ((user?.followingIds ?? []).includes(profileUser.id)) {
                          unfollowUser(profileUser.id);
                        } else {
                          followUser(profileUser.id);
                        }
                      }}
                    >
                      <Text style={[styles.actionBtnText, {
                        color: (user?.followingIds ?? []).includes(profileUser.id) ? colors.foreground : colors.primaryForeground
                      }]}>
                        {(user?.followingIds ?? []).includes(profileUser.id) ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                      activeOpacity={0.85}
                      onPress={() => router.push({
                        pathname: "/chat/[userId]",
                        params: {
                          userId: profileUser.id,
                          name: profileUser.name,
                          username: profileUser.username,
                          avatar: profileUser.avatar,
                          school: profileUser.school.name,
                        }
                      })}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Message</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/edit-profile");
                    }}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.name, { color: colors.foreground }]}>{profileUser.name}</Text>
              <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profileUser.username}</Text>

              <View style={[styles.schoolBadge, { backgroundColor: colors.accent }]}>
                <Feather name="book-open" size={13} color={colors.primary} />
                <Text style={[styles.schoolText, { color: colors.primary }]}>{profileUser.school.name}</Text>
                <Text style={[styles.schoolType, { color: colors.mutedForeground }]}>
                  · {profileUser.school.type === "university" ? "University" : "High School"}
                </Text>
              </View>

              {profileUser.bio ? (
                <Text style={[styles.bio, { color: colors.foreground }]}>{profileUser.bio}</Text>
              ) : null}

              <View style={[styles.stats, { borderTopColor: colors.border }]}>
                {[
                  { label: "Posts", value: userPosts.length || profileUser.posts },
                  { label: "Followers", value: profileUser.followers },
                  { label: "Following", value: profileUser.following },
                ].map((s) => (
                  <View key={s.label} style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCount(s.value)}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/create-page");
                }}
                style={[styles.createPageBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.createPageIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="flag" size={18} color={colors.primary} />
                </View>
                <View style={styles.createPageText}>
                  <Text style={[styles.createPageTitle, { color: colors.foreground }]}>Create a Page</Text>
                  <Text style={[styles.createPageSub, { color: colors.mutedForeground }]}>Start a business, club, or community page</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}

            <Text style={[styles.postsHeader, { color: colors.mutedForeground }]}>POSTS</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="file-text" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  logoutBtn: { padding: 4 },
  profileCard: {
    margin: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  profileActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" },
  name: { fontSize: 20, fontWeight: "700" },
  username: { fontSize: 14, marginTop: 2 },
  schoolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  schoolText: { fontSize: 13, fontWeight: "600" },
  schoolType: { fontSize: 12 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  stats: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 12 },
  postsHeader: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 20, paddingVertical: 10 },
  listContent: { paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14 },
  createPageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  createPageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createPageText: { flex: 1 },
  createPageTitle: { fontSize: 15, fontWeight: "600" },
  createPageSub: { fontSize: 12, marginTop: 2 },
});
