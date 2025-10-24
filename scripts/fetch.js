import Parser from "rss-parser";
import { fetch } from "undici";

const parser = new Parser();

/**
 * You can add/remove feeds here. Keep it focused on your niche.
 */
const RSS_FEEDS = [
  // Tech/AI examples
  "https://news.ycombinator.com/rss",
  "https://www.theverge.com/rss/index.xml",
  "https://feeds.feedburner.com/TechCrunch/",
  "https://www.reddit.com/r/MachineLearning/.rss",
  "https://www.reddit.com/r/artificial/.rss"
];

// Optional NewsAPI (set NEWSAPI_KEY)
async function fromNewsAPI() {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];
  // Top headlines in tech as example
  const url =
    "https://newsapi.org/v2/top-headlines?category=technology&pageSize=20";
  const res = await fetch(url, { headers: { "X-Api-Key": key } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles || []).map((a) => ({
    source: a.source?.name || "NewsAPI",
    title: a.title || "",
    link: a.url,
    excerpt: a.description || "",
    published: a.publishedAt || ""
  }));
}

async function fromRss() {
  const all = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      (feed.items || []).slice(0, 10).forEach((item) =>
        all.push({
          source: feed.title || "RSS",
          title: item.title || "",
          link: item.link || "",
          excerpt: item.contentSnippet || item.content || "",
          published: item.isoDate || item.pubDate || ""
        })
      );
    } catch {
      // skip broken feed
    }
  }
  return all;
}

export async function fetchCandidates() {
  const [rss, news] = await Promise.all([fromRss(), fromNewsAPI()]);
  const items = [...rss, ...news]
    .filter((x) => x.title && x.link)
    // remove dupes by link
    .filter(
      (x, i, arr) => arr.findIndex((y) => (y.link || "").trim() === (x.link || "").trim()) === i
    );
  // limit to ~15/day for faster, cheaper runs
  return items.slice(0, 15);
}
