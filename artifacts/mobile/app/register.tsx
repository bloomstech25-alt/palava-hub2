import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  FlatList,
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
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSchools = SCHOOLS_LIST.filter((s) =>
    s.name.toLowerCase().includes(schoolQuery.toLowerCase())
  );

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim() || !selectedSchool) {
      setError("Please fill in all fields");
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
    setIsLoading(true);
    setError("");
    const result = await register({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
      school: selectedSchool,
    });
    setIsLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Registration failed");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
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
            <Text style={[styles.title, { color: colors.foreground }]}>Join StudentConnect</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Connect with students from Liberian universities and high schools
            </Text>
          </View>

          <View style={styles.form}>
            <InputField label="Full Name" icon="user" value={name} onChangeText={setName} placeholder="Your full name" colors={colors} />
            <InputField label="Username" icon="at-sign" value={username} onChangeText={setUsername} placeholder="yourhandle" colors={colors} autoCapitalize="none" />
            <InputField label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="your@email.com" colors={colors} keyboardType="email-address" />

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
              <Text style={[styles.registerBtnText, { color: colors.primaryForeground }]}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Text>
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
  backBtn: { marginBottom: 28, width: 40 },
  heading: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 8, lineHeight: 22 },
  form: { gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
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
