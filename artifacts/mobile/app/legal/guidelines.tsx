import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function GuidelinesScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Community Guidelines</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>Welcome to Palava Hub</Text>
        <P>
          To keep our community safe and respectful, every member of Palava Hub must follow these rules.
          Violating them may result in content removal, temporary suspension, or permanent ban.
        </P>

        <H>1. Be Respectful</H>
        <L>No bullying, harassment, or personal attacks</L>
        <L>No hate speech based on tribe, ethnicity, religion, gender, or sexual orientation</L>
        <L>No threats of violence or intimidation</L>

        <H>2. No Harmful Content</H>
        <L>No violence or graphic gore</L>
        <L>No sexual or sexually explicit content</L>
        <L>No content that promotes self-harm or dangerous activity</L>
        <L>No false or misleading information that could cause harm</L>

        <H>3. Use Palava (Anonymous Posts) Responsibly</H>
        <P>
          Anonymous posting is a privilege, not a shield. Abuse of this feature — including harassment,
          bullying, or spreading false information — will result in account suspension. Even when posting
          anonymously, your activity is logged internally for safety purposes.
        </P>

        <H>4. Respect Privacy</H>
        <L>Do not share other people's private information without consent</L>
        <L>Do not post photos or videos of others without permission</L>
        <L>Do not impersonate other people or organizations</L>

        <H>5. No Spam or Manipulation</H>
        <L>No unsolicited advertising outside of the official Promote feature</L>
        <L>No fake accounts, automated bots, or coordinated inauthentic behavior</L>
        <L>No scams, fraud, or attempts to manipulate engagement metrics</L>

        <H>6. Report Violations</H>
        <P>
          Use the Report button on any post or profile to flag content you believe violates these
          guidelines. Reports are reviewed by our admin team. False or abusive reporting may itself be a
          violation.
        </P>

        <H>7. Enforcement</H>
        <P>
          Palava Hub reserves the right to remove content, suspend accounts, or permanently ban users who
          violate these guidelines. Decisions are at our discretion and final.
        </P>

        <H>8. Keep It Liberian</H>
        <P>
          Palava Hub is built for Liberian students. Engage with your school community, lift others up,
          and help make Palava Hub a place we can all be proud of.
        </P>

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
});
