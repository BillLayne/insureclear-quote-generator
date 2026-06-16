# Gmail Draft — one-time setup

The **Gmail Draft** button creates a real Gmail draft through the Gmail API with the
**full HTML document preserved** (head, `<meta viewport>`, styles). That is what makes
the email render correctly on Android Gmail — the old **Sync Gmail** button copies the
HTML and relies on pasting into Gmail compose, which strips the `<head>` and lets Android
"font-boost" (enlarge) the body text so lines wrap differently than the template.

You only have to do this once. It uses Google Identity Services (GIS) in the browser, so
there is **no server, no client secret, and no stored tokens** — just a public OAuth
*client ID*.

## 1. Pick / open the Google Cloud project

Use the existing project for this app (handoff name: **"Bill Layne Insurance-Quote Tem"**)
at https://console.cloud.google.com/ . Make sure it's the selected project.

## 2. Enable the Gmail API

APIs & Services → **Library** → search **Gmail API** → **Enable**.

## 3. Configure the OAuth consent screen

APIs & Services → **OAuth consent screen**.

- **If `billlayneinsurance.com` is a Google Workspace domain** and you'll only use this
  signed in as `Bill@billlayneinsurance.com`: choose **Internal**. No verification, no
  test-user limits. (Recommended.)
- **Otherwise** choose **External**, keep it in **Testing**, and under **Test users** add
  `Bill@billlayneinsurance.com` (and any other agency email that will use the button).
  Test users skip Google's "unverified app" review for this sensitive scope.

Add the scope `https://www.googleapis.com/auth/gmail.compose` (create/manage drafts).
Fill in the app name, support email, and developer email; save.

## 4. Create the OAuth Client ID

APIs & Services → **Credentials** → **Create Credentials** → **OAuth client ID**.

- Application type: **Web application**
- Name: e.g. `quote-template-studio-web`
- **Authorized JavaScript origins** — add each origin you'll open the app from:
  - `https://quote-template-studio.pages.dev`
  - `http://localhost:3001`
  - `http://127.0.0.1:3001`
- Leave **Authorized redirect URIs** empty (the GIS token flow uses origins, not redirects).
- Create, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).

## 5. Add the Client ID to the build

Create `.env.local` in the project root (it is gitignored via `*.local`):

```
VITE_GMAIL_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Vite inlines `VITE_*` variables at **build time**, so `.env.local` must exist when you run
`npm run build` locally before deploying.

## 6. Rebuild & deploy

```
npm run build
npx wrangler@latest pages deploy dist --project-name quote-template-studio --branch main --commit-dirty=true
```

## Using it

1. Generate an email quote as usual.
2. Click **Gmail Draft** (the accent button next to *Sync Gmail*).
3. The first time, Google shows a consent popup — approve `Create drafts`.
4. A Gmail draft is created (BCC `Save@BillLayneInsurance.com`) and your Drafts opens.
5. Open it on mobile to confirm the layout matches the template, then send.

## Notes & troubleshooting

- The client ID is **not a secret** — it's meant to live in the browser bundle. Don't put
  any API key or client *secret* in `.env.local`.
- "`Gmail Draft is not configured`" → `VITE_GMAIL_CLIENT_ID` was empty at build time.
- "`redirect_uri_mismatch` / `origin mismatch`" → the exact origin you opened the app from
  isn't in **Authorized JavaScript origins** (step 4). Add it and wait a few minutes.
- "`access_denied`" with External+Testing → the signed-in address isn't a **Test user**.
- The popup needs the browser to allow popups for the app's origin.
- The old **Sync Gmail** (clipboard → compose paste) button is still there as a fallback.
