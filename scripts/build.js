import "dotenv/config.js";
import fs from "fs";
import path from "path";
import { formatInTimeZone } from "date-fns-tz";
import { fetchCandidates } from "./fetch.js";
import { summariseBatch } from "./summarise.js";
import { ensureDir, writeFile, todayParts, absoluteUrl } from "./utils.js";
import { pageTemplate, indexTemplate, legalPage } from "./templates.js";

const SITE_DIR = "site";
const POSTS_DIR = path.join(SITE_DIR, "posts");
const ASSETS_DIR = path.join(SITE_DIR, "assets");
const SITE_BASE = process.env.SITE_BASE || "https://your-site.netlify.app";

function styles() {
  return `:root{--mx:1100px;--pad:18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
body{margin:0;background:#0b0c10;color:#e9eef3}
a{color:#cfe7ff;text-decoration:none}
a:hover{text-decoration:underline}
.top{display:flex;gap:16px;align-items:center;padding:12px var(--pad);max-width:var(--mx);margin:0 auto}
.top a{opacity:.95}
.hero{max-width:var(--mx);margin:24px auto;padding:0 var(--pad)}
.hero h1{margin:6px 0 0;font-size:2.2rem}
.sub{opacity:.8}
.btn{display:inline-block;background:#1b88ff;color:#fff;padding:10px 14px;border-radius:10px}
.grid{max-width:var(--mx);margin:0 auto;padding:0 var(--pad);display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.card{background:#11151c;border:1px solid #1f2633;border-radius:14px;padding:16px}
.card h3{margin:8px 0 10px;font-size:1.05rem;line-height:1.25}
.meta{opacity:.7;font-size:.9rem}
.tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:12px 0 0;list-style:none}
.tags li{background:#1a2333;border:1px solid #273349;padding:4px 8px;border-radius:999px;font-size:.85rem}
.recent{max-width:var(--mx);margin:0 auto;padding:0 var(--pad)}
.recent ul{list-style:disc;margin-left:20px}
.foot{max-width:var(--mx);margin:40px auto;padding:12px var(--pad);opacity:.7;border-top:1px solid #1f2633}

/* Ads + newsletter */
.adwrap{max-width:var(--mx);margin:10px auto;padding:0 var(--pad)}
.newsletter{max-width:720px;margin:28px auto;padding:0 var(--pad)}
.newsletter form{display:flex;gap:10px;flex-wrap:wrap}
.newsletter input{flex:1;min-width:240px;padding:10px 12px;border-radius:10px;border:1px solid #263042;background:#0e1218;color:#e9eef3}
.newsletter button{padding:10px 14px;border-radius:10px;background:#1b88ff;color:#fff;border:0}
.newsletter .small{opacity:.7;font-size:.85rem;margin-top:6px}

/* Legal */
.legal{max-width:var(--mx);margin:20px auto;padding:0 var(--pad)}
.legal h1{font-size:2rem;margin:10px 0 14px}
.legal p{line-height:1.55}

/* Cookie */
.cc{position:fixed;left:0;right:0;bottom:0;padding:12px}
.cc-box{max-width:var(--mx);margin:0 auto;background:#0f1420;border:1px solid #1f2633;border-radius:12px;padding:12px;display:flex;gap:10px;align-items:center;justify-content:space-between}
.cc a{color:#cfe7ff}
.cc button{background:#1b88ff;color:#fff;border:0;border-radius:10px;padding:8px 12px}
`;
}

function rssXml(items) {
  const now = new Date().toUTCString();
  const itemsXml = items
    .map(
      (it) => `
<item>
  <title>${escapeXml(it.title)}</title>
  <link>${escapeXml(it.url)}</link>
  <guid>${escapeXml(it.url)}</guid>
  <pubDate>${new Date(it.date + "T00:00:00Z").toUTCString()}</pubDate>
  <description>${escapeXml(it.description)}</description>
</item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>AI Trend Digest</title>
  <link>${escapeXml(SITE_BASE)}</link>
  <description>Automated AI news summaries for busy humans.</description>
  <lastBuildDate>${now}</lastBuildDate>
  ${itemsXml}
</channel>
</rss>`;
}

function sitemapXml(items) {
  const urls = items.map((it) => `<url><loc>${escapeXml(it.url)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${escapeXml(SITE_BASE)}</loc></url>
  ${urls}
</urlset>`;
}

function escapeXml(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- Legal page bodies (simple defaults you can edit) ---
function privacyHtml() {
  return `
<p>We use cookies and similar technologies for analytics, personalisation, and to serve ads via third-party partners (e.g., Google AdSense). Third parties may place and read cookies in your browser, or use web beacons to collect information as a result of ad serving on this site.</p>
<p>You can manage cookies in your browser settings. For Google’s ad policies and data use, see <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">Google’s Partner Sites policy</a>.</p>
<p>For data queries, contact us via the newsletter reply address.</p>`;
}

function termsHtml() {
  return `
<p>By using this site, you agree to our use of third-party services for content fetching, analytics, and advertising. Content is summarised by automated systems; verify facts on the original sources linked in each article.</p>
<p>We reserve the right to update or remove content at any time. No warranty is provided.</p>`;
}

(async () => {
  // 1) Fetch & summarise
  const candidates = await fetchCandidates();
  const stories = await summariseBatch(candidates);

  // 2) Build today page
  const { iso } = todayParts();
  const dayDir = path.join(POSTS_DIR, iso);
  ensureDir(dayDir);
  ensureDir(ASSETS_DIR);

  // write styles if missing
  const cssPath = path.join(ASSETS_DIR, "styles.css");
  if (!fs.existsSync(cssPath)) writeFile(cssPath, styles());

  const dateStr = formatInTimeZone(new Date(), "Pacific/Auckland", "d MMMM yyyy");
  const pageHtml = pageTemplate({
    title: `Daily Digest — ${dateStr}`,
    dateStr,
    stories,
    siteBase: SITE_BASE
  });
  writeFile(path.join(dayDir, "index.html"), pageHtml);

  // 3) Build index + feeds from last 14 days
  const days = fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .slice(-14);

  const recent = days
    .map((d) => ({
      date: d,
      url: absoluteUrl(SITE_BASE, `/posts/${d}/`)
    }))
    .reverse();

  const latestUrl = recent[0]?.url || absoluteUrl(SITE_BASE, `/posts/${iso}/`);
  const latestDate = recent[0]?.date || iso;

  writeFile(
    path.join(SITE_DIR, "index.html"),
    indexTemplate({ latestDate, latestUrl, recentLinks: recent, siteBase: SITE_BASE })
  );

  writeFile(
    path.join(SITE_DIR, "feed.xml"),
    rssXml(
      recent.map((r) => ({
        title: `AI Trend Digest — ${r.date}`,
        url: r.url,
        date: r.date,
        description: "Automated AI news summaries."
      }))
    )
  );

  writeFile(
    path.join(SITE_DIR, "sitemap.xml"),
    sitemapXml(recent.map((r) => ({ url: r.url })))
  );

  // 4) Legal pages
  writeFile(path.join(SITE_DIR, "privacy.html"), legalPage({ title: "Privacy Policy", content: privacyHtml(), siteBase: SITE_BASE }));
  writeFile(path.join(SITE_DIR, "terms.html"), legalPage({ title: "Terms of Use", content: termsHtml(), siteBase: SITE_BASE }));

  console.log(`Built site for ${iso} with ${stories.length} stories.`);
})();
