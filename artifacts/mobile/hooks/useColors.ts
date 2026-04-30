import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Reads the resolved scheme from `ThemeContext` (which honors the user's
 * persisted preference plus the system appearance setting), then returns
 * the matching palette. Falls back to the light palette if `dark` isn't
 * defined in `constants/colors.ts`.
 */
export function useColors() {
  const { resolved } = useTheme();
  const palette =
    resolved === "dark" && "dark" in colors
      ? (colors as unknown as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
