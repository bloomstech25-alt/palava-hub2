import { Router, type IRouter, type Request, type Response } from "express";
import Parser from "rss-parser";

const router: IRouter = Router();

// Catalog of Liberian news pages users can follow.
// We aggregate public RSS / web feeds — no API keys required.
export const NEWS_PAGES = [
  {
    id: "fpa",
    name: "FrontPage Africa",
    handle: "frontpageafrica",
    category: "news",
    description: "Liberia's leading independent newspaper — politics, business, and society.",
    color: "#0F4C81",
    rss: "https://frontpageafricaonline.com/feed/",
  },
  {
    id: "observer",
    name: "Liberian Observer",
    handle: "liberianobserver",
    category: "news",
    description: "Daily news, opinion, and analysis from Monrovia.",
    color: "#B91C1C",
    rss: "https://www.liberianobserver.com/feed/",
  },
  {
    id: "bushchicken",
    name: "Bush Chicken",
    handle: "bushchicken",
    category: "news",
    description: "In-depth journalism from across all 15 counties of Liberia.",
    color: "#047857",
    rss: "https://www.bushchicken.com/feed/",
  },
  {
    id: "newdawn",
    name: "The New Dawn",
    handle: "newdawnliberia",
    category: "news",
    description: "Truth to the world — daily Liberian news coverage.",
    color: "#1E40AF",
    rss: "https://thenewdawnliberia.com/feed/",
  },
  {
    id: "lib_sports",
    name: "Liberia Football",
    handle: "liberiafootball",
    category: "sports",
    description: "Lone Star, LFA, and Liberian football coverage.",
    color: "#16A34A",
    rss: "https://frontpageafricaonline.com/sports/feed/",
  },
  {
    id: "fpa_entertainment",
    name: "FPA Entertainment",
    handle: "fpa_entertainment",
    category: "entertainment",
    description: "Liberian music, movies, and celebrity news.",
    color: "#DB2777",
    rss: "https://frontpageafricaonline.com/entertainment/feed/",
  },
  {
    id: "observer_sports",
    name: "Observer Sports",
    handle: "observersports",
    category: "sports",
    description: "Sports headlines from the Liberian Observer.",
    color: "#EA580C",
    rss: "https://www.liberianobserver.com/sports/feed/",
  },
  {
    id: "observer_lifestyle",
    name: "Observer Lifestyle",
    handle: "observerlifestyle",
    category: "entertainment",
    description: "Liberian lifestyle, culture, and entertainment.",
    color: "#9333EA",
    rss: "https://www.liberianobserver.com/lifestyle/feed/",
  },
] as const;

type NewsItem = {
  pageId: string;
  pageName: string;
  pageColor: string;
  category: string;
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string;
};

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "PalavaHub/1.0 (+https://palava-hub.app)" },
});

// Cache feeds for 10 minutes — news doesn't change every second
const feedCache = new Map<string, { items: NewsItem[]; cachedAt: number }>();
const CACHE_MS = 10 * 60 * 1000;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item: Record<string, unknown>): string | null {
  // Common RSS image fields
  const enc = item.enclosure as { url?: string } | undefined;
  if (enc?.url && /\.(jpe?g|png|webp|gif)/i.test(enc.url)) return enc.url;
  const media = (item["media:content"] as { $?: { url?: string } } | undefined)?.$?.url;
  if (media) return media;
  const mediaThumb = (item["media:thumbnail"] as { $?: { url?: string } } | undefined)?.$?.url;
  if (mediaThumb) return mediaThumb;
  // Look for first <img> in content
  const content = String(item["content:encoded"] ?? item.content ?? "");
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

async function fetchPage(pageId: string): Promise<NewsItem[]> {
  const page = NEWS_PAGES.find((p) => p.id === pageId);
  if (!page) return [];
  const cached = feedCache.get(pageId);
  if (cached && Date.now() - cached.cachedAt < CACHE_MS) return cached.items;
  try {
    const feed = await parser.parseURL(page.rss);
    const items: NewsItem[] = (feed.items ?? []).slice(0, 15).map((it) => {
      const raw = it as Record<string, unknown>;
      const summary = stripHtml(String(raw.contentSnippet ?? raw.content ?? raw.summary ?? "")).slice(0, 280);
      return {
        pageId: page.id,
        pageName: page.name,
        pageColor: page.color,
        category: page.category,
        title: String(it.title ?? "").trim(),
        link: String(it.link ?? "").trim(),
        summary,
        imageUrl: extractImage(raw),
        publishedAt: String(it.isoDate ?? it.pubDate ?? new Date().toISOString()),
      };
    }).filter((i) => i.title && i.link);
    feedCache.set(pageId, { items, cachedAt: Date.now() });
    return items;
  } catch (err) {
    // Keep stale cache on failure if we have one
    if (cached) return cached.items;
    return [];
  }
}

// GET /api/news/pages — list all available news/sports/entertainment pages
router.get("/news/pages", (_req: Request, res: Response) => {
  res.json(NEWS_PAGES.map(({ rss: _rss, ...rest }) => rest));
});

// GET /api/news/feed?pages=fpa,observer  — aggregated, sorted by date
router.get("/news/feed", async (req: Request, res: Response) => {
  const pagesParam = String(req.query.pages ?? "").trim();
  const pageIds = pagesParam
    ? pagesParam.split(",").map((s) => s.trim()).filter(Boolean)
    : NEWS_PAGES.map((p) => p.id); // default = everything

  const validIds = pageIds.filter((id) => NEWS_PAGES.some((p) => p.id === id));
  if (validIds.length === 0) {
    res.json({ items: [] });
    return;
  }

  const results = await Promise.all(validIds.map((id) => fetchPage(id)));
  const merged = results.flat();
  merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  res.json({ items: merged.slice(0, 60) });
});

// GET /api/news/page/:id — single page feed
router.get("/news/page/:id", async (req: Request, res: Response) => {
  const items = await fetchPage(req.params.id);
  res.json({ items });
});

export default router;
