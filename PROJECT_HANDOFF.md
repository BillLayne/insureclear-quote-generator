# Quote Template Studio - Complete Project Handoff

Last updated: 2026-06-23

## Executive Summary

Quote Template Studio is a React + Vite + Cloudflare Pages app for Bill Layne Insurance Agency. It turns carrier quote PDFs/images and manually reviewed structured data into polished customer-facing quote outputs for Gmail and web pages.

The current app supports:

- Gmail-ready quote emails for auto, home, motorcycle, renters, and rental dwelling quotes.
- Elite Gmail welcome/quote templates for home and auto.
- Commercial auto elite Gmail quote template.
- Auto webpage quote outputs.
- Home webpage quote outputs.
- Commercial auto webpage quote outputs.
- Modern Auto Page output, kept separate from the standard auto webpage template.
- Nonstandard Auto Page output, kept separate from standard and modern templates.
- Auto comparison sample templates kept separate from core production modes.
- Gemini PDF/image parsing through a Cloudflare Pages Function.
- Customer quote-action pages that collect "start policy / contact us / ask a question" requests and email them to the agency.
- Default general auto MP3 guide embedded in auto webpage-style outputs.
- Auto Quote Fold Card and Home Quote Fold Card outputs for letter-landscape duplex brochure printing.
- Fold-card-specific field boxes for company name, customer address, prior carrier, setup charge, payment schedule, QR link, coverage alert, product strip, and agent image URL.
- Copy HTML, copy text, Gmail sync, Gmail draft, downloadable HTML, downloadable web/fold-card HTML, and live iframe preview workflows.

Live app:

```text
https://quote-template-studio.pages.dev/
```

Primary local project:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program
```

## Latest Production Status

Latest build and deploy completed on 2026-06-23.

Build command:

```bash
npm run build
```

Deploy command:

```bash
npx wrangler pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

Latest Cloudflare preview URL:

```text
https://8fd62ceb.quote-template-studio.pages.dev
```

Production URL:

```text
https://quote-template-studio.pages.dev/
```

Latest verified production bundle:

```text
assets/index-D4XNg5pV.js
```

Latest verification:

- `npm run build` passed.
- Cloudflare Pages deploy completed successfully.
- `https://quote-template-studio.pages.dev/` returned `200`.
- `https://8fd62ceb.quote-template-studio.pages.dev/` returned `200`.
- Production served `assets/index-D4XNg5pV.js`.
- Production bundle contains the original Auto Fold template sections: `Ready To Review?`, `Quote At A Glance`, and `Coverage Snapshot`.
- Production bundle no longer contains the generic placeholder phrase `Your auto quote, folded into plain English.`
- Auto Fold hero-image serialization was fixed so the inline `--front-cover-image` CSS variable uses a quote-safe `url('...')` value for iframe preview, print, and downloaded HTML.
- Prior local Browser visual QA confirmed the Auto Fold Card matches the original standalone builder structure instead of the generic fold-card renderer.
- Fold-card assets returned `200`: `/fold-card/agency-logo.png`, `/fold-card/auto-quote-cover.png`, and `/fold-card/auto-quote-agent-review.png`.
- Production `/fold-card/auto-quote-cover.png` returned `200 image/png`.
- Current source/build verification confirmed the compiled Auto Fold renderer includes the quote-safe cover-image URL and production serves the updated bundle.

Known build warning:

- Vite warns that a JS chunk is larger than 500 kB. This is pre-existing and not a deployment failure.

## Current Worktree Warning

The working tree is intentionally dirty because multiple templates and new renderer files have been added during active development. Do not run destructive reset/checkout commands.

Current known dirty worktree after the hero-image fix:

```text
?? tmp-live-check/
?? tmp/quote-template-studio-live-headers.txt
?? tmp/quote-template-studio-live.html
?? tmp/quote-template-studio-live.js
```

Treat these untracked folders/files as scratch verification artifacts unless Bill asks to clean them up.

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Cloudflare Pages
- Cloudflare Pages Functions
- Gemini through `@google/genai`
- Resend email API for quote-action notices
- Optional Twilio SMS notification
- Optional OpenAI speech endpoint, though current preferred audio workflow uses staff-provided MP3 files
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

Recommended live deploy:

```bash
npm run build
npx wrangler pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
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

Expected variables:

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

Google Cloud / Gemini key record for this project:

```text
Google Cloud project name: Bill Layne Insurance-Quote Tem
Suggested API key name: quote-template-studio-prod-gemini-2026-06
Cloudflare Pages secret name: GEMINI_API_KEY
```

Never put API keys in browser HTML, React files, committed `.env`, or committed `.dev.vars`.

## Main Source Map

```text
App.tsx
```

Main UI and state manager. Handles quote type, output mode, email mode, parsing, preview, form edits, advanced JSON, export buttons, Gmail integration, audio script/MP3 workflow, and all quote-specific forms.

```text
index.css
```

Staff app shell styling. This is not the Gmail template styling or customer webpage styling.

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

Carrier registry with carrier IDs, display names, legal names, logos, claims/portal info, and carrier flags.

Commercial auto remains intentionally limited to:

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

Used when switching quote type or starting from sample data.

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

The frontend validation/rendering also supports manually pasted single-image Imgur links.

## Customer Action Page

```text
functions/quote-action.ts
```

This is the container/page that opens after the customer clicks a quote action button such as Start Policy, Contact Us, Bind, or Ask a Question.

How it works:

1. Quote templates build a URL to `https://quote-template-studio.pages.dev/quote-action`.
2. Query parameters prefill action, client name, client email, template type, carrier, quote number, premium, and subject.
3. GET `/quote-action` returns a confirmation form.
4. Customer can add best email, best phone, and notes.
5. POST `/quote-action` sends an email notice through Resend to `QUOTE_NOTICE_TO`.
6. Default notice recipient is `docs@billlayneinsurance.com`.
7. Optional Twilio SMS sends a short alert if Twilio vars are configured.
8. The page includes a honeypot field named `website`.
9. The success page reminds the customer that coverage is not bound until carrier acceptance and payment.

Important latest copy change:

- The customer-facing confirmation page no longer displays `template` as a quote detail row.

Primary frontend URL source:

```text
config/brand.ts -> BRAND.quoteActionUrl
```

Email helper:

```text
templates/shared/EmailParts.tsx -> quoteActionHref()
```

Webpage helpers:

```text
lib/autoWebPageHtml.ts -> quoteActionHref()
lib/homeWebPageHtml.ts -> quoteActionHref()
lib/commercialAutoWebPageHtml.ts -> quoteActionHref()
lib/modernAutoWebPageHtml.ts -> quoteActionHref()
lib/nonstandardAutoWebPageHtml.ts -> quoteActionHref()
```

## Output Modes

Configured primarily in:

```text
App.tsx
lib/htmlSerialize.tsx
```

Core output choices currently include:

- Gmail Email
- Auto Web Page
- Modern Auto Page
- Nonstandard Auto Page
- Commercial Auto Page
- Auto Elite Quote
- Home Elite Welcome
- Home Elite Quote
- Auto Elite Welcome
- Commercial Auto Elite

The Modern Auto Page and Nonstandard Auto Page are separate renderers so they do not alter the standard auto webpage template.

## Gmail Email Templates

Shared renderer:

```text
lib/htmlSerialize.tsx
```

Standard React quote templates:

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

Elite Gmail templates and renderers:

```text
templates/email/HOME_ELITE_WELCOME.html
templates/email/AUTO_ELITE_WELCOME.html
templates/email/AUTO_ELITE_QUOTE_TEMPLATE.html
templates/email/COMMERCIAL_AUTO_ELITE_QUOTE_SAMPLE.html
templates/HomeEliteGmailTemplate.tsx
templates/HomeEliteQuoteGmailTemplate.tsx
templates/AutoEliteGmailTemplate.tsx
templates/CommercialAutoEliteGmailTemplate.tsx
```

Important Gmail 2026 rules to preserve:

- Mobile-first inline sizing.
- Do not rely on Gmail media queries to shrink mobile content.
- Media queries may enhance desktop, but mobile must be correct without them.
- Use table-based structure for emails.
- Keep logos and title text from competing in the same narrow row.
- Avoid oversized mobile headings.
- Avoid nested cards inside cards.
- Keep buttons clear and Gmail-safe.
- Include required agency contact details and JSON-LD.
- Avoid `border-radius:50%` because the app integrity guard blocks circles.

Recent Gmail/elite updates:

- Home Elite Quote mode added.
- Home Elite Welcome and Quote headers standardized to the auto elite style.
- Auto Elite Welcome header standardized.
- Auto Elite Quote template replaced with the proven upgraded Claude elite Gmail structure from `C:\Users\bill\OneDrive\Documents\Playground\2026 Quotes All Sources\Auto Gmail quotes\claude auto elite template\auto-quote-elite-2026-PATCHED.html`; parser tokens, repeatable vehicle cards, repeatable additional-driver cards, quote-action links, and discount cleanup were restored after the replacement. The default hero image for this template is the exact upgraded template hero: `https://i.imgur.com/0ejD7K7.jpeg`.
- Commercial Auto Elite header standardized.
- Removed "View ID Cards / Documents" buttons from elite welcome templates because Gmail cannot create attached document preview links by itself.
- Auto Elite Gmail fallback text changed so missing vehicle slots no longer say `No additional vehicle listed`.

## Webpage Templates

### Standard Auto Web Page

```text
lib/autoWebPageHtml.ts
templates/web/BLI_AUTO_QUOTE_MASTER_TEMPLATE.html
templates/web/AUTO_QUOTE_V4_FINAL_MASTER_TEMPLATE.html
```

Important behavior:

- Uses the approved auto landing-page structure.
- `heroImageUrl` can override the default hero background.
- Quote-action buttons route to `/quote-action`.
- Physical-folder service language was removed/replaced with local-agent review language.
- Default general auto MP3 guide is available through `public/audio/bill-layne-auto-insurance-general.mp3`.
- Standard auto webpage currently includes the general audio section.

### Home Web Page

```text
lib/homeWebPageHtml.ts
templates/web/v4_homeowners_master_template.html
templates/web/BLI_HOME_QUOTE_MASTER_TEMPLATE.html
```

Important behavior:

- Uses the approved homeowners landing-page structure.
- Uses `HERO_IMAGE_URL` for hero background and social image.
- Blank `heroImageUrl` falls back to:

```text
https://i.imgur.com/waSydQr.jpeg
```

- Direct image URLs render.
- Single-image Imgur share URLs normalize for rendering.
- Protection class is editable in the home form.
- Discount section still renders even when no total savings amount is parsed; zero savings total is omitted.
- Home webpage audio remains an optional staff-added workflow.

### Commercial Auto Web Page

```text
lib/commercialAutoWebPageHtml.ts
templates/web/COMMERCIAL_AUTO_QUOTE_MASTER_TEMPLATE.html
templates/web/COMMERCIAL_AUTO_WEB_IMAGE_PROMPTS.md
```

Important behavior:

- Uses auto data shape but commercial-specific copy.
- Focuses on business vehicles, rated drivers, liability, physical damage, business use, and billing.
- Commercial carrier set is Progressive, Nationwide, and National General.

Current images:

```text
Hero background: https://i.imgur.com/9jkiZyF.jpeg
Agent helping image: https://i.imgur.com/b9Yh74p.png
```

### Modern Auto Page

```text
lib/modernAutoWebPageHtml.ts
templates/web/MODERN_AUTO_QUOTE_TEMPLATE.html
```

Important behavior:

- Separate auto webpage option labeled Modern.
- Does not alter standard auto, home, commercial auto, or nonstandard templates.
- Built from the provided modern auto webpage source.
- Includes the general auto MP3 guide.
- Top header shows the insurance company instead of phone number.
- Hero carrier display uses the actual carrier logo.
- Hero steps are confined in the hero container.
- "Contact Bill" wording changed to "Contact Us" / "Contact Us to Start".
- Bottom sticky button wording uses "Call Us".
- Text action uses the Twilio text number:

```text
336-827-9065
```

- Driver section includes "Drivers Included" / "Drivers on Policy".
- Vehicle details include towing reimbursement and loss of use/rental, with absent values shown as not on the vehicle.
- Step sections are visually separated: Step 1, Step 2, and Step 3.

### Nonstandard Auto Page

```text
lib/nonstandardAutoWebPageHtml.ts
templates/web/NONSTANDARD_AUTO_QUOTE_TEMPLATE.html
```

Important behavior:

- Separate auto webpage option labeled Nonstandard Auto Page.
- Does not alter standard auto or modern auto templates.
- Designed for fast-start/nonstandard shoppers on mobile.
- Current hero is approved; do not redesign it unless specifically requested.
- Hero no longer displays redundant down/monthly containers from the earlier version.
- Hero emphasizes start cost and simple action flow.
- Bottom sticky buttons are Text, Start Policy, and Call, with improved contrast.
- Quote-action Start Policy link opens `/quote-action`.
- Text action uses the Twilio text number:

```text
336-827-9065
```

- Top/market section now says:

```text
We shopped the market for your best available rate.
```

- Vehicle cards now show:

```text
Comprehensive
Collision
Towing reimbursement
Loss of use / rental
Liability / premium
```

- If a specific coverage is not selected or not found, the vehicle card displays:

```text
Not selected
```

- Only actual parsed vehicles render. Empty vehicle slots are removed entirely.
- The old customer-facing phrase `No additional vehicle listed` has been removed from source and built output.
- "Coverage status" section was removed as redundant.
- "Why people choose Bill Layne" section was removed, but Google/customer reviews remain.
- Shopped-market carrier list replaced Foremost with Travelers where requested.
- Footer includes agency website and social icons.
- Start Review copy uses "we / our team" language instead of implying every call must go to Bill personally.

## Public Assets

Static public assets:

```text
public/audio/bill-layne-auto-insurance-general.mp3
public/carrier-logos/progressive.png
public/carrier-logos/nationwide.png
public/carrier-logos/national-general.png
public/carrier-logos/travelers.png
public/carrier-logos/alamance.png
public/carrier-logos/dairyland.png
public/carrier-logos/foremost.jpg
public/carrier-logos/hagerty.png
public/carrier-logos/ncgrange.png
public/carrier-logos/ncjua.png
public/carrier-logos/steadily.png
```

The default general auto audio guide URL used by auto-style webpage renderers:

```text
https://quote-template-studio.pages.dev/audio/bill-layne-auto-insurance-general.mp3
```

## Audio Review Workflow

Files:

```text
lib/webAudioReview.ts
lib/autoWebPageHtml.ts
lib/homeWebPageHtml.ts
lib/modernAutoWebPageHtml.ts
lib/nonstandardAutoWebPageHtml.ts
functions/api/generate-audio-review.ts
public/audio/bill-layne-auto-insurance-general.mp3
```

Current practical workflow:

- Auto-style webpage quotes can include the default general auto MP3 guide.
- Home webpage audio remains optional and staff-provided.
- Staff can copy a friendly script and create audio outside the app.
- If staff adds an MP3/audio file, the page includes an audio section.
- If no audio is added for optional flows, no audio section appears.

Important note:

The general auto MP3 explains auto insurance coverages broadly. It is not a custom reading of the customer-specific limits. The written quote remains the source for exact customer details.

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

If Gmail export buttons are grayed out, inspect this file first.

## Validation

```text
lib/validation.ts
```

Shared validation includes:

- Required client first/full name.
- Valid client email format when provided.
- Hero image URL must be a direct HTTPS image URL or a single-image Imgur link.
- Carrier must exist in `config/carriers.ts`.
- Effective/expiry dates must parse.
- Line-of-business-specific required fields.

Hero image helpers:

```text
lib/heroImage.ts
```

Plain Imgur links are accepted for manual hero image entry. Example:

```text
https://imgur.com/6jDPnCX
```

The renderer normalizes it to a direct image URL for display.

## Auto Comparison Templates

These are standalone/sample templates and are not the same as the core production output modes.

Known files from this work:

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
- Use side-by-side comparison on desktop.
- Use stacked cards on mobile to avoid left/right scrolling.
- Use carrier-specific color backgrounds so coverage differences are easy to read.

## Recent Timeline Highlights

Recent major changes completed before this handoff:

- Added Auto Web Page output.
- Added Home Web Page output.
- Added Commercial Auto Web Page output.
- Added Modern Auto Page output as a separate template.
- Added Nonstandard Auto Page output as a separate template.
- Added default general auto MP3 to auto-style webpage quotes.
- Patched quote-action so the customer confirmation page does not show `template`.
- Patched quote-action copy and buttons to use "Contact Us" / team language where needed.
- Updated text action number to the Twilio number `336-827-9065` where requested.
- Added vehicle-level E&O-friendly rows for comprehensive, collision, towing, and loss of use/rental.
- Patched Nonstandard Auto Page so only listed vehicles render.
- Removed `No additional vehicle listed` from current source/build.
- Updated Nonstandard Auto Page market wording to "We shopped the market for your best available rate."
- Kept the approved Nonstandard Auto Page hero unchanged after final user approval.
- Replaced Auto Elite Gmail Quote with the upgraded elite/mobile-optimized structure and verified rendered output has no unresolved tokens, no sample-data leaks, and passes the Gmail integrity gate.

## Deployment Checklist

Before deploying:

```bash
npm run build
```

Deploy:

```bash
npx wrangler pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

Verify:

```powershell
$response = Invoke-WebRequest -Uri 'https://quote-template-studio.pages.dev/' -UseBasicParsing
$response.StatusCode
($response.Content | Select-String -Pattern 'assets/index-[^"'']+\.js' -AllMatches).Matches.Value | Select-Object -First 3
```

Secret scan before commit or push:

```bash
rg -n --hidden --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/build/**' --glob '!**/.wrangler/**' "AIza[0-9A-Za-z_-]{20,}|GEMINI_API_KEY=.*AIza|OPENAI_API_KEY=.*sk-|RESEND_API_KEY=.*re_" .
```

Rules:

- Never commit `.dev.vars`.
- Never expose Gemini/OpenAI/Resend/Twilio keys in React, HTML, or GitHub Pages files.
- Store production secrets in Cloudflare Pages project `quote-template-studio`.

## Known Limitations / Watch Items

- The repo is still not cleanly tracked in git; many current files are modified or untracked due to active template work.
- Webpage templates use raw HTML and token replacement; token names must match renderer keys exactly.
- Home webpage uses Tailwind CDN inside the generated customer page, which can trigger a browser console warning. It is known and not currently blocking.
- Audio generation endpoint exists, but the preferred high-quality workflow is script copy plus staff-created MP3 upload/default MP3.
- Auto comparison templates are samples/separate TSX, not a main production output mode.
- Commercial auto data currently reuses `AutoQuoteData`; future improvement could add a dedicated commercial auto data type.
- The Home Web Page Imgur normalizer assumes single-image Imgur IDs and appends `.jpeg`.
- Imgur album/gallery links are not supported as hero images.
- Wrangler installed locally reported version `3.114.17`; current Pages deploy command works with this project.

## Fast Orientation For The Next Conversation

Start here:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\App.tsx
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\htmlSerialize.tsx
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\autoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\modernAutoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\nonstandardAutoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\homeWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\commercialAutoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\functions\api\parse-quote.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\functions\quote-action.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\config\brand.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\config\carriers.ts
```

If Gmail exports are grayed out:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\integrityCheck.ts
```

If Home Web Page customer images fail:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\homeWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\templates\web\v4_homeowners_master_template.html
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\validation.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\heroImage.ts
```

If quote-action emails fail:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\functions\quote-action.ts
Cloudflare Pages env vars: RESEND_API_KEY, QUOTE_NOTICE_TO, QUOTE_NOTICE_FROM
```

If parsing fails:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\functions\api\parse-quote.ts
Cloudflare Pages env var: GEMINI_API_KEY
```

If Modern Auto Page needs work:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\modernAutoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\templates\web\MODERN_AUTO_QUOTE_TEMPLATE.html
```

If Nonstandard Auto Page needs work:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\nonstandardAutoWebPageHtml.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\templates\web\NONSTANDARD_AUTO_QUOTE_TEMPLATE.html
```

If audio needs work:

```text
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\lib\webAudioReview.ts
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\public\audio\bill-layne-auto-insurance-general.mp3
C:\Users\bill\OneDrive\Documents\Playground\2026-best-pdf-auto-and-home-quote-program\functions\api\generate-audio-review.ts
```

## Bottom Line

The app is live at `https://quote-template-studio.pages.dev/` and the latest deployed bundle is `assets/index-Cnr2rJEV.js`. The newest production work is centered on the upgraded Auto Elite Gmail Quote template, including the corrected default hero image, Modern Auto Page and Nonstandard Auto Page additions, the default auto MP3 guide, quote-action cleanup, and the Nonstandard Auto Page vehicle-card fix so only actual listed vehicles appear.
