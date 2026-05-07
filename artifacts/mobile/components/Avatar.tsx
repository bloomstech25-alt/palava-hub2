import React, { useState } from "react";
import { Image, type ImageStyle, StyleSheet, Text, View, type ViewStyle, type StyleProp } from "react-native";
import { useColors } from "@/hooks/useColors";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

// One avatar component to rule them all. Renders the user's photo when we
// have a usable http(s)/data URL AND it loads successfully. Otherwise (no
// URL, blob:/file: URL, network failure, 404) falls back to a colored
// circle with the user's initial so the UI never has a blank hole.
//
// Why not just <Image source={{uri}} />? Two reasons:
//  1) iOS native networking crashes on blob: URIs ("No suitable URL request
//     handler found for blob:..."). We must filter those out.
//  2) Remote placeholder services (ui-avatars.com etc.) silently fail on
//     flaky carrier networks, leaving a blank circle. A local letter
//     fallback is always available.
export function Avatar({ uri, name, size, style }: AvatarProps) {
  const colors = useColors();
  const [failed, setFailed] = useState(false);

  const isLoadable =
    typeof uri === "string" &&
    (uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("data:"));

  const sizeStyle: ImageStyle | undefined = size
    ? { width: size, height: size, borderRadius: size / 2 }
    : undefined;

  if (isLoadable && !failed) {
    return (
      <Image
        source={{ uri: uri as string }}
        style={[sizeStyle, style] as StyleProp<ImageStyle>}
        onError={() => setFailed(true)}
      />
    );
  }

  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  // Cast to ViewStyle for the colored fallback container.
  const containerStyle: StyleProp<ViewStyle> = [
    sizeStyle as ViewStyle | undefined,
    style as ViewStyle,
    styles.fallback,
    { backgroundColor: colors.primary },
  ];
  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.initial,
          { color: colors.primaryForeground, fontSize: size ? Math.round(size * 0.42) : 18 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { fontWeight: "800" },
});
