/// <reference types="@cloudflare/workers-types" />

interface Env {
  RESEND_API_KEY?: string;
  QUOTE_NOTICE_FROM?: string;
  QUOTE_NOTICE_TO?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;
  TWILIO_TO_NUMBER?: string;
}

interface QuoteAction {
  action: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  templateType: string;
  carrier: string;
  quoteNumber: string;
  premium: string;
  propertyAddress: string;
  subject: string;
  notes: string;
}

const noticeToDefault = 'docs@billlayneinsurance.com';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const field = (source: URLSearchParams | FormData, key: keyof QuoteAction) => {
  const value = source.get(key);
  return typeof value === 'string' ? value.trim().slice(0, 500) : '';
};

const actionFrom = (source: URLSearchParams | FormData): QuoteAction => ({
  action: field(source, 'action') || 'application_review',
  clientName: field(source, 'clientName'),
  clientEmail: field(source, 'clientEmail'),
  clientPhone: field(source, 'clientPhone'),
  templateType: field(source, 'templateType'),
  carrier: field(source, 'carrier'),
  quoteNumber: field(source, 'quoteNumber'),
  premium: field(source, 'premium'),
  propertyAddress: field(source, 'propertyAddress'),
  subject: field(source, 'subject'),
  notes: field(source, 'notes'),
});

const isDocumentRequest = (data: QuoteAction) =>
  /document|declaration|mortgage|evidence/i.test(`${data.action} ${data.templateType} ${data.premium} ${data.subject}`);

const requestLabel = (data: QuoteAction) => {
  if (/request/i.test(data.premium) && !/^\$/.test(data.premium)) return data.premium;
  const text = `${data.action} ${data.premium} ${data.subject}`.toLowerCase();
  if (text.includes('mortgage') || text.includes('evidence')) return 'Mortgagee evidence request';
  if (text.includes('declaration') || text.includes('dec')) return 'Declarations page request';
  return data.premium || 'Document request';
};

const htmlPage = (title: string, body: string, status = 200) =>
  new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; background:#f1f5f9; color:#0f172a; font-family:Arial, Helvetica, sans-serif; }
    main { max-width:640px; margin:0 auto; padding:32px 18px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:28px; box-shadow:0 16px 40px rgba(15,23,42,.08); }
    .logo { color:#003f87; font-size:12px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; margin:0 0 16px; }
    h1 { margin:0 0 10px; font-size:28px; line-height:1.15; }
    p { color:#475569; line-height:1.55; }
    dl { display:grid; grid-template-columns:150px 1fr; gap:10px 14px; margin:22px 0; padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; }
    dt { color:#64748b; font-size:12px; font-weight:700; text-transform:uppercase; }
    dd { margin:0; font-weight:700; }
    label { display:block; color:#334155; font-size:13px; font-weight:700; margin:14px 0 6px; }
    input, textarea { box-sizing:border-box; width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:12px; font:inherit; }
    .hp { display:none; }
    button { width:100%; margin-top:18px; border:2px solid #C8A84E; border-radius:8px; background:#003f87; color:#fff; padding:14px 18px; font-size:15px; font-weight:700; cursor:pointer; }
    .notice { margin-top:16px; padding:12px 14px; border-radius:8px; background:#fffbeb; color:#92400e; font-size:13px; }
    a { color:#003f87; font-weight:700; }
    @media (max-width:560px) { dl { grid-template-columns:1fr; } .card { padding:22px; } }
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

const summaryList = (data: QuoteAction) => `
<dl>
  <dt>Client</dt><dd>${escapeHtml(data.clientName || 'Not listed')}</dd>
  <dt>${isDocumentRequest(data) ? 'Policy' : 'Quote'}</dt><dd>${escapeHtml(data.quoteNumber || 'Not listed')}</dd>
  <dt>Carrier</dt><dd>${escapeHtml(data.carrier || 'Not listed')}</dd>
  <dt>${isDocumentRequest(data) ? 'Request' : 'Premium'}</dt><dd>${escapeHtml(isDocumentRequest(data) ? requestLabel(data) : (data.premium || 'Not listed'))}</dd>
  ${data.propertyAddress ? `<dt>Property</dt><dd>${escapeHtml(data.propertyAddress)}</dd>` : ''}
</dl>`;

const confirmationForm = (data: QuoteAction) => htmlPage('Confirm request', `
<section class="card">
  <p class="logo">Bill Layne Insurance Agency</p>
  <h1>Confirm your request</h1>
  <p>${isDocumentRequest(data)
    ? `Submit this form and Bill Layne Insurance Agency will receive your ${escapeHtml(requestLabel(data).toLowerCase())}. We will review the policy details and follow up if we need anything else.`
    : 'Submit this form and Bill Layne Insurance Agency will contact you about the quote. This request does not bind coverage, lock a rate, or start a policy.'}</p>
  ${summaryList(data)}
  <form method="post" action="/quote-action">
    ${Object.entries(data)
      .filter(([key]) => !['clientEmail', 'clientPhone', 'notes', 'templateType'].includes(key))
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}">`)
      .join('')}
    <label for="clientEmail">Best email</label>
    <input id="clientEmail" name="clientEmail" type="email" value="${escapeHtml(data.clientEmail)}" autocomplete="email">
    <label for="clientPhone">Best phone</label>
    <input id="clientPhone" name="clientPhone" type="tel" value="${escapeHtml(data.clientPhone)}" autocomplete="tel">
    <label for="notes">Anything you want us to know?</label>
    <textarea id="notes" name="notes" rows="3" placeholder="${isDocumentRequest(data) ? 'Where should we send it? Lender name, email, fax, loan number, or deadline.' : 'Preferred contact time, effective date, lender request, etc.'}">${escapeHtml(data.notes)}</textarea>
    <label class="hp" for="website">Website</label>
    <input class="hp" id="website" name="website" tabindex="-1" autocomplete="off">
    <button type="submit">${isDocumentRequest(data) ? 'Send Document Request' : 'Notify Bill to Contact Me'}</button>
  </form>
  <p class="notice">${isDocumentRequest(data)
    ? 'This request does not change coverage. Your policy contract and declarations page control all coverage.'
    : 'Coverage begins only after an application is submitted, accepted by the carrier, and initial payment is processed.'}</p>
</section>`);

const successPage = (data: QuoteAction) => htmlPage('Request received', `
<section class="card">
  <p class="logo">Bill Layne Insurance Agency</p>
  <h1>Request received</h1>
  <p>Thanks${data.clientName ? `, ${escapeHtml(data.clientName.split(' ')[0])}` : ''}. We sent your request to Bill Layne Insurance Agency.</p>
  ${summaryList(data)}
  <p class="notice">${isDocumentRequest(data)
    ? 'This request does not change coverage. We will use the current policy record to respond.'
    : 'This request does not bind coverage or lock a rate. Coverage starts only after carrier acceptance and payment.'}</p>
  <p><a href="https://www.BillLayneInsurance.com">Return to BillLayneInsurance.com</a></p>
</section>`);

const errorPage = (message: string) => htmlPage('Request not sent', `
<section class="card">
  <p class="logo">Bill Layne Insurance Agency</p>
  <h1>We could not send the request</h1>
  <p>${escapeHtml(message)}</p>
  <p>Please call <a href="tel:3368351993">(336) 835-1993</a> or email <a href="mailto:docs@billlayneinsurance.com">docs@billlayneinsurance.com</a>.</p>
</section>`, 500);

const emailText = (data: QuoteAction, request: Request) => [
  isDocumentRequest(data) ? 'A customer requested a home policy document.' : 'A customer requested contact from a quote email.',
  '',
  `Action: ${data.action}`,
  `Request: ${requestLabel(data)}`,
  `Client: ${data.clientName || 'Not listed'}`,
  `Client email: ${data.clientEmail || 'Not listed'}`,
  `Client phone: ${data.clientPhone || 'Not listed'}`,
  `Carrier: ${data.carrier || 'Not listed'}`,
  `${isDocumentRequest(data) ? 'Policy number' : 'Quote number'}: ${data.quoteNumber || 'Not listed'}`,
  `${isDocumentRequest(data) ? 'Property address' : 'Premium'}: ${isDocumentRequest(data) ? (data.propertyAddress || 'Not listed') : (data.premium || 'Not listed')}`,
  `Original subject: ${data.subject || 'Not listed'}`,
  `Notes: ${data.notes || 'None'}`,
  '',
  `Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} Eastern`,
  `IP: ${request.headers.get('CF-Connecting-IP') || 'Not available'}`,
].join('\n');

async function sendEmail(env: Env, data: QuoteAction, request: Request) {
  if (!env.RESEND_API_KEY) throw new Error('Email notifications are not configured yet. Missing RESEND_API_KEY.');

  const to = env.QUOTE_NOTICE_TO || noticeToDefault;
  const from = env.QUOTE_NOTICE_FROM || 'Quote Template Studio <onboarding@resend.dev>';
  const subject = isDocumentRequest(data)
    ? `${requestLabel(data)}: ${data.clientName || 'Client'} - ${data.carrier || 'home policy'}`
    : `Quote action requested: ${data.clientName || 'Client'} - ${data.carrier || 'quote'}`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: emailText(data, request),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email provider rejected the notice: ${detail.slice(0, 300)}`);
  }
}

async function sendSmsIfConfigured(env: Env, data: QuoteAction) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER || !env.TWILIO_TO_NUMBER) return;

  const params = new URLSearchParams({
    From: env.TWILIO_FROM_NUMBER,
    To: env.TWILIO_TO_NUMBER,
    Body: isDocumentRequest(data)
      ? `${requestLabel(data)}: ${data.clientName || 'Client'} - ${data.carrier || 'home policy'} - policy ${data.quoteNumber || 'not listed'}. Check docs@billlayneinsurance.com.`
      : `Quote contact request: ${data.clientName || 'Client'} - ${data.carrier || 'quote'} - ${data.premium || 'premium not listed'}. Check docs@billlayneinsurance.com.`,
  });
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  const url = new URL(request.url);
  return confirmationForm(actionFrom(url.searchParams));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();
  if (form.get('website')) return successPage(actionFrom(form));

  const data = actionFrom(form);
  try {
    await sendEmail(env, data, request);
    await sendSmsIfConfigured(env, data);
    return successPage(data);
  } catch (error) {
    return errorPage(error instanceof Error ? error.message : 'Unknown notification error.');
  }
};
