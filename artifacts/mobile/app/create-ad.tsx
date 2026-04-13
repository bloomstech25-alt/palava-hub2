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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAds } from "@/context/AdsContext";
import type { AdCTA, AdBudget, AdAudience } from "@/context/AdsContext";

const CTA_OPTIONS: AdCTA[] = ["Learn More", "Apply Now", "Contact Us", "Visit Website", "Enroll Now"];
const BUDGET_OPTIONS: { key: AdBudget; label: string; desc: string; reach: string }[] = [
  { key: "basic", label: "Basic", desc: "L$500 / day", reach: "~500 students/day" },
  { key: "standard", label: "Standard", desc: "L$1,500 / day", reach: "~1,500 students/day" },
  { key: "premium", label: "Premium", desc: "L$3,000 / day", reach: "~3,000+ students/day" },
];
const AUDIENCE_OPTIONS: { key: AdAudience; label: string; icon: string }[] = [
  { key: "all", label: "All Students", icon: "users" },
  { key: "university", label: "University Students", icon: "book" },
  { key: "high_school", label: "High School Students", icon: "award" },
];

export default function CreateAdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { createAd } = useAds();

  const [sponsorName, setSponsorName] = useState("");
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState<AdCTA>("Learn More");
  const [budget, setBudget] = useState<AdBudget>("basic");
  const [audience, setAudience] = useState<AdAudience>("all");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = sponsorName.trim() && headline.trim() && body.trim();

  function handleSubmit() {
    if (!canSubmit) return;
    createAd({ sponsorName: sponsorName.trim(), headline: headline.trim(), body: body.trim(), cta, budget, audience });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <View style={[styles.successScreen, { paddingTop: topPad + 40 }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.accent }]}>
            <Feather name="check-circle" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Ad Submitted!</Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Your ad is under review by our admin team. Once approved, it will start showing to students across Palava Hub.
          </Text>
          <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewRow}>
              <Feather name="clock" size={15} color={colors.mutedForeground} />
              <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>Review takes 1–2 business hours</Text>
            </View>
            <View style={styles.reviewRow}>
              <Feather name="bell" size={15} color={colors.mutedForeground} />
              <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>You'll be notified when it goes live</Text>
            </View>
            <View style={styles.reviewRow}>
              <Feather name="shield" size={15} color={colors.mutedForeground} />
              <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>Ads must follow our community guidelines</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>Back to Feed</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="x" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Run an Ad</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: canSubmit ? colors.primary : colors.muted }]}
          activeOpacity={canSubmit ? 0.85 : 1}
          disabled={!canSubmit}
        >
          <Text style={[styles.submitBtnText, { color: canSubmit ? colors.primaryForeground : colors.mutedForeground }]}>
            Submit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.accent }]}>
          <Feather name="zap" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Reach thousands of students across Liberian schools
          </Text>
        </View>

        {/* Sponsor Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Business / Organization Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Liberia Tech Hub"
            placeholderTextColor={colors.mutedForeground}
            value={sponsorName}
            onChangeText={setSponsorName}
            maxLength={60}
          />
        </View>

        {/* Headline */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Ad Headline</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Short and catchy — max 80 characters</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Apply for our 2025 Scholarship"
            placeholderTextColor={colors.mutedForeground}
            value={headline}
            onChangeText={setHeadline}
            maxLength={80}
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{headline.length}/80</Text>
        </View>

        {/* Body */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Ad Description</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Describe your offering — max 200 characters</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Tell students what you're offering and why they should care..."
            placeholderTextColor={colors.mutedForeground}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{body.length}/200</Text>
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Call to Action Button</Text>
          <View style={styles.chipRow}>
            {CTA_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, { backgroundColor: cta === option ? colors.primary : colors.card, borderColor: cta === option ? colors.primary : colors.border }]}
                onPress={() => setCta(option)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: cta === option ? colors.primaryForeground : colors.foreground }]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Audience */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Target Audience</Text>
          <View style={styles.optionList}>
            {AUDIENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, { backgroundColor: colors.card, borderColor: audience === opt.key ? colors.primary : colors.border }]}
                onPress={() => setAudience(opt.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.optionIcon, { backgroundColor: audience === opt.key ? colors.primary + "15" : colors.muted }]}>
                  <Feather name={opt.icon as any} size={16} color={audience === opt.key ? colors.primary : colors.mutedForeground} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>{opt.label}</Text>
                {audience === opt.key && (
                  <Feather name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Daily Budget</Text>
          <View style={styles.optionList}>
            {BUDGET_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.budgetRow, { backgroundColor: colors.card, borderColor: budget === opt.key ? colors.primary : colors.border }]}
                onPress={() => setBudget(opt.key)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.budgetLabel, { color: colors.foreground }]}>{opt.label}</Text>
                  <Text style={[styles.budgetDesc, { color: colors.mutedForeground }]}>{opt.desc} · {opt.reach}</Text>
                </View>
                {budget === opt.key && (
                  <Feather name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Terms note */}
        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          By submitting, you agree to Palava Hub's advertising guidelines. All ads are reviewed before going live.
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  submitBtnText: { fontSize: 14, fontWeight: "700" },
  content: { padding: 16, gap: 4, paddingBottom: 60 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  infoText: { fontSize: 13, fontWeight: "600", flex: 1 },
  section: { marginBottom: 20, gap: 6 },
  label: { fontSize: 15, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: -2 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  charCount: { fontSize: 11, textAlign: "right" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  optionList: { gap: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  budgetLabel: { fontSize: 14, fontWeight: "700" },
  budgetDesc: { fontSize: 12, marginTop: 2 },
  terms: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 8 },
  // Success screen
  successScreen: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 24, fontWeight: "800" },
  successBody: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  reviewCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewText: { fontSize: 14 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
  doneBtnText: { fontSize: 16, fontWeight: "700" },
});
