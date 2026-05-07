import { Feather } from "@expo/vector-icons";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useEffect } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeed, type Notification } from "@/context/FeedContext";
import { useColors } from "@/hooks/useColors";
import { formatRelativeTime } from "@/utils/time";
import { Avatar } from "@/components/Avatar";

const ICON_MAP: Record<Notification["type"], { name: string; color: string; bg: string }> = {
  like: { name: "heart", color: "#ef4444", bg: "#fef2f2" },
  comment: { name: "message-circle", color: "#3b82f6", bg: "#eff6ff" },
  follow: { name: "user-plus", color: "#10b981", bg: "#f0fdf4" },
  mention: { name: "at-sign", color: "#f59e0b", bg: "#fffbeb" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { notifications, markNotificationsRead } = useFeed();

  useEffect(() => {
    const timer = setTimeout(markNotificationsRead, 1500);
    return () => clearTimeout(timer);
  }, [markNotificationsRead]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = ICON_MAP[item.type];
          return (
            <View
              style={[
                styles.notifItem,
                {
                  backgroundColor: item.isRead ? colors.background : colors.accent,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.avatarWrap}>
                <Avatar uri={item.actor.avatar} name={item.actor.name} style={styles.avatar} />
                <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
                  <Feather name={meta.name as any} size={11} color={meta.color} />
                </View>
              </View>
              <View style={styles.notifText}>
                <Text style={[styles.notifMain, { color: colors.foreground }]}>
                  <Text style={{ fontWeight: "700" }}>{item.actor.name}</Text>
                  {" "}{item.message}
                </Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {formatRelativeTime(item.createdAt)}
                </Text>
              </View>
              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No notifications</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>When someone interacts with you, you'll see it here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, paddingTop: 8 },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  typeIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  notifText: { flex: 1 },
  notifMain: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 12, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
