import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (p: ThemePreference) => Promise<void>;
};

const STORAGE_KEY = "@palavahub/themePreference";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [hydrated, setHydrated] = useState(false);

  // Load saved preference on mount so the user's last choice persists across
  // app restarts, even though Firebase auth uses inMemoryPersistence and
  // forces re-login each session.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark" || v === "system") {
          setPreferenceState(v);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setPreference = useCallback(async (p: ThemePreference) => {
    setPreferenceState(p);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, p);
    } catch {
      // best effort — UI already updated
    }
  }, []);

  const resolved: "light" | "dark" =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  // Don't flash the wrong palette before AsyncStorage hydrates — render
  // children once we know the preference.
  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback if a consumer renders outside the provider during hot
    // reload — defaults to system scheme without persistence.
    return {
      preference: "system",
      resolved: "light",
      setPreference: async () => {},
    };
  }
  return ctx;
}
