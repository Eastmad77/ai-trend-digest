# AI Trend Digest (Fully Automated)

A self-updating site that fetches tech/AI headlines, summarises them with OpenAI, and publishes daily.
Perfect for AdSense + newsletter growth.

## Quick Start

1) **Create repo** on GitHub, push this folder.

2) **Set GitHub Secrets** (Settings → Secrets and variables → Actions):
- `OPENAI_API_KEY`
- (optional) `NEWSAPI_KEY`
- `SITE_BASE` → your Netlify URL (set after first deploy; safe to leave for now)

3) **Deploy to Netlify**
- New site from Git
- Build cmd: `npm run build`
- Publish dir: `site`
- After first deploy, copy live URL into GitHub Secret `SITE_BASE`.

4) **Enable the GitHub Action**
- It will run daily (see `.github/workflows/daily.yml`) and commit fresh pages to `site/`.
- Every commit triggers Netlify to redeploy.

## Local Dev

```bash
cp .env.example .env
npm i
npm run dev
# open http://localhost:4321
