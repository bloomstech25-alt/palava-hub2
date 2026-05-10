import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);

export default function ImageViewerScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const [loadError, setLoadError] = useState<string | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  if (!uri) {
    router.back();
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemedStatusBar />
      <View style={styles.root}>
        <GestureDetector gesture={composed}>
          <View style={styles.imageWrap}>
            <AnimatedImage
              source={{ uri }}
              style={[{ width: winW, height: winH }, animatedStyle]}
              contentFit="contain"
              transition={150}
              onError={(e) => {
                const msg = (e as { error?: string } | undefined)?.error ?? "Couldn't load image";
                console.warn("[image-viewer] load failed:", msg, "uri:", uri);
                setLoadError(msg);
              }}
            />
            {loadError && (
              <View style={styles.errorOverlay} pointerEvents="none">
                <Feather name="alert-circle" size={28} color="#fff" />
                <Text style={styles.errorText}>Couldn't load image</Text>
                <Text style={styles.errorSub} numberOfLines={2}>{loadError}</Text>
              </View>
            )}
          </View>
        </GestureDetector>

        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          hitSlop={12}
        >
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  imageWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 8 },
  errorSub: { color: "#bbb", fontSize: 12, marginTop: 4, textAlign: "center" },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
