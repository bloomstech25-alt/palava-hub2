import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TermsOfServiceScreen() {
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
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Terms of Service</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Terms of Service</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Effective Date: June 1, 2026</Text>

        <P>By creating an account or using Palava Hub, you agree to these Terms of Service.</P>

        <H>1. Who Can Use Palava Hub</H>
        <L>You must be at least 13 years old</L>
        <L>You must provide accurate information when registering</L>
        <L>You are responsible for keeping your account credentials secure</L>
        <L>One person may not maintain more than one active account</L>

        <H>2. Your Content</H>
        <P>
          You retain ownership of content you post. By posting, you grant Palava Hub a non-exclusive,
          royalty-free licence to store and display your content to operate the service. We do not
          sell your content to third parties.
        </P>
        <P>
          You are solely responsible for what you post. Content that violates our Community Guidelines
          may be removed without notice.
        </P>

        <H>3. Prohibited Conduct</H>
        <L>Impersonating another person or entity</L>
        <L>Posting illegal, harmful, or abusive content</L>
        <L>Using the platform to harass, threaten, or bully other users</L>
        <L>Attempting to access accounts or data that do not belong to you</L>
        <L>Using bots, scrapers, or automation that disrupts the platform</L>

        <H>4. Ads &amp; Promotions</H>
        <P>
          Palava Hub offers a free ad-posting feature. Ads are subject to admin review before
          publication. We reserve the right to reject any ad that violates our guidelines.
        </P>

        <H>5. Termination</H>
        <P>
          We may suspend or permanently ban accounts that violate these Terms. You may delete your
          account at any time from Settings → Account → Delete my account.
        </P>

        <H>6. Disclaimer</H>
        <P>
          Palava Hub is provided "as is" without warranties of any kind. We do not guarantee the
          service will be uninterrupted or error-free.
        </P>

        <H>7. Changes to These Terms</H>
        <P>
          We may update these Terms from time to time. Material changes will be communicated in-app.
          Continued use after changes constitutes acceptance of the updated Terms.
        </P>

        <H>8. Contact</H>
        <P>Questions? Email us at: support@palavahub.com</P>

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
