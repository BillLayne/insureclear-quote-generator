import { createServer } from 'vite';

// --- Mock browser globals BEFORE loading the module ---
globalThis.window = globalThis;
globalThis.document = { querySelector: () => null, createElement: () => ({}), head: { appendChild() {} } };
let capturedRaw = null;
globalThis.fetch = async (_url, opts) => {
  capturedRaw = JSON.parse(opts.body).message.raw;
  return { ok: true, json: async () => ({ id: 'draftId', message: { id: 'msgId' } }) };
};
globalThis.google = {
  accounts: { oauth2: { initTokenClient: (cfg) => ({ requestAccessToken: () => cfg.callback({ access_token: 'fake-token' }) }) } },
};

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  define: { 'import.meta.env.VITE_GMAIL_CLIENT_ID': JSON.stringify('test-id.apps.googleusercontent.com') },
});

try {
  const mod = await server.ssrLoadModule('/lib/gmailDraft.ts');
  console.log('gmailConfigured:', mod.gmailConfigured);

  const subject = 'Ronald, your auto quote — three cars, about $112/mo'; // em dash = non-ASCII
  const html = '<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body>Café — done</body></html>';
  const res = await mod.createGmailDraft({ subject, html, to: 'client@example.com', bcc: 'Save@BillLayneInsurance.com' });
  console.log('result:', JSON.stringify(res));

  // Decode raw (base64url -> bytes -> utf8)
  const b64 = capturedRaw.replace(/-/g, '+').replace(/_/g, '/');
  const mime = Buffer.from(b64, 'base64').toString('utf8');
  const [headerBlock, bodyBlock] = mime.split('\r\n\r\n');
  console.log('\n--- HEADERS ---\n' + headerBlock);

  const decodedHtml = Buffer.from(bodyBlock.replace(/\r\n/g, ''), 'base64').toString('utf8');

  const checks = [
    ['has To header', /^To: client@example\.com$/m.test(headerBlock)],
    ['has Bcc header', /^Bcc: Save@BillLayneInsurance\.com$/m.test(headerBlock)],
    ['subject RFC2047-encoded (=?UTF-8?B?)', /^Subject: =\?UTF-8\?B\?/m.test(headerBlock)],
    ['subject decodes back', (() => { const m = headerBlock.match(/^Subject: =\?UTF-8\?B\?([^?]+)\?=/m); return m && Buffer.from(m[1], 'base64').toString('utf8') === subject; })()],
    ['content-type html utf8', /^Content-Type: text\/html; charset="UTF-8"$/m.test(headerBlock)],
    ['transfer-encoding base64', /^Content-Transfer-Encoding: base64$/m.test(headerBlock)],
    ['blank line separates headers/body', mime.includes('\r\n\r\n')],
    ['html round-trips exactly (UTF-8 preserved)', decodedHtml === html],
    ['raw is base64url (no + / =)', !/[+/=]/.test(capturedRaw)],
    ['result url targets the draft', res.url.includes('msgId')],
  ];
  let fail = 0;
  console.log('\n--- CHECKS ---');
  for (const [name, ok] of checks) { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} | ${name}`); }
  console.log(`\n${fail === 0 ? 'ALL PASS' : fail + ' FAILED'}`);
} finally {
  await server.close();
}
