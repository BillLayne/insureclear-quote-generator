import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { resolveHeroImageUrl, normalizeHeroImageUrl, isUsableHeroImageUrl } = await server.ssrLoadModule('/lib/heroImage.ts');
  const FB = 'https://i.imgur.com/DEFAULT.jpeg';

  const cases = [
    // [input, expected normalized (with fallback FB), expectedUsable]
    ['', FB, true],
    ['   ', FB, true],
    ['https://i.imgur.com/6jDPnCX.jpeg', 'https://i.imgur.com/6jDPnCX.jpeg', true],
    ['https://imgur.com/6jDPnCX', 'https://i.imgur.com/6jDPnCX.jpeg', true],
    ['https://imgur.com/6jDPnCX.png', 'https://i.imgur.com/6jDPnCX.png', true],
    ['https://i.imgur.com/6jDPnCX.PNG', 'https://i.imgur.com/6jDPnCX.png', true],
    ['https://i.imgur.com/abc123', 'https://i.imgur.com/abc123.jpeg', true],
    ['https://www.imgur.com/abc123.webp', 'https://i.imgur.com/abc123.webp', true],
    ['https://imgur.com/a/AbCdEfG', FB, false],          // album
    ['https://imgur.com/gallery/AbCdEfG', FB, false],     // gallery
    ['https://imgur.com/a/AbCdEfG/xyz', FB, false],
    ['https://example.com/photo.jpg', 'https://example.com/photo.jpg', true],
    ['https://cdn.example.com/img/house.WEBP?v=2', 'https://cdn.example.com/img/house.WEBP?v=2', true],
    ['https://example.com/no-extension', FB, false],
    ['http://imgur.com/6jDPnCX', FB, false],              // not https
    ['not a url', FB, false],
    ['https://imgur.com/a', FB, false],                   // reserved single-seg
  ];

  let fail = 0;
  for (const [input, expNorm, expUsable] of cases) {
    const gotNorm = normalizeHeroImageUrl(input, FB);
    const gotUsable = isUsableHeroImageUrl(input);
    const ok = gotNorm === expNorm && gotUsable === expUsable;
    if (!ok) fail++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} | in=${JSON.stringify(input)}\n       norm=${gotNorm}  (exp ${expNorm})\n       usable=${gotUsable} (exp ${expUsable})`);
  }
  console.log(`\n${fail === 0 ? 'ALL PASS' : fail + ' FAILED'} (${cases.length} cases)`);
} finally {
  await server.close();
}
