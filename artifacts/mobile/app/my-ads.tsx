import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useAds, type Ad, type AdStatus } from "@/context/AdsContext";

const STATUS_STYLES: Record<AdStatus, { bg: string; text: string; label: string }> = {
  active:   { bg: "#10B98115", text: "#059669", label: "Active" },
  pending:  { bg: "#F59E0B15", text: "#D97706", label: "Pending Review" },
  paused:   { bg: "#94A3B815", text: "#475569", label: "Paused" },
  rejected: { bg: "#EF444415", text: "#DC2626", label: "Rejected" },
};

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ctr(impressions: number, clicks: number) {
  if (!impressions) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default function MyAdsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { user } = useAuth();
  const { myAds, pauseAd, resumeAd } = useAds();

  const ads = user ? myAds(user.id) : [];

  const totals = useMemo(() => {
    return ads.reduce(
      (acc, a) => ({
        impressions: acc.impressions + a.impressions,
        clicks: acc.clicks + a.clicks,
        active: acc.active + (a.status === "active" ? 1 : 0),
      }),
      { impressions: 0, clicks: 0, active: 0 },
    );
  }, [ads]);

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="eye" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNum(totals.impressions)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Impressions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mouse-pointer" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNum(totals.clicks)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Clicks</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="trending-up" size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{ctr(totals.impressions, totals.clicks)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>CTR</Text>
        </View>
      </View>

      {/* Active count summary */}
      <View style={[styles.summaryRow, { backgroundColor: colors.accent }]}>
        <Feather name="zap" size={14} color={colors.primary} />
        <Text style={[styles.summaryText, { color: colors.primary }]}>
          {totals.active} {totals.active === 1 ? "ad is" : "ads are"} live across Palava Hub
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Ads ({ads.length})</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Ad }) => {
    const s = STATUS_STYLES[item.status];
    return (
      <View style={[styles.adCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.adHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.adHeadline, { color: colors.foreground }]} numberOfLines={2}>
              {item.headline}
            </Text>
            <Text style={[styles.adSponsor, { color: colors.mutedForeground }]}>{item.sponsorName}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>

        {/* Per-ad metrics */}
        <View style={[styles.metricRow, { borderTopColor: colors.border }]}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{formatNum(item.impressions)}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Views</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{formatNum(item.clicks)}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Clicks</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{ctr(item.impressions, item.clicks)}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>CTR</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {item.status === "active" && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => pauseAd(item.id)}
              activeOpacity={0.8}
            >
              <Feather name="pause" size={13} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>Pause</Text>
            </TouchableOpacity>
          )}
          {item.status === "paused" && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
              onPress={() => resumeAd(item.id)}
              activeOpacity={0.8}
            >
              <Feather name="play" size={13} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Resume</Text>
            </TouchableOpacity>
          )}
          {item.status === "pending" && (
            <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
              Awaiting admin review
            </Text>
          )}
          {item.status === "rejected" && (
            <Text style={[styles.helperText, { color: "#DC2626" }]}>
              This ad was not approved
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Ads</Text>
        <TouchableOpacity
          onPress={() => router.push("/create-ad")}
          style={[styles.newBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color={colors.primaryForeground} />
          <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ads}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          ads.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                <Feather name="zap" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No ads yet</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Promote your business or event to thousands of Liberian students.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/create-ad")}
                activeOpacity={0.85}
              >
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>Create your first ad</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
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
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  newBtnText: { fontSize: 13, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    alignItems: "flex-start",
  },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 2 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  summaryText: { fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  adCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  adHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  adHeadline: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  adSponsor: { fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  statusText: { fontSize: 11, fontWeight: "700" },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metric: { flex: 1, alignItems: "center", gap: 2 },
  metricValue: { fontSize: 16, fontWeight: "800" },
  metricLabel: { fontSize: 11, fontWeight: "500" },
  metricDivider: { width: 1, height: 28 },
  actionRow: { flexDirection: "row", alignItems: "center" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: { fontSize: 13, fontWeight: "600" },
  helperText: { fontSize: 12, fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, gap: 10 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 22, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
