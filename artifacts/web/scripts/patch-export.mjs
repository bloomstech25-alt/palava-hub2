import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX = path.resolve(__dirname, "..", "dist", "public", "index.html");

if (!fs.existsSync(INDEX)) {
  console.error(`patch-export: ${INDEX} not found`);
  process.exit(1);
}

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
