import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { uploadUriToStorage } from "@/utils/uploadBlob";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function EditPageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [original, setOriginal] = useState({ name: "", description: "", website: "", logo: null as string | null, cover: null as string | null });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!pageId || !user) return;
    getDoc(doc(db, "pages", pageId)).then((snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data();
      if (d.ownerId !== user.id) { setLoading(false); return; }
      setName(d.name ?? "");
      setDescription(d.description ?? "");
      setWebsite(d.website ?? "");
      setLogoUri(d.logo ?? null);
      setCoverUri(d.cover ?? null);
      setOriginal({ name: d.name ?? "", description: d.description ?? "", website: d.website ?? "", logo: d.logo ?? null, cover: d.cover ?? null });
      setAllowed(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [pageId, user]);

  const hasChanges =
    name !== original.name ||
    description !== original.description ||
    website !== original.website ||
    logoUri !== original.logo ||
    coverUri !== original.cover;

  const pickImage = async (kind: "logo" | "cover") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Allow photo access to update your page.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: Platform.OS !== "ios",
      aspect: kind === "logo" ? [1, 1] : [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      if (kind === "logo") setLogoUri(result.assets[0].uri);
      else setCoverUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!pageId || !user || !name.trim()) return;
    setIsSaving(true);
    try {
      let finalLogo = logoUri;
      let finalCover = coverUri;

      const needsUpload = (uri: string | null) =>
        !!uri && !uri.startsWith("http://") && !uri.startsWith("https://") && !uri.startsWith("data:");

      if (needsUpload(logoUri)) {
        const fname = `logo-${Date.now()}.jpg`;
        const r = ref(storage, `pages/${user.id}/${fname}`);
        finalLogo = await uploadUriToStorage(logoUri as string, r, "image/jpeg", { compress: true });
      }
      if (needsUpload(coverUri)) {
        const fname = `cover-${Date.now()}.jpg`;
        const r = ref(storage, `pages/${user.id}/${fname}`);
        finalCover = await uploadUriToStorage(coverUri as string, r, "image/jpeg", { compress: true });
      }

      await updateDoc(doc(db, "pages", pageId), {
        name: name.trim(),
        description: description.trim(),
        website: website.trim(),
        logo: finalLogo,
        cover: finalCover,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly =
        msg.includes("storage/unauthorized") || msg.includes("storage/unauthenticated") ? "Please sign in again."
        : msg.includes("storage/quota-exceeded") ? "Image too large. Try a smaller one."
        : msg.toLowerCase().includes("network") ? "Check your connection and try again."
        : `Couldn't save.\n\n${msg.slice(0, 240)}`;
      Alert.alert("Error", friendly);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedStatusBar />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ThemedStatusBar />
        <Feather name="lock" size={36} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>Only the page owner can edit this page.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
          <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Page</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isSaving || !name.trim()}
            style={[styles.saveBtn, { backgroundColor: hasChanges && name.trim() ? colors.primary : colors.muted }]}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[styles.saveBtnText, { color: hasChanges && name.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover */}
          <TouchableOpacity onPress={() => pickImage("cover")} activeOpacity={0.85} style={[styles.coverWrap, { backgroundColor: colors.muted }]}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            ) : null}
            <View style={styles.coverOverlay}>
              <Feather name="camera" size={20} color="#ffffff" />
              <Text style={styles.coverOverlayText}>{coverUri ? "Change Cover" : "Add Cover Photo"}</Text>
            </View>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoRow}>
            <TouchableOpacity onPress={() => pickImage("logo")} activeOpacity={0.85} style={styles.logoTouch}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={[styles.logo, { borderColor: colors.background }]} />
              ) : (
                <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Feather name="image" size={28} color="#ffffff" />
                </View>
              )}
              <View style={styles.logoOverlay}>
                <Feather name="camera" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.logoHint, { color: colors.mutedForeground }]}>Tap to change page logo</Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Field label="Page Name" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Page name"
                placeholderTextColor={colors.mutedForeground}
                maxLength={80}
              />
            </Field>

            <Field label="Description" colors={colors}>
              <TextInput
                style={[styles.input, styles.textarea, { color: colors.foreground }]}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this page about?"
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{description.length}/300</Text>
            </Field>

            <Field label="Website" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourwebsite.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                maxLength={200}
              />
            </Field>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, children, colors }: { label: string; children: React.ReactNode; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: "center" },
  saveBtnText: { fontSize: 14, fontWeight: "700" },
  backBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  scroll: { paddingBottom: 40 },
  coverWrap: { height: 160, justifyContent: "flex-end" },
  coverImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  coverOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  coverOverlayText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  logoRow: { alignItems: "center", marginTop: -40 },
  logoTouch: { width: 96, height: 96, borderRadius: 24 },
  logo: { width: 96, height: 96, borderRadius: 24, borderWidth: 3 },
  logoFallback: { alignItems: "center", justifyContent: "center" },
  logoOverlay: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoHint: { fontSize: 12, marginTop: 8 },
  fields: { padding: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  fieldBox: { borderRadius: 14, borderWidth: 1, padding: 12 },
  input: { fontSize: 15, padding: 0 },
  textarea: { minHeight: 80 },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
});
