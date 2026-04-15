import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useFeed, type Post } from "@/context/FeedContext";
import { formatRelativeTime } from "@/utils/time";

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onFollow: () => void;
  onPress?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function PostCard({ post, onLike, onFollow, onPress, onDelete, onShare }: PostCardProps) {
  const colors = useColors();
  const { user } = useAuth();
  const { addPost, sharePost } = useFeed();
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

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Share Post",
      "How would you like to share this?",
      [
        {
          text: "🔁 Repost on Palava Hub",
          onPress: handleRepost,
        },
        {
          text: "📤 Share to other apps",
          onPress: handleShareExternal,
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleRepost = async () => {
    if (!user) return;
    try {
      const repostContent = `🔁 Reposted from @${post.author.username}:\n\n${post.content}`;
      await addPost(repostContent, post.tags, user);
      sharePost(post.id);
      onShare?.();
      Alert.alert("Reposted!", "The post has been shared to your feed.");
    } catch {
      Alert.alert("Error", "Could not repost. Please try again.");
    }
  };

  const handleShareExternal = async () => {
    try {
      const message = post.content
        ? `${post.content}\n\n— ${post.author.name} on Palava Hub`
        : `Check out this post by ${post.author.name} on Palava Hub`;
      const result = await Share.share({ message });
      if (result.action === Share.sharedAction) {
        onShare?.();
      }
    } catch {
      // share cancelled or failed
    }
  };

  const handleImageLongPress = async (imageUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Image Options",
      "What would you like to do?",
      [
        {
          text: "💾 Save to Phone",
          onPress: () => saveImage(imageUri),
        },
        {
          text: "📤 Share Image",
          onPress: () => shareImage(imageUri),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const saveImage = async (uri: string) => {
    if (Platform.OS === "web") {
      Alert.alert("Not available", "Image saving is only available on the mobile app.");
      return;
    }
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission needed", "Please allow Palava Hub to save photos to your library.");
        return;
      }
      const filename = FileSystem.documentDirectory + `palavahub_${Date.now()}.jpg`;
      const download = await FileSystem.downloadAsync(uri, filename);
      await MediaLibrary.saveToLibraryAsync(download.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved! 🎉", "Image saved to your camera roll.");
    } catch {
      Alert.alert("Error", "Could not save image. Please try again.");
    }
  };

  const shareImage = async (uri: string) => {
    try {
      await Share.share({
        message: `Check out this post by ${post.author.name} on Palava Hub`,
        url: Platform.OS === "ios" ? uri : undefined,
      });
    } catch {
      // share cancelled
    }
  };

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: post.isPinned ? colors.primary : colors.border }]}
    >
      {post.isPinned && (
        <View style={[styles.pinnedBanner, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="bookmark" size={11} color={colors.primary} />
          <Text style={[styles.pinnedText, { color: colors.primary }]}>Pinned Post</Text>
        </View>
      )}
      <View style={styles.cardContent}>
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
          {onDelete ? (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.deleteBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={15} color="#ef4444" />
            </TouchableOpacity>
          ) : (
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
          )}
        </View>

        {post.content ? (
          <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
        ) : null}

        {/* Image with long-press options */}
        {post.mediaUri && post.mediaType === "image" && (
          <TouchableOpacity
            onPress={onPress}
            onLongPress={() => handleImageLongPress(post.mediaUri!)}
            delayLongPress={400}
            activeOpacity={0.95}
            style={styles.mediaWrap}
          >
            <Image source={{ uri: post.mediaUri }} style={styles.postImage} resizeMode="cover" />
            <View style={[styles.longPressHint, { backgroundColor: "rgba(0,0,0,0.0)" }]}>
            </View>
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

          <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={handleShare}>
            <Feather name="repeat" size={18} color={colors.mutedForeground} />
            <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
              {formatCount(post.shares)}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardContent: {
    padding: 16,
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
  },
  longPressHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
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
