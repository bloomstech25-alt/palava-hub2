import { Feather } from "@expo/vector-icons";
import { PalavaStar } from "@/components/PalavaStar";
import { ReportModal } from "@/components/ReportModal";
import { Audio, ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { Avatar } from "@/components/Avatar";

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
  const { user, blockUser } = useAuth();
  const { toggleRepost } = useFeed();
  const [likeAnimating, setLikeAnimating] = useState(false);
  // Post options menu (3-dot) — replaces the standalone Follow/Delete buttons.
  // Houses Apple-required Report and Block actions for any non-owned post.
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwnPost = !!user && user.id === post.author.id;

  function openMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(true);
  }

  function handleReport() {
    setMenuOpen(false);
    // Small delay so the menu close animation finishes before the report
    // modal opens — prevents nested modals flickering on web.
    setTimeout(() => setReportOpen(true), 120);
  }

  function handleBlock() {
    setMenuOpen(false);
    Alert.alert(
      `Block @${post.author.username}?`,
      "You will no longer see their posts or messages. They will not be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            const result = await blockUser(post.author.id);
            if (!result.success) {
              Alert.alert("Could not block", result.error ?? "Please try again.");
            }
          },
        },
      ],
    );
  }

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

  // Twitter-style retweet: tap toggles the repost state (icon turns green
  // when active, gray when not). No quote-tweet behavior, no Alert prompt.
  // External "share to other apps" lives in the 3-dot menu instead.
  const handleRepost = () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepost(post.id);
    // NB: do not call onShare?.() here — toggleRepost already updates the
    // shares counter atomically. Calling onShare would double-count.
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
        Alert.alert("Allow photo access to save images.");
        return;
      }
      const filename = FileSystem.documentDirectory + `palavahub_${Date.now()}.jpg`;
      const download = await FileSystem.downloadAsync(uri, filename);
      await MediaLibrary.saveToLibraryAsync(download.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved! 🎉", "Image saved to your camera roll.");
    } catch {
      Alert.alert("Couldn't save image.");
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
            <Avatar uri={post.author.avatar} name={post.author.name} style={styles.avatar} />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={[styles.authorName, { color: colors.foreground }]}>{post.author.name}</Text>
                {post.author.verificationStatus === "approved" && <PalavaStar size={15} />}
              </View>
              <Text style={[styles.authorMeta, { color: colors.mutedForeground }]}>
                @{post.author.username}{post.author.school?.name ? ` · ${post.author.school.name}` : ""}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            {!isOwnPost && (
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
            <TouchableOpacity
              onPress={openMenu}
              style={[styles.menuBtn, { backgroundColor: colors.muted }]}
              activeOpacity={0.7}
              testID={`post-menu-${post.id}`}
              accessibilityLabel="Post options"
            >
              <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {post.content ? (
          <Text style={[styles.content, { color: colors.foreground }]}>{post.content}</Text>
        ) : null}

        {/* Image with long-press options */}
        {post.mediaUri && post.mediaType === "image" && (
          <TouchableOpacity
            onPress={() => {
              const u = post.mediaUri!;
              // Firebase Storage URLs (with ?alt=media&token=...) get mangled
              // by expo-router params; send a base64 copy as a safe channel.
              const b64 = btoa(unescape(encodeURIComponent(u)));
              router.push({ pathname: "/image-viewer", params: { uri: u, b64 } });
            }}
            onLongPress={() => handleImageLongPress(post.mediaUri!)}
            delayLongPress={400}
            activeOpacity={0.95}
            style={styles.mediaWrap}
          >
            <PostImage uri={post.mediaUri} colors={colors} />
            <View style={[styles.longPressHint, { backgroundColor: "rgba(0,0,0,0.0)" }]}>
            </View>
          </TouchableOpacity>
        )}

        {post.mediaUri && post.mediaType === "video" && (
          <PostVideo uri={post.mediaUri} colors={colors} />
        )}

        {post.mediaUri && post.mediaType === "audio" && (
          <AudioPlayerInline
            uri={post.mediaUri}
            durationSec={post.audioDurationSec}
            colors={colors}
          />
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

          <TouchableOpacity style={styles.action} activeOpacity={0.7} onPress={handleRepost} testID={`repost-${post.id}`}>
            <Feather
              name="repeat"
              size={18}
              color={post.isReposted ? "#17BF63" : colors.mutedForeground}
            />
            <Text style={[styles.actionCount, { color: post.isReposted ? "#17BF63" : colors.mutedForeground }]}>
              {formatCount(post.shares)}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>

      {/* Post options bottom sheet — replaces native ActionSheet so it works
          on web preview AND native, satisfying Apple Guideline 1.2 (must
          provide report + block on every UGC item). */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={menuStyles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[menuStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
            testID={`post-menu-sheet-${post.id}`}
          >
            <View style={menuStyles.handle} />
            {!isOwnPost && (
              <>
                <TouchableOpacity
                  style={menuStyles.row}
                  onPress={handleReport}
                  activeOpacity={0.7}
                  testID="menu-report"
                >
                  <Feather name="flag" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[menuStyles.rowTitle, { color: "#DC2626" }]}>Report post</Text>
                    <Text style={[menuStyles.rowSub, { color: colors.mutedForeground }]}>
                      Tell us if this breaks our rules
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={menuStyles.row}
                  onPress={handleBlock}
                  activeOpacity={0.7}
                  testID="menu-block"
                >
                  <Feather name="user-x" size={18} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={[menuStyles.rowTitle, { color: "#DC2626" }]}>
                      Block @{post.author.username}
                    </Text>
                    <Text style={[menuStyles.rowSub, { color: colors.mutedForeground }]}>
                      Hide their posts and messages
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={menuStyles.row}
              onPress={() => {
                setMenuOpen(false);
                setTimeout(handleShareExternal, 120);
              }}
              activeOpacity={0.7}
              testID="menu-share-external"
            >
              <Feather name="share" size={18} color={colors.foreground} />
              <View style={{ flex: 1 }}>
                <Text style={[menuStyles.rowTitle, { color: colors.foreground }]}>Share to other apps</Text>
                <Text style={[menuStyles.rowSub, { color: colors.mutedForeground }]}>
                  Send via WhatsApp, SMS, email, etc.
                </Text>
              </View>
            </TouchableOpacity>
            {onDelete && (
              <TouchableOpacity
                style={menuStyles.row}
                onPress={() => {
                  setMenuOpen(false);
                  setTimeout(handleDelete, 120);
                }}
                activeOpacity={0.7}
                testID="menu-delete"
              >
                <Feather name="trash-2" size={18} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={[menuStyles.rowTitle, { color: "#DC2626" }]}>Delete post</Text>
                  <Text style={[menuStyles.rowSub, { color: colors.mutedForeground }]}>
                    Permanently remove this post
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[menuStyles.row, menuStyles.cancel, { borderTopColor: colors.border }]}
              onPress={() => setMenuOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={[menuStyles.cancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ReportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetUserId={post.author.id}
      />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 28,
    paddingTop: 6,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(150,150,150,0.5)",
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 1 },
  cancel: {
    justifyContent: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
});

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
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
  },
  authorMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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

// ─── Inline audio player used by audio posts ─────────────────────────────────
export function AudioPlayerInline({
  uri,
  durationSec,
  colors,
}: {
  uri: string;
  durationSec?: number;
  colors: ReturnType<typeof useColors>;
}) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [total, setTotal] = useState(durationSec ?? 0);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  async function toggle() {
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.durationMillis) setTotal(Math.round(status.durationMillis / 1000));
          setPosition(Math.round((status.positionMillis ?? 0) / 1000));
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            sound.setPositionAsync(0).catch(() => {});
          }
        });
        setIsPlaying(true);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      Alert.alert("Playback failed", "Could not play this audio clip.");
    }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  const pct = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  return (
    <View style={[audioStyles.wrap, { backgroundColor: colors.accent, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={toggle}
        style={[audioStyles.playBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Feather name={isPlaying ? "pause" : "play"} size={16} color={colors.primaryForeground} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={[audioStyles.bar, { backgroundColor: colors.border }]}>
          <View style={[audioStyles.barFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
        </View>
        <View style={audioStyles.metaRow}>
          <Feather name="mic" size={11} color={colors.primary} />
          <Text style={[audioStyles.metaText, { color: colors.primary }]}>
            Audio clip · {fmt(total || 0)}
          </Text>
          <Text style={[audioStyles.metaText, { color: colors.mutedForeground, marginLeft: "auto" }]}>
            {fmt(position)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Inline post video — preserves natural aspect ratio so vertical phone
// videos don't get letterboxed inside a fixed landscape frame ────────────────
// Twitter-style image tile: shows a centered spinner over a muted placeholder
// until the image bytes finish downloading, then fades the photo in.
export function PostImage({
  uri,
  colors,
}: {
  uri: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={[styles.postImage, { backgroundColor: colors.muted, overflow: "hidden" }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={mediaLoaderStyles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

export function PostVideo({
  uri,
  colors,
}: {
  uri: string;
  colors: ReturnType<typeof useColors>;
}) {
  // Default to a friendly landscape until the video reports its real size,
  // then snap to whatever the source actually is (e.g. 9/16 for portrait).
  const [aspect, setAspect] = useState<number>(16 / 9);
  const [loading, setLoading] = useState(true);
  return (
    <View
      style={[
        videoStyles.wrap,
        { aspectRatio: aspect, backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <Video
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        isLooping={false}
        shouldPlay={false}
        onLoadStart={() => setLoading(true)}
        onReadyForDisplay={(e: any) => {
          setLoading(false);
          const w = e?.naturalSize?.width;
          const h = e?.naturalSize?.height;
          if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
            // Clamp extreme ratios so a 21:9 cinema clip still fits a phone
            // screen, and a hyper-tall portrait doesn't blow out the feed.
            const ratio = Math.min(Math.max(w / h, 0.5), 2.0);
            setAspect(ratio);
          }
        }}
      />
      {loading && (
        <View style={mediaLoaderStyles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const mediaLoaderStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

const videoStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    position: "relative",
  },
});

const audioStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 6,
  },
  playBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  bar: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  metaText: { fontSize: 11, fontWeight: "600" },
});
