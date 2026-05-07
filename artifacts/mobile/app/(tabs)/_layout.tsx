import { BlurView } from "expo-blur";
import { router, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useFeed } from "@/context/FeedContext";
import { useMessaging } from "@/context/MessagingContext";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { isAuthenticated, isLoading } = useAuth();
  const { unreadCount } = useFeed();
  const { totalUnread: msgUnread } = useMessaging();

  // Redirect to welcome if user logs out
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/welcome");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        ...(isWeb
          ? {
              tabBarPosition: "left" as const,
              tabBarVariant: "material" as const,
              tabBarLabelPosition: "beside-icon" as const,
              tabBarStyle: {
                backgroundColor: colors.background,
                borderRightWidth: 1,
                borderRightColor: colors.border,
                borderTopWidth: 0,
                width: 240,
                paddingTop: 24,
              },
              tabBarItemStyle: {
                borderRadius: 12,
                marginHorizontal: 12,
                marginVertical: 2,
                height: 48,
                justifyContent: "flex-start" as const,
              },
              tabBarLabelStyle: {
                fontSize: 15,
                fontWeight: "600" as const,
                marginLeft: 12,
              },
            }
          : {
              tabBarStyle: {
                position: "absolute" as const,
                backgroundColor: isIOS ? "transparent" : colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                elevation: 0,
                height: 62,
              },
              tabBarBackground: () =>
                isIOS ? (
                  <BlurView
                    intensity={100}
                    tint={isDark ? "dark" : "light"}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
                ),
              tabBarLabelStyle: { fontSize: 11, fontWeight: "600" as const, marginBottom: 4 },
            }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="magnifyingglass" tintColor={color} size={24} />
            ) : (
              <Feather name="search" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="palava-room"
        options={{
          title: "Palava",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>🔥</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Activity",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "bell.fill" : "bell"} tintColor={color} size={24} />
            ) : (
              <Feather name="bell" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="pages"
        options={{
          title: "Pages",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "flag.fill" : "flag"} tintColor={color} size={24} />
            ) : (
              <Feather name="flag" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: msgUnread > 0 ? msgUnread : undefined,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "message.fill" : "message"} tintColor={color} size={24} />
            ) : (
              <Feather name="message-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace("/(tabs)/profile");
          },
        }}
      />
    </Tabs>
  );
}
