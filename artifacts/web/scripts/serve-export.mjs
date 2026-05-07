import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist", "public");
const BASE = process.env.BASE_PATH ?? "/web/";
const PORT = Number(process.env.PORT);

if (!PORT || Number.isNaN(PORT)) {
  console.error("PORT environment variable is required");
  process.exit(1);
}

if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("");
  console.error("=========================================================");
  console.error("  No web build found at " + DIST);
  console.error("  Run: pnpm --filter @workspace/web run build");
  console.error("  This exports the Expo app to a static web bundle.");
  console.error("=========================================================");
  console.error("");
  process.exit(1);
}

const app = express();

let normBase = BASE.startsWith("/") ? BASE : `/${BASE}`;
if (normBase.length > 1 && normBase.endsWith("/")) normBase = normBase.slice(0, -1);
const baseRoute = normBase;

app.use(baseRoute, express.static(DIST, {
  index: false,
  dotfiles: "allow",
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    } else if (/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));

const fallbackPattern = baseRoute === "" ? /.*/ : new RegExp(`^${baseRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/.*)?$`);
app.get(fallbackPattern, (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(path.join(DIST, "index.html"));
});

app.use((_req, res) => {
  res.status(404).type("text/plain").send("Not Found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Palava Hub Web serving ${DIST} at port ${PORT} (base ${BASE})`);
});
