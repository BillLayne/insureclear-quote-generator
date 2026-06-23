import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, VehicleCoverage } from '../types/auto';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/AUTO_DIGITAL_QUOTE_CARD_TEMPLATE.html?raw';

export interface RenderedAutoDigitalQuoteCard {
  html: string;
  title: string;
}

const defaultHeroImageUrl = 'https://i.imgur.com/qGDSglj.jpeg';
const defaultAgentPhotoUrl = 'https://i.imgur.com/YYaFqWt.png';

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value: number | undefined | null, digits = 2) =>
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

const monthlyPayment = (data: AutoQuoteData) => {
  const monthly = data.paymentOptions.eft.recurringAmount;
  if (monthly > 0) return monthly;
  return data.termMonths > 0 ? data.totalPremium / data.termMonths : data.totalPremium;
};

const startPolicyUrl = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId];
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    templateType: 'auto-digital-quote',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(monthlyPayment(data), 2)} monthly`,
    subject: `${carrier.displayName} Auto Quote Binding Request`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const carrierPalette = (carrierId: AutoQuoteData['carrierId']) => {
  if (carrierId === 'progressive') {
    return { primary: '#0b4ea2', secondary: '#0f7bdc', surface: '#eef6ff', ink: '#083366', accent: '#b7d8ff' };
  }
  if (carrierId === 'nationwide') {
    return { primary: '#124b8f', secondary: '#1d6fc4', surface: '#eff6ff', ink: '#0d2f59', accent: '#b8d8ff' };
  }
  if (carrierId === 'travelers') {
    return { primary: '#b21f2d', secondary: '#d33a45', surface: '#fff1f2', ink: '#6f1320', accent: '#ffc9cf' };
  }
  if (carrierId === 'national_general') {
    return { primary: '#174a7c', secondary: '#f28c1b', surface: '#f5f9ff', ink: '#0d2f59', accent: '#ffd19a' };
  }
  return { primary: BRAND.colors.navy, secondary: BRAND.colors.navyMid, surface: BRAND.colors.blueTint, ink: BRAND.colors.darkSlate, accent: BRAND.colors.gold };
};

const carrierMarkHtml = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId];
  if (carrier.logoUrl) {
    return `<img src="${escapeHtml(carrier.logoUrl)}" alt="${escapeHtml(carrier.displayName)} logo">`;
  }
  return escapeHtml(carrier.textPillMain || carrier.displayName);
};

const driverNote = (relationship: string) => {
  if (relationship === 'insured') return 'Named insured / driver';
  if (relationship === 'spouse') return 'Spouse / listed driver';
  if (relationship === 'child') return 'Household driver';
  if (relationship === 'excluded') return 'Excluded driver - confirm before binding';
  return 'Driver listed on quote';
};

const driversHtml = (data: AutoQuoteData) =>
  (data.drivers.length ? data.drivers : [{ name: data.clientFullName, age: 0, yearsLicensed: 0, relationship: 'insured' as const, isTeen: false }])
    .map((driver) => `<div class="person-row"><div class="icon-wrap"><i data-lucide="user-round"></i></div><div><strong>${escapeHtml(driver.name)}</strong><span>${escapeHtml(driverNote(driver.relationship))}${driver.isTeen ? ' - teen driver' : ''}</span></div></div>`)
    .join('');

const coverageStatusValue = (coverage: VehicleCoverage) => {
  if (coverage.status === 'rejected') return 'Not selected';
  if (coverage.status === 'not_applicable') return 'Not shown';
  return coverage.limitOrDeductible || 'Included';
};

const derivedVehicleCoverages = (data: AutoQuoteData): VehicleCoverage[] => [
  { emoji: '', name: 'Liability', limitOrDeductible: `${data.coverages.bodilyInjuryLimit} BI / ${data.coverages.propertyDamageLimit} PD`, status: 'included' },
  {
    emoji: '',
    name: 'Comprehensive',
    limitOrDeductible: data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Not selected',
    status: data.coverages.comprehensiveDeductible ? 'included' : 'rejected',
  },
  {
    emoji: '',
    name: 'Collision',
    limitOrDeductible: data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Not selected',
    status: data.coverages.collisionDeductible ? 'included' : 'rejected',
  },
  {
    emoji: '',
    name: 'Medical Payments',
    limitOrDeductible: data.coverages.medicalPayments ? money(data.coverages.medicalPayments, 0) : 'Not selected',
    status: data.coverages.medicalPayments ? 'included' : 'rejected',
  },
  { emoji: '', name: 'Uninsured Motorist', limitOrDeductible: data.coverages.uninsuredMotoristLimit || 'Review', status: 'included' },
];

const vehiclesHtml = (data: AutoQuoteData) => {
  const vehicles = data.vehicles.filter((vehicle) => vehicle.year || vehicle.make || vehicle.model);
  if (!vehicles.length) {
    return '<div class="check-row"><div class="icon-wrap"><i data-lucide="car-front"></i></div><div><strong>Vehicles under review</strong><span>Add vehicles in the quote fields before sending this digital card.</span></div></div>';
  }
  return vehicles.map((vehicle, index) => {
    const coverages = vehicle.coverages?.length ? vehicle.coverages : derivedVehicleCoverages(data);
    const coverageRows = coverages.map((coverage) => `<div class="coverage-line"><div><strong>${escapeHtml(coverage.name)}</strong><span>${coverage.status === 'included' ? 'Quoted coverage' : 'Review selection before binding'}</span></div><div class="coverage-value">${escapeHtml(coverageStatusValue(coverage))}</div></div>`).join('');
    const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
    return `<details class="vehicle-card" ${index === 0 ? 'open' : ''}>
      <summary class="vehicle-summary">
        <div class="icon-wrap"><i data-lucide="car-front"></i></div>
        <div><strong class="vehicle-title">${escapeHtml(name || `Vehicle ${index + 1}`)}</strong><span class="vehicle-meta">${escapeHtml(vehicle.vinLast8 || 'VIN pending')} - ${vehicle.coverageType === 'full_coverage' ? 'Full coverage quoted' : 'Liability coverage quoted'}</span></div>
        <div class="vehicle-premium">${money(vehicle.vehiclePremium, 2)}<i class="chevron" data-lucide="chevron-down"></i></div>
      </summary>
      <div class="coverage-table">${coverageRows}</div>
    </details>`;
  }).join('');
};

const coverageHtml = (data: AutoQuoteData) => {
  const rows = [
    {
      icon: 'shield-check',
      label: 'Liability',
      value: `${data.coverages.bodilyInjuryLimit} / ${data.coverages.propertyDamageLimit}`,
      note: 'Bodily injury and property damage limits quoted.',
      example: 'Protects you when you are responsible for injuries or property damage to others.',
    },
    {
      icon: 'badge-dollar-sign',
      label: 'Comprehensive deductible',
      value: data.coverages.comprehensiveDeductible ? money(data.coverages.comprehensiveDeductible, 0) : 'Not selected',
      note: 'Other-than-collision damage.',
      example: 'Theft, glass, vandalism, fire, weather, and deer claims when selected.',
    },
    {
      icon: 'car-front',
      label: 'Collision deductible',
      value: data.coverages.collisionDeductible ? money(data.coverages.collisionDeductible, 0) : 'Not selected',
      note: 'Damage to your covered vehicle after a collision.',
      example: 'Applies when your vehicle is damaged in a crash and collision is selected.',
    },
    {
      icon: 'route',
      label: 'Rental / Roadside',
      value: [data.coverages.rentalReimbursement, data.coverages.towing].filter(Boolean).join(' + ') || 'Review',
      note: 'Optional service coverages can vary by company and vehicle.',
      example: 'Confirm rental limits, towing, roadside assistance, and any vehicle-specific selections.',
    },
  ];
  return rows.map((row, index) => `<details class="coverage-card" ${index === 0 ? 'open' : ''}>
    <summary class="coverage-summary">
      <div class="icon-wrap"><i data-lucide="${escapeHtml(row.icon)}"></i></div>
      <div><strong class="coverage-title">${escapeHtml(row.label)}</strong><span class="coverage-meta">${escapeHtml(row.note)}</span></div>
      <div class="vehicle-premium">${escapeHtml(row.value)}<i class="chevron" data-lucide="chevron-down"></i></div>
    </summary>
    <div class="coverage-table"><div class="coverage-line"><div><strong>Example</strong><span>${escapeHtml(row.example)}</span></div><div class="coverage-value">Review</div></div></div>
  </details>`).join('');
};

const discountsHtml = (data: AutoQuoteData) =>
  (data.discounts.length ? data.discounts : [{ emoji: '', label: 'Quoted discounts included' }])
    .map((discount) => `<span class="discount-chip"><i data-lucide="sparkles"></i>${escapeHtml(discount.label)}</span>`)
    .join('');

const checklistHtml = () => [
  ['user-check', 'Drivers and household members', 'Make sure every driver is listed correctly and no household driver is missing.'],
  ['car-front', 'Vehicles and VINs', 'Confirm every quoted vehicle, VIN, lienholder, and garaging address.'],
  ['shield-check', 'Deductibles and rental', 'Review comprehensive, collision, rental reimbursement, roadside, and uninsured motorist choices.'],
  ['credit-card', 'Payment plan', 'Confirm down payment, monthly draft date, EFT/card fee, and total policy term amount.'],
].map(([icon, title, body]) => `<div class="check-row"><div class="icon-wrap"><i data-lucide="${icon}"></i></div><div><strong>${title}</strong><span>${body}</span></div></div>`).join('');

export function renderAutoDigitalQuoteCardHtml(data: AutoQuoteData): RenderedAutoDigitalQuoteCard {
  const carrier = CARRIERS[data.carrierId];
  const palette = carrierPalette(data.carrierId);
  const monthly = money(monthlyPayment(data), 2);
  const title = `${data.clientFullName} Auto Quote Digital Card | Bill Layne Insurance`;
  const html = replaceTokens(masterTemplate, {
    TITLE: escapeHtml(title),
    BRAND_PRIMARY: palette.primary,
    BRAND_SECONDARY: palette.secondary,
    BRAND_SURFACE: palette.surface,
    BRAND_INK: palette.ink,
    BRAND_ACCENT: palette.accent,
    HERO_IMAGE: escapeHtml(normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl)),
    CARRIER_MARK_HTML: carrierMarkHtml(data),
    CUSTOMER_NAME: escapeHtml(data.clientFullName),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber || 'Review'),
    DOWN_PAYMENT: money(data.paymentOptions.eft.downPayment, 2),
    MONTHLY: monthly,
    TOTAL_PREMIUM: money(data.totalPremium, 2),
    EFFECTIVE_DATE: formatDate(data.effectiveDate),
    TERM: `${data.termMonths} months`,
    DRIVERS_HTML: driversHtml(data),
    VEHICLES_HTML: vehiclesHtml(data),
    COVERAGE_HTML: coverageHtml(data),
    DISCOUNTS_HTML: discountsHtml(data),
    CHECKLIST_HTML: checklistHtml(),
    START_URL: escapeHtml(startPolicyUrl(data)),
    AGENT_PHOTO: defaultAgentPhotoUrl,
    REVIEW_TEXT: `Local customers use ${BRAND.name} for clear quote explanations, carrier comparisons, and help after the policy starts.`,
    REVIEW_SOURCE: `${BRAND.googleRating} Google rating`,
  });
  return { html, title };
}
