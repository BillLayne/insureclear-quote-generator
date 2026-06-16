import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });

// grab the header area: from <body> to the first HERO/INTRO marker (covers the logo block)
const headerArea = (html) => {
  const start = html.search(/<body/i);
  const body = start >= 0 ? html.slice(start) : html;
  const cut = body.search(/HERO IMAGE|============ HERO|============ INTRO|HeaderCard|class="hero/i);
  return cut > 0 ? body.slice(0, cut) : body.slice(0, 4000);
};

try {
  const { renderQuoteHtml } = await server.ssrLoadModule('/lib/htmlSerialize.tsx');
  const { autoSample, homeSample } = await server.ssrLoadModule('/data/samples.ts');

  const modes = [
    ['full / auto', autoSample, 'full'],
    ['full / home', homeSample, 'full'],
    ['short', autoSample, 'short'],
    ['autoElite (welcome)', autoSample, 'autoElite'],
    ['autoEliteQuote (ref)', autoSample, 'autoEliteQuote'],
    ['homeElite (welcome)', homeSample, 'homeElite'],
    ['homeEliteQuote', homeSample, 'homeEliteQuote'],
    ['commercialAutoElite', autoSample, 'commercialAutoElite'],
  ];

  for (const [label, data, mode] of modes) {
    const { html } = renderQuoteHtml(data, mode);
    const head = headerArea(html);
    const dbl = head.match(/\{\{[^}]+\}\}/g) || [];
    const singleTokens = head.match(/\{(?:Carrier\w*|Client\w*|Quote\w*|Premium\w*|Vehicle\w*|Driver\w*|Discount\w*|Hero\w*|Effective\w*|Term\w*|Policy\w*|Prepared\w*)[^}]*\}/g) || [];
    const imgs = (head.match(/<img/gi) || []).length;
    const hasBL = head.includes('lxu9nfT.png');
    const hasContainer = /border-radius:14px|border:1px solid #e8e0cf|HeaderCard|border-radius:16px 16px 0 0/i.test(head);
    console.log(`\n=== ${label} (${mode}) ===`);
    console.log('  header imgs:', imgs, '| BL logo:', hasBL, '| in container:', hasContainer);
    console.log('  leftover {{double}}:', JSON.stringify(dbl));
    console.log('  leftover {single} tokens:', JSON.stringify(singleTokens));
  }
} finally {
  await server.close();
}
