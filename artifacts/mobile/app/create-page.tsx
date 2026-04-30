import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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

const PAGE_TYPES = [
  { id: "business", label: "Business", icon: "briefcase" as const, desc: "Shop, restaurant, service, or local business" },
  { id: "organization", label: "Organization", icon: "users" as const, desc: "Club, association, or student group" },
  { id: "community", label: "Community", icon: "globe" as const, desc: "Interest group or community page" },
  { id: "nonprofit", label: "Non-Profit", icon: "heart" as const, desc: "Charity, NGO, or cause-based group" },
  { id: "education", label: "Education", icon: "book-open" as const, desc: "School program, department, or tutoring" },
  { id: "entertainment", label: "Entertainment", icon: "music" as const, desc: "Artist, performer, or media page" },
];

export default function CreatePageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [pageType, setPageType] = useState<string | null>(null);
  const [pageName, setPageName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const canNext = pageType !== null;
  const canCreate = pageName.trim().length >= 3;

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to set a page logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCreate = async () => {
    if (!user || !pageName.trim() || !pageType) return;
    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const docRef = await addDoc(collection(db, "pages"), {
        name: pageName.trim(),
        type: pageType,
        description: description.trim(),
        website: website.trim(),
        logo: logoUri ?? null,
        ownerId: user.id,
        ownerName: user.name,
        ownerSchool: user.school?.name ?? "",
        followers: 0,
        posts: 0,
        verified: false,
        createdAt: serverTimestamp(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/page/[pageId]", params: { pageId: docRef.id } });
    } catch {
      Alert.alert("Error", "Could not create your page. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedType = PAGE_TYPES.find((t) => t.id === pageType);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            activeOpacity={0.7}
          >
            <Feather name={step === 2 ? "arrow-left" : "x"} size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Page</Text>
            <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step} of 2</Text>
          </View>
          {step === 1 ? (
            <TouchableOpacity
              onPress={() => { if (canNext) setStep(2); }}
              disabled={!canNext}
              style={[styles.nextBtn, { backgroundColor: canNext ? colors.primary : colors.muted }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.nextBtnText, { color: canNext ? colors.primaryForeground : colors.mutedForeground }]}>
                Next
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!canCreate || isCreating}
              style={[styles.nextBtn, { backgroundColor: canCreate ? colors.primary : colors.muted }]}
              activeOpacity={0.85}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.nextBtnText, { color: canCreate ? colors.primaryForeground : colors.mutedForeground }]}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            /* Step 1: Choose page type */
            <View style={styles.step}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>What kind of page?</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                Choose the category that best describes your page.
              </Text>
              <View style={styles.typeGrid}>
                {PAGE_TYPES.map((type) => {
                  const selected = pageType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => {
                        setPageType(type.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: selected ? colors.primary + "14" : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.typeIconWrap, { backgroundColor: selected ? colors.primary : colors.muted }]}>
                        <Feather name={type.icon} size={20} color={selected ? "#ffffff" : colors.mutedForeground} />
                      </View>
                      <Text style={[styles.typeLabel, { color: colors.foreground }]}>{type.label}</Text>
                      <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{type.desc}</Text>
                      {selected && (
                        <View style={[styles.typeCheck, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={12} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* Step 2: Page details */
            <View style={styles.step}>
              <View style={[styles.selectedTypeBadge, { backgroundColor: colors.accent }]}>
                <Feather name={selectedType!.icon} size={14} color={colors.primary} />
                <Text style={[styles.selectedTypeText, { color: colors.primary }]}>{selectedType!.label} Page</Text>
              </View>

              {/* Logo picker */}
              <View style={styles.logoSection}>
                <TouchableOpacity onPress={pickLogo} style={[styles.logoPicker, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoImage} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Feather name="image" size={28} color={colors.mutedForeground} />
                      <Text style={[styles.logoPlaceholderText, { color: colors.mutedForeground }]}>Add Logo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <Text style={[styles.logoHint, { color: colors.mutedForeground }]}>Tap to upload a page logo (optional)</Text>
              </View>

              {/* Fields */}
              <View style={styles.fields}>
                <FieldGroup label="Page Name *" colors={colors}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={pageName}
                    onChangeText={setPageName}
                    placeholder="e.g. Monrovia Tech Hub"
                    placeholderTextColor={colors.mutedForeground}
                    maxLength={80}
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Description" colors={colors}>
                  <TextInput
                    style={[styles.input, styles.descInput, { color: colors.foreground }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What is this page about?"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    maxLength={300}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{description.length}/300</Text>
                </FieldGroup>

                <FieldGroup label="Website" colors={colors}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://yourwebsite.com (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    maxLength={200}
                  />
                </FieldGroup>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                <Feather name="info" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>
                  Your page will be visible to all Palava Hub students. You can add posts and updates after creation.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldGroup({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <View style={[styles.fieldBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerStep: { fontSize: 12, marginTop: 1 },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
  },
  nextBtnText: { fontSize: 15, fontWeight: "700" },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  step: { gap: 20 },
  stepTitle: { fontSize: 22, fontWeight: "700" },
  stepSub: { fontSize: 15, lineHeight: 22, marginTop: -10 },
  typeGrid: { gap: 12 },
  typeCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    position: "relative",
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  typeLabel: { fontSize: 16, fontWeight: "700" },
  typeDesc: { fontSize: 13, lineHeight: 18 },
  typeCheck: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedTypeText: { fontSize: 13, fontWeight: "600" },
  logoSection: { alignItems: "center", gap: 8 },
  logoPicker: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 96, height: 96, borderRadius: 20 },
  logoPlaceholder: { alignItems: "center", gap: 6 },
  logoPlaceholderText: { fontSize: 12, fontWeight: "600" },
  logoHint: { fontSize: 13 },
  fields: { gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingLeft: 4 },
  fieldBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: { fontSize: 16, paddingVertical: 12 },
  descInput: { minHeight: 90 },
  charCount: { fontSize: 12, textAlign: "right", paddingBottom: 8 },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
