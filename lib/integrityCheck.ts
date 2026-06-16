export interface IntegrityResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  byteCount: number;
}

export function runIntegrityChecks(html: string): IntegrityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  [/cdn-cgi/i, /__cf_email__/, /email-protection/, /\[email&#160;protected\]/i].forEach((pattern) => {
    if (pattern.test(html)) errors.push(`Cloudflare corruption found: ${pattern}`);
  });

  if (!/mailto:Save@BillLayneInsurance\.com/i.test(html)) {
    errors.push('Clean mailto:Save@BillLayneInsurance.com missing');
  }

  if (/border-radius\s*:\s*50%/i.test(html)) {
    errors.push('border-radius:50% found - circles are banned');
  }

  const byteCount = new Blob([html]).size;
  if (byteCount > 102_400) {
    errors.push(`File too large: ${byteCount} bytes (max 102,400)`);
  } else if (byteCount > 95_000) {
    warnings.push(`Approaching size limit: ${byteCount} bytes`);
  }

  if (!html.trim().endsWith('</html>')) {
    errors.push('Missing closing </html> tag');
  }

  [
    'Bill Layne Insurance Agency',
    '(336) 835-1993',
    '1283 N Bridge St',
    'Elkin, NC 28621',
    'lxu9nfT.png',
    'application/ld+json',
  ].forEach((required) => {
    if (!html.includes(required)) errors.push(`Missing required string: "${required}"`);
  });

  ['XacnUW4', 'Licensed Insurance Agent', 'Owner & Licensed Agent'].forEach((banned) => {
    if (html.includes(banned)) errors.push(`Banned string found: "${banned}"`);
  });

  if (!/Inter/.test(html)) warnings.push('Inter font reference missing');

  return { passed: errors.length === 0, errors, warnings, byteCount };
}
