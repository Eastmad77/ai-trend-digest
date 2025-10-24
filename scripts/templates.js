import { htmlEscape } from "./utils.js";

export function pageTemplate({ title, dateStr, stories, siteBase }) {
  const itemsHtml = stories
    .map(
      (s) => `
      <article class="card">
        <div class="meta">
          <span class="source">${htmlEscape(s.source || "")}</span>
        </div>
        <h3><a href="${s.link}" rel="noopener nofollow" target="_blank">${htmlEscape(
        s.aiTitle || s.title
      )}</a></h3>
        <p>${htmlEscape(s.aiSummary || s.excerpt || "")}</p>
        ${
          (s.aiKeywords || []).length
            ? `<ul class="tags">${s.aiKeywords
                .map((k) => `<li>${htmlEscape(k)}</li>`)
                .join("")}</ul>`
            : ""
        }
      </article>`
    )
    .join("\n");

  return baseLayout({
    title,
    body: `
    <header class="hero">
      <h1>${htmlEscape(title)}</h1>
      <p class="sub">Daily AI-curated headlines — ${htmlEscape(dateStr)}</p>
    </header>
    <main class="grid">${itemsHtml}</main>
    `,
    siteBase
  });
}

export function indexTemplate({ latestDate, latestUrl, recentLinks, siteBase }) {
  const list = recentLinks
    .map(({ date, url }) => `<li><a href="${url}">${date}</a></li>`)
    .join("");

  return baseLayout({
    title: "AI Trend Digest",
    body: `
      <header class="hero">
        <h1>AI Trend Digest</h1>
        <p class="sub">Daily, automated summaries. Zero fluff.</p>
        <p><a class="btn" href="${latestUrl}">Read today’s edition (${latestDate})</a></p>
      </header>
      <section class="recent">
        <h2>Recent Editions</h2>
        <ul>${list}</ul>
      </section>
    `,
    siteBase
  });
}

function baseLayout({ title, body, siteBase }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${htmlEscape(title)}</title>
<meta name="description" content="Automated AI news summaries for busy humans." />
<link rel="canonical" href="${siteBase}" />
<link rel="stylesheet" href="/assets/styles.css" />
</head>
<body>
<nav class="top">
  <a href="/">AI Trend Digest</a>
  <a href="/feed.xml">RSS</a>
</nav>
${body}
<footer class="foot">
  <p>© ${new Date().getFullYear()} AI Trend Digest • Updated daily by automation.</p>
</footer>
</body>
</html>`;
}
