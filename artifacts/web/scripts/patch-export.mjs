import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "..", "dist", "public");
const INDEX = path.join(PUBLIC_DIR, "index.html");

if (!fs.existsSync(INDEX)) {
  console.error(`patch-export: ${INDEX} not found`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1) Inject scroll-fix overrides into index.html (always)
// ---------------------------------------------------------------------------
let html = fs.readFileSync(INDEX, "utf8");

const OVERRIDE = `<style id="palava-web-overrides">
  /* Allow normal browser scrolling — Expo's expo-reset disables it. */
  html, body { height: auto !important; min-height: 100%; overflow: auto !important; overscroll-behavior-y: none; }
  body { -webkit-overflow-scrolling: touch; }
  #root { height: auto !important; min-height: 100vh; display: flex; flex-direction: column; }
</style>`;

if (!html.includes("palava-web-overrides")) {
  html = html.replace("</head>", `${OVERRIDE}</head>`);
  fs.writeFileSync(INDEX, html);
  console.log("patch-export: injected scroll overrides into index.html");
} else {
  console.log("patch-export: overrides already present");
}

// ---------------------------------------------------------------------------
// 2) Optionally rewrite the baked-in `/web/` baseUrl → `/` for Firebase Hosting
//    Triggered by HOSTING=1. The Replit preview keeps `/web/` (proxy path),
//    while Firebase Hosting serves at the site root.
// ---------------------------------------------------------------------------
if (process.env.HOSTING === "1") {
  const FROM = "/web/";
  const TO = "/";
  const TEXT_EXTS = new Set([
    ".html",
    ".js",
    ".mjs",
    ".cjs",
    ".css",
    ".json",
    ".map",
    ".txt",
    ".webmanifest",
  ]);

  let filesPatched = 0;
  let occurrences = 0;

  /** @param {string} dir */
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!TEXT_EXTS.has(path.extname(entry.name).toLowerCase())) continue;
      const original = fs.readFileSync(full, "utf8");
      if (!original.includes(FROM)) continue;
      // Only replace `/web/` occurrences that look like absolute asset paths.
      // Guard against accidental matches in URLs like `https://example.com/web/...`
      // by requiring the preceding char to be a quote, parenthesis, equals, or
      // start-of-string boundary.
      const re = /(^|["'(=,\s])\/web\//g;
      const patched = original.replace(re, (_m, p1) => `${p1}${TO}`);
      if (patched === original) continue;
      const count = (original.match(re) || []).length;
      occurrences += count;
      fs.writeFileSync(full, patched);
      filesPatched += 1;
    }
  };

  walk(PUBLIC_DIR);
  console.log(
    `patch-export: HOSTING=1 — rewrote ${occurrences} \`${FROM}\` → \`${TO}\` reference(s) across ${filesPatched} file(s)`,
  );
}
