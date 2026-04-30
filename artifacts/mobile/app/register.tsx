import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, type School } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { SCHOOLS_LIST } from "@/context/FeedContext";

export default function RegisterScreen() {
  const colors = useColors();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  // Date of birth in ISO format YYYY-MM-DD — required by both Apple and Google
  // for age-appropriate design / COPPA compliance. Anyone under 13 is blocked.
  const [dob, setDob] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSchools = SCHOOLS_LIST.filter((s) =>
    s.name.toLowerCase().includes(schoolQuery.toLowerCase())
  );

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Auto-format DOB input as the user types. Strips non-digits and inserts
  // hyphens so a "number-pad" style keyboard (which lacks "-" on iOS/Android)
  // still produces a valid YYYY-MM-DD string.
  function handleDobChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 4 && digits.length <= 6) {
      out = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else if (digits.length > 6) {
      out = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }
    setDob(out);
  }

  // Compute calendar age from a YYYY-MM-DD string. Returns NaN for any
  // unparseable / future / structurally-invalid date (e.g. Feb 31) so the
  // caller can show a single error. We round-trip the parts back through Date
  // to reject values JavaScript silently normalizes (Feb 31 -> Mar 3 etc.).
  function computeAge(iso: string): number {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return NaN;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return NaN;
    if (y < 1900) return NaN;
    const birth = new Date(y, mo - 1, d);
    if (
      isNaN(birth.getTime()) ||
      birth.getFullYear() !== y ||
      birth.getMonth() !== mo - 1 ||
      birth.getDate() !== d
    ) {
      return NaN;
    }
    const today = new Date();
    if (birth > today) return NaN;
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age;
  }

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !password.trim() || !selectedSchool) {
      setError("Please fill in all required fields");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    // Age gating — required for Google Play age-appropriate design and Apple
    // App Store Guideline 1.3 / 5.1.4. Block anyone under 13 (COPPA).
    const age = computeAge(dob.trim());
    if (isNaN(age)) {
      setError("Please enter your date of birth as YYYY-MM-DD");
      return;
    }
    if (age < 13) {
      setError("You must be at least 13 years old to use Palava Hub.");
      return;
    }
    setIsLoading(true);
    setError("");

    const result = await register({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
      school: selectedSchool,
      bio: bio.trim(),
      avatarUri: avatarUri ?? undefined,
      dob: dob.trim(),
    });
    setIsLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Registration failed");
    }
  };

  const avatarPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=BF0A30&color=fff&size=200`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.foreground }]}>Join Palava Hub</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Connect with students from Liberian universities and high schools
            </Text>
          </View>

          {/* Profile Photo Picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
              <Image
                source={{ uri: avatarUri ?? avatarPlaceholder }}
                style={styles.avatar}
              />
              <View style={[styles.avatarOverlay, { backgroundColor: avatarUri ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)" }]}>
                <Feather name="camera" size={22} color="#ffffff" />
                <Text style={styles.avatarOverlayText}>{avatarUri ? "Change" : "Add Photo"}</Text>
              </View>
              {!avatarUri && (
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Feather name="plus" size={12} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
              Tap to add a profile photo
            </Text>
          </View>

          <View style={styles.form}>
            <InputField label="Full Name" icon="user" value={name} onChangeText={setName} placeholder="Your full name" colors={colors} />
            <InputField label="Username" icon="at-sign" value={username} onChangeText={setUsername} placeholder="yourhandle" colors={colors} autoCapitalize="none" />
            <InputField label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="your@email.com" colors={colors} keyboardType="email-address" autoCapitalize="none" />

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="lock" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Min 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date of Birth — store-required age verification */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Date of Birth</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="calendar" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedForeground}
                  value={dob}
                  onChangeText={handleDobChange}
                  keyboardType={Platform.OS === "web" ? "default" : "number-pad"}
                  autoCapitalize="none"
                  maxLength={10}
                  testID="input-dob"
                />
              </View>
              <Text style={[styles.schoolSub, { color: colors.mutedForeground }]}>
                You must be at least 13 to use Palava Hub.
              </Text>
            </View>

            {/* Bio Field */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>Bio</Text>
                <Text style={[styles.optionalTag, { color: colors.mutedForeground }]}>Optional</Text>
              </View>
              <View style={[styles.bioWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="edit-3" size={16} color={colors.mutedForeground} style={[styles.inputIcon, { alignSelf: "flex-start", marginTop: 14 }]} />
                <TextInput
                  style={[styles.bioInput, { color: colors.foreground }]}
                  placeholder="Tell people about yourself..."
                  placeholderTextColor={colors.mutedForeground}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  maxLength={160}
                  textAlignVertical="top"
                />
              </View>
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{bio.length}/160</Text>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Your School</Text>
              <TouchableOpacity
                style={[styles.inputWrap, { borderColor: selectedSchool ? colors.primary : colors.border, backgroundColor: colors.card }]}
                onPress={() => setShowSchoolPicker(true)}
                activeOpacity={0.8}
              >
                <Feather name="book-open" size={18} color={selectedSchool ? colors.primary : colors.mutedForeground} style={styles.inputIcon} />
                <Text style={[styles.input, { color: selectedSchool ? colors.foreground : colors.mutedForeground }]}>
                  {selectedSchool ? selectedSchool.name : "Select your school"}
                </Text>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              {selectedSchool && (
                <Text style={[styles.schoolSub, { color: colors.mutedForeground }]}>
                  {selectedSchool.type === "university" ? "University" : "High School"} · {selectedSchool.location}
                </Text>
              )}
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.like_bg }]}>
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={[styles.registerBtnText, { color: colors.primaryForeground }]}>Creating account...</Text>
                </View>
              ) : (
                <Text style={[styles.registerBtnText, { color: colors.primaryForeground }]}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace("/login")} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.primary }]}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSchoolPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select School</Text>
            <TouchableOpacity onPress={() => setShowSchoolPicker(false)} activeOpacity={0.7}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.card, margin: 16 }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search schools..."
              placeholderTextColor={colors.mutedForeground}
              value={schoolQuery}
              onChangeText={setSchoolQuery}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredSchools}
            keyExtractor={(s) => s.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.schoolItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedSchool(item);
                  setShowSchoolPicker(false);
                  setSchoolQuery("");
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.schoolBadge, { backgroundColor: item.type === "university" ? colors.accent : colors.secondary }]}>
                  <Feather name={item.type === "university" ? "book" : "award"} size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.schoolName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.schoolLocation, { color: colors.mutedForeground }]}>{item.location}</Text>
                </View>
                {selectedSchool?.id === item.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

function InputField({ label, icon, value, onChangeText, placeholder, colors, keyboardType, autoCapitalize }: any) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name={icon} size={18} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize ?? "words"}
          keyboardType={keyboardType ?? "default"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 20, width: 40 },
  heading: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  avatarSection: { alignItems: "center", marginBottom: 28, gap: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, overflow: "hidden", position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 50,
  },
  avatarOverlayText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { fontSize: 13 },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionalTag: { fontSize: 12, fontStyle: "italic" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  bioWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 100,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  bioInput: { flex: 1, fontSize: 15, paddingVertical: 12, lineHeight: 22 },
  charCount: { fontSize: 12, textAlign: "right", marginTop: 2 },
  eyeBtn: { padding: 4 },
  schoolSub: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  errorText: { fontSize: 13, flex: 1 },
  registerBtn: {
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  registerBtnText: { fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
  methodToggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 4,
  },
  methodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 8,
  },
  methodOptionText: { fontSize: 13, fontWeight: "700" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 15 },
  schoolItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  schoolBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolName: { fontSize: 15, fontWeight: "600" },
  schoolLocation: { fontSize: 12, marginTop: 2 },
});
