import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  // Custom confirmation modal — Alert.alert is unreliable on react-native-web
  // and Apple App Store Guideline 5.1.1(v) explicitly requires a confirmation
  // step before account deletion, so we render our own cross-platform dialog.
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
});
