import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawer } from "@/context/DrawerContext";
import { useAuth } from "@/context/AuthContext";
import { useFeed } from "@/context/FeedContext";
import { useMessaging } from "@/context/MessagingContext";
import { useColors } from "@/hooks/useColors";

type Item = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  badge?: number;
  href?: string;
  onPress?: () => void;
  destructive?: boolean;
  tint?: string;
};

export function DrawerMenu() {
  const { isOpen, close } = useDrawer();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const drawerWidth = Math.min(320, Math.round(screenW * 0.85));

  const { user, logout } = useAuth();
  const { unreadCount } = useFeed();
  const { totalUnread: msgUnread } = useMessaging();

  const slide = useRef(new Animated.Value(-drawerWidth)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: isOpen ? 0 : -drawerWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, drawerWidth, slide, fade]);

  // Don't render the (heavy) overlay tree at all when closed
  // and the slide animation has settled. Also hidden on web — the sidebar
  // already exposes everything.
  const [shouldRender, setShouldRender] = React.useState(false);
  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else {
      const t = setTimeout(() => setShouldRender(false), 240);
      return () => clearTimeout(t);
    }
  }, [isOpen]);
  if (!shouldRender || Platform.OS === "web") return null;

  const go = (href: string) => {
    close();
    setTimeout(() => router.push(href as never), 80);
  };

  const handleLogout = async () => {
    close();
    setTimeout(async () => {
      await logout();
      router.replace("/welcome");
    }, 80);
  };

  const items: Item[] = [
    { icon: "bell", label: "Activity", badge: unreadCount, href: "/(tabs)/notifications" },
    { icon: "message-circle", label: "Messages", badge: msgUnread, href: "/(tabs)/messages" },
    { icon: "flag", label: "Pages", href: "/(tabs)/pages" },
    { icon: "music", label: "Campus Jams", href: "/campus-jams" },
    { icon: "video", label: "Go Live", href: "/go-live", tint: "#ef4444" },
    { icon: "bar-chart-2", label: "My Ads", href: "/my-ads" },
    { icon: "settings", label: "Settings", href: "/settings" },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? "auto" : "none"}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: drawerWidth,
            backgroundColor: colors.background,
            borderRightColor: colors.border,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: slide }],
          },
        ]}
      >
        {/* Profile header */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => go("/(tabs)/profile")}
          style={[styles.profileRow, { borderBottomColor: colors.border }]}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: colors.primaryForeground, fontWeight: "800", fontSize: 18 }}>
                {(user?.name?.[0] ?? "?").toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {user?.name ?? "Guest"}
            </Text>
            <Text style={[styles.handle, { color: colors.mutedForeground }]} numberOfLines={1}>
              {user?.username ? `@${user.username}` : "View profile"}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingTop: 6 }} showsVerticalScrollIndicator={false}>
          {items.map((it) => (
            <TouchableOpacity
              key={it.label}
              activeOpacity={0.7}
              onPress={() => (it.href ? go(it.href) : it.onPress?.())}
              style={styles.row}
            >
              <View style={[styles.iconWrap, { backgroundColor: (it.tint ?? colors.primary) + "18" }]}>
                <Feather name={it.icon} size={18} color={it.tint ?? colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{it.label}</Text>
              {it.badge && it.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                    {it.badge > 99 ? "99+" : it.badge}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.destructive + "18" }]}>
              <Feather name="log-out" size={18} color={colors.destructive} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.destructive }]}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/** Hamburger button to drop into screen headers. */
export function DrawerButton({ tint }: { tint?: string }) {
  const { open } = useDrawer();
  const colors = useColors();
  const { unreadCount } = useFeed();
  const { totalUnread: msgUnread } = useMessaging();
  if (Platform.OS === "web") return null;
  const total = (unreadCount ?? 0) + (msgUnread ?? 0);
  return (
    <TouchableOpacity onPress={open} activeOpacity={0.7} style={styles.hamburger} hitSlop={8}>
      <Feather name="menu" size={24} color={tint ?? colors.foreground} />
      {total > 0 ? <View style={[styles.hamburgerDot, { backgroundColor: colors.primary }]} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  name: { fontSize: 16, fontWeight: "700" },
  handle: { fontSize: 13, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  divider: { height: 1, marginVertical: 10, marginHorizontal: 16 },
  hamburger: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  hamburgerDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },
});
