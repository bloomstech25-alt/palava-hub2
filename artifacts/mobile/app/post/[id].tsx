import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useFeed, type Comment } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";
import { formatRelativeTime } from "@/utils/time";
import { AudioPlayerInline, PostVideo } from "@/components/PostCard";
import { PalavaStar } from "@/components/PalavaStar";

export default function PostDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { posts, toggleLike, toggleFollow, getPostComments, addComment, subscribeToComments } = useFeed();

  const post = useMemo(() => posts.find((p) => p.id === id), [posts, id]);
  const comments = useMemo(() => getPostComments(id ?? ""), [getPostComments, id]);

  // Subscribe to real-time Firestore comments for this post
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToComments(id);
    return unsub;
  }, [id, subscribeToComments]);

  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleSendComment = () => {
    if (!comment.trim() || !user) return;
    setIsCommenting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment(id!, comment.trim(), user);
    setComment("");
    setIsCommenting(false);
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 60 }}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Post</Text>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
          ListHeaderComponent={
            <View>
              <View style={[styles.postContent, { borderBottomColor: colors.border }]}>
                <View style={styles.authorRow}>
                  <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
                  <View style={styles.authorInfo}>
                    <View style={styles.authorNameRow}>
                      <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
                      {post.author.verificationStatus === "approved" && <PalavaStar size={15} />}
                    </View>
                    <Text style={[styles.authorMeta, { color: colors.mutedForeground }]}>
                      @{post.author.username}{post.author.school?.name ? ` · ${post.author.school.name}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFollow(post.id)}
                    style={[
                      styles.followBtn,
                      { backgroundColor: post.isFollowing ? colors.muted : colors.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.followText, { color: post.isFollowing ? colors.mutedForeground : "#ffffff" }]}>
                      {post.isFollowing ? "Following" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {post.content ? (
                  <Text style={[styles.postText, { color: colors.foreground }]}>{post.content}</Text>
                ) : null}

                {post.mediaUri && post.mediaType === "image" && (
                  <Image
                    source={{ uri: post.mediaUri }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                )}

                {post.mediaUri && post.mediaType === "video" && (
                  <View style={{ marginTop: 14 }}>
                    <PostVideo uri={post.mediaUri} colors={colors} />
                  </View>
                )}

                {post.mediaUri && post.mediaType === "audio" && (
                  <View style={{ marginTop: 14 }}>
                    <AudioPlayerInline
                      uri={post.mediaUri}
                      durationSec={post.audioDurationSec}
                      colors={colors}
                    />
                  </View>
                )}

                {post.tags.length > 0 && (
                  <View style={styles.tags}>
                    {post.tags.map((t) => (
                      <View key={t} style={[styles.tagBadge, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.postTime, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(post.createdAt)}
                </Text>

                <View style={[styles.stats, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => { toggleLike(post.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={styles.statBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="heart" size={20} color={post.isLiked ? colors.like : colors.mutedForeground} />
                    <Text style={[styles.statText, { color: post.isLiked ? colors.like : colors.mutedForeground }]}>
                      {formatCount(post.likes)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.statBtn}>
                    <Feather name="message-circle" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                      {formatCount(post.comments)}
                    </Text>
                  </View>

                  <View style={styles.statBtn}>
                    <Feather name="repeat" size={20} color={colors.mutedForeground} />
                    <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                      {formatCount(post.shares)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.commentsHeader, { color: colors.mutedForeground }]}>
                {comments.length} COMMENT{comments.length !== 1 ? "S" : ""}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Comment }) => (
            <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
              <Image source={{ uri: item.author.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: colors.foreground }]}>{item.author.name}</Text>
                  <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.commentMeta, { color: colors.mutedForeground }]}>
                  @{item.author.username}
                </Text>
                <Text style={[styles.commentText, { color: colors.foreground }]}>{item.content}</Text>
                <TouchableOpacity style={styles.likeComment} activeOpacity={0.7}>
                  <Feather name="heart" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.likeCount, { color: colors.mutedForeground }]}>{item.likes}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.noComments}>
              <Text style={[styles.noCommentsText, { color: colors.mutedForeground }]}>
                No comments yet — be the first!
              </Text>
            </View>
          }
        />

        <View style={[styles.commentInput, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: bottomPad + 8 }]}>
          <Image source={{ uri: user?.avatar }} style={styles.inputAvatar} />
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Write a comment..."
              placeholderTextColor={colors.mutedForeground}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={300}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendComment}
            disabled={!comment.trim()}
            style={[styles.sendBtn, { backgroundColor: comment.trim() ? colors.primary : colors.muted }]}
            activeOpacity={0.8}
          >
            <Feather name="send" size={16} color={comment.trim() ? "#ffffff" : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    gap: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  postContent: { padding: 20, borderBottomWidth: 1 },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  authorInfo: { flex: 1 },
  authorNameRow: { flexDirection: "row", alignItems: "center" },
  authorName: { fontSize: 15, fontWeight: "700" },
  authorMeta: { fontSize: 12, marginTop: 2 },
  detailImage: { width: "100%", height: 260, borderRadius: 14, marginTop: 14 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  followText: { fontSize: 13, fontWeight: "600" },
  postText: { fontSize: 17, lineHeight: 26 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: "600" },
  postTime: { fontSize: 13, marginTop: 12 },
  stats: {
    flexDirection: "row",
    gap: 24,
    paddingVertical: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { fontSize: 14, fontWeight: "600" },
  commentsHeader: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 20, paddingVertical: 12 },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentAuthor: { fontSize: 14, fontWeight: "700" },
  commentTime: { fontSize: 12 },
  commentMeta: { fontSize: 12, marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  likeComment: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  likeCount: { fontSize: 12 },
  noComments: { padding: 30, alignItems: "center" },
  noCommentsText: { fontSize: 14 },
  commentInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  inputAvatar: { width: 36, height: 36, borderRadius: 18 },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  input: { fontSize: 14 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
