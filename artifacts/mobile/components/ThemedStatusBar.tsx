import { StatusBar, type StatusBarProps } from "expo-status-bar";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Wrapper around `expo-status-bar` that picks the right text color based on
 * the user's theme preference. We can't use `style="auto"` from
 * expo-status-bar because it only honors the SYSTEM color scheme — it
 * ignores our in-app override (light / dark / system) stored in
 * `ThemeContext`.
 */
export function ThemedStatusBar(props: Omit<StatusBarProps, "style">) {
  const { resolved } = useTheme();
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} {...props} />;
}
