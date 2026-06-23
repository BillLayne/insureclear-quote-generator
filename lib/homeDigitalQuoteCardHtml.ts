import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { HomeQuoteData } from '../types/home';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/HOME_DIGITAL_QUOTE_CARD_TEMPLATE.html?raw';

export interface RenderedHomeDigitalQuoteCard {
  html: string;
  title: string;
}

const defaultHeroImageUrl = 'https://i.imgur.com/i2NcMCf.jpeg';
const defaultAgentPhotoUrl = 'https://i.imgur.com/YYaFqWt.png';

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value: number | undefined | null, digits = 0) =>
  Number(value || 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatDate = (value: string | undefined | null) => {
  if (!value) return 'Date under review';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const monthlyEstimate = (data: HomeQuoteData) => data.annualPremium > 0 ? data.annualPremium / 12 : 0;

const limitLabel = (amount: number | string | undefined | null) =>
  typeof amount === 'number' ? money(amount) : String(amount || 'Included');

const startPolicyUrl = (data: HomeQuoteData) => {
  const carrier = CARRIERS[data.carrierId];
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    templateType: 'home-digital-quote',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(monthlyEstimate(data), 2)} monthly`,
    subject: `${carrier.displayName} Home Quote Binding Request`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const carrierPalette = (carrierId: HomeQuoteData['carrierId']) => {
  if (carrierId === 'ncgrange') {
    return { primary: '#5c4334', secondary: '#b9853d', surface: '#fbf3e8', ink: '#3b2a20', accent: '#f2d39d' };
  }
  if (carrierId === 'nationwide') {
    return { primary: '#124b8f', secondary: '#1d6fc4', surface: '#eff6ff', ink: '#0d2f59', accent: '#b8d8ff' };
  }
  if (carrierId === 'travelers') {
    return { primary: '#b21f2d', secondary: '#d33a45', surface: '#fff1f2', ink: '#6f1320', accent: '#ffc9cf' };
  }
  if (carrierId === 'alamance') {
    return { primary: '#386641', secondary: '#6a994e', surface: '#f1f7ed', ink: '#243d2a', accent: '#c8dcb0' };
  }
  return { primary: BRAND.colors.navy, secondary: BRAND.colors.navyMid, surface: BRAND.colors.blueTint, ink: BRAND.colors.darkSlate, accent: BRAND.colors.gold };
};

const carrierMarkHtml = (data: HomeQuoteData) => {
  const carrier = CARRIERS[data.carrierId];
  if (carrier.logoUrl) {
    return `<img src="${escapeHtml(carrier.logoUrl)}" alt="${escapeHtml(carrier.displayName)} logo">`;
  }
  return escapeHtml(carrier.textPillMain || carrier.displayName);
};

const firstName = (data: HomeQuoteData) =>
  data.clientFirstName || data.clientFullName.split(/\s+/).filter(Boolean)[0] || data.clientFullName;

const propertyHtml = (data: HomeQuoteData) => {
  const items = [
    ['map-pin', 'Insured location', data.propertyAddress || 'Address under review'],
    ['home', 'Policy type', data.policyType],
    ['hammer', 'Construction', data.constructionType || 'Not listed'],
    ['calendar', 'Year built', data.yearBuilt ? String(data.yearBuilt) : 'Not listed'],
    ['ruler', 'Square feet', data.squareFeet ? data.squareFeet.toLocaleString() : 'Not listed'],
    ['shield', 'Protection class', data.protectionClass ? `Class ${data.protectionClass}` : 'Not listed'],
    ['house', 'Roof', [data.roofMaterial, data.roofYear].filter(Boolean).join(' / ') || 'Not listed'],
    ['route', 'Fire distance', data.fireDistance || 'Confirm'],
  ];
  return items.map(([icon, label, value]) => `<div class="detail-row"><div class="icon-wrap"><i data-lucide="${escapeHtml(icon)}"></i></div><div><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div></div>`).join('');
};

const coverageRows = (data: HomeQuoteData) => {
  const c = data.coverages;
  return [
    {
      icon: 'home',
      label: 'Coverage A - Dwelling',
      amount: limitLabel(c.coverageA),
      note: 'Protects the structure of your home.',
      explain: `Pays to repair or rebuild the home itself. This quote shows ${limitLabel(c.coverageA)} for the dwelling.`,
      example: 'A covered fire, wind, or hail claim damages the house structure.',
    },
    {
      icon: 'warehouse',
      label: 'Coverage B - Other Structures',
      amount: limitLabel(c.coverageB),
      note: 'Detached garage, sheds, fences, and similar structures.',
      explain: `Other structures are quoted at ${limitLabel(c.coverageB)}.`,
      example: 'A storm damages a detached shed or fence.',
    },
    {
      icon: 'sofa',
      label: 'Coverage C - Personal Property',
      amount: limitLabel(c.coverageC),
      note: 'Furniture, clothes, electronics, and belongings.',
      explain: `Your contents are quoted at ${limitLabel(c.coverageC)} with ${data.personalPropertyLossSettlement} settlement.`,
      example: 'A covered loss damages furniture, clothing, and electronics.',
    },
    {
      icon: 'hotel',
      label: 'Coverage D - Loss of Use',
      amount: limitLabel(c.coverageD),
      note: 'Extra living cost if the home cannot be lived in.',
      explain: 'Helps with hotel, rental, or extra meal costs after a covered loss makes the home unlivable.',
      example: 'The home needs repairs after a covered fire and you need a temporary place to stay.',
    },
    {
      icon: 'shield-check',
      label: 'Coverage E - Personal Liability',
      amount: limitLabel(c.coverageE),
      note: 'Protects against covered lawsuits.',
      explain: `Personal liability is quoted at ${limitLabel(c.coverageE)}.`,
      example: 'A guest is injured and claims you are legally responsible.',
    },
    {
      icon: 'heart-pulse',
      label: 'Coverage F - Medical Payments',
      amount: limitLabel(c.coverageF),
      note: 'Small medical claims for guests.',
      explain: `Medical payments are quoted at ${limitLabel(c.coverageF)}.`,
      example: 'A visitor has a small injury on the property and needs medical care.',
    },
  ];
};

const coverageHtml = (data: HomeQuoteData) =>
  coverageRows(data).map((coverage, index) => `<details class="coverage-card" ${index === 0 ? 'open' : ''}>
    <summary class="coverage-summary">
      <div class="icon-wrap"><i data-lucide="${escapeHtml(coverage.icon)}"></i></div>
      <div><strong class="coverage-title">${escapeHtml(coverage.label)}</strong><span class="coverage-meta">${escapeHtml(coverage.note)}</span></div>
      <div class="coverage-amount">${escapeHtml(coverage.amount)}<i class="chevron" data-lucide="chevron-down"></i></div>
    </summary>
    <div class="coverage-explain"><strong>What this means</strong><br>${escapeHtml(coverage.explain)}<br><br><strong>Example</strong><br>${escapeHtml(coverage.example)}</div>
  </details>`).join('');

const endorsementsHtml = (data: HomeQuoteData) => {
  if (!data.endorsements.length) {
    return '<div class="schedule-card"><div class="icon-wrap"><i data-lucide="file-check-2"></i></div><div><strong>No extra endorsements listed</strong><span>Add scheduled forms or endorsements in the quote fields if needed.</span></div><div class="schedule-premium">Review</div></div>';
  }
  return data.endorsements.map((item) => `<div class="schedule-card"><div class="icon-wrap"><i data-lucide="badge-plus"></i></div><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.subLabel)}</span></div><div class="schedule-premium">${escapeHtml(item.amount)}</div></div>`).join('');
};

const discountsHtml = (data: HomeQuoteData) =>
  (data.discounts.length ? data.discounts : [{ emoji: '', label: 'Quoted discounts included' }])
    .map((discount) => `<span class="discount-chip"><i data-lucide="sparkles"></i>${escapeHtml(discount.label)}</span>`)
    .join('');

const checklistHtml = () => [
  ['map-pin', 'Address and occupancy', 'Confirm the insured location, occupancy, and any mailing address differences.'],
  ['hammer', 'Construction and year built', 'Review year built, construction type, roof, heating, wood stove, and updates.'],
  ['shield-check', 'Limits and deductible', 'Confirm dwelling, contents, liability, med pay, and deductible match your needs.'],
  ['file-check-2', 'Forms and schedules', 'Review added endorsements, water backup, equipment breakdown, and lender needs.'],
].map(([icon, title, body]) => `<div class="check-row"><div class="icon-wrap"><i data-lucide="${icon}"></i></div><div><strong>${title}</strong><span>${body}</span></div></div>`).join('');

export function renderHomeDigitalQuoteCardHtml(data: HomeQuoteData): RenderedHomeDigitalQuoteCard {
  const carrier = CARRIERS[data.carrierId];
  const palette = carrierPalette(data.carrierId);
  const monthly = money(monthlyEstimate(data), 2);
  const title = `${data.clientFullName} Home Quote Digital Card | Bill Layne Insurance`;
  const html = replaceTokens(masterTemplate, {
    TITLE: escapeHtml(title),
    BRAND_PRIMARY: palette.primary,
    BRAND_SECONDARY: palette.secondary,
    BRAND_SURFACE: palette.surface,
    BRAND_INK: palette.ink,
    BRAND_ACCENT: palette.accent,
    HERO_IMAGE: escapeHtml(normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl)),
    CARRIER_MARK_HTML: carrierMarkHtml(data),
    FIRST_NAME: escapeHtml(firstName(data)),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber || 'Review'),
    MONTHLY: monthly,
    ANNUAL_PREMIUM: money(data.annualPremium, 2),
    DWELLING_LIMIT: limitLabel(data.coverages.coverageA),
    DEDUCTIBLE: money(data.allPerilDeductible, 0),
    POLICY_TYPE: escapeHtml(data.policyType),
    EFFECTIVE_DATE: formatDate(data.effectiveDate),
    EXPIRATION_DATE: formatDate(data.expiryDate),
    TERM: '12 months',
    PROPERTY_HTML: propertyHtml(data),
    COVERAGE_HTML: coverageHtml(data),
    ENDORSEMENTS_HTML: endorsementsHtml(data),
    DISCOUNTS_HTML: discountsHtml(data),
    CHECKLIST_HTML: checklistHtml(),
    START_URL: escapeHtml(startPolicyUrl(data)),
    AGENT_PHOTO: defaultAgentPhotoUrl,
    REVIEW_TEXT: `Local customers use ${BRAND.name} for clear quote explanations, carrier comparisons, and help after the policy starts.`,
    REVIEW_SOURCE: `${BRAND.googleRating} Google rating`,
  });
  return { html, title };
}
