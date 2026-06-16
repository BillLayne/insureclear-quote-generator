import { createServer } from 'vite';
import fs from 'node:fs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { renderReceiptHtml, validateReceiptData } = await server.ssrLoadModule('/lib/receiptHtml.ts');
  const { runIntegrityChecks } = await server.ssrLoadModule('/lib/integrityCheck.ts');
  const { receiptSample } = await server.ssrLoadModule('/data/receipts.ts');

  const out = renderReceiptHtml(receiptSample);
  fs.writeFileSync('tmp/receipt_preview.html', out.html);
  const integrity = runIntegrityChecks(out.html);
  const leftover = out.html.match(/\{\{[^}]+\}\}/g) || [];

  console.log('subject:', out.subject);
  console.log('preheader:', out.preheader);
  console.log('bytes:', integrity.byteCount, '| integrity.passed:', integrity.passed);
  if (!integrity.passed) console.log('integrity.errors:', JSON.stringify(integrity.errors));
  console.log('integrity.warnings:', JSON.stringify(integrity.warnings));
  console.log('leftover {{tokens}}:', JSON.stringify(leftover));
  console.log('validate(sample):', JSON.stringify(validateReceiptData(receiptSample)));
  // spot-check derived tokens in output
  console.log('has amount 154.69:', out.html.includes('$154.69'));
  console.log('has policy last4 ••3106:', out.html.includes('•☂3106'));
  console.log('has method short "Visa ••4242":', out.html.includes('Visa ••4242'));
  console.log('has ISO date 2026-06-16:', out.html.includes('2026-06-16'));

  // empty-data edge: validation should flag
  const blank = { ...receiptSample, clientFirstName: '', carrierName: '', paymentAmount: 0, confirmationNumber: '' };
  console.log('validate(blank):', JSON.stringify(validateReceiptData(blank)));
  console.log('wrote tmp/receipt_preview.html');
} finally {
  await server.close();
}
