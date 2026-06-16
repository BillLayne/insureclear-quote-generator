# Quote Template Studio - Full Project Handoff

Last updated: 2026-06-10

## Executive Summary

Quote Template Studio is a React + Vite + Cloudflare Pages app for Bill Layne Insurance Agency. It turns carrier quote PDFs/images and manually edited structured data into polished customer-facing quote outputs.

The app supports:

- Gmail-ready quote emails for auto, home, motorcycle, renters, and rental dwelling quotes.
- Elite Gmail welcome/quote templates for home and auto.
- Commercial auto elite Gmail quote template.
- Auto, home, and commercial auto webpage quote outputs.
- Auto comparison quote sample templates kept separate from the main production quote modes.
- Gemini PDF/image parsing through a Cloudflare Pages Function.
- Customer action pages that collect "bind / contact me / ask question" requests and email them to the agency.
- Optional audio-review workflow for auto and home webpage quotes.
- Copy HTML, copy text, Gmail sync, PDF email, PDF HTML, and downloadable HTML outputs.

Live app:

```text
https://quote-template-studio.pages.dev/
```

Primary local project:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program
```

Current local preview:

```text
http://127.0.0.1:4173/
```

## Latest Production Status

Latest deploy completed on 2026-06-10 with:

```bash
npx wrangler@latest pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

Latest preview URL returned by Cloudflare:

```text
https://e4655e6c.quote-template-studio.pages.dev
```

Production target:

```text
https://quote-template-studio.pages.dev/
```

Latest verification completed:

- `npm run build` passed.
- Home webpage hero image renderer accepts direct Imgur image URLs.
- Home webpage hero image renderer accepts plain single-image Imgur share URLs such as `https://imgur.com/6jDPnCX`.
- Validation now accepts both direct image URLs and single-image Imgur links.
- Home webpage hero image replaces both the page hero background and `og:image`.
- Blank Home Web Page hero image still falls back to the approved default image.

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Cloudflare Pages
- Cloudflare Pages Functions
- Gemini through `@google/genai`
- Optional OpenAI speech endpoint for friendly audio review generation
- Resend email API for quote-action notices
- Optional Twilio SMS notification
- Lucide React icons

Important scripts:

```bash
npm run dev
npm run dev:cf
npm run build
npm run preview
npm run deploy
```

Recommended local preview after build:

```bash
npm run preview -- --host 127.0.0.1
```

Recommended deploy:

```bash
npm run build
npx wrangler@latest pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

## Environment Variables And Secrets

Local secret file:

```text
.dev.vars
```

Example file:

```text
.dev.vars.example
```

Current expected variables:

```text
GEMINI_API_KEY
OPENAI_API_KEY
RESEND_API_KEY
QUOTE_NOTICE_TO
QUOTE_NOTICE_FROM
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
TWILIO_TO_NUMBER
```

Required for parsing:

```text
GEMINI_API_KEY
```

Required for customer action email notices:

```text
RESEND_API_KEY
QUOTE_NOTICE_TO=docs@billlayneinsurance.com
QUOTE_NOTICE_FROM=Quote Template Studio <quotes@your-verified-domain.com>
```

Optional:

```text
OPENAI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
TWILIO_TO_NUMBER
```

API key naming standard used for this project:

```text
Google Cloud project name: Bill Layne Insurance-Quote Tem
Suggested API key name: quote-template-studio-prod-gemini-2026-06
Cloudflare Pages secret name: GEMINI_API_KEY
```

Do not put API keys in browser HTML, React files, committed `.env`, or committed `.dev.vars`.

## Repo State Warning

This working tree is still broadly dirty/migrated relative to the old git baseline. Many current source files are untracked in git even though they are real current app files.

Do not run destructive reset/checkout commands. Do not assume untracked files are disposable.

Recent `git status --short` showed legacy deletions and a migrated file layout, including:

```text
M App.tsx
M functions/api/parse-quote.ts
M package.json
D components/EditDataForm.tsx
D components/PreviewTemplate.tsx
D types.ts
D utils/htmlGenerator.ts
?? config/
?? data/
?? functions/
?? lib/
?? templates/
?? types/
?? PROJECT_HANDOFF.md
```

## High-Level App Flow

1. Staff chooses quote type: Auto, Home, Motorcycle, Renters, or Rental Home.
2. Staff uploads a carrier PDF/image and optional parsing notes.
3. Frontend calls `/api/parse-quote`.
4. Cloudflare Pages Function sends the file to Gemini and returns typed JSON.
5. Staff reviews and edits the form fields or advanced JSON.
6. Staff selects output:
   - Gmail Email
   - Auto/Home Web Page
   - Commercial Auto Web Page
7. App renders a live iframe preview.
8. Staff copies text/HTML, syncs Gmail, generates PDF email/HTML, downloads HTML, or uses the webpage output.
9. Customer CTA buttons open `/quote-action`, prefilled with quote details.
10. Customer submits the quote-action form and the app emails the request to the agency.

## Main Source Map

```text
App.tsx
```

Main UI and state manager. Handles quote type, output mode, email mode, parsing, preview, export actions, audio script/MP3 flow, and all edit forms.

```text
index.css
```

Staff app shell styling. This is not Gmail or customer webpage styling.

```text
index.tsx
```

React entry point.

```text
vite.config.ts
```

Vite config.

```text
vite-env.d.ts
```

Allows raw imports such as `?raw` HTML templates.

## Config Files

```text
config/brand.ts
```

Agency constants and shared assets.

Important values:

```text
name = Bill Layne Insurance Agency
street = 1283 N Bridge St
city/state/zip = Elkin, NC 28621
phone = (336) 835-1993
email = Save@BillLayneInsurance.com
quoteActionUrl = https://quote-template-studio.pages.dev/quote-action
logoUrl = https://i.imgur.com/lxu9nfT.png
googleIconUrl = https://i.imgur.com/nDFmjxh.png
autoCoverageInfographicUrl = https://i.imgur.com/WQojJ18.png
autoLifestyleImageUrl = https://i.imgur.com/eiSOz9F.jpeg
```

```text
config/carriers.ts
```

Carrier registry with IDs, display names, legal names, logos, claims/portal info, and carrier flags.

Commercial auto is intentionally restricted in the commercial auto renderers to:

```text
progressive
nationwide
national_general
```

```text
config/copy.ts
```

Shared copy constants and notes.

## Data Contracts

Union:

```text
types/quote.ts
```

Line-of-business types:

```text
types/auto.ts
types/home.ts
types/motorcycle.ts
types/renters.ts
types/dwelling.ts
```

Sample data:

```text
data/samples.ts
```

Used when switching quote type or starting a sample flow.

## Parsing Backend

```text
functions/api/parse-quote.ts
```

Cloudflare Pages Function for PDF/image parsing.

Current behavior:

- Accepts base64 file data, MIME type, user instructions, and target quote type.
- Uses Gemini through `@google/genai`.
- Returns schema-constrained JSON for auto, home, motorcycle, renters, or dwelling.
- Includes `heroImageUrl` in the schema but instructs Gemini to keep it blank unless a direct usable image URL appears in user notes.
- Has explicit carrier ID enum matching `config/carriers.ts`.

Important parsing instruction:

```text
heroImageUrl should be blank unless the user notes include a direct https image URL ending in .jpg, .jpeg, .png, .webp, or .gif.
```

Note: the frontend validation/rendering now also supports single-image Imgur links for manual entry.

## Customer Action Page

```text
functions/quote-action.ts
```

This is the "container/page opens after clicking Contact Me / bind / ask question" behavior.

How it works:

- Quote templates build a URL to `https://quote-template-studio.pages.dev/quote-action`.
- Query parameters prefill action, client name, client email, template type, carrier, quote number, premium, and subject.
- GET `/quote-action` returns a confirmation form.
- Customer can add best email, best phone, and notes.
- POST `/quote-action` sends an email notice through Resend to `QUOTE_NOTICE_TO`.
- Default notice recipient is `docs@billlayneinsurance.com`.
- Optional Twilio SMS sends a short alert if Twilio vars are configured.
- The page includes a honeypot field named `website`.
- Success page reminds the customer that coverage is not bound until carrier acceptance and payment.

Primary frontend URL source:

```text
config/brand.ts -> BRAND.quoteActionUrl
```

Email helper for Gmail templates:

```text
templates/shared/EmailParts.tsx -> quoteActionHref()
```

Webpage helpers:

```text
lib/autoWebPageHtml.ts -> quoteActionHref()
lib/homeWebPageHtml.ts -> quoteActionHref()
lib/commercialAutoWebPageHtml.ts -> quoteActionHref()
```

## Output Modes

Configured in:

```text
App.tsx
```

Current output mode type:

```ts
type OutputMode = 'email' | 'webpage' | 'commercialWebpage';
```

Email modes:

```text
full
short
homeElite
homeEliteQuote
autoElite
commercialAutoElite
```

Defined in:

```text
lib/htmlSerialize.tsx
```

## Gmail Email Templates

Shared renderer:

```text
lib/htmlSerialize.tsx
```

Standard quote templates:

```text
templates/AutoQuoteTemplate.tsx
templates/HomeQuoteTemplate.tsx
templates/MotorcycleQuoteTemplate.tsx
templates/RentersQuoteTemplate.tsx
templates/DwellingQuoteTemplate.tsx
templates/ShortQuoteTemplate.tsx
templates/shared/EmailParts.tsx
```

Raw Auto Gmail source:

```text
templates/email/AUTO_QUOTE_EMAIL_TEMPLATE.html
```

Auto Gmail renderer:

```text
lib/autoEmailHtml.ts
```

Important Auto Gmail fixes:

- Uses `BRAND.logoUrl` so the required `lxu9nfT.png` logo is present.
- Agent image uses rounded-square styling instead of `border-radius:50%`.
- Export buttons are enabled only when integrity checks pass.

Elite Gmail templates:

```text
templates/email/HOME_ELITE_WELCOME.html
templates/email/AUTO_ELITE_WELCOME.html
templates/email/COMMERCIAL_AUTO_ELITE_QUOTE_SAMPLE.html
templates/HomeEliteGmailTemplate.tsx
templates/HomeEliteQuoteGmailTemplate.tsx
templates/AutoEliteGmailTemplate.tsx
templates/CommercialAutoEliteGmailTemplate.tsx
```

Elite Gmail 2026 mobile rules currently applied:

- Mobile-first inline sizing.
- Do not depend on Gmail media queries for shrinking mobile content.
- Header uses stacked/two-row logic where needed so carrier logos do not fight the title.
- Avoid circular `border-radius:50%` in Gmail output because the integrity guard blocks it.
- Include `application/ld+json`.
- Include Bill Layne logo `lxu9nfT.png`.
- Keep copy condensed for Gmail mobile.
- Removed "View ID Cards / Documents" from elite welcome templates because Gmail cannot create attached document preview links by itself.

## Webpage Templates

Auto webpage:

```text
lib/autoWebPageHtml.ts
templates/web/AUTO_QUOTE_V4_FINAL_MASTER_TEMPLATE.html
```

Important Auto Web Page behavior:

- Uses the provided final auto landing-page structure.
- `heroImageUrl` can override the default hero background.
- CTA uses `QUOTE_ACTION_URL`.
- Includes payment toggle logic in the raw HTML master.
- Local service section was changed away from physical folder/welcome-kit language to "Local Agent Review" language because a folder is not always sent.
- Audio block is optional and only appears if an audio file has been added.

Home webpage:

```text
lib/homeWebPageHtml.ts
templates/web/v4_homeowners_master_template.html
```

Important Home Web Page behavior:

- Uses the homeowners web landing page structure.
- Uses `HERO_IMAGE_URL` for the hero background and `og:image`.
- If `heroImageUrl` is blank, default is:

```text
https://i.imgur.com/waSydQr.jpeg
```

- If staff pastes a direct image URL, the page uses it.
- If staff pastes a single-image Imgur share URL like `https://imgur.com/6jDPnCX`, the renderer normalizes it to:

```text
https://i.imgur.com/6jDPnCX.jpeg
```

- Validation now accepts direct image URLs and single-image Imgur links.
- Protection class is editable in the Home form and renders as a plain class number when available.
- Discount section still renders even if there is no total savings amount; the annual savings total is omitted when savings are zero.
- Audio block is optional and only appears if an audio file has been added.

Commercial auto webpage:

```text
lib/commercialAutoWebPageHtml.ts
templates/web/COMMERCIAL_AUTO_QUOTE_MASTER_TEMPLATE.html
templates/web/COMMERCIAL_AUTO_WEB_IMAGE_PROMPTS.md
```

Important Commercial Auto Web Page behavior:

- Uses auto data shape but commercial-specific copy.
- Focuses on business vehicles, rated drivers, liability, physical damage, and business-use review.
- Commercial carrier restriction:

```text
Progressive
Nationwide
National General
```

Current images:

```text
Hero background: https://i.imgur.com/9jkiZyF.jpeg
Agent helping image: https://i.imgur.com/b9Yh74p.png
```

## Audio Review Workflow

Files:

```text
lib/webAudioReview.ts
lib/autoWebPageHtml.ts
lib/homeWebPageHtml.ts
functions/api/generate-audio-review.ts
```

Current user-facing workflow:

1. Choose Auto Web Page or Home Web Page.
2. The app shows a friendly coverage/payment script in a copyable container.
3. Staff copies that script to an external audio creator if desired.
4. Staff clicks Add MP3 / Audio and selects the finished audio file.
5. The webpage output embeds an audio section.
6. If no audio file is added, no audio section appears in the webpage quote.

Current backend audio endpoint:

```text
functions/api/generate-audio-review.ts
```

It can generate MP3 through OpenAI if `OPENAI_API_KEY` is configured, using:

```text
model = gpt-4o-mini-tts
voice = cedar by default, marin optional
format = mp3
```

Important note:

The app was intentionally moved toward script-copy plus MP3 upload because the generated voice quality needed more control. Do not auto-include audio unless staff explicitly adds an audio file.

## Integrity Checks

```text
lib/integrityCheck.ts
```

Export buttons are disabled if:

- Cloudflare email-protection corruption appears.
- `mailto:Save@BillLayneInsurance.com` is missing.
- `border-radius:50%` appears.
- HTML byte count is above 102,400.
- HTML does not end in `</html>`.
- Required strings are missing:

```text
Bill Layne Insurance Agency
(336) 835-1993
1283 N Bridge St
Elkin, NC 28621
lxu9nfT.png
application/ld+json
```

Warnings:

- Byte count above 95,000.
- Inter font reference missing.

Known implication:

If a Gmail template has a circular avatar or misses the agency logo, the app will switch to review mode and disable Copy HTML / Sync Gmail / Download.

## Validation

```text
lib/validation.ts
```

Current shared validation includes:

- Required client first/full name.
- Valid client email format when provided.
- Hero image URL must be a direct HTTPS image URL or a single-image Imgur link.
- Carrier must exist in `config/carriers.ts`.
- Effective/expiry dates must parse.
- Line-of-business-specific required fields.

Latest change:

Plain Imgur links are accepted for manual hero image entry so staff can paste links like:

```text
https://imgur.com/6jDPnCX
```

The Home Web Page renderer then normalizes that link for CSS background usage.

## Recent Important Updates Since The Old Handoff

Auto Gmail quote:

- Fixed disabled export buttons by restoring required Bill Layne logo asset and removing circular `border-radius:50%`.

Home Elite Gmail quote:

- Added Home Elite Quote email mode.
- Fixed export buttons.
- Added Gmail-safe mobile-first inline sizing.
- Header restructured so mobile title stays condensed.
- Carrier logo and agent review image mobile behavior patched.

Home Elite Welcome:

- Removed ID card/document CTA.
- Patched mobile header/phone/logo issues.

Auto Elite Welcome:

- Added Auto Elite template option.
- Removed ID card/document CTA.

Commercial Auto Elite Gmail:

- Added sample/template option.
- Uses Progressive, Nationwide, and National General.
- Hero image:

```text
https://i.imgur.com/BeciIu9.jpeg
```

- Agent image:

```text
https://i.imgur.com/5BLPVwW.png
```

Auto Web Page:

- Added webpage output option.
- Updated to match provided final auto webpage structure.
- Replaced physical-folder service language with local-agent review concept.

Home Web Page:

- Added webpage output option.
- Added script/MP3 audio workflow.
- Patched family image height/cropping earlier in the template.
- Patched hero image override with `HERO_IMAGE_URL`.
- Patched Imgur share-link normalization and validation.

Commercial Auto Web Page:

- Added commercial auto webpage template.
- Generated and tested Air Controls sample quote from PDF.
- Pushed live.

Auto comparison:

- Added separate comparison templates/samples.
- Kept separate from main auto/home/commercial production templates.
- Includes side-by-side desktop comparison and mobile-friendly stacked comparison.

## Auto Comparison Templates

These are standalone/sample templates and are not wired as a main output mode in the same way as Auto/Home/Commercial Web Page.

Files:

```text
templates/AutoComparisonQuoteTemplate.tsx
templates/AutoComparisonAdvisorFirstTemplate.tsx
tmp/auto_comparison_quote_sample.html
tmp/auto_comparison_advisor_first_sample.html
tmp/jarrod_liston_natgen_vs_progressive_auto_comparison.html
```

Purpose:

- Compare two auto quotes such as National General renewal versus Progressive new quote.
- Show recommendation first.
- Use side-by-side tables on desktop.
- Use stacked cards on mobile to avoid horizontal scrolling.
- Highlight company-specific backgrounds so coverage rows are easier to read.

## Commercial Auto Images

Commercial auto Gmail:

```text
templates/email/COMMERCIAL_AUTO_ELITE_IMAGE_PROMPTS.md
```

Commercial auto webpage:

```text
templates/web/COMMERCIAL_AUTO_WEB_IMAGE_PROMPTS.md
```

Current used images:

```text
Commercial auto Gmail hero: https://i.imgur.com/BeciIu9.jpeg
Commercial auto Gmail agent: https://i.imgur.com/5BLPVwW.png
Commercial auto webpage hero: https://i.imgur.com/9jkiZyF.jpeg
Commercial auto webpage agent: https://i.imgur.com/b9Yh74p.png
```

## Home Web Page Hero Image Fix Details

Problem:

Staff could paste a customer home Imgur URL into `Hero Image URL`, but the Home Web Page preview still showed the default hero image.

Cause:

- `templates/web/v4_homeowners_master_template.html` hardcoded `https://i.imgur.com/waSydQr.jpeg`.
- `lib/homeWebPageHtml.ts` did not provide a `HERO_IMAGE_URL` token.
- `lib/validation.ts` only allowed direct image URLs, which conflicted with the new Imgur share-link support.

Fix:

- Replaced hardcoded hero image and `og:image` with `{{HERO_IMAGE_URL}}`.
- Added `heroImageUrl()` helper in `lib/homeWebPageHtml.ts`.
- Added Imgur share-link normalization.
- Updated validation to accept direct images or single-image Imgur links.

Verified cases:

```text
https://i.imgur.com/6jDPnCX.jpeg -> preserved and rendered
https://imgur.com/6jDPnCX -> normalized to https://i.imgur.com/6jDPnCX.jpeg
blank -> defaults to https://i.imgur.com/waSydQr.jpeg
```

## Gmail 2026 Optimization Rules To Preserve

Based on the updated Gmail rules/project guidance:

- Use mobile-first inline sizing.
- Do not rely on `<style>` media queries to shrink mobile layouts.
- Media queries may enhance desktop, but mobile must be correct without them.
- Keep Gmail content condensed by default.
- Use table-based structure for emails.
- Keep logos and title text from competing in the same narrow row.
- Avoid oversized mobile headings.
- Avoid nested cards inside cards.
- Keep buttons clear, centered when appropriate, and Gmail-safe.
- Include required agency contact details and JSON-LD.
- Avoid `border-radius:50%` because the app integrity guard blocks circles.

## Deployment Checklist

Before deploying:

```bash
npm run build
```

Recommended renderer checks when Home Web Page hero image logic changes:

```bash
node --input-type=module
```

Use Vite SSR module loading to call `renderHomeWebPageHtml()` with sample data and verify:

- custom direct image URL is present
- Imgur share URL normalizes
- blank uses default
- no `{{HERO_IMAGE_URL}}` remains

Deploy:

```bash
npx wrangler@latest pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

Live check:

```text
https://quote-template-studio.pages.dev/
```

## Secret Scan Before Commit Or Push

Run from the repo or Playground:

```bash
rg -n --hidden --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**' --glob '!**/.wrangler/**' "AIza[0-9A-Za-z_-]{20,}|GEMINI_API_KEY=.*AIza|OPENAI_API_KEY=.*sk-|RESEND_API_KEY=.*re_" .
```

Rules:

- Never commit `.dev.vars`.
- Never expose Gemini/OpenAI/Resend/Twilio keys in React, HTML, or GitHub Pages files.
- Store production secrets in Cloudflare Pages project `quote-template-studio`.

## Known Limitations / Watch Items

- The repo is still not cleanly tracked in git; many current files are untracked due to the migration.
- Webpage templates use raw HTML and token replacement; token names must match renderer keys exactly.
- Home webpage uses Tailwind CDN inside the generated customer page, which triggers a browser console warning. It is known and not currently blocking.
- Audio generation endpoint exists, but current preferred workflow is manual script copy plus MP3 upload.
- Auto comparison templates are samples/separate TSX, not a core production output mode.
- Commercial auto data currently reuses `AutoQuoteData`; future improvement could add a dedicated commercial auto data type.
- The Home Web Page Imgur normalizer assumes single-image Imgur IDs and appends `.jpeg`.
- If an Imgur link points to an album/gallery, it is not supported as a hero image.

## Fast Orientation For The Next Program

Start here:

```text
App.tsx
lib/htmlSerialize.tsx
lib/autoWebPageHtml.ts
lib/homeWebPageHtml.ts
lib/commercialAutoWebPageHtml.ts
functions/api/parse-quote.ts
functions/quote-action.ts
config/brand.ts
config/carriers.ts
```

If Gmail exports are grayed out:

```text
lib/integrityCheck.ts
```

If Home Web Page customer images fail:

```text
lib/homeWebPageHtml.ts
templates/web/v4_homeowners_master_template.html
lib/validation.ts
```

If quote-action emails fail:

```text
functions/quote-action.ts
Cloudflare Pages env vars: RESEND_API_KEY, QUOTE_NOTICE_TO, QUOTE_NOTICE_FROM
```

If parsing fails:

```text
functions/api/parse-quote.ts
Cloudflare Pages env var: GEMINI_API_KEY
```

If audio is requested:

```text
lib/webAudioReview.ts
lib/autoWebPageHtml.ts
lib/homeWebPageHtml.ts
functions/api/generate-audio-review.ts
Cloudflare Pages env var: OPENAI_API_KEY
```

## Current Bottom Line

The app is live and working as a multi-output quote studio. The latest important fix is the Home Web Page customer home image flow: staff can paste a direct Imgur image URL or a single-image Imgur share URL, and the generated Home Web Page now uses that image in the hero area and social preview.
