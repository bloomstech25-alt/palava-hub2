import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#1e3a8a", "#2563eb", "#3b82f6"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={[styles.content, { paddingTop: topPad + 40, paddingBottom: bottomPad + 20 }]}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Feather name="users" size={40} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>StudentConnect</Text>
          <Text style={styles.tagline}>Where campus meets community</Text>
        </View>

        <View style={styles.featureGrid}>
          {[
            { icon: "globe", label: "Global Feed" },
            { icon: "trending-up", label: "Trending" },
            { icon: "search", label: "Discover" },
            { icon: "book-open", label: "Schools" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon as any} size={20} color="#ffffff" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#2563eb" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  featureItem: {
    alignItems: "center",
    gap: 8,
    width: (width - 80) / 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#2563eb",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  secondaryBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "500",
  },
});
