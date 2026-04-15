import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FeedProvider, useFeed } from "@/context/FeedContext";
import { AdsProvider } from "@/context/AdsContext";
import { MessagingProvider, useMessaging } from "@/context/MessagingContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function FirebaseSyncBridge() {
  const { user } = useAuth();
  const { setCurrentUserId: setFeedUserId } = useFeed();
  const { setCurrentUserId: setMsgUserId } = useMessaging();
  useEffect(() => {
    const uid = user?.id ?? null;
    setFeedUserId(uid);
    setMsgUserId(uid);
  }, [user?.id, setFeedUserId, setMsgUserId]);
  return null;
}

function RootLayoutNav() {
  return (
    <>
      <FirebaseSyncBridge />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-post" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-ad" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-palava" options={{ presentation: "modal" }} />
        <Stack.Screen name="go-live" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-page" options={{ presentation: "modal" }} />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="chat/[userId]" />
        <Stack.Screen name="page/[pageId]" />
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <FeedProvider>
                  <AdsProvider>
                    <MessagingProvider>
                      <RootLayoutNav />
                    </MessagingProvider>
                  </AdsProvider>
                </FeedProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
