import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function AccountDeletionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function H({ children }: { children: React.ReactNode }) {
    return <Text style={[styles.h, { color: colors.foreground }]}>{children}</Text>;
  }
  function P({ children }: { children: React.ReactNode }) {
    return <Text style={[styles.p, { color: colors.foreground }]}>{children}</Text>;
  }
  function L({ children }: { children: React.ReactNode }) {
    return (
      <View style={styles.li}>
        <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
        <Text style={[styles.p, { color: colors.foreground, flex: 1, marginTop: 0 }]}>{children}</Text>
      </View>
    );
  }
  function Step({ n, children }: { n: number; children: React.ReactNode }) {
    return (
      <View style={styles.step}>
        <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: "700" }}>{n}</Text>
        </View>
        <Text style={[styles.p, { color: colors.foreground, flex: 1, marginTop: 0 }]}>{children}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Account Deletion</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Delete Your Account</Text>
        <P>
          You can permanently delete your Palava Hub account at any time. Deletion is immediate
          and cannot be undone.
        </P>

        <H>How to Delete Your Account</H>
        <Step n={1}>Open <Text style={{ fontWeight: "700" }}>Settings</Text> from the bottom nav or your profile</Step>
        <Step n={2}>Scroll to the <Text style={{ fontWeight: "700" }}>Account</Text> section</Step>
        <Step n={3}>Tap <Text style={{ fontWeight: "700" }}>Delete my account</Text></Step>
        <Step n={4}>Confirm by tapping <Text style={{ fontWeight: "700" }}>Delete</Text> in the dialog</Step>

        <H>What Gets Removed</H>
        <L>Your Firebase Authentication account and login credentials</L>
        <L>Your public profile (name, username, bio, avatar, school)</L>
        <L>All your posts, comments, and likes</L>
        <L>All direct messages you sent or received</L>
        <L>Any ads or Pages you created</L>
        <L>Support requests submitted under your account</L>
        <L>Your push notification token</L>
        <L>Profile photos and media in Firebase Storage</L>

        <H>What May Be Retained</H>
        <P>
          Anonymised data may be retained for up to 90 days for fraud prevention and legal
          compliance. This data cannot be linked back to your identity.
        </P>
        <P>
          Anonymous posts in the Palava Room are stored without any author identifier and cannot
          be deleted per individual account.
        </P>

        <H>Can't Access Your Account?</H>
        <P>
          If you cannot log in to delete your account, email us at support@palavahub.com with
          your registered email address. We will manually delete your account within 5 business days.
        </P>

        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: "#DC2626" }]}
          onPress={() => router.push("/settings")}
          activeOpacity={0.85}
        >
          <Feather name="trash-2" size={16} color="#fff" />
          <Text style={styles.deleteBtnText}>Go to Settings to delete</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
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
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 12 },
  h: { fontSize: 16, fontWeight: "700", marginTop: 22, marginBottom: 8 },
  p: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  li: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 6, paddingRight: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 10, paddingRight: 8 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0,
  },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 50, borderRadius: 14, marginTop: 28,
  },
  deleteBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
