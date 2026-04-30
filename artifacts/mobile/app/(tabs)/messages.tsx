import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useState, useMemo, useEffect } from "react";
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
import { collection, getDocs, limit, orderBy, query as firestoreQuery } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useColors } from "@/hooks/useColors";
import { useMessaging, type Conversation } from "@/context/MessagingContext";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";
import { normalizeUser } from "@/utils/normalizeUser";
import { formatRelativeTime } from "@/utils/time";

// Discriminated union so a single FlatList can render both conversation
// rows (already-talking-to) and suggestion rows (new people you can
// message). Using one list is what fixes the previous "screen freezes
// when the new-conversation panel is open" bug — the old version
// rendered up to 60 suggestion users in a non-scrollable <View> which
// overflowed the screen and blocked the conversation list below.
type Row =
  | { kind: "header"; id: string; label: string }
  | { kind: "conversation"; id: string; conv: Conversation }
  | { kind: "suggestion"; id: string; user: User };

export default function MessagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { conversations, totalUnread } = useMessaging();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Lazy-fetch the global user list the first time the user either taps
  // "new message" OR types in the search bar. We pre-load on search so
  // results across all students appear immediately as they type, not
  // only after they tap the edit button.
  useEffect(() => {
    if (allUsers.length > 0) return;
    if (!showNew && !isSearching) return;
    setUsersLoading(true);
    const q = firestoreQuery(collection(db, "users"), orderBy("name", "asc"), limit(60));
    getDocs(q)
      .then((snap) => {
        const fetched = snap.docs
          .map((d) => normalizeUser(d.data(), d.id))
          .filter((u) => u.id !== user?.id);
        setAllUsers(fetched);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [showNew, isSearching, allUsers.length, user?.id]);

  const filteredConversations = useMemo(() => {
    if (!isSearching) return conversations;
    return conversations.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(trimmedQuery) ||
        (c.username ?? "").toLowerCase().includes(trimmedQuery) ||
        (c.school ?? "").toLowerCase().includes(trimmedQuery),
    );
  }, [conversations, isSearching, trimmedQuery]);

  const filteredSuggestions = useMemo(() => {
    const base = allUsers.filter((u) => !conversations.find((c) => c.userId === u.id));
    if (!isSearching) return base;
    return base.filter(
      (u) =>
        u.name?.toLowerCase().includes(trimmedQuery) ||
        u.username?.toLowerCase().includes(trimmedQuery) ||
        u.school?.name?.toLowerCase().includes(trimmedQuery),
    );
  }, [allUsers, conversations, isSearching, trimmedQuery]);

  // Build a single, fully scrollable list:
  //   [conversations] -> "START A CONVERSATION" header -> [suggestions]
  // Suggestions show whenever `showNew` is on OR the user is searching.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const conv of filteredConversations) {
      out.push({ kind: "conversation", id: `c:${conv.userId}`, conv });
    }
    const showSuggestions = showNew || isSearching;
    if (showSuggestions) {
      out.push({ kind: "header", id: "h:suggestions", label: "START A CONVERSATION" });
      for (const u of filteredSuggestions) {
        out.push({ kind: "suggestion", id: `s:${u.id}`, user: u });
      }
    }
    return out;
  }, [filteredConversations, filteredSuggestions, showNew, isSearching]);

  function openChat(c: Conversation) {
    router.push({
      pathname: "/chat/[userId]",
      params: {
        userId: c.userId,
        name: c.name,
        username: c.username,
        avatar: c.avatar,
        school: c.school,
      },
    });
  }

  function startNewChat(userId: string, name: string, username: string, avatar: string, school: string) {
    setShowNew(false);
    setQuery("");
    router.push({ pathname: "/chat/[userId]", params: { userId, name, username, avatar, school } });
  }

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === "header") {
      return (
        <View style={styles.suggestionsHeader}>
          <Text style={[styles.suggestionsHeaderText, { color: colors.mutedForeground }]}>{item.label}</Text>
          {usersLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      );
    }
    if (item.kind === "conversation") {
      const conv = item.conv;
      return (
        <TouchableOpacity
          style={[styles.convRow, { borderBottomColor: colors.border }]}
          onPress={() => openChat(conv)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrap}>
            <Image source={{ uri: conv.avatar }} style={styles.convAvatar} />
            <View style={[styles.onlineDot, { backgroundColor: "#22c55e", borderColor: colors.background }]} />
          </View>
          <View style={styles.convInfo}>
            <View style={styles.convTopRow}>
              <Text style={[styles.convName, { color: colors.foreground }, conv.unread > 0 && styles.convNameBold]}>
                {conv.name}
              </Text>
              <Text style={[styles.convTime, { color: colors.mutedForeground }]}>
                {formatRelativeTime(conv.lastAt)}
              </Text>
            </View>
            <View style={styles.convBottomRow}>
              <Text
                style={[styles.convLast, { color: conv.unread > 0 ? colors.foreground : colors.mutedForeground }]}
                numberOfLines={1}
              >
                {conv.lastMessage}
              </Text>
              {conv.unread > 0 && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadDotText}>{conv.unread}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.convSchool, { color: colors.mutedForeground }]}>{conv.school}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    // suggestion
    const u = item.user;
    return (
      <TouchableOpacity
        style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() => startNewChat(u.id, u.name, u.username, u.avatar, u.school?.name ?? "")}
      >
        {u.avatar ? (
          <Image source={{ uri: u.avatar }} style={styles.suggestionAvatar} />
        ) : (
          <View style={[styles.suggestionAvatar, styles.suggestionAvatarFallback, { backgroundColor: colors.primary }]}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>{u.name?.[0]?.toUpperCase() ?? "?"}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.suggestionName, { color: colors.foreground }]}>{u.name}</Text>
          <Text style={[styles.suggestionMeta, { color: colors.mutedForeground }]}>
            @{u.username}{u.school?.name ? ` · ${u.school.name}` : ""}
          </Text>
        </View>
        <View style={[styles.messageIcon, { backgroundColor: colors.accent }]}>
          <Feather name="message-circle" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const showSuggestionsSection = showNew || isSearching;
  const noConversations = filteredConversations.length === 0;
  const noSuggestions = filteredSuggestions.length === 0;
  const fullyEmpty =
    noConversations &&
    (!showSuggestionsSection || (noSuggestions && !usersLoading));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />

      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => setShowNew(!showNew)}
            style={[styles.newBtn, { backgroundColor: showNew ? colors.primary : colors.accent }]}
            activeOpacity={0.8}
          >
            <Feather name={showNew ? "x" : "edit"} size={16} color={showNew ? "#ffffff" : colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search messages or students..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={renderRow}
        ListEmptyComponent={
          fullyEmpty ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                <Feather name={isSearching ? "search" : "message-circle"} size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {isSearching ? "No matches" : "No messages yet"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {isSearching
                  ? "Try a different name, username, or school."
                  : "Tap the edit icon above to start a conversation with a fellow student."}
              </Text>
            </View>
          ) : null
        }
      />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, flex: 1 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 15 },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  suggestionsHeaderText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionAvatar: { width: 42, height: 42, borderRadius: 21 },
  suggestionAvatarFallback: { alignItems: "center", justifyContent: "center" },
  suggestionName: { fontSize: 14, fontWeight: "600" },
  suggestionMeta: { fontSize: 12, marginTop: 1 },
  messageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { paddingBottom: 100 },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  convAvatar: { width: 52, height: 52, borderRadius: 26 },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  convInfo: { flex: 1, gap: 3 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convName: { fontSize: 15, fontWeight: "500" },
  convNameBold: { fontWeight: "700" },
  convTime: { fontSize: 12 },
  convBottomRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  convLast: { fontSize: 13, flex: 1 },
  convSchool: { fontSize: 11 },
  unreadDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadDotText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 40, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
