// Create a real Gmail draft from the browser via the Gmail API + Google Identity
// Services (GIS). Unlike the clipboard "Sync Gmail" path — which pastes into Gmail
// compose and loses the document <head> (viewport + text-size-adjust guards), causing
// Android font-boosting — this delivers the FULL HTML document as a MIME text/html
// draft, so Gmail renders it mobile-optimized exactly like the source template.
//
// Auth is the GIS OAuth2 token flow: a short-lived access token is obtained in the
// browser. No client secret, no backend token storage. The client ID is public.
// Setup: see GMAIL_DRAFT_SETUP.md and set VITE_GMAIL_CLIENT_ID at build time.

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';
const DRAFTS_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts';

export const gmailClientId = (import.meta.env.VITE_GMAIL_CLIENT_ID ?? '').trim();
export const gmailConfigured = gmailClientId.length > 0;

export interface GmailDraftInput {
  subject: string;
  html: string;
  to?: string;
  bcc?: string;
}

export interface GmailDraftResult {
  id: string;
  url: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Gmail draft is only available in the browser.'));
  }
  const w = window as unknown as { google?: { accounts?: { oauth2?: unknown } } };
  if (w.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in.')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the Google sign-in script (check your network or ad blocker).'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Preload the GIS script so the auth popup opens within the button click gesture. */
export function preloadGmailAuth(): void {
  if (!gmailConfigured) return;
  void loadGis().catch(() => {
    /* preload is best-effort; the click handler surfaces real errors */
  });
}

function requestAccessToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const oauth2 = (window as unknown as {
      google?: { accounts?: { oauth2?: {
        initTokenClient: (config: Record<string, unknown>) => { requestAccessToken: (overrides?: Record<string, unknown>) => void };
      } } };
    }).google?.accounts?.oauth2;

    if (!oauth2) {
      reject(new Error('Google sign-in is not loaded yet. Try again in a moment.'));
      return;
    }

    const client = oauth2.initTokenClient({
      client_id: gmailClientId,
      scope: GMAIL_SCOPE,
      callback: (resp: GoogleTokenResponse) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        if (!resp.access_token) {
          reject(new Error('Google did not return an access token.'));
          return;
        }
        resolve(resp.access_token);
      },
      error_callback: (err: { message?: string } | undefined) => {
        reject(new Error(err?.message || 'Google authorization was closed before completing.'));
      },
    });
    // Empty prompt: silent if already granted this session, otherwise Google shows consent.
    client.requestAccessToken({ prompt: '' });
  });
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64Url(value: string): string {
  return base64Utf8(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// RFC 2047 encoded-word for headers containing non-ASCII (em dashes, accents, etc.).
function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${base64Utf8(value)}?=`;
}

function wrapBase64(value: string): string {
  return (value.match(/.{1,76}/g) ?? []).join('\r\n');
}

function buildMimeMessage({ subject, html, to, bcc }: GmailDraftInput): string {
  const headers = [
    to ? `To: ${to}` : null,
    bcc ? `Bcc: ${bcc}` : null,
    `Subject: ${encodeHeaderValue(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ]
    .filter(Boolean)
    .join('\r\n');
  const body = wrapBase64(base64Utf8(html));
  return `${headers}\r\n\r\n${body}`;
}

export async function createGmailDraft(input: GmailDraftInput): Promise<GmailDraftResult> {
  if (!gmailConfigured) {
    throw new Error('Gmail Draft is not configured. Set VITE_GMAIL_CLIENT_ID and rebuild — see GMAIL_DRAFT_SETUP.md.');
  }

  await loadGis();
  const token = await requestAccessToken();
  const raw = base64Url(buildMimeMessage(input));

  const response = await fetch(DRAFTS_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw } }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const errorJson = (await response.json()) as { error?: { message?: string } };
      if (errorJson.error?.message) detail = errorJson.error.message;
    } catch {
      /* keep the status-code detail */
    }
    throw new Error(`Gmail draft was not created (${detail}).`);
  }

  const json = (await response.json()) as { id?: string; message?: { id?: string } };
  const messageId = json.message?.id;
  const url = messageId
    ? `https://mail.google.com/mail/u/0/#drafts?compose=${messageId}`
    : 'https://mail.google.com/mail/u/0/#drafts';
  return { id: json.id ?? messageId ?? '', url };
}
