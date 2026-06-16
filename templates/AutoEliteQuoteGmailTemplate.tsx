import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import { quoteActionHref } from './shared/EmailParts';
import { normalizeHeroImageUrl } from '../lib/heroImage';
import autoEliteQuoteTemplate from './email/AUTO_ELITE_QUOTE_TEMPLATE.html?raw';

const defaultHeroImageUrl = 'https://i.imgur.com/ccUL6ng.jpeg';

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

const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

const numberWord = (count: number) => {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  return words[count] || String(count);
};

const formatLimit = (limit?: string | number | null) => {
  const raw = String(limit ?? '').trim();
  if (!raw) return 'Not listed';
  if (raw.includes('$')) return raw;

  const parts = raw.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part) => formatLimit(part)).join(' / ');
  }

  const numeric = Number(raw.replace(/[,kK]/g, ''));
  if (!Number.isFinite(numeric)) return raw;
  const amount = numeric < 1000 ? numeric * 1000 : numeric;
  return money(amount, 0);
};

const relationshipCopy = (driver?: Driver) => {
  if (!driver) return 'Driver';
  if (driver.relationship === 'insured') return 'Named Insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'child') return 'Household Driver';
  if (driver.relationship === 'excluded') return 'Excluded Driver';
  return 'Driver';
};

const driverDetail = (driver?: Driver) => {
  if (!driver) return 'Driver details to be confirmed';
  const parts = [
    escapeHtml(relationshipCopy(driver)),
    driver.age ? `Age ${driver.age}` : '',
    driver.yearsLicensed ? `${driver.yearsLicensed} yrs licensed` : '',
    driver.isTeen ? 'Teen driver' : '',
  ].filter(Boolean);
  return parts.join(' &bull; ') || 'Driver details to be confirmed';
};

const vehicleName = (vehicle?: Vehicle) =>
  vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle details to be confirmed';

const vehicleUse = (vehicle?: Vehicle) => {
  if (!vehicle) return 'Use to be confirmed';
  const coverage = vehicle.coverageType === 'full_coverage' ? 'Comprehensive/collision selected' : 'Liability only';
  const primary = vehicle.isPrimary ? 'Primary vehicle' : 'Additional vehicle';
  return `${primary} &middot; ${coverage} &middot; Garaged ${escapeHtml(vehicle.garagingZip || 'ZIP confirm')}`;
};

const defaultVehicleCoverages = (data: AutoQuoteData, vehicle?: Vehicle): VehicleCoverage[] => {
  if (!vehicle) return [];
  if (vehicle.coverages?.length) return vehicle.coverages;

  const rows: VehicleCoverage[] = [
    {
      emoji: '',
      name: 'Liability',
      limitOrDeductible: `${data.coverages.bodilyInjuryLimit} BI / ${data.coverages.propertyDamageLimit} PD`,
      status: 'included',
    },
    {
      emoji: '',
      name: 'Uninsured Motorist',
      limitOrDeductible: data.coverages.uninsuredMotoristLimit,
      status: 'included',
    },
  ];

  if (vehicle.coverageType === 'full_coverage') {
    rows.push({
      emoji: '',
      name: 'Comprehensive',
      limitOrDeductible: data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Included',
      status: 'included',
    });
    rows.push({
      emoji: '',
      name: 'Collision',
      limitOrDeductible: data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Included',
      status: 'included',
    });
  }

  return rows;
};

const deductibleValue = (data: AutoQuoteData, vehicle: Vehicle | undefined, pattern: RegExp, fallback?: number) => {
  if (!vehicle) return 'Not listed';
  const match = defaultVehicleCoverages(data, vehicle).find((coverage) => pattern.test(coverage.name));
  if (!match) return fallback ? `${money(fallback, 0)} deductible` : 'Not selected';
  if (match.status === 'rejected' || /not (included|selected)/i.test(match.limitOrDeductible)) return 'Not selected';
  return match.limitOrDeductible || (fallback ? `${money(fallback, 0)} deductible` : 'Not selected');
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const extractBlock = (template: string, startMarker: string, endMarker: string) => {
  const start = template.indexOf(startMarker);
  const end = template.indexOf(endMarker, start);
  if (start < 0 || end < 0) return null;
  return {
    start,
    end: end + endMarker.length,
    block: template.slice(start, end + endMarker.length),
  };
};

const renderVehicleCards = (data: AutoQuoteData, block: string) => {
  const vehicles = data.vehicles.length ? data.vehicles : [undefined];
  return vehicles
    .map((vehicle) =>
      replaceTokens(block, {
        VEHICLE_N: escapeHtml(vehicleName(vehicle)),
        VEHICLE_N_VIN: escapeHtml(vehicle?.vinLast8 || 'Confirm'),
        VEHICLE_N_USE: vehicleUse(vehicle),
        VEHICLE_N_PREMIUM: vehicle ? escapeHtml(money(vehicle.vehiclePremium)) : 'Review',
        VEHICLE_N_COMP: escapeHtml(deductibleValue(data, vehicle, /comprehensive|other than collision/i, data.coverages.comprehensiveDeductible)),
        VEHICLE_N_COLL: escapeHtml(deductibleValue(data, vehicle, /collision/i, data.coverages.collisionDeductible)),
      }),
    )
    .join('\n');
};

const renderAdditionalDrivers = (drivers: Driver[], block: string) =>
  drivers
    .slice(1)
    .map((driver) =>
      replaceTokens(block, {
        DRIVER_2_NAME: escapeHtml(driver.name || 'Additional driver'),
        DRIVER_2_DETAIL: driverDetail(driver),
      }),
    )
    .join('\n');

const removeInstructionComment = (template: string) =>
  template.replace(/^<!--[\s\S]*?============================================================================\s*-->\s*/m, '');

const maybeRemoveBundleCard = (html: string, data: AutoQuoteData) => {
  const hasHomeownerDiscount = data.discounts.some((discount) => /home\s*owner|homeowner|home/i.test(discount.label));
  if (hasHomeownerDiscount) return html;

  return html.replace(
    /\s*<!-- ============ BUNDLE CROSS-SELL P\.S\.[\s\S]*?<!-- Disclaimer -->/,
    '\n\n          <!-- Disclaimer -->',
  );
};

// Real discounts only — no fake "service" filler. After the {{DISCOUNT_N}} tokens are
// filled (empty for unused slots), collapse the lone check-mark cells and drop any
// fully-empty rows so the 2-column grid stays clean for 1–8 discounts. The exact cell
// styles are matched from the template so this stays correct if the template is re-synced.
const cleanDiscountGrid = (html: string) =>
  html
    .replace(/>&#10003;\s*<\/td>/g, '>&nbsp;</td>')
    .replace(
      /\s*<tr>\s*<td width="50%" valign="top" style="padding:5px 10px 5px 0; color:#5f584a;">&nbsp;<\/td>\s*<td width="50%" valign="top" style="padding:5px 0 5px 10px; color:#5f584a;">&nbsp;<\/td>\s*<\/tr>/g,
      '',
    );

export const autoEliteQuoteSubject = (data: AutoQuoteData) => {
  const vehicleWord = numberWord(data.vehicles.length || 1);
  const monthly = data.totalPremium / Math.max(data.termMonths, 1);
  return `${data.clientFirstName}, your auto quote - ${vehicleWord} cars, about ${money(monthly)}/mo`;
};

export const autoEliteQuotePreheader = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  return `${numberWord(data.vehicles.length || 1)} vehicles with ${carrier.displayName} - ${money(data.totalPremium)} for ${data.termMonths}-month, coverage details and next step.`;
};

export function renderAutoEliteQuoteGmailHtml(data: AutoQuoteData) {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const monthly = data.totalPremium / Math.max(data.termMonths, 1);
  const paidInFull = data.paymentOptions.paidInFull.total || data.totalPremium;
  const pifSavings = data.paymentOptions.paidInFull.savings || Math.max(data.totalPremium - paidInFull, 0);
  const downPayment = data.paymentOptions.eft.downPayment || monthly;
  const installmentCount = data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);
  const installmentAmount = data.paymentOptions.eft.recurringAmount || monthly;
  const heroImage = normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl);
  const vehicleWord = numberWord(data.vehicles.length || 1);
  const primaryDriver = data.drivers[0];
  const realDiscounts = data.discounts
    .map((discount) => discount.label.trim())
    .filter(Boolean)
    .slice(0, 8);
  const discounts = realDiscounts.length ? realDiscounts : ['Ask us which discounts you qualify for'];
  const discountSlots = [...discounts, '', '', '', '', '', '', '', ''].slice(0, 8);
  const actionUrl = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.totalPremium),
    subject: autoEliteQuoteSubject(data),
  });

  let html = removeInstructionComment(autoEliteQuoteTemplate);

  const vehicleBlock = extractBlock(
    html,
    '<!-- >>> REPEAT THIS "Vehicle card" <tr> ONCE PER VEHICLE (N = 1, 2, 3 ...) <<< -->',
    '<!-- >>> END Vehicle card <<< -->',
  );
  if (vehicleBlock) {
    html = `${html.slice(0, vehicleBlock.start)}${renderVehicleCards(data, vehicleBlock.block)}${html.slice(vehicleBlock.end)}`;
  }

  const additionalDriverBlock = extractBlock(
    html,
    '<!-- >>> REPEAT THIS "Additional driver" <tr> per extra driver (neutral badge) <<< -->',
    '<!-- >>> END Additional driver <<< -->',
  );
  if (additionalDriverBlock) {
    html = `${html.slice(0, additionalDriverBlock.start)}${renderAdditionalDrivers(data.drivers, additionalDriverBlock.block)}${html.slice(additionalDriverBlock.end)}`;
  }

  html = replaceTokens(html, {
    BODILY_INJURY: escapeHtml(formatLimit(data.coverages.bodilyInjuryLimit)),
    CARRIER_LEGAL: escapeHtml(carrier.legalName),
    CARRIER_LOGO_URL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    DOWN_PAYMENT: escapeHtml(money(downPayment)),
    DRIVER_1_DETAIL: driverDetail(primaryDriver),
    DRIVER_1_NAME: escapeHtml(primaryDriver?.name || data.clientFullName || 'Primary driver'),
    EFFECTIVE_DATE: escapeHtml(formatDate(data.effectiveDate)),
    HERO_IMAGE_URL: escapeHtml(heroImage),
    INSTALLMENT_AMT: escapeHtml(money(installmentAmount)),
    INSTALLMENT_COUNT: escapeHtml(installmentCount),
    MED_PAY: escapeHtml(data.coverages.medicalPayments ? money(data.coverages.medicalPayments, 0) : 'Not selected'),
    MONTHLY_PAYMENT: escapeHtml(money(monthly)),
    PAY_IN_FULL: escapeHtml(money(paidInFull)),
    PIF_SAVINGS: escapeHtml(money(pifSavings)),
    POLICY_TYPE: 'NC Personal Auto',
    PREPARED_FOR: escapeHtml(data.clientFullName || data.clientFirstName),
    PROPERTY_DAMAGE: escapeHtml(formatLimit(data.coverages.propertyDamageLimit)),
    QUOTE_ACTION_URL: escapeHtml(actionUrl),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber),
    TERM_LENGTH: `${data.termMonths}-month`,
    TERM_TOTAL: escapeHtml(money(data.totalPremium)),
    UM_PD: escapeHtml(formatLimit(data.coverages.propertyDamageLimit)),
    UM_UIM_BI: escapeHtml(formatLimit(data.coverages.underinsuredMotoristLimit || data.coverages.uninsuredMotoristLimit)),
    VEHICLE_COUNT_WORD: escapeHtml(vehicleWord),
    DISCOUNT_1: escapeHtml(discountSlots[0]),
    DISCOUNT_2: escapeHtml(discountSlots[1]),
    DISCOUNT_3: escapeHtml(discountSlots[2]),
    DISCOUNT_4: escapeHtml(discountSlots[3]),
    DISCOUNT_5: escapeHtml(discountSlots[4]),
    DISCOUNT_6: escapeHtml(discountSlots[5]),
    DISCOUNT_7: escapeHtml(discountSlots[6]),
    DISCOUNT_8: escapeHtml(discountSlots[7]),
    DRIVER_N_NAME: '',
    DRIVER_N_DETAIL: '',
  });

  html = maybeRemoveBundleCard(html, data);
  html = cleanDiscountGrid(html);
  return html
    .replace(/336-835-1993/g, '(336) 835-1993')
    .replace(/Elkin NC 28621/g, 'Elkin, NC 28621');
}
