import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useAds } from "@/context/AdsContext";
import { useColors } from "@/hooks/useColors";

type PageDoc = {
  id: string;
  name: string;
  type: string;
  description?: string;
  logo?: string | null;
  followers?: number;
  posts?: number;
  verified?: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  business: "Business",
  organization: "Organization",
  community: "Community",
  nonprofit: "Non-Profit",
  education: "Education",
  entertainment: "Entertainment",
};

export default function PagesTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { myAds } = useAds();

  const [pages, setPages] = useState<PageDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/welcome");
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const q = query(collection(db, "pages"), where("ownerId", "==", user.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PageDoc, "id">) }));
        setPages(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [user?.id]);

  const totalAds = user ? myAds(user.id).length : 0;

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
      <View>
        <Text style={[styles.h1, { color: colors.foreground }]}>Pages</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Create and manage your business, club, or community pages — and run ads to grow them.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/create-page");
          }}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>New Page</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/my-ads")}
          style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.8}
        >
          <Feather name="bar-chart-2" size={15} color={colors.foreground} />
          <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
            My Ads {totalAds > 0 ? `(${totalAds})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR PAGES</Text>
    </View>
  );

  const renderItem = ({ item }: { item: PageDoc }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => router.push({ pathname: "/page/[pageId]", params: { pageId: item.id } })}
        activeOpacity={0.85}
      >
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
            <Feather name="flag" size={20} color={colors.mutedForeground} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.pageMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {TYPE_LABEL[item.type] ?? item.type} · {item.followers ?? 0} followers · {item.posts ?? 0} posts
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/page/[pageId]", params: { pageId: item.id } })}
        >
          <Feather name="settings" size={14} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Manage</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/create-ad", params: { sponsor: item.name } })}
        >
          <Feather name="zap" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Create Ad</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <ThemedStatusBar />
      <FlatList
        data={pages}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                <Feather name="flag" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No pages yet</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Create a page for your business, club, or community — then run ads to reach Liberian students.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/create-page")}
                activeOpacity={0.85}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Create your first page</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  h1: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 6 },
  card: {
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 14, borderWidth: 1, overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  logo: { width: 48, height: 48, borderRadius: 12 },
  pageName: { fontSize: 15, fontWeight: "700" },
  pageMeta: { fontSize: 12, marginTop: 2 },
  cardActions: { flexDirection: "row", borderTopWidth: 1 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
  divider: { width: 1 },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
