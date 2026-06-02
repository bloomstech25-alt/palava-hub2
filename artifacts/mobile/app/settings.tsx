import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemePreference } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

type RowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
  iconColor?: string;
};

type ToggleRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout, deleteAccount, updateUser } = useAuth();
  const { preference, setPreference } = useTheme();

  // Default-on for every channel: missing field is treated as true so users
  // who haven't touched settings still get pushes after upgrading.
  const notif = user?.notifications ?? {};
  const messagesOn = notif.messages !== false;
  const likesOn = notif.likes !== false;
  const followsOn = notif.follows !== false;
  const commentsOn = notif.comments !== false;

  const setNotif = (key: "messages" | "likes" | "follows" | "comments") => (value: boolean) => {
    void updateUser({
      notifications: { ...(user?.notifications ?? {}), [key]: value },
    });
  };

  const themeOptions: { key: ThemePreference; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "light", label: "Light", icon: "sun" },
    { key: "dark", label: "Dark", icon: "moon" },
    { key: "system", label: "Auto", icon: "smartphone" },
  ];
  const [deleting, setDeleting] = useState(false);
  // Custom confirmation modal — Alert.alert is unreliable on react-native-web
  // and Apple App Store Guideline 5.1.1(v) explicitly requires a confirmation
  // step before account deletion, so we render our own cross-platform dialog.
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function performLogout() {
    await logout();
    router.replace("/welcome");
  }

  function handleLogout() {
    // Alert.alert is unreliable on react-native-web; use the browser confirm there.
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to log out?")) {
        void performLogout();
      }
      return;
    }
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: performLogout },
    ]);
  }

  function handleDelete() {
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    setConfirmDeleteOpen(false);
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.success) {
      router.replace("/welcome");
    } else {
      Alert.alert("Could not delete", res.error ?? "Please try again later.");
    }
  }

  function ToggleRow({ icon, label, description, value, onValueChange }: ToggleRowProps) {
    return (
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconBubble, { backgroundColor: colors.accent }]}>
          <Feather name={icon} size={17} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
          {description ? (
            <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#ffffff"
        />
      </View>
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
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          { paddingBottom: 40 },
          Platform.OS === "web" ? { maxWidth: 640, width: "100%", alignSelf: "center" as const } : null,
        ]}
      >
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

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Appearance</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, padding: 14 }]}>
          <Text style={[styles.appearanceLabel, { color: colors.foreground }]}>Theme</Text>
          <Text style={[styles.appearanceHint, { color: colors.mutedForeground }]}>
            Choose how Palava Hub looks on this device.
          </Text>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const active = preference === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themePill,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => void setPreference(opt.key)}
                  activeOpacity={0.85}
                >
                  <Feather
                    name={opt.icon}
                    size={15}
                    color={active ? "#ffffff" : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.themePillText,
                      { color: active ? "#ffffff" : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Notifications</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ToggleRow
            icon="message-circle"
            label="Messages"
            description="Push when someone sends you a message"
            value={messagesOn}
            onValueChange={setNotif("messages")}
          />
          <ToggleRow
            icon="heart"
            label="Likes"
            description="Push when someone likes your post"
            value={likesOn}
            onValueChange={setNotif("likes")}
          />
          <ToggleRow
            icon="user-plus"
            label="New followers"
            description="Push when someone follows you"
            value={followsOn}
            onValueChange={setNotif("follows")}
          />
          <ToggleRow
            icon="message-square"
            label="Comments"
            description="Push when someone comments on your post"
            value={commentsOn}
            onValueChange={setNotif("comments")}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Safety & Legal</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row
            icon="shield"
            label="Privacy Policy"
            description="How we collect, use, and protect your data"
            onPress={() => router.push("/legal/privacy")}
          />
          <Row
            icon="file-text"
            label="Terms of Service"
            description="Rules and conditions for using Palava Hub"
            onPress={() => router.push("/legal/terms")}
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
          <Row
            icon="trash-2"
            label="Account Deletion"
            description="How to permanently delete your account and data"
            onPress={() => router.push("/legal/account-deletion")}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Your Activity</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="bar-chart-2" label="My Ads" description="View metrics for your ads and pages" onPress={() => router.push("/my-ads")} />
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

      <Modal
        visible={confirmDeleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            testID="confirm-delete-dialog"
          >
            <View style={[styles.modalIconBubble, { backgroundColor: "#DC262615" }]}>
              <Feather name="alert-triangle" size={26} color="#DC2626" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Delete your account?
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              This permanently removes your profile, posts, comments, messages, and all other data
              from Palava Hub. This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGhost, { borderColor: colors.border }]}
                onPress={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                testID="cancel-delete"
              >
                <Text style={[styles.modalBtnGhostText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={confirmDelete}
                disabled={deleting}
                testID="confirm-delete"
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Delete forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  modalIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  modalBody: { fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 18 },
  modalActions: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  modalBtnGhost: { borderWidth: 1, backgroundColor: "transparent" },
  modalBtnGhostText: { fontSize: 14, fontWeight: "600" },
  modalBtnDanger: { backgroundColor: "#DC2626" },
  modalBtnDangerText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  appearanceLabel: { fontSize: 14, fontWeight: "700" },
  appearanceHint: { fontSize: 12, marginTop: 4, marginBottom: 12 },
  themeRow: { flexDirection: "row", gap: 8 },
  themePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themePillText: { fontSize: 13, fontWeight: "600" },
});
