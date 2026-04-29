import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicyScreen() {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Palava Hub Privacy Policy</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Effective Date: May 4, 2026</Text>

        <P>
          Palava Hub ("we", "our", "us") respects your privacy. This policy explains how we collect, use,
          and protect your information when you use our mobile and web services.
        </P>

        <H>1. Information We Collect</H>
        <L>Email address (for account creation)</L>
        <L>Phone number (when you choose phone sign-up)</L>
        <L>School selection (to connect users with their campus community)</L>
        <L>User-generated content (posts, comments, Palava posts, photos, videos, audio)</L>
        <L>Device and usage data (device type, OS, crash logs, in-app actions)</L>

        <H>2. How We Use Information</H>
        <L>To create and manage your account</L>
        <L>To connect you with your school community</L>
        <L>To deliver, personalize, and improve the user experience</L>
        <L>To ensure safety, prevent abuse, and enforce our Community Guidelines</L>

        <H>3. Anonymous Posting (Palava Feature)</H>
        <P>
          Posts made in the "Palava" section are anonymous to other users. We may internally link activity
          to accounts to enforce safety and prevent misuse, but this internal linkage is never exposed to
          other users.
        </P>

        <H>4. Content Moderation</H>
        <P>We monitor and review content to prevent abuse, harassment, and harmful or illegal activity.</P>

        <H>5. Data Sharing</H>
        <P>We do not sell your data. We may share data only:</P>
        <L>To comply with legal obligations</L>
        <L>To protect user safety</L>
        <L>With service providers (Firebase, hosting) who help us operate the app</L>

        <H>6. Account Deletion</H>
        <P>
          Users can permanently delete their account at any time from Settings → Account → Delete my
          account. Deletion removes your profile, posts, and Firestore data. Some anonymized logs may be
          retained for fraud and abuse prevention as required by law.
        </P>

        <H>7. Children's Privacy</H>
        <P>
          Palava Hub is not directed at children under 13. If we learn we have collected data from a child
          under 13 without parental consent, we will delete it.
        </P>

        <H>8. Security</H>
        <P>
          We use reasonable measures including Firebase Authentication, encrypted data at rest, and HTTPS
          in transit to protect your data.
        </P>

        <H>9. Changes to This Policy</H>
        <P>
          We may update this policy from time to time. Material changes will be communicated through the
          app. Continued use after changes means you accept the updated policy.
        </P>

        <H>10. Contact</H>
        <P>For questions about this policy, contact us at: support@palavahub.com</P>

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
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 18 },
  h: { fontSize: 16, fontWeight: "700", marginTop: 22, marginBottom: 8 },
  p: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  li: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 6, paddingRight: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
});
