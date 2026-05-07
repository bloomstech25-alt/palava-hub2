// Returns a URI safe to pass to <Image source={{ uri }} />.
//
// Why: iOS native networking (RCTHTTPRequestHandler) cannot fetch `blob:`
// URLs and crashes with "No suitable URL request handler found for blob:".
// `file://` URIs from a different app session (e.g. cached on a previous
// device or saved in Firestore from a failed upload) are also invalid —
// the file is gone but the URI string lingers in the user profile.
//
// Anything that isn't an http(s) or data: URL is replaced with a generated
// avatar placeholder keyed off the user's name so the UI never shows a
// broken image and never crashes.
export function safeAvatarUri(
  uri: string | null | undefined,
  fallbackName: string = "U",
): string {
  if (typeof uri === "string") {
    const trimmed = uri.trim();
    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:")
    ) {
      return trimmed;
    }
  }
  const name = (fallbackName || "U").slice(0, 24);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=BF0A30&color=fff&size=200`;
}
