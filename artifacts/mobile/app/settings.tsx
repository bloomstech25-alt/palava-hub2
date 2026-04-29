import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type RowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  iconColor?: string;
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/welcome");
        },
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(
      "Delete Account",
      "This permanently removes your profile, posts, and all data. This cannot be undone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete forever",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const res = await deleteAccount();
            setDeleting(false);
            if (res.success) {
              router.replace("/welcome");
            } else {
              Alert.alert("Could not delete", res.error ?? "Please try again later.");
            }
          },
        },
      ]
    );
  }

  function Row({ icon, label, description, onPress, destructive, iconColor }: RowProps) {
    const fg = destructive ? "#DC2626" : colors.foreground;
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBubble, { backgroundColor: destructive ? "#DC262615" : colors.accent }]}>
          <Feather name={icon} size={17} color={iconColor ?? (destructive ? "#DC2626" : colors.primary)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: fg }]}>{label}</Text>
          {description ? (
            <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Account */}
        {user ? (
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{(user.name || user.email).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>{user.name}</Text>
              <Text style={[styles.profileSchool, { color: colors.mutedForeground }]} numberOfLines={1}>
                {user.school?.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/edit-profile")}
              style={[styles.editBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.editBtnText, { color: colors.foreground }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Safety & Legal</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon="shield"
            label="Privacy Policy"
            description="How we collect, use, and protect your data"
            onPress={() => router.push("/legal/privacy")}
          />
          <Row
            icon="book-open"
            label="Community Guidelines"
            description="Rules that keep Palava Hub safe and respectful"
            onPress={() => router.push("/legal/guidelines")}
          />
          <Row
            icon="help-circle"
            label="Report & Help"
            description="Report a problem or get support"
            onPress={() => router.push("/legal/report-help")}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Your Activity</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="bar-chart-2" label="My Ads" description="View metrics for your ads and pages" onPress={() => router.push("/my-ads")} />
          <Row icon="globe" label="News Pages" description="Follow Liberian news, sports, and entertainment" onPress={() => router.push("/news")} />
          <Row icon="zap" label="Campus Jams" description="See what's happening on campus" onPress={() => router.push("/campus-jams")} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="log-out" label="Log out" onPress={handleLogout} />
          <Row
            icon="trash-2"
            label={deleting ? "Deleting…" : "Delete my account"}
            description="Permanently remove your profile and data"
            onPress={handleDelete}
            destructive
          />
        </View>

        <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>Palava Hub · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileSchool: { fontSize: 12, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, borderWidth: 1 },
  editBtnText: { fontSize: 13, fontWeight: "700" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 6,
  },
  section: { marginHorizontal: 14, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowDesc: { fontSize: 12, marginTop: 1, lineHeight: 16 },
  appVersion: { textAlign: "center", marginTop: 24, fontSize: 12 },
});
