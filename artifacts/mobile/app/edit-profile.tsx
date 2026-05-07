import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { storage } from "@/lib/firebase";
import { ref } from "firebase/storage";
import { uploadUriToStorage } from "@/utils/uploadBlob";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { safeAvatarUri } from "@/utils/avatarUri";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [maritalStatus, setMaritalStatus] = useState<NonNullable<typeof user>["maritalStatus"] | "">(
    user?.maritalStatus ?? ""
  );
  const [currentLocation, setCurrentLocation] = useState(user?.currentLocation ?? "");
  const [currentEmployment, setCurrentEmployment] = useState(user?.currentEmployment ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    name !== user?.name ||
    username !== user?.username ||
    bio !== user?.bio ||
    avatar !== user?.avatar ||
    (maritalStatus ?? "") !== (user?.maritalStatus ?? "") ||
    currentLocation !== (user?.currentLocation ?? "") ||
    currentEmployment !== (user?.currentEmployment ?? "");

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // iOS native cropper crashes on blob: URIs in Expo Go.
      allowsEditing: Platform.OS !== "ios",
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your display name.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }
    const cleanUsername = username.replace(/\s/g, "").toLowerCase();
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // If the avatar has changed and is a local URI (blob: or file:), upload to Firebase Storage
      let finalAvatar = avatar;
      const isLocalUri = avatar !== user?.avatar && (avatar.startsWith("blob:") || avatar.startsWith("file:"));
      if (isLocalUri && user?.id) {
        try {
          const storageRef = ref(storage, `avatars/${user.id}`);
          // Use the shared helper so the avatar gets compressed (≈10× smaller
          // payload than a raw camera roll photo) and so blob:/file:/ph:
          // URIs are read via XHR — the previous fetch().blob() path failed
          // on iOS PHPicker URIs.
          finalAvatar = await uploadUriToStorage(avatar, storageRef, "image/jpeg", { compress: true });
          if (!finalAvatar.startsWith("http")) {
            // safety net: never persist a non-http avatar URI to Firestore.
            finalAvatar = user?.avatar ?? "";
          }
        } catch {
          // Keep original avatar if upload fails
          finalAvatar = user?.avatar ?? avatar;
        }
      }
      await updateUser({
        name: name.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        avatar: finalAvatar,
        maritalStatus: (maritalStatus || "") as NonNullable<typeof user>["maritalStatus"],
        currentLocation: currentLocation.trim(),
        currentEmployment: currentEmployment.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            style={[
              styles.saveBtn,
              { backgroundColor: hasChanges ? colors.primary : colors.muted },
            ]}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={[styles.saveBtnText, { color: hasChanges ? colors.primaryForeground : colors.mutedForeground }]}>
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
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
              <Image
                source={{ uri: safeAvatarUri(avatar, name) }}
                style={styles.avatar}
              />
              <View style={[styles.avatarOverlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
                <Feather name="camera" size={22} color="#ffffff" />
                <Text style={styles.avatarOverlayText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>Tap to change your profile photo</Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <FieldGroup label="Display Name" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground}
                maxLength={60}
              />
            </FieldGroup>

            <FieldGroup label="Username" colors={colors}>
              <View style={styles.usernameRow}>
                <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
                <TextInput
                  style={[styles.input, { flex: 1, color: colors.foreground }]}
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/\s/g, "").toLowerCase())}
                  placeholder="username"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>
            </FieldGroup>

            <FieldGroup label="Bio" colors={colors}>
              <TextInput
                style={[styles.input, styles.bioInput, { color: colors.foreground }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people about yourself..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={160}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{bio.length}/160</Text>
            </FieldGroup>

            <FieldGroup label="Current Location  ·  Optional" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={currentLocation}
                onChangeText={setCurrentLocation}
                placeholder="e.g. Monrovia, Liberia"
                placeholderTextColor={colors.mutedForeground}
                maxLength={80}
              />
            </FieldGroup>

            <FieldGroup label="Current Employment  ·  Optional" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={currentEmployment}
                onChangeText={setCurrentEmployment}
                placeholder="e.g. Software Engineer at Lonestar"
                placeholderTextColor={colors.mutedForeground}
                maxLength={100}
              />
            </FieldGroup>

            <FieldGroup label="Marital Status  ·  Optional" colors={colors}>
              <View style={styles.chipRow}>
                {([
                  { v: "", label: "—" },
                  { v: "single", label: "Single" },
                  { v: "in_relationship", label: "In a relationship" },
                  { v: "engaged", label: "Engaged" },
                  { v: "married", label: "Married" },
                  { v: "complicated", label: "It's complicated" },
                  { v: "prefer_not_to_say", label: "Prefer not to say" },
                ] as const).map((opt) => {
                  const active = (maritalStatus ?? "") === opt.v;
                  return (
                    <TouchableOpacity
                      key={opt.v || "none"}
                      onPress={() => setMaritalStatus(opt.v as typeof maritalStatus)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.muted,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={{
                          color: active ? colors.primaryForeground : colors.foreground,
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FieldGroup>

            <View style={[styles.readonlyGroup, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.readonlyHeader}>
                <Feather name="book-open" size={14} color={colors.mutedForeground} />
                <Text style={[styles.readonlyLabel, { color: colors.mutedForeground }]}>School</Text>
              </View>
              <Text style={[styles.readonlyValue, { color: colors.foreground }]}>{user.school?.name ?? "—"}</Text>
              <Text style={[styles.readonlyHint, { color: colors.mutedForeground }]}>School cannot be changed after registration.</Text>
            </View>
          </View>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700" },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    ...(Platform.OS === "web"
      ? { maxWidth: 560, width: "100%", alignSelf: "center" as const }
      : null),
  },
  avatarSection: { alignItems: "center", marginBottom: 32, gap: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, overflow: "hidden" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 50,
  },
  avatarOverlayText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  avatarHint: { fontSize: 13 },
  fields: { gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingLeft: 4 },
  fieldBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: { fontSize: 16, paddingVertical: 12 },
  usernameRow: { flexDirection: "row", alignItems: "center" },
  atSign: { fontSize: 16, marginRight: 2 },
  bioInput: { minHeight: 90 },
  charCount: { fontSize: 12, textAlign: "right", paddingBottom: 8 },
  readonlyGroup: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  readonlyHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  readonlyLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  readonlyValue: { fontSize: 16, fontWeight: "600" },
  readonlyHint: { fontSize: 12, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
