import { createServer } from 'vite';
import fs from 'node:fs';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { renderAutoWebPageHtml } = await server.ssrLoadModule('/lib/autoWebPageHtml.ts');
  const { autoSample } = await server.ssrLoadModule('/data/samples.ts');
  const data = {
    ...JSON.parse(JSON.stringify(autoSample)),
    carrierId: 'progressive',
    clientFirstName: 'Parker',
    clientFullName: 'Parker McConville',
  };
  const out = renderAutoWebPageHtml(data);
  const html = typeof out === 'string' ? out : out.html;
  fs.writeFileSync('tmp/auto_webpage_preview.html', html);
  console.log('wrote tmp/auto_webpage_preview.html', html.length, 'chars');
} finally {
  await server.close();
}
