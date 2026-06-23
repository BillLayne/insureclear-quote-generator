import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import { resolveDigitalCardUrl } from './digitalCardLinks';
import { normalizeHeroImageUrl } from './heroImage';
import type { GeneratedAudioReview } from './webAudioReview';
import masterTemplate from '../templates/web/AUTO_ELITE_WEBPAGE_TEMPLATE.html?raw';

export interface RenderedAutoEliteWebPage {
  html: string;
  title: string;
}

interface PaymentPlan {
  key: string;
  name: string;
  amount: string;
  unit: string;
  sub: string;
  total: string;
  tag: string;
  note: string;
  miniText: string;
  premiumParam: string;
  recommended: boolean;
}

interface CoverageRow {
  open?: boolean;
  icon: string;
  name: string;
  sub: string;
  limit: string;
  small: string;
  body: string;
  means?: string;
}

const quoteStudioBaseUrl = BRAND.quoteActionUrl.replace(/\/quote-action$/, '');

const publicAssetUrl = (path: string) => {
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : quoteStudioBaseUrl;
  return `${origin}${path}`;
};

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
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatShortDate = (value: string | undefined | null) => {
  if (!value) return 'review date';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const icons = {
  person: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  building: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-4"></path></svg>',
  alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>',
  pulse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>',
  burst: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"></path><path d="m6.3 6.3 2.8 2.8"></path><path d="M2 12h4"></path><path d="m6.3 17.7 2.8-2.8"></path><path d="M12 22v-4"></path><path d="m17.7 17.7-2.8-2.8"></path><path d="M22 12h-4"></path><path d="m17.7 6.3-2.8 2.8"></path></svg>',
  layers: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"></path><path d="m2 17 10 5 10-5"></path><path d="m2 12 10 5 10-5"></path></svg>',
  rental: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>',
  wrench: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  car: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>',
} as const;

const chevronSvg =
  '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const monthlyPayment = (data: AutoQuoteData) => {
  const monthly = data.paymentOptions.eft.recurringAmount;
  if (monthly > 0) return monthly;
  return data.totalPremium > 0 ? data.totalPremium / Math.max(data.termMonths, 1) : 0;
};

const installmentCount = (data: AutoQuoteData) =>
  data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);

const paidInFullTotal = (data: AutoQuoteData) =>
  data.paymentOptions.paidInFull.total || data.totalPremium;

const paidInFullSavings = (data: AutoQuoteData) => {
  if (data.paymentOptions.paidInFull.savings > 0) return data.paymentOptions.paidInFull.savings;
  const total = paidInFullTotal(data);
  return data.totalPremium > total ? data.totalPremium - total : 0;
};

const paymentPlans = (data: AutoQuoteData): PaymentPlan[] => {
  const monthly = monthlyPayment(data);
  const hasMonthly = monthly > 0;
  const count = installmentCount(data);
  const down = data.paymentOptions.eft.downPayment;
  const payInFull = paidInFullTotal(data);
  const savings = paidInFullSavings(data);
  const term = data.termMonths;

  return [
    {
      key: 'monthly',
      name: 'Monthly Auto-Pay',
      amount: hasMonthly ? money(monthly, 2) : 'Review',
      unit: hasMonthly ? '/ mo' : '',
      sub: hasMonthly
        ? down > 0
          ? `${money(down, 2)} down, then ${count} EFT payment${count === 1 ? '' : 's'}.`
          : `${count} EFT payment${count === 1 ? '' : 's'} across the term.`
        : 'Monthly EFT schedule needs carrier confirmation.',
      total: money(data.totalPremium, 2),
      tag: 'bank auto-pay',
      note: hasMonthly
        ? down > 0
          ? `Starts with ${money(down, 2)} down, then ${count} automatic monthly payment${count === 1 ? '' : 's'} of ${money(monthly, 2)} from your bank. Pay-in-full and card/check options are below.`
          : `${count} automatic monthly payment${count === 1 ? '' : 's'} of ${money(monthly, 2)} from your bank. Pay-in-full and card/check options are below.`
        : 'Ask us to confirm the exact monthly EFT schedule before binding.',
      miniText: 'Monthly auto-pay selected',
      premiumParam: hasMonthly ? `${money(monthly, 2)}/mo EFT` : 'Monthly EFT review',
      recommended: hasMonthly,
    },
    {
      key: 'payinfull',
      name: 'Pay In Full',
      amount: payInFull > 0 ? money(payInFull, 2) : money(data.totalPremium, 2),
      unit: '/ term',
      sub: savings > 0 ? `Lowest total, saves ${money(savings, 2)}.` : `One payment for the full ${term}-month term.`,
      total: payInFull > 0 ? money(payInFull, 2) : money(data.totalPremium, 2),
      tag: savings > 0 ? 'lowest cost' : 'one payment',
      note: savings > 0
        ? `One payment for the full ${term}-month term. This is the lowest total cost and includes ${money(savings, 2)} in pay-in-full savings.`
        : `One payment for the full ${term}-month term. No monthly drafts to track.`,
      miniText: 'Pay-in-full selected',
      premiumParam: `${payInFull > 0 ? money(payInFull, 2) : money(data.totalPremium, 2)}/term`,
      recommended: !hasMonthly,
    },
    {
      key: 'card',
      name: 'Card / Check Billing',
      amount: 'Review',
      unit: '',
      sub: 'Carrier billing can vary. We will confirm the exact schedule.',
      total: 'Confirm',
      tag: 'ask us to confirm',
      note: 'Card, invoice, or check billing can vary by carrier and may include fees or a different schedule. Choose this and we will confirm the exact numbers before binding.',
      miniText: 'Card/check billing review selected',
      premiumParam: 'Card/check billing review',
      recommended: false,
    },
  ];
};

const driverRole = (driver: Driver) => {
  if (driver.relationship === 'insured') return 'Named Insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'excluded') return 'Excluded Driver - not covered';
  return driver.isTeen ? 'Youthful Driver' : 'Household Driver';
};

const driversHtml = (data: AutoQuoteData) => {
  const drivers = data.drivers.length
    ? data.drivers
    : [{ name: data.clientFullName || 'Driver under review', age: 0, yearsLicensed: 0, relationship: 'insured', isTeen: false } satisfies Driver];

  return drivers
    .map((driver) => {
      const detail = driver.relationship === 'excluded'
        ? driverRole(driver)
        : `${driverRole(driver)} &middot; ${driver.yearsLicensed ? `Licensed ${escapeHtml(driver.yearsLicensed)} yrs` : 'License details under review'}`;
      return `        <div class="driver-card">
          <div class="driver-icon">${icons.person}</div>
          <div>
            <strong>${escapeHtml(driver.name)}</strong>
            <span>${detail}</span>
          </div>
        </div>`;
    })
    .join('\n');
};

const coverageRowHtml = (row: CoverageRow) => `        <details class="cov"${row.open ? ' open' : ''}>
          <summary aria-label="${escapeHtml(row.name)}, ${escapeHtml(row.limit)}">
            <span class="icon-chip">${row.icon}</span>
            <span class="cov-name"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.sub)}</span></span>
            <span class="cov-limit">${escapeHtml(row.limit)}${row.small ? `<small>${escapeHtml(row.small)}</small>` : ''}</span>
            ${chevronSvg}
          </summary>
          <div class="cov-body">
            <p>${escapeHtml(row.body)}</p>
            ${row.means ? `<p class="means"><strong>What this means for you:</strong> ${escapeHtml(row.means)}</p>` : ''}
          </div>
        </details>`;

const policyCoverageRowsHtml = (data: AutoQuoteData) => {
  const c = data.coverages;
  const rows: CoverageRow[] = [
    {
      open: true,
      icon: icons.shield,
      name: 'Bodily Injury Liability',
      sub: 'If you injure someone in an accident',
      limit: c.bodilyInjuryLimit || 'Review',
      small: 'per person / per accident',
      body: "If you are at fault in an accident and someone is hurt, this pays their medical bills, lost wages, legal claims, and your defense up to your limits.",
      means: `${c.bodilyInjuryLimit || 'these'} limits are the coverage that stands between a serious accident and your savings, your home, and your future paychecks.`,
    },
    {
      icon: icons.building,
      name: 'Property Damage Liability',
      sub: "If you damage someone else's property",
      limit: c.propertyDamageLimit || 'Review',
      small: 'per accident',
      body: "Pays to repair or replace other people's property you damage in an at-fault accident, including their vehicle, fence, mailbox, or storefront.",
      means: `with new trucks and SUVs commonly costing $60,000+, your ${c.propertyDamageLimit || 'property damage'} limit helps keep one bad day from coming out of your pocket.`,
    },
    {
      icon: icons.alert,
      name: 'Uninsured / Underinsured Motorist',
      sub: "When the other driver cannot pay",
      limit: c.uninsuredMotoristLimit || 'Review',
      small: c.underinsuredMotoristLimit && c.underinsuredMotoristLimit !== c.uninsuredMotoristLimit ? `UIM ${c.underinsuredMotoristLimit}` : 'bodily injury',
      body: `If you or your passengers are injured by a driver who has no insurance, or not enough, this steps in and pays what their policy cannot.${c.underinsuredMotoristLimit && c.underinsuredMotoristLimit !== c.uninsuredMotoristLimit ? ` Underinsured motorist protection is shown at ${c.underinsuredMotoristLimit}.` : ''}`,
      means: "you cannot control whether the other driver bought good insurance. This helps protect your family even when they did not.",
    },
  ];

  if (c.medicalPayments) {
    rows.push({
      icon: icons.pulse,
      name: 'Medical Payments',
      sub: 'Quick medical help, no fault required',
      limit: money(c.medicalPayments, 0),
      small: 'per person',
      body: 'Pays medical expenses for you and your passengers after an accident, regardless of who was at fault.',
      means: 'it can handle copays and deductibles while fault is still being sorted out.',
    });
  }

  if (c.customEquipment) {
    rows.push({
      icon: icons.star,
      name: 'Custom Parts & Equipment',
      sub: 'Aftermarket upgrades and accessories',
      limit: money(c.customEquipment, 0),
      small: 'limit',
      body: 'Covers permanently installed aftermarket equipment that a standard policy may not fully replace.',
      means: 'the upgrades you added to your vehicle are protected, not just the factory build.',
    });
  }

  return rows.map(coverageRowHtml).join('\n');
};

const POLICY_WIDE_PATTERN = /bodily injury|property damage|uninsured|underinsured|liability|medical payments|med pay/i;

const deductibleLabel = (value: number | undefined) =>
  value && value > 0 ? money(value, 0) : 'Review';

const coverageKind = (coverage: VehicleCoverage) => {
  const name = coverage.name.toLowerCase();
  if (/collision/.test(name) && !/other than/.test(name)) return 'collision';
  if (/comprehensive|other than collision|otc/.test(name)) return 'comprehensive';
  if (/rental|transportation|loss of use/.test(name)) return 'rental';
  if (/towing|roadside|labor/.test(name)) return 'towing';
  if (/custom|equipment|parts/.test(name)) return 'custom';
  return 'other';
};

const rowFromVehicleCoverage = (coverage: VehicleCoverage): CoverageRow | null => {
  if (POLICY_WIDE_PATTERN.test(coverage.name)) return null;
  const kind = coverageKind(coverage);
  const raw = coverage.limitOrDeductible || '';
  const selected = coverage.status === 'included' && !/not included|rejected|declined/i.test(raw);
  const limit = selected ? raw || 'Included' : 'Not selected';
  const small = selected ? (kind === 'collision' || kind === 'comprehensive' ? 'deductible' : 'limit') : 'ask to add';

  if (kind === 'collision') {
    return {
      icon: icons.burst,
      name: 'Collision',
      sub: 'Damage from an accident, any fault',
      limit,
      small,
      body: selected
        ? 'Pays to repair or replace this vehicle when it is damaged in a collision with another vehicle or object, no matter who was at fault.'
        : 'Collision is not currently selected on this vehicle.',
      means: selected ? `your out-of-pocket amount is generally the ${limit} deductible before the carrier pays the covered repair.` : 'if you want physical damage protection for an at-fault accident, ask us to quote collision.',
    };
  }

  if (kind === 'comprehensive') {
    return {
      open: true,
      icon: icons.layers,
      name: 'Comprehensive',
      sub: 'Theft, hail, fire, animals, glass',
      limit,
      small,
      body: selected
        ? 'Covers damage that is not a collision: theft, vandalism, hail, fire, flood, falling limbs, broken glass, and hitting a deer.'
        : 'Comprehensive is not currently selected on this vehicle.',
      means: selected ? `a deer strike or hail claim is handled under comprehensive, usually subject to the ${limit} deductible.` : 'ask us to add comprehensive if you want this vehicle protected from theft, hail, deer, glass, and similar losses.',
    };
  }

  if (kind === 'rental') {
    return {
      icon: icons.rental,
      name: 'Rental Reimbursement',
      sub: 'A rental car during a covered claim',
      limit,
      small,
      body: selected
        ? 'Helps pay for a rental car while this vehicle is being repaired after a covered collision or comprehensive claim.'
        : 'Rental reimbursement is not currently selected on this vehicle.',
      means: selected ? 'you have help staying mobile while a covered repair is underway.' : 'without this, rental costs during a repair may be out of pocket.',
    };
  }

  if (kind === 'towing') {
    return {
      icon: icons.wrench,
      name: 'Roadside / Towing & Labor',
      sub: 'Tows, jump-starts, lockouts',
      limit,
      small,
      body: selected
        ? 'Covers towing, jump-starts, flat-tire changes, lockout service, and emergency fuel when you are stranded, up to the listed limit.'
        : 'Roadside or towing is not currently selected on this vehicle.',
      means: selected ? 'a breakdown has a service path instead of becoming a surprise cash expense.' : 'ask us to add roadside if you want tow and lockout help included.',
    };
  }

  return {
    icon: icons.shield,
    name: coverage.name || 'Vehicle Coverage',
    sub: selected ? 'Included on this vehicle' : 'Not selected on this vehicle',
    limit,
    small,
    body: selected ? 'This vehicle-specific coverage is included on the quote.' : 'This option is shown on the source quote but is not currently selected.',
  };
};

const defaultVehicleRows = (vehicle: Vehicle, data: AutoQuoteData): CoverageRow[] => {
  const rows: CoverageRow[] = [];
  if (vehicle.coverageType === 'full_coverage') {
    rows.push({
      open: true,
      icon: icons.layers,
      name: 'Comprehensive',
      sub: 'Theft, hail, fire, animals, glass',
      limit: deductibleLabel(data.coverages.comprehensiveDeductible),
      small: 'deductible',
      body: 'Covers damage that is not a collision: theft, vandalism, hail, fire, flood, falling limbs, broken glass, and hitting a deer.',
      means: `a deer strike or hail claim is handled under comprehensive, usually subject to the ${deductibleLabel(data.coverages.comprehensiveDeductible)} deductible.`,
    });
    rows.push({
      icon: icons.burst,
      name: 'Collision',
      sub: 'Damage from an accident, any fault',
      limit: deductibleLabel(data.coverages.collisionDeductible),
      small: 'deductible',
      body: 'Pays to repair or replace this vehicle when it is damaged in a collision with another vehicle or object, no matter who was at fault.',
      means: `your out-of-pocket amount is generally the ${deductibleLabel(data.coverages.collisionDeductible)} deductible before the carrier pays the covered repair.`,
    });
  }
  if (data.coverages.rentalReimbursement) {
    rows.push({
      icon: icons.rental,
      name: 'Rental Reimbursement',
      sub: 'A rental car during a covered claim',
      limit: data.coverages.rentalReimbursement,
      small: 'limit',
      body: 'Helps pay for a rental car while this vehicle is being repaired after a covered collision or comprehensive claim.',
      means: 'you have help staying mobile while a covered repair is underway.',
    });
  }
  if (data.coverages.towing) {
    rows.push({
      icon: icons.wrench,
      name: 'Roadside / Towing & Labor',
      sub: 'Tows, jump-starts, lockouts',
      limit: data.coverages.towing,
      small: 'limit',
      body: 'Covers towing, jump-starts, flat-tire changes, lockout service, and emergency fuel when you are stranded, up to the listed limit.',
      means: 'a breakdown has a service path instead of becoming a surprise cash expense.',
    });
  }
  if (!rows.length) {
    rows.push({
      open: true,
      icon: icons.shield,
      name: 'Liability Protection',
      sub: 'Policy-wide liability follows this vehicle',
      limit: data.coverages.propertyDamageLimit || 'Review',
      small: 'see policy limits',
      body: 'This vehicle is protected by the policy-wide liability coverages shown above.',
      means: 'the physical damage coverages on this vehicle are limited, so ask us before binding if you want comprehensive or collision.',
    });
  }
  return rows;
};

const vehicleRows = (vehicle: Vehicle, data: AutoQuoteData) => {
  const parsedRows = (vehicle.coverages || [])
    .map(rowFromVehicleCoverage)
    .filter((row): row is CoverageRow => Boolean(row));
  return parsedRows.length ? parsedRows : defaultVehicleRows(vehicle, data);
};

const vehicleCoverageTypeLabel = (vehicle: Vehicle) =>
  vehicle.coverageType === 'full_coverage' ? 'Full coverage' : 'Liability only';

const vehiclesHtml = (data: AutoQuoteData) => {
  const vehicles = data.vehicles.length
    ? data.vehicles
    : [{
        year: new Date().getFullYear(),
        make: 'Vehicle',
        model: 'under review',
        vinLast8: '',
        coverageType: 'liability_only',
        garagingZip: BRAND.zip,
        vehiclePremium: 0,
        isPrimary: true,
      } satisfies Vehicle];

  return vehicles
    .map((vehicle, index) => {
      const premiumTag = vehicle.vehiclePremium > 0
        ? `<span class="vehicle-tag gold">${money(vehicle.vehiclePremium, 2)} / ${data.termMonths}-mo term</span>`
        : '<span class="vehicle-tag gold">Premium included</span>';
      const rows = vehicleRows(vehicle, data).map(coverageRowHtml).join('\n');
      return `        <article class="vehicle-card">
          <div class="vehicle-head">
            <div class="vehicle-icon">${icons.car}</div>
            <div class="vehicle-title">
              <span>Vehicle ${index + 1}${vehicle.isPrimary ? ' &middot; Primary' : ''}</span>
              <strong>${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</strong>
            </div>
            <div class="vehicle-tags">
              <span class="vehicle-tag">${vehicle.vinLast8 ? `VIN ending ${escapeHtml(vehicle.vinLast8)}` : 'VIN under review'}</span>
              <span class="vehicle-tag">${vehicleCoverageTypeLabel(vehicle)}</span>
              ${premiumTag}
            </div>
          </div>
          <div class="vehicle-subhead"><span>Coverage on this vehicle</span><span>Deductible / Limit</span></div>
          ${rows}
        </article>`;
    })
    .join('\n');
};

const paymentPlanCardsHtml = (plans: PaymentPlan[]) =>
  plans
    .map((plan) => `        <button type="button" class="plan-card" role="radio" aria-checked="${plan.recommended ? 'true' : 'false'}" data-plan-card data-plan-name="${escapeHtml(plan.name)}" data-plan-amount="${escapeHtml(plan.amount)}" data-plan-unit="${escapeHtml(plan.unit)}" data-plan-note="${escapeHtml(plan.note)}" data-plan-mini="${escapeHtml(plan.miniText)}" data-premium-param="${escapeHtml(plan.premiumParam)}">
          ${plan.recommended ? '<span class="recommended">Recommended</span>' : ''}
          <span class="plan-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
          <span class="plan-name">${escapeHtml(plan.name)}</span>
          <span class="plan-price"><strong>${escapeHtml(plan.amount)}</strong><span>${escapeHtml(plan.unit)}</span></span>
          <span class="plan-sub">${escapeHtml(plan.sub)}</span>
          <span class="plan-total">Total term: <b>${escapeHtml(plan.total)}</b> &middot; ${escapeHtml(plan.tag)}</span>
        </button>`)
    .join('\n');

const discountsHtml = (data: AutoQuoteData) => {
  const discounts = data.discounts.length
    ? data.discounts
    : [{ emoji: '', label: 'Carrier discounts reviewed' }];
  return discounts
    .map((discount) => `        <div class="discount-pill"><span>&#10003;&nbsp; ${escapeHtml(discount.label)}</span></div>`)
    .join('\n');
};

const socialLinksHtml = () => {
  const links = [
    {
      url: BRAND.facebook,
      label: 'Facebook',
      icon: '<span aria-hidden="true" style="font-size:18px;line-height:1;">f</span>',
    },
    {
      url: BRAND.instagram,
      label: 'Instagram',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle></svg>',
    },
    {
      url: BRAND.youtube,
      label: 'YouTube',
      icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 1.9 12c0 1.6.1 3.2.5 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.6.5-3.2.5-4.8 0-1.6-.1-3.2-.5-4.8ZM10 15.3V8.7l5.7 3.3L10 15.3Z"></path></svg>',
    },
    {
      url: BRAND.twitter,
      label: 'X',
      icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 4l16 16"></path><path d="M20 4L4 20"></path></svg>',
    },
    {
      url: BRAND.messenger,
      label: 'Messenger',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.3 9.2 9.2 0 0 1-2.7-.4L4 21l1.4-4.1A8.2 8.2 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z"></path><path d="m8 13 2.7-2.7 2.5 2.1L16 9.7"></path></svg>',
    },
  ];
  return links
    .map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(link.label)}">${link.icon}</a>`)
    .join('\n        ');
};

const carrierComparisonLine = (data: AutoQuoteData) => {
  const carriers = data.carriersShoppedNames.filter(Boolean);
  if (!carriers.length) return 'the carriers we represent';
  if (carriers.length === 1) return carriers[0];
  if (carriers.length === 2) return `${carriers[0]} and ${carriers[1]}`;
  return `${carriers.slice(0, -1).join(', ')}, and ${carriers[carriers.length - 1]}`;
};

const clientArea = (data: AutoQuoteData) => {
  const zip = data.vehicles[0]?.garagingZip?.trim();
  if (!zip || zip === BRAND.zip) return `${BRAND.city}, ${BRAND.state}`;
  return `the ${zip} area`;
};

const garagingLine = (data: AutoQuoteData) => {
  const zip = data.vehicles[0]?.garagingZip?.trim();
  if (!zip) return `Garaged in ${escapeHtml(BRAND.city)} &middot; ${escapeHtml(BRAND.state)}`;
  if (zip === BRAND.zip) return `Garaged in ${escapeHtml(BRAND.city)} &middot; ${escapeHtml(BRAND.state)} ${escapeHtml(zip)}`;
  return `Garaged in ${escapeHtml(BRAND.state)} ${escapeHtml(zip)}`;
};

const quoteActionHref = (data: AutoQuoteData, carrierName: string, plan: PaymentPlan) => {
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail || '',
    templateType: 'auto',
    carrier: carrierName,
    quoteNumber: data.quoteNumber,
    premium: plan.premiumParam,
    payPlan: plan.name,
    subject: `${carrierName} Auto Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const smsHref = (data: AutoQuoteData) =>
  `sms:${BRAND.phoneRaw}?body=${encodeURIComponent(`Hi Bill, I'm reviewing my auto quote (#${data.quoteNumber}) and had a question about...`)}`;

const deductibleExplanation = (data: AutoQuoteData) => {
  const comp = data.coverages.comprehensiveDeductible ? money(data.coverages.comprehensiveDeductible, 0) : 'the listed comprehensive';
  const coll = data.coverages.collisionDeductible ? money(data.coverages.collisionDeductible, 0) : 'the listed collision';
  return `Your deductible only applies to damage to your own vehicle, mainly collision and comprehensive claims. Liability claims, meaning injuries or damage you cause to others, have no deductible at all. Comprehensive claims generally use ${comp}; collision claims generally use ${coll}. Glass-only repairs may qualify for a reduced or waived deductible, so ask us before you pay out of pocket.`;
};

const generalAudioScript =
  'This general guide explains the basic parts of auto insurance. It is not a custom reading of every exact limit on this page, so the written quote below is still the source for your specific details.';

export function renderAutoEliteWebPageHtml(
  data: AutoQuoteData,
  audioReview?: GeneratedAudioReview | null,
): RenderedAutoEliteWebPage {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.nationwide;
  const plans = paymentPlans(data);
  const selectedPlan = plans.find((plan) => plan.recommended) ?? plans[0];
  const agencyLogoUrl = publicAssetUrl('/auto-elite-webpage/agency-logo-sample.png');
  const heroFallbackUrl = publicAssetUrl('/auto-elite-webpage/vehicle-hero-sample.png');
  const audioProfileUrl = publicAssetUrl('/auto-elite-webpage/audio-guide-agent.jpg');
  const audioFallbackUrl = publicAssetUrl('/auto-elite-webpage/auto-guide-sample.mp3');
  const familyRoadUrl = publicAssetUrl('/auto-elite-webpage/family-road-sample.jpg');
  const officePhotoUrl = publicAssetUrl('/auto-elite-webpage/office-sample.jpg');
  const heroUrl = normalizeHeroImageUrl(data.heroImageUrl, heroFallbackUrl);
  const digitalCardUrl = resolveDigitalCardUrl(data.carrierId, data.digitalCardUrl);
  const savings = paidInFullSavings(data);
  const title = `${data.clientFullName} - Auto Elite Webpage Quote | Bill Layne Insurance`;

  const html = replaceTokens(masterTemplate, {
    ACCEPT_URL: escapeHtml(quoteActionHref(data, carrier.displayName, selectedPlan)),
    AGENCY_CITY: escapeHtml(BRAND.city),
    AGENCY_EMAIL: escapeHtml(BRAND.email),
    AGENCY_FOUNDED: escapeHtml(BRAND.founded),
    AGENCY_LOGO_URL: escapeHtml(agencyLogoUrl),
    AGENCY_PHONE: escapeHtml(BRAND.phone),
    AGENCY_PHONE_RAW: escapeHtml(BRAND.phoneRaw),
    AGENCY_STATE: escapeHtml(BRAND.state),
    AGENCY_STREET: escapeHtml(BRAND.street),
    AGENCY_ZIP: escapeHtml(BRAND.zip),
    AUDIO_PROFILE_URL: escapeHtml(audioProfileUrl),
    AUDIO_SCRIPT: escapeHtml(audioReview?.script || generalAudioScript),
    AUDIO_SOURCE_TYPE: escapeHtml(audioReview?.mimeType || 'audio/mpeg'),
    AUDIO_SOURCE_URL: escapeHtml(audioReview?.audioDataUrl || audioFallbackUrl),
    CARRIERS_COMPARED: escapeHtml(carrierComparisonLine(data)),
    CARRIER_LOGO_URL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CLIENT_AREA: escapeHtml(clientArea(data)),
    CLIENT_EMAIL: escapeHtml(data.clientEmail || ''),
    CLIENT_NAME: escapeHtml(data.clientFullName || data.clientFirstName || 'Client'),
    CURRENT_YEAR: escapeHtml(new Date().getFullYear()),
    DEDUCTIBLE_EXPLANATION: escapeHtml(deductibleExplanation(data)),
    DIGITAL_CARD_URL: escapeHtml(digitalCardUrl),
    DISCOUNTS_HTML: discountsHtml(data),
    DISCOUNT_SUMMARY: escapeHtml(savings > 0 ? `Includes ${money(savings, 0)} pay-in-full savings` : 'Applied'),
    DRIVERS_HTML: driversHtml(data),
    EFFECTIVE_DATE: escapeHtml(formatDate(data.effectiveDate)),
    EXPIRY_DATE: escapeHtml(formatDate(data.expiryDate)),
    EXPIRY_DATE_SHORT: escapeHtml(formatShortDate(data.expiryDate)),
    FAMILY_ROAD_URL: escapeHtml(familyRoadUrl),
    GARAGING_LINE: garagingLine(data),
    GOOGLE_RATING: escapeHtml(BRAND.googleRating),
    GOOGLE_REVIEWS_URL: escapeHtml(BRAND.googleReviewsUrl),
    HERO_IMAGE_URL: escapeHtml(heroUrl),
    MINI_AMT: escapeHtml(selectedPlan.amount),
    MINI_PLAN_TEXT: escapeHtml(selectedPlan.miniText),
    MINI_UNIT: escapeHtml(selectedPlan.unit),
    OFFICE_PHOTO_URL: escapeHtml(officePhotoUrl),
    PAGE_TITLE: escapeHtml(title),
    PAYMENT_NOTE: escapeHtml(selectedPlan.note),
    PAYMENT_PLAN_CARDS_HTML: paymentPlanCardsHtml(plans),
    POLICY_COVERAGE_ROWS_HTML: policyCoverageRowsHtml(data),
    PREPARED_DATE: escapeHtml(formatDate(data.quoteDate)),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber || 'Review'),
    REVIEW_COUNT: escapeHtml(BRAND.googleReviewCount),
    SAVINGS_LINE: escapeHtml(savings > 0 ? `Includes ${money(savings, 2)} pay-in-full savings` : 'Quoted with every eligible discount applied'),
    SELECTED_PLAN_LABEL: escapeHtml(selectedPlan.name),
    SMS_HREF: escapeHtml(smsHref(data)),
    SOCIAL_LINKS_HTML: socialLinksHtml(),
    TERM_MONTHS: escapeHtml(data.termMonths),
    TERM_PREMIUM: escapeHtml(money(data.totalPremium, 2)),
    VEHICLES_HTML: vehiclesHtml(data),
    WEBSITE_LABEL: escapeHtml(BRAND.website),
    WEBSITE_URL: escapeHtml(BRAND.websiteUrl),
  });

  return { html, title };
}
