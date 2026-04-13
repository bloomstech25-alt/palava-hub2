import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Ad } from "@/context/AdsContext";

interface AdCardProps {
  ad: Ad;
}

const BUDGET_REACH: Record<string, string> = {
  basic: "~500 students/day",
  standard: "~1,500 students/day",
  premium: "~3,000+ students/day",
};

export function AdCard({ ad }: AdCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary + "30" }]}>
      {/* Sponsored label */}
      <View style={styles.topRow}>
        <View style={[styles.sponsoredBadge, { backgroundColor: colors.accent }]}>
          <Feather name="zap" size={10} color={colors.primary} />
          <Text style={[styles.sponsoredText, { color: colors.primary }]}>Sponsored</Text>
        </View>
        <Text style={[styles.sponsorName, { color: colors.mutedForeground }]}>{ad.sponsorName}</Text>
      </View>

      {/* Ad content */}
      <Text style={[styles.headline, { color: colors.foreground }]}>{ad.headline}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={3}>{ad.body}</Text>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>{ad.cta}</Text>
        <Feather name="arrow-right" size={14} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sponsoredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  sponsorName: { fontSize: 12, fontWeight: "500" },
  headline: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  body: { fontSize: 14, lineHeight: 20 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 2,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "700" },
});
