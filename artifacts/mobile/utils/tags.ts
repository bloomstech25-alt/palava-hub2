/**
 * Shared hashtag parsing + normalization helpers used by the Explore →
 * Trending tab and the topic detail screen. Keeping the rules in one
 * place prevents the trends list and the topic page from diverging
 * (e.g. a tag showing up in trends but matching zero posts on tap).
 */

export interface NormalizedTag {
  /** Lowercased + trimmed, no leading `#`. The canonical key. */
  key: string;
  /** Original casing/spacing (with leading `#` stripped) for display. */
  display: string;
}

/** Trim, drop a leading `#`, and lowercase. Returns `""` for invalid input. */
export function normalizeTagKey(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/^#/, "").trim().toLowerCase();
}

/** Strip a leading `#` and trim, preserving original case for display. */
export function normalizeTagDisplay(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/^#/, "").trim();
}

/**
 * Collect every distinct hashtag mentioned by a single post — combining the
 * explicit `tags` array with any `#word` tokens parsed from `content` — and
 * dedupe by lowercase key so the same tag never counts twice for one post.
 *
 * Returns a Map keyed by the lowercase tag, with the value being the
 * preferred display label (first occurrence wins).
 */
export function collectPostTags(post: {
  tags?: unknown[] | null;
  content?: string | null;
}): Map<string, string> {
  const out = new Map<string, string>();

  for (const raw of post.tags ?? []) {
    const key = normalizeTagKey(raw);
    if (!key || out.has(key)) continue;
    out.set(key, normalizeTagDisplay(raw) || key);
  }

  const matches = (post.content ?? "").match(/#(\w+)/g) ?? [];
  for (const m of matches) {
    const key = normalizeTagKey(m);
    if (!key || out.has(key)) continue;
    out.set(key, m.slice(1));
  }

  return out;
}

/** True if `post` mentions `needle` (case-insensitive, ignores leading #). */
export function postHasTag(
  post: { tags?: unknown[] | null; content?: string | null },
  needle: string,
): boolean {
  const target = normalizeTagKey(needle);
  if (!target) return false;
  return collectPostTags(post).has(target);
}
