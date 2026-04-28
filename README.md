# InsureClear — AI Quote Proposal Generator

Upload a PDF or image of an insurance quote, and Gemini parses it into a clean,
consumer-friendly proposal template (home, auto, or other).

The Gemini API call runs **server-side** in a Cloudflare Pages Function, so
your API key is never shipped to the browser.

---

## Architecture

```
Browser (React + Vite)
   │  POST /api/parse-quote  { base64Data, mimeType, instructions, quoteType }
   ▼
Cloudflare Pages Function   ──►   Google Gemini API
   (functions/api/parse-quote.ts)
   reads GEMINI_API_KEY from env
```

Static frontend deploys to Cloudflare Pages. The Pages Function runs on the
Workers runtime and is the only place the API key is ever read.

---

## 1. Local development

**Requires Node.js 20+.**

```bash
npm install
```

### Option A — frontend only (no AI calls)
```bash
npm run dev
```
The UI runs at `http://localhost:3000`, but uploads to `/api/parse-quote` will
404 because the Pages Function is not running.

### Option B — full stack with Wrangler
```bash
cp .dev.vars.example .dev.vars   # then put your real Gemini key in .dev.vars
npm run dev:cf
```
This boots `wrangler pages dev` in front of Vite so the function and the
frontend run together. `.dev.vars` is gitignored.

---

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `.env.local`, `.dev.vars`, `node_modules`, `dist`,
and `.wrangler/` — none of those should ever be committed.

---

## 3. Deploy to Cloudflare Pages

### Connect the repo
1. Cloudflare dashboard → **Workers & Pages** → **Create application** →
   **Pages** → **Connect to Git**.
2. Pick the GitHub repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (set `NODE_VERSION=20` env var if needed)

### Add the API key as a secret
After the first deploy:
1. Open the Pages project → **Settings → Environment variables**.
2. Click **Add variable**.
3. **Variable name:** `GEMINI_API_KEY`
4. **Value:** paste your Gemini API key
5. **Type:** **Secret** (encrypted — important; do not use plaintext)
6. Apply to **Production** and **Preview**.
7. Trigger a redeploy (any push, or **Deployments → Retry**) so the function
   picks up the new variable.

The `functions/` directory is auto-detected by Cloudflare Pages and deployed
alongside the static site. No extra config needed.

### Verify
After deploy, upload a sample PDF in the UI. If something is wrong:
- **DevTools → Network → /api/parse-quote** — look at the JSON error.
- **Cloudflare dashboard → Pages → your project → Functions → Real-time logs**
  shows the function's stderr (e.g. missing key, Gemini API errors).

---

## 4. Deploy from the CLI (optional)

If you'd rather skip the GitHub integration:

```bash
npx wrangler login
npm run deploy        # vite build && wrangler pages deploy dist
npx wrangler pages secret put GEMINI_API_KEY --project-name=<your-project>
```

---

## File map

| Path                              | What it does                                   |
| --------------------------------- | ---------------------------------------------- |
| `App.tsx`, `components/`          | React UI                                       |
| `services/geminiService.ts`       | Browser → calls `/api/parse-quote`             |
| `utils/htmlGenerator.ts`          | Turns parsed data into the downloadable HTML   |
| `functions/api/parse-quote.ts`    | **Server-side** Gemini proxy (holds the key)   |
| `functions/tsconfig.json`         | TS config so worker types resolve              |
| `vite.config.ts`                  | Vite build (no secrets injected)               |
| `.dev.vars.example`               | Template for local Wrangler secrets            |

---

## Security notes

- **Never** put the API key back into `vite.config.ts` `define` — that bakes
  it into the public JS bundle.
- The `.env.local` file is no longer used for the API key. It's gitignored, but
  even if it were committed, the build no longer reads `GEMINI_API_KEY` from it.
- Rate limiting / abuse protection is not built in. For a public-facing
  deployment, consider adding [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/),
  a per-IP rate limiter, or auth in front of the function.
