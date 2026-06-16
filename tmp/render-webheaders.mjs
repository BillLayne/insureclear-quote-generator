import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const headerOf = (html) => { const m = html.match(/<header[\s\S]*?<\/header>/i); return m ? m[0] : '(no <header> found)'; };

try {
  const { renderHomeWebPageHtml } = await server.ssrLoadModule('/lib/homeWebPageHtml.ts');
  const { renderCommercialAutoWebPageHtml } = await server.ssrLoadModule('/lib/commercialAutoWebPageHtml.ts');
  const { homeSample, autoSample } = await server.ssrLoadModule('/data/samples.ts');

  const homeOut = renderHomeWebPageHtml(homeSample);
  const homeHtml = typeof homeOut === 'string' ? homeOut : homeOut.html;
  const comOut = renderCommercialAutoWebPageHtml({ ...JSON.parse(JSON.stringify(autoSample)), carrierId: 'progressive', clientFullName: 'Acme Trucking LLC' });
  const comHtml = typeof comOut === 'string' ? comOut : comOut.html;

  for (const [label, html, bannedText] of [
    ['HOME', homeHtml, ['Your Neighbor', 'Insurance Carrier']],
    ['COMMERCIAL', comHtml, ['Commercial Auto Quote Review', 'Call Office', '>BL<']],
  ]) {
    const header = headerOf(html);
    const leftover = header.match(/\{\{[^}]+\}\}/g) || [];
    console.log(`\n===== ${label} HEADER =====`);
    console.log(header.replace(/\s+/g, ' ').trim());
    console.log('--- checks ---');
    console.log('has BL logo (lxu9nfT):', header.includes('lxu9nfT.png'));
    console.log('has a carrier logo img after brand:', /<\/div>\s*<img[^>]+>/i.test(header) || (header.match(/<img/gi) || []).length >= 2);
    console.log('img count:', (header.match(/<img/gi) || []).length);
    console.log('leftover {{tokens}} in header:', JSON.stringify(leftover));
    bannedText.forEach((t) => console.log(`banned text "${t}" present:`, header.includes(t)));
  }
} finally {
  await server.close();
}
