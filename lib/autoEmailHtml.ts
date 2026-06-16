import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import emailTemplate from '../templates/email/AUTO_QUOTE_EMAIL_TEMPLATE.html?raw';

const EMAIL_ASSETS = {
  agencyLogoUrl: BRAND.logoUrl,
  agentHeadshotUrl: 'https://i.imgur.com/dPA8slE.jpeg',
} as const;

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

const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const vehicleIcon = (index: number) => ['&#128663;', '&#128665;', '&#128664;', '&#128763;', '&#128763;'][index] || '&#128663;';

const coverageLabel = (data: AutoQuoteData, coverage: VehicleCoverage) => {
  if (/liability/i.test(coverage.name)) {
    return `Liability - BI ${escapeHtml(data.coverages.bodilyInjuryLimit)} + PD ${escapeHtml(data.coverages.propertyDamageLimit)}`;
  }
  if (/comprehensive|other than collision/i.test(coverage.name)) {
    return `Other Than Collision (Comprehensive) - ${escapeHtml(coverage.limitOrDeductible)}`;
  }
  if (/collision/i.test(coverage.name)) {
    return `Collision - ${escapeHtml(coverage.limitOrDeductible)}`;
  }
  return `${escapeHtml(coverage.name)} - ${escapeHtml(coverage.limitOrDeductible)}`;
};

const defaultVehicleCoverages = (data: AutoQuoteData, vehicle: Vehicle): VehicleCoverage[] => {
  if (vehicle.coverages?.length) return vehicle.coverages;

  const rows: VehicleCoverage[] = [
    {
      emoji: '',
      name: 'Liability',
      limitOrDeductible: `${data.coverages.bodilyInjuryLimit} BI + ${data.coverages.propertyDamageLimit} PD`,
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
    if (data.coverages.comprehensiveDeductible) {
      rows.push({
        emoji: '',
        name: 'Other Than Collision (Comprehensive)',
        limitOrDeductible: `${money(data.coverages.comprehensiveDeductible, 0)} Deductible`,
        status: 'included',
      });
    }
    if (data.coverages.collisionDeductible) {
      rows.push({
        emoji: '',
        name: 'Collision',
        limitOrDeductible: `${money(data.coverages.collisionDeductible, 0)} Deductible`,
        status: 'included',
      });
    }
  } else {
    rows.push({ emoji: '', name: 'Other Than Collision (Comprehensive)', limitOrDeductible: 'Not included', status: 'rejected' });
    rows.push({ emoji: '', name: 'Collision', limitOrDeductible: 'Not included', status: 'rejected' });
  }

  if (data.coverages.towing) {
    rows.push({ emoji: '', name: 'Towing and Labor', limitOrDeductible: data.coverages.towing, status: 'included' });
  }

  return rows;
};

const renderVehicleCoverages = (data: AutoQuoteData, vehicle: Vehicle) => {
  const rows = defaultVehicleCoverages(data, vehicle).map((coverage, index, coverages) => {
    const isLast = index === coverages.length - 1;
    const rejected = coverage.status === 'rejected' || /not included/i.test(coverage.limitOrDeductible);
    const premium = rejected ? 'Not included' : coverage.premium ? money(coverage.premium) : 'Included';
    const border = isLast ? '' : ' border-bottom:1px solid #f1f5f9;';

    return `<tr>
          <td style="padding:6px 0;${border}">${coverageLabel(data, coverage)}</td>
          <td align="right" style="padding:6px 0;${border} color:#0b2234; font-weight:600;">${escapeHtml(premium)}</td>
        </tr>`;
  });

  return rows.join('\n');
};

const vehiclesHtml = (data: AutoQuoteData) =>
  data.vehicles
    .map(
      (vehicle, index) => `<!-- ${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)} -->
<table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom:18px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
  <tr>
    <td style="background-color:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0;">
      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:16px; font-weight:700; color:#0b2234; font-family:system-ui, -apple-system, sans-serif;">${vehicleIcon(index)} ${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</span>
            <span style="display:block; font-size:11px; color:#64748b; font-family:system-ui, -apple-system, sans-serif; margin-top:2px;">VIN: ending ${escapeHtml(vehicle.vinLast8)} &middot; ${vehicle.coverageType === 'full_coverage' ? 'Full coverage' : 'Liability only'} &middot; ZIP ${escapeHtml(vehicle.garagingZip)}</span>
          </td>
          <td align="right" style="vertical-align:middle;">
            <span style="font-size:16px; font-weight:700; color:#003f87; font-family:system-ui, -apple-system, sans-serif;">${money(vehicle.vehiclePremium)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 16px; background-color:#ffffff;">
      <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="font-size:12px; color:#334155; font-family:system-ui, -apple-system, sans-serif;">
        ${renderVehicleCoverages(data, vehicle)}
      </table>
    </td>
  </tr>
</table>`,
    )
    .join('\n');

const relationshipCopy = (driver: Driver) => {
  if (driver.relationship === 'insured') return 'Named insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'excluded') return 'Excluded driver';
  return driver.isTeen ? 'Youthful driver' : 'Household driver';
};

const driversHtml = (data: AutoQuoteData) =>
  data.drivers
    .map(
      (driver) => `<table width="100%" cellPadding="0" cellSpacing="0" border="0" style="margin-bottom:14px; border:1px solid #e2e8f0; border-radius:8px; background-color:#ffffff;">
  <tr>
    <td style="padding:16px;">
      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
        <tr>
          <td width="36" style="width:36px; vertical-align:top;">
            <span style="font-size:24px;">&#128100;</span>
          </td>
          <td style="padding-left:12px; vertical-align:top;">
            <span style="font-size:15px; font-weight:700; color:#0b2234; font-family:system-ui, -apple-system, sans-serif;">${escapeHtml(driver.name)}</span>
            <span style="display:block; font-size:12px; color:#64748b; font-family:system-ui, -apple-system, sans-serif; margin-top:3px; line-height:1.5;">Age ${escapeHtml(driver.age)} &middot; ${escapeHtml(relationshipCopy(driver))} &middot; ${escapeHtml(driver.yearsLicensed)} Yrs Licensed${driver.relationship === 'excluded' ? ' &middot; Excluded' : ' &middot; Rated Driver'}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
    )
    .join('\n');

const discountsHtml = (data: AutoQuoteData) => {
  const discounts = data.discounts.length ? data.discounts : [{ label: 'Review with agency' }];
  const rows = discounts
    .map(
      (discount) => `<tr>
          <td style="padding:4px 0; vertical-align:top; color:#1a7a4e; font-weight:bold;" width="20">&#10003;</td>
          <td style="padding:4px 0;"><strong>${escapeHtml(discount.label)}</strong> - Included on this quote.</td>
        </tr>`,
    )
    .join('\n');

  return `<table width="100%" cellPadding="0" cellSpacing="0" border="0" style="border:1px solid #e2e8f0; border-radius:8px; background-color:#ffffff;">
  <tr>
    <td style="padding:16px;">
      <table width="100%" cellPadding="0" cellSpacing="0" border="0" style="font-size:13px; color:#334155; font-family:system-ui, -apple-system, sans-serif; line-height:1.65;">
        ${rows}
      </table>
    </td>
  </tr>
</table>`;
};

const premiumBreakdownHtml = (data: AutoQuoteData) => {
  const vehicleRows = data.vehicles
    .map(
      (vehicle) => `<tr>
    <td style="padding:6px 0; border-bottom:1px solid #e2e8f0;">${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)} Premium</td>
    <td align="right" style="padding:6px 0; border-bottom:1px solid #e2e8f0; font-weight:600; color:#0b2234;">${money(vehicle.vehiclePremium)}</td>
  </tr>`,
    )
    .join('\n');

  const umRows = [
    `<tr>
    <td style="padding:6px 0; border-bottom:1px solid #e2e8f0;">Combined UM / UIM Bodily Injury</td>
    <td align="right" style="padding:6px 0; border-bottom:1px solid #e2e8f0; font-weight:600; color:#0b2234;">${escapeHtml(data.coverages.uninsuredMotoristLimit)}</td>
  </tr>`,
    data.coverages.underinsuredMotoristLimit
      ? `<tr>
    <td style="padding:6px 0; border-bottom:1px solid #e2e8f0;">Underinsured Motorist</td>
    <td align="right" style="padding:6px 0; border-bottom:1px solid #e2e8f0; font-weight:600; color:#0b2234;">${escapeHtml(data.coverages.underinsuredMotoristLimit)}</td>
  </tr>`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `<table width="100%" cellPadding="0" cellSpacing="0" border="0" style="font-size:13px; color:#334155; font-family:system-ui, -apple-system, sans-serif; line-height:1.65;">
  ${vehicleRows}
  ${umRows}
</table>`;
};

const quoteActionHref = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths;
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(monthly)}/mo`,
    subject: `${carrier.displayName} Auto Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const applyInstallmentCount = (html: string, data: AutoQuoteData) => {
  const count = data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);
  return html.replace(/Ã— 5/g, `× ${count}`).replace(/× 5/g, `× ${count}`);
};

const applySavingsVisibility = (html: string, data: AutoQuoteData) => {
  const savings = data.paymentOptions.paidInFull.savings || 0;
  if (savings > 0) return html;
  return html.replace(/<p style="margin:4px 0 0 0;font-family:system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;font-size:12px;color:#059669;font-weight:bold;">Save \$0\.00<\/p>/g, '');
};

export const renderAutoEmailHtml = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths;
  const payFullTotal = data.paymentOptions.paidInFull.total || data.totalPremium;

  const tokenized = replaceTokens(emailTemplate, {
    AGENCY_LOGO_URL: EMAIL_ASSETS.agencyLogoUrl,
    AGENT_EMAIL: escapeHtml(BRAND.email),
    AGENT_HEADSHOT_URL: EMAIL_ASSETS.agentHeadshotUrl,
    CARRIER_LOGO_SRC: escapeHtml(carrier.logoUrl || EMAIL_ASSETS.agencyLogoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CUSTOMER_FIRST_NAME: escapeHtml(data.clientFirstName),
    DISCOUNTS_HTML: discountsHtml(data),
    DRIVERS_HTML: driversHtml(data),
    DRIVER_COUNT: escapeHtml(data.drivers.length),
    GOOGLE_RATING: escapeHtml(BRAND.googleRating),
    GOOGLE_REVIEW_COUNT: escapeHtml(BRAND.googleReviewCount),
    INITIAL_PAYMENT_FOR_LOWEST_MONTHLY: escapeHtml(money(data.paymentOptions.eft.downPayment)),
    INSTALLMENT_TERM_TOTAL: escapeHtml(money(data.totalPremium)),
    LIABILITY_LIMITS: escapeHtml(`${data.coverages.bodilyInjuryLimit} + PD ${data.coverages.propertyDamageLimit}`),
    LOWEST_MONTHLY_PAYMENT: escapeHtml(money(monthly)),
    PAID_IN_FULL_AMOUNT: escapeHtml(money(payFullTotal)),
    PAID_IN_FULL_SAVINGS: escapeHtml(money(data.paymentOptions.paidInFull.savings || 0)),
    POLICY_TERM_LABEL: `${escapeHtml(data.termMonths)}-Month`,
    PREMIUM_BREAKDOWN_HTML: premiumBreakdownHtml(data),
    QUOTE_ACTION_URL: escapeHtml(quoteActionHref(data)),
    QUOTE_EXPIRATION_DATE: escapeHtml(formatDate(data.expiryDate)),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber),
    REVIEW_1_NAME: 'Sarah M.',
    REVIEW_1_TEXT: "Bill Layne Insurance is hands down the best insurance agency I've ever dealt with. They're always friendly, helpful, and quick to respond.",
    VEHICLES_HTML: vehiclesHtml(data),
    VEHICLE_COUNT: escapeHtml(data.vehicles.length),
  });

  return applySavingsVisibility(applyInstallmentCount(tokenized, data), data);
};
