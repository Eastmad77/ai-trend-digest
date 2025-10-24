import { htmlEscape } from "./utils.js";

const ADS_CLIENT = process.env.ADSENSE_CLIENT || ""; // e.g., ca-pub-XXXX
const HAS_ADS = !!ADS_CLIENT;

const NL_PROVIDER = (process.env.NEWSLETTER_PROVIDER || "buttondown").toLowerCase();
const NL_ID = process.env.NEWSLETTER_ID || "";
const NL_FORM_ACTION = process.env.NEWSLETTER_FORM_ACTION || "";

function adHeadSnippet() {
  if (!HAS_ADS) return "";
  return `
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}" crossorigin="anonymous"></script>
<script>
  window.adsbygoogle = window.adsbygoogle || [];
</script>`;
}

function adBlock({ slot = "in-article" } = {}) {
  if (!HAS_ADS) return "";
  return `
<div class="adwrap">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-format="fluid"
       data-ad-layout-key="-fb+5w+4e-db+86"
       data-ad-client="${ADS_CLIENT}"
       data-ad-slot="auto"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>`;
}

function newsletterBlock() {
  if (NL_PROVIDER === "buttondown" && NL_ID) {
    return `
<section class="newsletter">
  <h2>Get the Daily Digest</h2>
  <form action="https://buttondown.email/api/emails/embed-subscribe/${htmlEscape(NL_ID)}" method="post" target="popupwindow" onsubmit="window.open('https://buttondown.email/${htmlEscape(NL_ID)}', 'popupwindow')">
    <input type="email" name="email" placeholder="you@example.com" required>
    <button type="submit">Subscribe</button>
    <p class="small">Powered by Buttondown • Unsubscribe anytime</p>
  </form>
</section>`;
  }
  if (NL_PROVIDER === "mailchimp" && NL_FORM_ACTION) {
    return `
<section class="newsletter">
  <h2>Get the Daily Digest</h2>
  <form action="${htmlEscape(NL_FORM_ACTION)}" method="post" target="_blank" novalidate>
    <input type="email" name="EMAIL" placeholder="you@example.com" required>
    <button type="submit">Subscribe</button>
    <p class="small">Powered by Mailchimp • Unsubscribe anytime</p>
  </form>
</section>`;
  }
  return "";
}

function cookieConsent() {
  return `
<div id="cc" class="cc" style="display:none">
  <div class="cc-box">
    <p>We use cookies for analytics & ads. <a href="/privacy.html">Learn more</a>.</p>
    <button id="cc-accept">OK</button>
  </div>
</div>
<script>
  (function(){
    try{
      if(!localStorage.getItem('ccok')){
        var el=document.getElementById('cc');
        var btn=document.getElementById('cc-accept');
        el.style.display='block';
        btn.addEventListener('click',function(){
          localStorage.setItem('ccok','1'); el.remove();
        });
      }
    }catch(e){}
  })();
</script>`;
}

export function pageTemplate({ title, dateStr, stories, siteBase }) {
  // Build cards and inject inline ads every ~6 items
  const chunks = [];
  stories.forEach((s, i) => {
    chunks.push(`
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
            ? `<ul class="tags">${s.aiKeywords.map((k) => `<li>${htmlEscape(k)}</li>`).join("")}</ul>`
            : ""
        }
      </article>`);
    if (HAS_ADS && i > 0 && (i + 1) % 6 === 0) {
      chunks.push(adBlock({ slot: "inline" }));
    }
  });

  return baseLayout({
    title,
    headExtras: adHeadSnippet(),
    body: `
    <header class="hero">
      <h1>${htmlEscape(title)}</h1>
      <p class="sub">Daily AI-curated headlines — ${htmlEscape(dateStr)}</p>
    </header>
    ${adBlock({ slot: "top" })}
    <main class="grid">${chunks.join("\n")}</main>
    ${newsletterBlock()}
    `,
    siteBase
  });
}

export function indexTemplate({ latestDate, latestUrl, recentLinks, siteBase }) {
  const list = recentLinks.map(({ date, url }) => `<li><a href="${url}">${date}</a></li>`).join("");

  return baseLayout({
    title: "AI Trend Digest",
    headExtras: adHeadSnippet(),
    body: `
      <header class="hero">
        <h1>AI Trend Digest</h1>
        <p class="sub">Daily, automated summaries. Zero fluff.</p>
        <p><a class="btn" href="${latestUrl}">Read today’s edition (${latestDate})</a></p>
      </header>
      ${adBlock({ slot: "index-top" })}
      <section class="recent">
        <h2>Recent Editions</h2>
        <ul>${list}</ul>
      </section>
      ${newsletterBlock()}
    `,
    siteBase
  });
}

export function legalPage({ title, content, siteBase }) {
  return baseLayout({
    title,
    headExtras: "",
    body: `
    <main class="legal">
      <h1>${htmlEscape(title)}</h1>
      ${content}
    </main>`,
    siteBase
  });
}

function baseLayout({ title, body, siteBase, headExtras = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${htmlEscape(title)}</title>
<meta name="description" content="Automated AI news summaries for busy humans." />
<link rel="canonical" href="${siteBase}" />
<link rel="stylesheet" href="/assets/styles.css" />
${headExtras}
</head>
<body>
<nav class="top">
  <a href="/">AI Trend Digest</a>
  <a href="/feed.xml">RSS</a>
  <a href="/privacy.html">Privacy</a>
  <a href="/terms.html">Terms</a>
</nav>
${body}
<footer class="foot">
  <p>© ${new Date().getFullYear()} AI Trend Digest • Updated daily by automation.</p>
</footer>
${cookieConsent()}
</body>
</html>`;
}
