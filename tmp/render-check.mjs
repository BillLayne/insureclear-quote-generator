import { createServer } from 'vite';
import fs from 'node:fs';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { renderQuoteHtml } = await server.ssrLoadModule('/lib/htmlSerialize.tsx');
  const { autoSample } = await server.ssrLoadModule('/data/samples.ts');
  const { runIntegrityChecks } = await server.ssrLoadModule('/lib/integrityCheck.ts');

  // Wood-like 3-vehicle / 2-driver / homeowner-discount scenario to mirror the example
  const wood = JSON.parse(JSON.stringify(autoSample));
  wood.clientFirstName = 'Ronald';
  wood.clientFullName = 'Ronald & Belinda Wood';
  wood.carrierId = 'national_general';
  wood.quoteNumber = '253426045';
  wood.effectiveDate = '2026-07-01';
  wood.termMonths = 6;
  wood.totalPremium = 669.24;
  wood.paymentOptions = { eft: { downPayment: 114.74, recurringAmount: 114.5, recurringCount: 5 }, paidInFull: { total: 613.22, savings: 56.02 } };
  wood.drivers = [
    { name: 'Ronald Wood', age: 56, yearsLicensed: 38, relationship: 'insured', isTeen: false },
    { name: 'Belinda W. Wood', age: 55, yearsLicensed: 37, relationship: 'spouse', isTeen: false },
  ];
  wood.discounts = [
    { emoji: '', label: 'Multi-Car' }, { emoji: '', label: 'Multi-Policy' },
    { emoji: '', label: 'Homeowner' }, { emoji: '', label: 'Accident / Claim Free' },
    { emoji: '', label: 'Advance Quote' }, { emoji: '', label: 'Paperless' },
    { emoji: '', label: 'In-Agency' }, { emoji: '', label: 'Airbag (all vehicles)' },
  ];

  for (const [label, data] of [['SAMPLE(2veh/1drv/5disc)', autoSample], ['WOOD(3disc-pad-test)', { ...wood, discounts: wood.discounts.slice(0, 3) }]]) {
    const rendered = renderQuoteHtml(data, 'autoEliteQuote');
    const html = rendered.html;
    const integrity = runIntegrityChecks(html);
    const leftoverTokens = html.match(/\{\{[^}]+\}\}/g) || [];
    const discountCells = (html.match(/&#10003;[^<]*/g) || []).map((s) => s.replace('&#10003;', '').trim());
    console.log('\n===', label, '===');
    console.log('bytes:', integrity.byteCount, '| integrity.passed:', integrity.passed);
    if (!integrity.passed) console.log('integrity.errors:', JSON.stringify(integrity.errors));
    console.log('leftover {{tokens}}:', JSON.stringify(leftoverTokens));
    console.log('discount cells:', JSON.stringify(discountCells));
    console.log('phone uses (336) 835-1993:', html.includes('(336) 835-1993'));
    console.log('still has bare 336-835-1993:', html.includes('336-835-1993'));
  }

  // Full Wood render for visual compare
  const woodRender = renderQuoteHtml(wood, 'autoEliteQuote');
  fs.writeFileSync('tmp/autoEliteQuote_wood_current.html', woodRender.html);
  console.log('\nWrote tmp/autoEliteQuote_wood_current.html (', woodRender.html.length, 'chars )');
} finally {
  await server.close();
}
