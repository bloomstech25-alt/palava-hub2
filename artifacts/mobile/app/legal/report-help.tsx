import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const TOPICS: { key: string; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "bug", label: "Report a bug", icon: "alert-triangle" },
  { key: "abuse", label: "Report abuse or harassment", icon: "shield-off" },
  { key: "content", label: "Report harmful content", icon: "flag" },
  { key: "account", label: "Account issue", icon: "user-x" },
  { key: "feedback", label: "Send feedback or feature request", icon: "message-circle" },
  { key: "other", label: "Other / general help", icon: "help-circle" },
];

export default function ReportHelpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const [topic, setTopic] = useState("bug");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (message.trim().length < 5) {
      Alert.alert("Tell us more", "Please describe the problem in at least a few words.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "supportRequests"), {
        topic,
        message: message.trim(),
        userId: user?.id ?? null,
        userName: user?.name ?? "Anonymous",
        userEmail: user?.email ?? null,
        status: "open",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Thank you", "Our team will review your report shortly.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      setMessage("");
    } catch {
      Alert.alert("Submission failed", "Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Report & Help</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.foreground }]}>How can we help?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Pick a topic, then tell us what's going on. Our admin team reviews every report.
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Topic</Text>
        <View style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TOPICS.map((t, idx) => {
            const active = topic === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.topicRow,
                  idx > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
                ]}
                onPress={() => setTopic(t.key)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: active ? colors.primary : colors.accent },
                  ]}
                >
                  <Feather name={t.icon} size={16} color={active ? colors.primaryForeground : colors.primary} />
                </View>
                <Text style={[styles.topicLabel, { color: colors.foreground }]}>{t.label}</Text>
                {active ? <Feather name="check" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Describe the issue</Text>
        <TextInput
          style={[
            styles.textarea,
            { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="What happened? Include any details that might help us understand..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={1500}
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/1500</Text>

        <TouchableOpacity
          style={[
            styles.submit,
            { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
          ]}
          disabled={submitting}
          onPress={submit}
          activeOpacity={0.85}
        >
          <Feather name="send" size={16} color={colors.primaryForeground} />
          <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
            {submitting ? "Sending..." : "Send Report"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.contact, { color: colors.mutedForeground }]}>
          Or email us directly: support@palavahub.com
        </Text>
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
  title: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 14, lineHeight: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 6,
  },
  topicCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  iconBubble: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  topicLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 130,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: { fontSize: 11, alignSelf: "flex-end", marginTop: 4 },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 18,
  },
  submitText: { fontSize: 15, fontWeight: "700" },
  contact: { textAlign: "center", marginTop: 18, fontSize: 12 },
});
