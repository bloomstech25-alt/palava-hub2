import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Post } from "@/context/FeedContext";
import { formatRelativeTime } from "@/utils/time";

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onFollow: () => void;
  onPress?: () => void;
}

export function PostCard({ post, onLike, onFollow, onPress }: PostCardProps) {
  const colors = useColors();
  const [likeAnimating, setLikeAnimating] = useState(false);

  const handleLike = () => {
    setLikeAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike();
    setTimeout(() => setLikeAnimating(false), 300);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFollow();
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/(tabs)/profile", params: { userId: post.author.id } })}
          style={styles.authorRow}
          activeOpacity={0.7}
        >
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
            <Text style={[styles.authorMeta, { color: colors.mutedForeground }]}>
              @{post.author.username} · {post.author.school.name}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleFollow}
          style={[
            styles.followBtn,
            {
              backgroundColor: post.isFollowing ? colors.muted : colors.primary,
              borderColor: post.isFollowing ? colors.border : colors.primary,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.followText, { color: post.isFollowing ? colors.mutedForeground : colors.primaryForeground }]}>
            {post.isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      {post.content ? (
        <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
      ) : null}

      {/* Media display */}
      {post.mediaUri && post.mediaType === "image" && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={styles.mediaWrap}>
          <Image source={{ uri: post.mediaUri }} style={styles.postImage} resizeMode="cover" />
        </TouchableOpacity>
      )}

      {post.mediaUri && post.mediaType === "video" && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.videoThumb, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
            <Feather name="play" size={22} color="#ffffff" />
          </View>
          <View style={[styles.videoBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            <Feather name="film" size={11} color="#ffffff" />
            <Text style={styles.videoBadgeText}>Video</Text>
          </View>
        </TouchableOpacity>
      )}

      {post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.accent }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleLike} style={styles.action} activeOpacity={0.7}>
          <Feather
            name="heart"
            size={18}
            color={post.isLiked ? colors.like : colors.mutedForeground}
            style={{ opacity: likeAnimating ? 0.6 : 1 }}
          />
          <Text style={[styles.actionCount, { color: post.isLiked ? colors.like : colors.mutedForeground }]}>
            {formatCount(post.likes)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPress}
          style={styles.action}
          activeOpacity={0.7}
        >
          <Feather name="message-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {formatCount(post.comments)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} activeOpacity={0.7}>
          <Feather name="repeat" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {formatCount(post.shares)}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatRelativeTime(post.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
  },
  authorMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 8,
  },
  followText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
  },
  videoThumb: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 20,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: "500",
  },
  time: {
    fontSize: 12,
    marginLeft: "auto",
  },
});
