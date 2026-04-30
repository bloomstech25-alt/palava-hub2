import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  where,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface PalavaPost {
  id: string;
  text: string;
  schoolName: string;
  schoolType: "university" | "high_school";
  reactions: { wahala: number; funny: number; realTalk: number; spill: number };
  wahalaBy: string[];
  funnyBy: string[];
  realTalkBy: string[];
  spillBy: string[];
  createdAt: string;
  expiresAt: number;
}

const REACTION_CONFIG = [
  { key: "wahala", emoji: "🔥", label: "Wahala", color: "#f97316" },
  { key: "funny", emoji: "😂", label: "Funny", color: "#eab308" },
  { key: "realTalk", emoji: "💯", label: "Real Talk", color: "#22c55e" },
  { key: "spill", emoji: "🫣", label: "Spill More", color: "#a855f7" },
] as const;

function timeLeft(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function tsToMs(ts: any): number {
  if (!ts) return Date.now() + 86400000;
  if (ts?.toMillis) return ts.toMillis();
  if (ts?.seconds) return ts.seconds * 1000;
  return Date.now() + 86400000;
}

function tsToString(ts: any): string {
  const ms = tsToMs(ts);
  return new Date(ms).toISOString();
}

export default function PalavaRoomScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [posts, setPosts] = useState<PalavaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const cutoff = Timestamp.fromMillis(Date.now() - 86400000);
    const q = query(
      collection(db, "palavaroomPosts"),
      where("createdAt", ">=", cutoff),
      orderBy("createdAt", "desc"),
      limit(60)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched: PalavaPost[] = snap.docs.map((d) => {
        const data = d.data();
        const createdMs = tsToMs(data.createdAt);
        return {
          id: d.id,
          text: data.text ?? "",
          schoolName: data.schoolName ?? "A Liberian school",
          schoolType: data.schoolType ?? "university",
          reactions: {
            wahala: data.reactions?.wahala ?? 0,
            funny: data.reactions?.funny ?? 0,
            realTalk: data.reactions?.realTalk ?? 0,
            spill: data.reactions?.spill ?? 0,
          },
          wahalaBy: data.wahalaBy ?? [],
          funnyBy: data.funnyBy ?? [],
          realTalkBy: data.realTalkBy ?? [],
          spillBy: data.spillBy ?? [],
          createdAt: tsToString(data.createdAt),
          expiresAt: createdMs + 86400000,
        };
      });
      setPosts(fetched);
      setIsLoading(false);
      setRefreshing(false);
    }, () => {
      setIsLoading(false);
      setRefreshing(false);
    });

    return unsub;
  }, []);

  async function toggleReaction(postId: string, reactionKey: string) {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const byField = `${reactionKey}By`;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const alreadyReacted = (post as any)[byField]?.includes(user.id);
    const ref = doc(db, "palavaroomPosts", postId);
    try {
      await updateDoc(ref, {
        [`reactions.${reactionKey}`]: increment(alreadyReacted ? -1 : 1),
        [byField]: alreadyReacted ? arrayRemove(user.id) : arrayUnion(user.id),
      });
    } catch (err: any) {
      // Don't show a toast for every tap, but at least log so we can
      // diagnose the rare permission-denied / rule mismatch case.
      console.warn("[palava-room] reaction failed", {
        code: err?.code,
        message: err?.message,
        postId,
        reactionKey,
      });
    }
  }

  function renderPost({ item }: { item: PalavaPost }) {
    const schoolLabel = item.schoolType === "university"
      ? `A ${item.schoolName} student`
      : `A ${item.schoolName} student`;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.anonBadge, { backgroundColor: colors.muted }]}>
            <Text style={styles.anonEmoji}>🕶️</Text>
            <Text style={[styles.anonLabel, { color: colors.mutedForeground }]}>{schoolLabel}</Text>
          </View>
          <View style={[styles.timerBadge, { backgroundColor: colors.muted + "80" }]}>
            <Feather name="clock" size={10} color={colors.mutedForeground} />
            <Text style={[styles.timerText, { color: colors.mutedForeground }]}>
              {timeLeft(item.expiresAt)}
            </Text>
          </View>
        </View>

        <Text style={[styles.postText, { color: colors.foreground }]}>{item.text}</Text>

        <View style={styles.reactions}>
          {REACTION_CONFIG.map((r) => {
            const byField = `${r.key}By` as keyof PalavaPost;
            const reacted = user ? (item[byField] as string[]).includes(user.id) : false;
            const count = item.reactions[r.key];
            return (
              <TouchableOpacity
                key={r.key}
                style={[
                  styles.reactionBtn,
                  {
                    backgroundColor: reacted ? r.color + "25" : colors.muted,
                    borderColor: reacted ? r.color + "60" : colors.border,
                  },
                ]}
                onPress={() => toggleReaction(item.id, r.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                {count > 0 && (
                  <Text style={[styles.reactionCount, { color: reacted ? r.color : colors.mutedForeground }]}>
                    {count}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🔥</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Palava Room</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Anonymous · 24 hours</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/create-palava")}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>New Palava</Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer banner */}
      <View style={[styles.banner, { backgroundColor: "#7c3aed15", borderBottomColor: "#7c3aed20" }]}>
        <Text style={[styles.bannerText, { color: "#7c3aed" }]}>
          🕶️ Posts are 100% anonymous. Only your school is shown. They disappear after 24 hours.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🕶️</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No palava yet today</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Be the first to spill some tea. It's anonymous, no one will know!
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/create-palava")}
                activeOpacity={0.85}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Start the Palava 🔥</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 1 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { fontSize: 13, fontWeight: "700" },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  bannerText: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  list: { paddingTop: 10, paddingHorizontal: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  anonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  anonEmoji: { fontSize: 14 },
  anonLabel: { fontSize: 12, fontWeight: "600" },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerText: { fontSize: 11, fontWeight: "500" },
  postText: { fontSize: 16, lineHeight: 24, fontWeight: "400", marginBottom: 16 },
  reactions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  reactionEmoji: { fontSize: 15 },
  reactionCount: { fontSize: 13, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { paddingTop: 80, alignItems: "center", paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptySub: { fontSize: 14, lineHeight: 21, textAlign: "center" },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyBtnText: { fontSize: 15, fontWeight: "700" },
});
