# Quote Template Studio

React + Vite app for Bill Layne Insurance Agency staff to turn auto and home carrier quote PDFs into Gmail-ready HTML quote emails.

The app can:
- Upload a carrier PDF or image and parse it with Gemini through a Cloudflare Pages Function.
- Load auto/home sample data for testing.
- Edit structured quote data in a staff form or the advanced JSON editor.
- Render a live 600px Gmail preview.
- Copy HTML, copy the plain-text companion, or download a self-contained `.html` file.
- Open a customer confirmation page from email CTAs and notify `docs@billlayneinsurance.com` when the customer asks to be contacted.
- Run Gmail safety checks: byte count, clean mailto, no banned circles/headshot strings, Schema JSON-LD, and home TIV compliance.

## Local Development

Install dependencies:

```bash
npm install
```

Frontend only:

```bash
npm run dev
```

The UI runs at `http://127.0.0.1:3000`, but PDF parsing will 404 because the Cloudflare function is not running.

Full stack with the PDF parser:

```bash
cp .dev.vars.example .dev.vars
# Put your real Gemini key in .dev.vars as GEMINI_API_KEY=...
npm run dev:cf
```

Wrangler serves the full app at `http://127.0.0.1:8788` and proxies Vite on `http://127.0.0.1:3000`.

## Project Map

| Path | Purpose |
| --- | --- |
| `App.tsx` | Staff-facing upload, edit, preview, and export UI |
| `config/brand.ts` | Agency logo, address, colors, social links |
| `config/carriers.ts` | Carrier registry and logo/legal names |
| `types/auto.ts`, `types/home.ts` | Structured quote data contracts |
| `templates/` | React email components rendered to static Gmail HTML |
| `lib/htmlSerialize.tsx` | `renderToStaticMarkup()` wrapper |
| `lib/integrityCheck.ts` | Gmail clipping and safety checks |
| `lib/plainTextCompanion.ts` | Multipart plain-text companion copy |
| `functions/api/parse-quote.ts` | Server-side Gemini PDF parser |
| `data/samples.ts` | Auto/home fixtures from the handoff |

## Deployment

Build:

```bash
npm run build
```

Deploy to Cloudflare Pages:

```bash
npm run deploy
```

Set `GEMINI_API_KEY` as a Cloudflare Pages secret for production and preview. The key must stay server-side; do not expose it in Vite client env vars.

Quote action notifications use the `/quote-action` Cloudflare Pages Function. Set these production variables/secrets:

```bash
wrangler pages secret put RESEND_API_KEY --project-name quote-template-studio
wrangler pages secret put QUOTE_NOTICE_FROM --project-name quote-template-studio
wrangler pages secret put QUOTE_NOTICE_TO --project-name quote-template-studio
```

`QUOTE_NOTICE_TO` should be `docs@billlayneinsurance.com`. `QUOTE_NOTICE_FROM` must be a sender/domain verified in Resend. Optional Twilio SMS notifications can be enabled with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, and `TWILIO_TO_NUMBER`.
