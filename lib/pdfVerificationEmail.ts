import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { QuoteData } from '../types/quote';

export interface PdfVerificationEmail {
  html: string;
  text: string;
  subject: string;
  preheader: string;
  filename: string;
}

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value: number, digits = 2) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const carrierName = (data: QuoteData) => CARRIERS[data.carrierId]?.displayName || data.carrierId;
const carrierLegal = (data: QuoteData) => {
  if ('carrierLegalEntity' in data && data.carrierLegalEntity) return data.carrierLegalEntity;
  return CARRIERS[data.carrierId]?.legalName || carrierName(data);
};

function premiumSummary(data: QuoteData) {
  if (data.templateType === 'auto') {
    const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths;
    return {
      headline: `${money(monthly)}/mo`,
      subline: `${money(data.totalPremium)} total ${data.termMonths}-month premium`,
      total: money(data.totalPremium),
    };
  }
  return {
    headline: `${money(data.annualPremium)}/yr`,
    subline: `${money(data.annualPremium / 12)} per month equivalent`,
    total: money(data.annualPremium),
  };
}

function subjectItem(data: QuoteData) {
  if (data.templateType === 'auto') {
    return data.vehicles.map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`).join(', ');
  }
  if (data.templateType === 'home') return data.propertyAddress;
  if (data.templateType === 'motorcycle') return [data.bike.year, data.bike.make, data.bike.model, data.bike.trim].filter(Boolean).join(' ');
  if (data.templateType === 'renters') return `${data.unit.streetAddress}, ${data.unit.city}, ${data.unit.state} ${data.unit.zip}`;
  return `${data.property.streetAddress}, ${data.property.city}, ${data.property.state} ${data.property.zip}`;
}

function coverageSnapshot(data: QuoteData) {
  if (data.templateType === 'auto') {
    return [
      ['Policy Term', `${data.termMonths} months`],
      ['Vehicles', `${data.vehicles.length}`],
      ['Drivers', `${data.drivers.length}`],
      ['Quote Expires', data.expiryDate],
    ];
  }
  if (data.templateType === 'home') {
    return [
      ['Policy Type', data.policyType],
      ['Dwelling', money(data.coverages.coverageA, 0)],
      ['Deductible', money(data.allPerilDeductible, 0)],
      ['Quote Expires', data.expiryDate],
    ];
  }
  if (data.templateType === 'motorcycle') {
    return [
      ['Bike Type', data.bike.bikeType],
      ['VIN', data.bike.vin],
      ['Engine', data.bike.engine],
      ['Quote Expires', data.expiryDate],
    ];
  }
  if (data.templateType === 'renters') {
    return [
      ['Personal Property', money(data.coverages.coverageC, 0)],
      ['Liability', money(data.coverages.coverageE, 0)],
      ['Deductible', money(data.coverages.deductible, 0)],
      ['Quote Expires', data.expiryDate],
    ];
  }
  return [
    ['Form', data.formCode],
    ['Dwelling', money(data.coverages.coverageA, 0)],
    ['Fair Rental Value', money(data.coverages.coverageD, 0)],
    ['Quote Expires', data.expiryDate],
  ];
}

function rowsHtml(rows: string[][]) {
  return rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <span style="display:block;margin:0 0 3px 0;font-family:${BRAND.fontFamily};font-size:10px;font-weight:700;color:#64748b;letter-spacing:0.8px;text-transform:uppercase;">${escapeHtml(label)}</span>
          <span style="display:block;margin:0;font-family:${BRAND.fontFamily};font-size:15px;font-weight:700;color:#0f172a;line-height:1.35;">${escapeHtml(value)}</span>
        </td>
      </tr>`,
    )
    .join('');
}

export function buildPdfVerificationEmail(data: QuoteData): PdfVerificationEmail {
  const carrier = CARRIERS[data.carrierId] || CARRIERS.progressive;
  const firstName = data.clientFirstName || data.clientFullName.split(' ')[0] || 'there';
  const item = subjectItem(data);
  const premium = premiumSummary(data);
  const subject = `${firstName}, your ${carrier.displayName} PDF is ready`;
  const preheader = `${carrier.displayName} PDF plus key quote details for review`;
  const filename = `${data.clientFullName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_${data.templateType}_pdf_email.html`;
  const summaryRows = [
    ['Client', data.clientFullName],
    ['Carrier', carrier.displayName],
    ['Quote Number', data.quoteNumber],
    ['Insured Item', item],
    ['Effective Date', data.effectiveDate],
    ['Premium', premium.total],
    ...coverageSnapshot(data),
  ];
  const carrierLogo = carrier.logoUrl
    ? `<img src="${carrier.logoUrl}" alt="${escapeHtml(carrier.displayName)}" width="120" style="display:block;width:120px;height:auto;border:0;">`
    : `<span style="font-family:${BRAND.fontFamily};font-size:11px;font-weight:700;color:#003f87;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(carrier.displayName)}</span>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(subject)}</title>
<style>
${BRAND.fontImport}
body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table{border-collapse:collapse;}
img{-ms-interpolation-mode:bicubic;}
a{text-decoration:none;}
@media only screen and (max-width:600px){.container{width:100%!important}.card-pad{padding:22px!important}.hero-title{font-size:26px!important}.premium-num{font-size:36px!important}}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<div style="display:none;white-space:nowrap;font:15px courier;color:#ffffff;line-height:0;width:600px!important;min-width:600px!important;max-width:600px!important;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div>
<div style="display:none;font-size:1px;color:#fefefe;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>
<table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" width="600" cellPadding="0" cellSpacing="0" border="0" class="container" style="width:600px;max-width:600px;">
<tr><td>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#fafafa;border:1px solid #e2e8f0;border-radius:16px 16px 0 0;border-bottom:none;">
    <tr><td height="5" style="background:linear-gradient(90deg,#003f87,#C8A84E);background-color:#003f87;font-size:0;line-height:0;height:5px;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:24px;">
      <table role="presentation" cellPadding="0" cellSpacing="0" border="0"><tr>
        <td style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 18px;"><img src="${BRAND.logoUrl}" width="120" alt="${escapeHtml(BRAND.name)}" style="display:block;width:120px;height:auto;border:0;"></td>
        <td width="20" style="width:20px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 18px;">${carrierLogo}</td>
      </tr></table>
      <p style="margin:16px 0 0 0;font-family:${BRAND.fontFamily};font-size:10px;font-weight:700;color:#64748b;letter-spacing:1.5px;text-transform:uppercase;">Carrier PDF Verification Email</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background:linear-gradient(135deg,#0f172a 0%,#1a365d 50%,#0f766e 100%);background-color:#0f172a;">
    <tr><td align="center" class="card-pad" style="padding:42px 32px;text-align:center;">
      <p style="margin:0 0 10px 0;font-family:${BRAND.fontFamily};font-size:11px;font-weight:700;color:#C8A84E;letter-spacing:1.8px;text-transform:uppercase;">PDF Ready for Review</p>
      <h1 class="hero-title" style="margin:0 0 12px 0;font-family:${BRAND.fontFamily};font-size:32px;font-weight:700;color:#ffffff;line-height:1.2;">${escapeHtml(firstName)}, your carrier PDF is ready.</h1>
      <p style="margin:0 0 24px 0;font-family:${BRAND.fontFamily};font-size:14px;color:rgba(255,255,255,0.78);line-height:1.6;">I attached the carrier PDF so you can verify the quote details directly from the source document.</p>
      <table role="presentation" cellPadding="0" cellSpacing="0" border="0" style="margin:0 auto;"><tr><td style="background-color:rgba(255,255,255,0.15);border-radius:16px;padding:20px 36px;border:1px solid rgba(255,255,255,0.3);text-align:center;">
        <p style="margin:0 0 2px 0;font-family:${BRAND.fontFamily};font-size:11px;font-weight:700;color:#C8A84E;letter-spacing:1.5px;text-transform:uppercase;">Quote Premium</p>
        <p class="premium-num" style="margin:0;font-family:${BRAND.fontFamily};font-size:40px;font-weight:700;color:#ffffff;line-height:1.1;">${escapeHtml(premium.headline)}</p>
        <p style="margin:4px 0 0 0;font-family:${BRAND.fontFamily};font-size:13px;color:rgba(255,255,255,0.75);">${escapeHtml(premium.subline)}</p>
      </td></tr></table>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-top:none;">
    <tr><td class="card-pad" style="padding:32px;">
      <p style="margin:0 0 4px 0;font-family:${BRAND.fontFamily};font-size:10px;font-weight:700;color:#003f87;letter-spacing:1.5px;text-transform:uppercase;">&bull; Attachment Reminder</p>
      <h2 style="margin:0 0 12px 0;font-family:${BRAND.fontFamily};font-size:21px;font-weight:700;color:#0f172a;line-height:1.25;">Carrier PDF attached for verification</h2>
      <p style="margin:0;font-family:${BRAND.fontFamily};font-size:14px;color:#334155;line-height:1.65;">The PDF attached to this Gmail message is the carrier source document. The summary below is provided for convenience, but the attached PDF controls if there is any mismatch.</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#fafafa;border:1px solid #e2e8f0;border-top:none;">
    <tr><td class="card-pad" style="padding:32px;">
      <p style="margin:0 0 4px 0;font-family:${BRAND.fontFamily};font-size:10px;font-weight:700;color:#003f87;letter-spacing:1.5px;text-transform:uppercase;">&bull; PDF Summary</p>
      <h2 style="margin:0 0 12px 0;font-family:${BRAND.fontFamily};font-size:21px;font-weight:700;color:#0f172a;line-height:1.25;">What this PDF covers</h2>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0">${rowsHtml(summaryRows)}</table>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-top:none;">
    <tr><td align="center" class="card-pad" style="padding:34px 32px;text-align:center;">
      <h2 style="margin:0 0 10px 0;font-family:${BRAND.fontFamily};font-size:22px;font-weight:700;color:#0f172a;">Questions after reviewing the PDF?</h2>
      <p style="margin:0 0 20px 0;font-family:${BRAND.fontFamily};font-size:14px;color:#64748b;line-height:1.6;">Just reply to this email. I will review the PDF with you and explain anything that is unclear.</p>
      <table role="presentation" cellPadding="0" cellSpacing="0" border="0" style="margin:0 auto 12px auto;"><tr><td style="background-color:#003f87;border-radius:8px;border:2px solid #C8A84E;"><a href="tel:${BRAND.phoneRaw}" style="display:inline-block;padding:14px 34px;font-family:${BRAND.fontFamily};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Call ${BRAND.phone}</a></td></tr></table>
      <p style="margin:0;font-family:${BRAND.fontFamily};font-size:11px;color:#64748b;line-height:1.55;">This is a quote communication. Coverage starts only after carrier acceptance and required payment.</p>
    </td></tr>
  </table>
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" style="background-color:#fafafa;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
    <tr><td align="center" style="padding:28px 24px;">
      <p style="margin:0 0 10px 0;font-family:${BRAND.fontFamily};font-size:14px;font-weight:700;color:#0f172a;">${BRAND.name}</p>
      <p style="margin:0 0 8px 0;font-family:${BRAND.fontFamily};font-size:12px;color:#64748b;line-height:1.7;">${BRAND.street}<br>${BRAND.city}, ${BRAND.state} ${BRAND.zip}<br><a href="tel:${BRAND.phoneRaw}" style="color:#003f87;font-weight:700;">${BRAND.phone}</a> &bull; <a href="mailto:${BRAND.email}" style="color:#003f87;font-weight:700;">${BRAND.email}</a><br><a href="${BRAND.websiteUrl}" style="color:#003f87;font-weight:700;">${BRAND.website}</a></p>
      <p style="margin:0 0 10px 0;font-family:${BRAND.fontFamily};font-size:11px;color:#64748b;"><a href="${BRAND.facebook}" style="color:#003f87;">Facebook</a> &bull; <a href="${BRAND.youtube}" style="color:#003f87;">YouTube</a> &bull; <a href="${BRAND.instagram}" style="color:#003f87;">Instagram</a> &bull; <a href="${BRAND.twitter}" style="color:#003f87;">X</a></p>
      <p style="margin:0;font-family:${BRAND.fontFamily};font-size:10px;color:#94a3b8;line-height:1.6;">You are receiving this because you requested a quote or policy service from Bill Layne Insurance Agency. To stop receiving these emails, reply with unsubscribe or call ${BRAND.phone}.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</td></tr>
</table>
<script type="application/ld+json">${JSON.stringify({
    '@context': 'http://schema.org',
    '@type': 'EmailMessage',
    description: `${carrier.displayName} PDF verification for ${data.clientFullName}`,
    about: {
      '@type': 'Quotation',
      identifier: data.quoteNumber,
      name: `${carrier.displayName} ${data.templateType} quote PDF`,
    },
    sender: {
      '@type': 'InsuranceAgency',
      name: BRAND.name,
      telephone: '+1-336-835-1993',
      email: BRAND.email,
    },
  })}</script>
</body>
</html>`;

  const text = `${firstName}, your ${carrier.displayName} carrier PDF is ready.

The carrier PDF should be attached to this Gmail message for verification.

PDF SUMMARY
===========
Client: ${data.clientFullName}
Carrier: ${carrier.displayName}
Carrier Legal Entity: ${carrierLegal(data)}
Quote Number: ${data.quoteNumber}
Insured Item: ${item}
Effective Date: ${data.effectiveDate}
Premium: ${premium.total}

Please reply with any questions after reviewing the attached PDF.

${BRAND.name}
${BRAND.phone}
${BRAND.email}`;

  return { html, text, subject, preheader, filename };
}
