import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { PalavaStar } from "@/components/PalavaStar";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, followUser, unfollowUser, applyForVerification } = useAuth();
  const { posts, toggleLike, toggleFollow, deletePost } = useFeed();
  const params = useLocalSearchParams<{ userId?: string }>();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [applying, setApplying] = useState(false);

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
        <ThemedStatusBar />
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
      <ThemedStatusBar />

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
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/settings");
                  }}
                  style={styles.logoutBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="settings" size={20} color={colors.mutedForeground} />
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
                          school: profileUser.school?.name ?? "",
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

              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.foreground }]}>{profileUser.name}</Text>
                {profileUser.verificationStatus === "approved" && <PalavaStar size={22} />}
              </View>
              <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profileUser.username}</Text>

              {profileUser.school?.name ? (
                <View style={[styles.schoolBadge, { backgroundColor: colors.accent }]}>
                  <Feather name="book-open" size={13} color={colors.primary} />
                  <Text style={[styles.schoolText, { color: colors.primary }]}>{profileUser.school.name}</Text>
                  {profileUser.school.type ? (
                    <Text style={[styles.schoolType, { color: colors.mutedForeground }]}>
                      · {profileUser.school.type === "university" ? "University" : "High School"}
                    </Text>
                  ) : null}
                </View>
              ) : null}

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

            {/* Verification section — own profile only */}
            {isOwnProfile && (() => {
              const status = profileUser.verificationStatus ?? "none";
              if (status === "approved") return (
                <View style={[styles.verifyBox, { backgroundColor: "#D4A85518", borderColor: "#D4A855" }]}>
                  <PalavaStar size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verifyTitle, { color: "#D4A855" }]}>Palava Star Verified</Text>
                    <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>Your account is officially verified on Palava Hub</Text>
                  </View>
                </View>
              );
              if (status === "pending") return (
                <View style={[styles.verifyBox, { backgroundColor: colors.muted + "80", borderColor: colors.border }]}>
                  <Feather name="clock" size={20} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verifyTitle, { color: colors.foreground }]}>Verification Under Review</Text>
                    <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>Admin will review your application soon</Text>
                  </View>
                </View>
              );
              const canApply = (profileUser.followers ?? 0) >= 50;
              return (
                <TouchableOpacity
                  style={[styles.verifyBox, {
                    backgroundColor: canApply ? "#BF0A3010" : colors.muted + "40",
                    borderColor: canApply ? "#BF0A30" : colors.border,
                    opacity: applying ? 0.6 : 1,
                  }]}
                  activeOpacity={canApply ? 0.8 : 1}
                  disabled={!canApply || applying}
                  onPress={async () => {
                    if (!canApply) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setApplying(true);
                    const result = await applyForVerification();
                    setApplying(false);
                    if (result.success) {
                      Alert.alert("Application Submitted! 🌟", "We'll review your application and get back to you soon.");
                    } else if (result.error) {
                      Alert.alert("Not Eligible", result.error);
                    }
                  }}
                >
                  {applying
                    ? <ActivityIndicator size={20} color="#BF0A30" />
                    : <View style={styles.starIconBox}><PalavaStar size={20} /></View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verifyTitle, { color: canApply ? colors.foreground : colors.mutedForeground }]}>
                      {status === "rejected" ? "Re-apply for Palava Star" : "Apply for Palava Star"}
                    </Text>
                    <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
                      {canApply
                        ? "You're eligible! Tap to apply for verification"
                        : `Need ${50 - (profileUser.followers ?? 0)} more followers to apply`}
                    </Text>
                  </View>
                  {canApply && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
                </TouchableOpacity>
              );
            })()}

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

            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/my-ads");
                }}
                style={[styles.createPageBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.createPageIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="bar-chart-2" size={18} color={colors.primary} />
                </View>
                <View style={styles.createPageText}>
                  <Text style={[styles.createPageTitle, { color: colors.foreground }]}>My Ads & Insights</Text>
                  <Text style={[styles.createPageSub, { color: colors.mutedForeground }]}>Run ads and see views, clicks, and reach</Text>
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
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 20, fontWeight: "700" },
  username: { fontSize: 14, marginTop: 2 },
  verifyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  verifyTitle: { fontSize: 14, fontWeight: "700" },
  verifySub: { fontSize: 12, marginTop: 2 },
  starIconBox: { width: 20, height: 20 },
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
