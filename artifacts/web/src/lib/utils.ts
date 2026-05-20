export function timeAgo(input: unknown): string {
  if (!input) return "";
  let ms: number;
  if (typeof input === "number") ms = input;
  else if (input instanceof Date) ms = input.getTime();
  else if (typeof input === "object" && input !== null && "seconds" in input) {
    ms = (input as { seconds: number }).seconds * 1000;
  } else return "";
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(seed: string): string {
  const palette = [
    "#0866FF",
    "#BF0A30",
    "#D4A12A",
    "#1B998B",
    "#7B61FF",
    "#E84393",
    "#00B894",
    "#F39C12",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length]!;
}
