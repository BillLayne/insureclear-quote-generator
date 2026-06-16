import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import type { GeneratedAudioReview } from './webAudioReview';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/BLI_AUTO_QUOTE_MASTER_TEMPLATE.html?raw';

export interface RenderedAutoWebPage {
  html: string;
  title: string;
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

const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const defaultHeroImageUrl = 'https://i.imgur.com/UDvUctJ.png';

const monthlyPayment = (data: AutoQuoteData) =>
  data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths;

const installmentCount = (data: AutoQuoteData) =>
  data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);

const paymentNote = (data: AutoQuoteData) => {
  const down = data.paymentOptions.eft.downPayment;
  if (!down) {
    return 'Pay in full, set up auto-draft, or ask us to review monthly payment options before binding.';
  }
  const count = installmentCount(data);
  return `Starts with ${money(down)} down today, then ${count} automatic monthly payment${count === 1 ? '' : 's'} of ${money(monthlyPayment(data))}. Pay-in-full and other billing options are available.`;
};

const savingsLine = (data: AutoQuoteData) => {
  const savings = data.paymentOptions.paidInFull.savings || 0;
  return savings > 0 ? `Includes ${money(savings)} Pay-In-Full Savings` : 'Quoted with every eligible discount applied';
};

const clientCity = (data: AutoQuoteData) => {
  const zip = data.vehicles[0]?.garagingZip?.trim();
  return zip ? `the ${zip} area` : `${BRAND.city}, ${BRAND.state}`;
};

const carriersComparedLabel = (data: AutoQuoteData) => {
  const count = data.carriersShoppedNames.length;
  return count >= 2 ? String(count) : 'multiple';
};

/* ---------- inline SVG icons (stroke = currentColor) ---------- */
const ICONS = {
  person: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  building: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
  alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
  pulse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  burst: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.3 6.3 2.8 2.8"/><path d="M2 12h4"/><path d="m6.3 17.7 2.8-2.8"/><path d="M12 22v-4"/><path d="m17.7 17.7-2.8-2.8"/><path d="M22 12h-4"/><path d="m17.7 6.3-2.8 2.8"/></svg>',
  layers: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  rental: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>',
  wrench: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  car: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
} as const;

const chevronSvg =
  '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

/* ---------- drivers ---------- */
const driverRole = (driver: Driver) => {
  if (driver.relationship === 'insured') return 'Named Insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'excluded') return 'Excluded Driver — not covered';
  return driver.isTeen ? 'Youthful Driver' : 'Household Driver';
};

const driversHtml = (data: AutoQuoteData) =>
  data.drivers
    .map((driver) => {
      const detail = driver.relationship === 'excluded'
        ? driverRole(driver)
        : `${driverRole(driver)} &bull; Licensed ${escapeHtml(driver.yearsLicensed)} yrs`;
      return `      <div class="driver">
        <div class="driver-icon">${ICONS.person}</div>
        <div>
          <strong>${escapeHtml(driver.name)}</strong>
          <span>${detail}</span>
        </div>
      </div>`;
    })
    .join('\n');

/* ---------- shared ledger row ---------- */
interface LedgerRow {
  icon: string;
  name: string;
  sub: string;
  limit: string;
  limitSmall: string;
  body: string;
  means: string;
}

const ledgerRowHtml = (row: LedgerRow) => `      <details class="cov">
        <summary aria-label="${escapeHtml(row.name)}, ${escapeHtml(row.limit)}">
          <span class="icon-chip">${row.icon}</span>
          <span class="cov-name"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.sub)}</span></span>
          <span class="cov-limit">${escapeHtml(row.limit)}${row.limitSmall ? `<small>${escapeHtml(row.limitSmall)}</small>` : ''}</span>
          ${chevronSvg}
        </summary>
        <div class="cov-body">
          <p>${escapeHtml(row.body)}</p>
          <p class="means"><strong>What this means for you:</strong> ${escapeHtml(row.means)}</p>
        </div>
      </details>`;

/* ---------- policy-wide coverages ---------- */
const policyCoverageRowsHtml = (data: AutoQuoteData) => {
  const c = data.coverages;
  const rows: LedgerRow[] = [
    {
      icon: ICONS.shield,
      name: 'Bodily Injury Liability',
      sub: 'If you injure someone in an accident',
      limit: c.bodilyInjuryLimit,
      limitSmall: 'per person / per accident',
      body: "If you're at fault in an accident and someone is hurt, this pays their medical bills, lost wages, and legal claims against you — including your legal defense — up to your limits.",
      means: `your ${c.bodilyInjuryLimit} limits are the coverage that stands between a serious accident and your savings, your home, and your future paychecks.`,
    },
    {
      icon: ICONS.building,
      name: 'Property Damage Liability',
      sub: "If you damage someone else's property",
      limit: c.propertyDamageLimit,
      limitSmall: 'per accident',
      body: "Pays to repair or replace other people's property you damage in an at-fault accident — their vehicle, a fence, a mailbox, a storefront.",
      means: `with new trucks and SUVs commonly costing $60,000+, your ${c.propertyDamageLimit} limit means one bad day doesn't come out of your pocket.`,
    },
    {
      icon: ICONS.alert,
      name: 'Uninsured / Underinsured Motorist',
      sub: "When the other driver can't pay",
      limit: c.uninsuredMotoristLimit,
      limitSmall: 'bodily injury',
      body: `If you or your passengers are injured by a driver who has no insurance — or not enough — this steps in and pays what their policy can't.${c.underinsuredMotoristLimit && c.underinsuredMotoristLimit !== c.uninsuredMotoristLimit ? ` Underinsured motorist protection is shown at ${c.underinsuredMotoristLimit}.` : ''}`,
      means: "you can't control whether the other driver bought good insurance. This makes sure your family is protected even when they didn't.",
    },
  ];

  if (c.medicalPayments) {
    rows.push({
      icon: ICONS.pulse,
      name: 'Medical Payments',
      sub: 'Quick medical help, no fault required',
      limit: money(c.medicalPayments, 0),
      limitSmall: 'per person',
      body: 'Pays medical expenses for you and your passengers after an accident, regardless of who was at fault — ambulance rides, ER visits, follow-up care, up to your limit per person.',
      means: 'it fills the gap fast — copays and deductibles get handled while fault is still being sorted out.',
    });
  }

  if (c.customEquipment) {
    rows.push({
      icon: ICONS.star,
      name: 'Custom Parts & Equipment',
      sub: 'Aftermarket upgrades and accessories',
      limit: money(c.customEquipment, 0),
      limitSmall: 'limit',
      body: 'Covers permanently installed aftermarket equipment — wheels, lift kits, sound systems, toolboxes — that a standard policy would not fully replace.',
      means: 'the upgrades you added to your vehicle are protected, not just the factory build.',
    });
  }

  return rows.map(ledgerRowHtml).join('\n');
};

/* ---------- vehicles ---------- */
const dollarFrom = (raw: string) => raw.match(/\$[\d,]+(?:\.\d{2})?/)?.[0] || '';

interface VehicleRowSource {
  kind: 'collision' | 'comprehensive' | 'rental' | 'towing' | 'other';
  name: string;
  value: string;
}

const POLICY_WIDE_PATTERN = /bodily injury|property damage|uninsured|underinsured|liability|medical payments|med pay/i;

const classifyCoverage = (coverage: VehicleCoverage): VehicleRowSource | null => {
  const raw = (coverage.limitOrDeductible || '').trim();
  if (coverage.status === 'rejected' || /not included|rejected|declined/i.test(raw)) return null;
  if (POLICY_WIDE_PATTERN.test(coverage.name)) return null;

  if (/collision/i.test(coverage.name) && !/other than/i.test(coverage.name)) {
    return { kind: 'collision', name: 'Collision', value: raw };
  }
  if (/comprehensive|other than collision/i.test(coverage.name)) {
    return { kind: 'comprehensive', name: 'Comprehensive', value: raw };
  }
  if (/rental|transportation expense/i.test(coverage.name)) {
    return { kind: 'rental', name: 'Rental Reimbursement', value: raw };
  }
  if (/towing|roadside|labor/i.test(coverage.name)) {
    return { kind: 'towing', name: 'Towing & Roadside', value: raw };
  }
  return { kind: 'other', name: coverage.name, value: raw };
};

const vehicleRowSources = (data: AutoQuoteData, vehicle: Vehicle): VehicleRowSource[] => {
  if (vehicle.coverages?.length) {
    return vehicle.coverages.map(classifyCoverage).filter((row): row is VehicleRowSource => row !== null);
  }

  const rows: VehicleRowSource[] = [];
  if (vehicle.coverageType === 'full_coverage') {
    if (data.coverages.collisionDeductible) {
      rows.push({ kind: 'collision', name: 'Collision', value: `${money(data.coverages.collisionDeductible, 0)} deductible` });
    }
    if (data.coverages.comprehensiveDeductible) {
      rows.push({ kind: 'comprehensive', name: 'Comprehensive', value: `${money(data.coverages.comprehensiveDeductible, 0)} deductible` });
    }
    if (data.coverages.rentalReimbursement) {
      rows.push({ kind: 'rental', name: 'Rental Reimbursement', value: data.coverages.rentalReimbursement });
    }
    if (data.coverages.towing) {
      rows.push({ kind: 'towing', name: 'Towing & Roadside', value: data.coverages.towing });
    }
  }
  return rows;
};

const vehicleRow = (source: VehicleRowSource, vehicleName: string): LedgerRow => {
  const amount = dollarFrom(source.value);

  if (source.kind === 'collision') {
    const display = amount || source.value || 'Included';
    return {
      icon: ICONS.burst,
      name: 'Collision',
      sub: 'Damage from an accident',
      limit: display,
      limitSmall: amount ? 'deductible' : '',
      body: "Pays to repair or replace this vehicle when it's damaged in a collision — with another car, a guardrail, a deer you couldn't avoid swerving for — no matter who's at fault. You pay the deductible; the policy pays the rest up to the vehicle's value.",
      means: `fender-bender or total loss, your ${vehicleName} gets repaired or replaced for ${amount || 'your deductible'} out of pocket.`,
    };
  }
  if (source.kind === 'comprehensive') {
    const display = amount || source.value || 'Included';
    return {
      icon: ICONS.layers,
      name: 'Comprehensive',
      sub: 'Theft, hail, fire, animals, glass',
      limit: display,
      limitSmall: amount ? 'deductible' : '',
      body: "Covers damage that isn't a collision: theft, vandalism, hail, fire, flood, falling tree limbs, broken glass, and hitting a deer. Here in the foothills, deer strikes and hailstorms are the two claims we see most.",
      means: `when an October deer jumps out on a back road, that's a comprehensive claim — ${amount || 'your deductible'}, not a collision surcharge.`,
    };
  }
  if (source.kind === 'rental') {
    return {
      icon: ICONS.rental,
      name: 'Rental Reimbursement',
      sub: 'A car while yours is in the shop',
      limit: source.value || 'Included',
      limitSmall: 'per day / max',
      body: 'Pays for a rental car while this vehicle is being repaired after a covered claim, up to the daily and total limits shown.',
      means: 'body shops are quoting 2–4 week repair times. This keeps you driving to work without paying for the rental yourself.',
    };
  }
  if (source.kind === 'towing') {
    return {
      icon: ICONS.wrench,
      name: 'Towing & Roadside',
      sub: 'Breakdowns, lockouts, flat tires',
      limit: source.value || 'Included',
      limitSmall: 'per disablement',
      body: 'Covers a tow, jump-start, lockout service, flat-tire change, or fuel delivery when this vehicle breaks down.',
      means: 'stranded on I-77 or a mountain back road — one call, and the tow is covered.',
    };
  }
  return {
    icon: ICONS.star,
    name: source.name,
    sub: 'Included on this vehicle',
    limit: source.value || 'Included',
    limitSmall: '',
    body: `${source.name} is included on this vehicle as shown on the carrier quote.`,
    means: 'this protection was added because it fits how you use this vehicle — ask us anytime and we will walk through it together.',
  };
};

const liabilityOnlyRow = (vehicleName: string): LedgerRow => ({
  icon: ICONS.shield,
  name: 'Liability-Only Protection',
  sub: 'No physical-damage coverage on this vehicle',
  limit: 'See policy-wide',
  limitSmall: 'coverages above',
  body: 'This vehicle carries the policy-wide liability and uninsured motorist protection, but no collision or comprehensive coverage. Damage to this vehicle itself — accident, theft, hail, deer — would not be covered.',
  means: `that's often the right call for an older vehicle, but if ${vehicleName} would be expensive to replace out of pocket, ask us what adding physical-damage coverage costs.`,
});

const vehiclesHtml = (data: AutoQuoteData) =>
  data.vehicles
    .map((vehicle, index) => {
      const vehicleName = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
      const sources = vehicleRowSources(data, vehicle);
      const hasPhysical = sources.some((source) => source.kind === 'collision' || source.kind === 'comprehensive');
      const rows = sources.length ? sources.map((source) => vehicleRow(source, vehicleName)) : [liabilityOnlyRow(vehicleName)];
      const protectionChip = hasPhysical ? 'Collision &amp; Comprehensive' : 'Liability-Only Protection';
      const vinLast4 = (vehicle.vinLast8 || '').slice(-4);
      const premiumChip = vehicle.vehiclePremium
        ? `\n          <span class="chip">${escapeHtml(money(vehicle.vehiclePremium))} / ${escapeHtml(data.termMonths)}-mo term</span>`
        : '';

      return `    <article class="vehicle">
      <div class="veh-head">
        <div class="veh-icon">${ICONS.car}</div>
        <div class="veh-title">
          <span class="eyebrow">Vehicle ${index + 1}</span>
          <strong>${escapeHtml(vehicleName)}</strong>
        </div>
        <div class="veh-chips">
          ${vinLast4 ? `<span class="chip">VIN ending ${escapeHtml(vinLast4)}</span>` : ''}
          <span class="chip">${protectionChip}</span>${premiumChip}
        </div>
      </div>

      <div class="ledger">
        <div class="ledger-head"><span>Coverage on this vehicle</span><span>Deductible / Limit</span></div>
${rows.map(ledgerRowHtml).join('\n')}
      </div>
    </article>`;
    })
    .join('\n\n');

const deductibleExplanation = () =>
  'Your deductible only applies to damage to your own vehicle — collision and comprehensive claims. Liability claims, meaning injuries or damage you cause to others, have no deductible at all. And glass-only repairs may qualify for a reduced or waived deductible — ask us before you pay out of pocket.';

const discountsHtml = (data: AutoQuoteData) => {
  const discounts = data.discounts.length ? data.discounts : [{ label: 'Ask us which discounts you qualify for' }];
  return discounts
    .map((discount) => `      <div>✓&nbsp; ${escapeHtml(discount.label)}</div>`)
    .join('\n');
};

const audioSectionHtml = (audioReview?: GeneratedAudioReview | null) => {
  if (!audioReview?.audioDataUrl) return '';
  return `  <!-- ================= AUDIO ================= -->
  <section id="audio">
    <div class="audio-card">
      <div class="audio-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
      </div>
      <div style="flex:1 1 280px;min-width:240px">
        <span class="eyebrow">60-Second Audio Review</span>
        <h3>Listen to your auto quote in plain English</h3>
        <p>A friendly walkthrough of your drivers, vehicles, and coverage choices on this page.</p>
        <audio controls preload="metadata">
          <source src="${escapeHtml(audioReview.audioDataUrl)}" type="${escapeHtml(audioReview.mimeType || 'audio/mpeg')}">
          Your browser does not support audio playback.
        </audio>
        <details>
          <summary>Read the short script</summary>
          <p>${escapeHtml(audioReview.script)}</p>
        </details>
      </div>
    </div>
  </section>`;
};

export const autoAudioReviewScript = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const monthly = monthlyPayment(data);
  const count = installmentCount(data);
  const comp = data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} comprehensive deductible` : 'comprehensive coverage where listed';
  const collision = data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} collision deductible` : 'collision coverage where listed';
  const vehicleNames = data.vehicles
    .slice(0, 3)
    .map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}`)
    .join(', ');
  const moreVehicles = data.vehicles.length > 3 ? `, plus ${data.vehicles.length - 3} more vehicle${data.vehicles.length - 3 === 1 ? '' : 's'}` : '';
  const payFull = data.paymentOptions.paidInFull.total ? `Pay in full is ${money(data.paymentOptions.paidInFull.total)}, which can avoid future monthly bills${data.paymentOptions.paidInFull.savings ? ` and shows ${money(data.paymentOptions.paidInFull.savings)} in savings` : ''}.` : 'Pay in full is also available if you prefer one payment.';

  return `Hi, this is Bill Layne Insurance. Thanks for letting us shop your auto insurance. Here is the quick, plain-English tour. ${carrier.displayName} shows a monthly EFT payment of ${money(monthly)}, with ${money(data.paymentOptions.eft.downPayment)} due today, followed by ${count} automatic monthly payments. This quote covers ${data.vehicles.length} vehicle${data.vehicles.length === 1 ? '' : 's'}, including ${vehicleNames}${moreVehicles}. Liability helps protect you if you injure someone or damage their property, shown here as ${data.coverages.bodilyInjuryLimit} bodily injury and ${data.coverages.propertyDamageLimit} property damage. Uninsured motorist is ${data.coverages.uninsuredMotoristLimit}. For covered vehicles, comprehensive helps with things like theft, fire, weather, and animals, with a ${comp}; collision helps after an accident, with a ${collision}. ${payFull} Before anything is submitted, we will confirm drivers, vehicles, VINs, coverages, and payment. Tap Accept Quote or Contact Me when you are ready.`;
};

export function renderAutoWebPageHtml(data: AutoQuoteData, audioReview?: GeneratedAudioReview | null): RenderedAutoWebPage {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const monthly = monthlyPayment(data);
  const title = `${data.clientFullName} — Auto Quote Explained | Bill Layne Insurance`;

  const html = replaceTokens(masterTemplate, {
    AUDIO_SECTION_HTML: audioSectionHtml(audioReview),
    CARRIERS_COMPARED: escapeHtml(carriersComparedLabel(data)),
    CARRIER_LOGO_URL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CLIENT_CITY: escapeHtml(clientCity(data)),
    CLIENT_EMAIL: escapeHtml(data.clientEmail || ''),
    CLIENT_NAME: escapeHtml(data.clientFullName),
    DEDUCTIBLE_EXPLANATION: escapeHtml(deductibleExplanation()),
    DISCOUNTS_HTML: discountsHtml(data),
    DRIVERS_HTML: driversHtml(data),
    EFFECTIVE_DATE: escapeHtml(formatDate(data.effectiveDate)),
    GOOGLE_RATING: escapeHtml(String(BRAND.googleRating)),
    HERO_IMAGE_URL: escapeHtml(normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl)),
    MONTHLY_PREMIUM: escapeHtml(money(monthly)),
    PAYMENT_NOTE: escapeHtml(paymentNote(data)),
    POLICY_COVERAGE_ROWS_HTML: policyCoverageRowsHtml(data),
    PREMIUM_PARAM: escapeHtml(`${money(monthly)}/mo`),
    PREPARED_DATE: escapeHtml(formatDate(data.quoteDate)),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber),
    REVIEW_COUNT: escapeHtml(BRAND.googleReviewCount),
    SAVINGS_LINE: escapeHtml(savingsLine(data)),
    TERM_LENGTH: escapeHtml(`${data.termMonths}-Month`),
    TERM_PREMIUM: escapeHtml(money(data.totalPremium)),
    VALID_THROUGH: escapeHtml(formatDate(data.expiryDate)),
    VEHICLES_HTML: vehiclesHtml(data),
  });

  return { html, title };
}
