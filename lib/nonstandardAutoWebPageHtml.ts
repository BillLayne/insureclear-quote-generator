import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/NONSTANDARD_AUTO_QUOTE_TEMPLATE.html?raw';

export interface RenderedNonstandardAutoWebPage {
  html: string;
  title: string;
}

const defaultHeroImageUrl = 'https://i.imgur.com/UgHD8SI.jpeg';
const defaultSectionImageUrl = 'https://i.imgur.com/h00mpPA.jpeg';
const autoGeneralAudioUrl = 'https://quote-template-studio.pages.dev/audio/bill-layne-auto-insurance-general.mp3';
const autoAudioProfileImageUrl = 'https://i.imgur.com/h00mpPA.jpeg';

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
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const formatLimit = (limit?: string | number | null) => {
  const raw = String(limit ?? '').trim();
  if (!raw) return 'Not listed';
  if (raw.includes('$')) return raw;
  return raw;
};

const relationship = (driver?: Driver) => {
  if (!driver) return 'Driver';
  if (driver.relationship === 'insured') return 'Insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'child') return 'Household driver';
  if (driver.relationship === 'excluded') return 'Excluded driver';
  return 'Driver';
};

const driverTags = (driver?: Driver) => {
  if (!driver) return ['Not listed', 'Confirm status', 'Confirm license'];
  return [
    driver.isTeen ? 'Youthful driver' : 'Rated driver',
    relationship(driver),
    driver.yearsLicensed ? `${driver.yearsLicensed} years licensed` : 'License years confirm',
  ];
};

const driverSub = (driver?: Driver) => {
  if (!driver) return 'No additional rated driver listed';
  return `${relationship(driver)} | Age ${driver.age || 'confirm'} | ${driver.relationship === 'excluded' ? 'Not covered to drive' : 'Rated'}`;
};

const vehicleName = (vehicle?: Vehicle) =>
  vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : '';

const vehicleIcon = (vehicle?: Vehicle) => {
  const name = vehicleName(vehicle).toLowerCase();
  if (/truck|pickup|sierra|f-?150|f-?250|silverado|ram/.test(name)) return 'TRK';
  if (/van|wagon|edge|suv|explorer|tahoe|suburban|escape/.test(name)) return 'SUV';
  return 'CAR';
};

const vehiclePhysicalCoverage = (vehicle?: Vehicle) => {
  if (!vehicle) return 'Not listed';
  return vehicle.coverageType === 'full_coverage' ? 'Comp/collision listed' : 'Liability only';
};

const coverageValue = (vehicle: Vehicle | undefined, pattern: RegExp, fallback: string) => {
  if (!vehicle) return 'Not listed';
  const match = vehicle.coverages?.find((coverage) => pattern.test(coverage.name));
  if (!match) return fallback;
  if (match.status === 'rejected' || match.status === 'not_applicable' || /not included|not selected|not applicable|rejected|declined/i.test(match.limitOrDeductible || '')) return 'Not selected';
  return match.limitOrDeductible || fallback;
};

const vehiclePremium = (vehicle?: Vehicle) => vehicle?.vehiclePremium ? money(vehicle.vehiclePremium) : 'Not listed';

const vehicleSlots = (data: AutoQuoteData) => {
  const vehicles = data.vehicles.slice(0, 3);
  const liability = `${formatLimit(data.coverages.bodilyInjuryLimit)} / ${formatLimit(data.coverages.propertyDamageLimit)}`;
  return vehicles.map((vehicle) => {
    const comp = coverageValue(
      vehicle,
      /comprehensive|other than collision/i,
      vehicle?.coverageType === 'full_coverage' && data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} ded` : 'Not selected',
    );
    const coll = coverageValue(
      vehicle,
      /collision/i,
      vehicle?.coverageType === 'full_coverage' && data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} ded` : 'Not selected',
    );
    const towing = coverageValue(
      vehicle,
      /towing|roadside|labor/i,
      data.coverages.towing || 'Not selected',
    );
    const rental = coverageValue(
      vehicle,
      /rental|transportation expense|loss of use/i,
      data.coverages.rentalReimbursement || 'Not selected',
    );
    return {
      name: vehicleName(vehicle),
      sub: vehicle ? `VIN ending ${(vehicle.vinLast8 || 'Confirm').slice(-4)} | Garaged ${vehicle.garagingZip || 'Confirm'}` : 'Add another vehicle if needed',
      icon: vehicleIcon(vehicle),
      tags: [
        vehiclePhysicalCoverage(vehicle),
        vehicle ? `ZIP ${vehicle.garagingZip || 'confirm'}` : 'No vehicle',
        vehiclePremium(vehicle),
      ],
      rows: [
        ['Comprehensive', comp],
        ['Collision', coll],
        ['Towing reimbursement', towing],
        ['Loss of use / rental', rental],
        ['Liability / premium', vehicle ? `${liability} | ${vehiclePremium(vehicle)}` : 'Not listed'],
      ],
    };
  });
};

const vehicleCardsHtml = (slots: ReturnType<typeof vehicleSlots>) =>
  slots
    .map((slot) => `        <article class="vehicle">
          <div class="vehicle-head">
            <div class="vehicle-top">
              <div>
                <h3>${escapeHtml(slot.name)}</h3>
                <div class="sub">${escapeHtml(slot.sub)}</div>
              </div>
              <div class="veh-ico">${escapeHtml(slot.icon)}</div>
            </div>
            <div class="veh-chips">
              <span class="veh-chip">${escapeHtml(slot.tags[0])}</span>
              <span class="veh-chip">${escapeHtml(slot.tags[1])}</span>
              <span class="veh-chip">${escapeHtml(slot.tags[2])}</span>
            </div>
          </div>
          <div class="vehicle-body">
            <div class="mini-ledger">
${slot.rows.map(([label, value]) => `              <div class="mini-row"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('\n')}
            </div>
          </div>
        </article>`)
    .join('\n\n');

const marketLogos = (data: AutoQuoteData) => {
  const current = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const candidates = [
    current,
    CARRIERS.progressive,
    CARRIERS.national_general,
    CARRIERS.nationwide,
    CARRIERS.dairyland,
    CARRIERS.travelers,
  ];
  const seen = new Set<string>();
  return candidates
    .filter((carrier) => carrier.logoUrl)
    .filter((carrier) => {
      if (seen.has(carrier.id)) return false;
      seen.add(carrier.id);
      return true;
    })
    .slice(0, 5);
};

const discountSlots = (data: AutoQuoteData) => {
  const labels = data.discounts.length ? data.discounts.map((discount) => discount.label) : ['Policy review', 'Payment plan review', 'Agency support'];
  const slots = [
    {
      title: 'Policy discounts',
      text: labels.slice(0, 5).join(', ') || 'Carrier discount list should be confirmed before binding.',
    },
    {
      title: labels[1] || 'Payment review',
      text: data.paymentOptions.paidInFull.savings
        ? `${money(data.paymentOptions.paidInFull.savings)} savings shown if paid in full.`
        : 'Payment options were reviewed with this quote.',
    },
    {
      title: labels[2] || 'Carrier fit',
      text: 'This quote was selected as a fast-start option based on the parsed carrier proposal.',
    },
  ];
  return slots;
};

const quoteActionHref = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const down = data.paymentOptions.eft.downPayment || data.totalPremium / Math.max(data.termMonths, 1);
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: 'nonstandard-auto',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(down)} down`,
    subject: `${carrier.displayName} Fast Start Auto Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const applyActionLinks = (html: string, actionUrl: string) =>
  html
    .replace('id="miniStartBtn" href="#quote-start"', `id="miniStartBtn" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener"`)
    .replace('id="heroStartBtn" href="#quote-start"', `id="heroStartBtn" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener"`)
    .replace('<a class="btn btn-primary" href="#quote-start">Start Policy</a>', `<a class="btn btn-primary" href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener">Start Policy</a>`);

const audioSectionHtml = () => `    <section id="audio-guide">
      <div class="audio-card">
        <img class="audio-profile" src="${escapeHtml(autoAudioProfileImageUrl)}" alt="Bill Layne Insurance audio guide" width="64" height="64" loading="lazy" />
        <div class="audio-body">
          <span class="eyebrow">General Auto Coverage Guide</span>
          <h3>Learn what auto insurance covers.</h3>
          <p>Liability, UM, comp, collision,<br />deductibles, payments.</p>
          <audio controls preload="metadata">
            <source src="${escapeHtml(autoGeneralAudioUrl)}" type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
          <div class="audio-note">General guide. Exact quote limits are below.</div>
        </div>
      </div>
    </section>`;

export function renderNonstandardAutoWebPageHtml(data: AutoQuoteData): RenderedNonstandardAutoWebPage {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const down = data.paymentOptions.eft.downPayment || data.totalPremium / Math.max(data.termMonths, 1);
  const recurring = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const recurringCount = data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);
  const paidInFull = data.paymentOptions.paidInFull.total || data.totalPremium;
  const vehicleSlot = vehicleSlots(data);
  const markets = marketLogos(data);
  const discounts = discountSlots(data);
  const drivers = [data.drivers[0], data.drivers[1]];
  const driver1Tags = driverTags(drivers[0]);
  const driver2Tags = driverTags(drivers[1]);
  const actionUrl = quoteActionHref(data);
  const title = `${data.clientFullName} Fast Start Auto Quote | Bill Layne Insurance`;
  const liability = `${formatLimit(data.coverages.bodilyInjuryLimit)} BI / ${formatLimit(data.coverages.propertyDamageLimit)} PD`;
  const umuim = data.coverages.underinsuredMotoristLimit
    ? `${formatLimit(data.coverages.uninsuredMotoristLimit)} / ${formatLimit(data.coverages.underinsuredMotoristLimit)}`
    : formatLimit(data.coverages.uninsuredMotoristLimit);
  const comp = data.coverages.comprehensiveDeductible ? `ACV / ${money(data.coverages.comprehensiveDeductible, 0)} ded` : 'Where listed';
  const collision = data.coverages.collisionDeductible ? `ACV / ${money(data.coverages.collisionDeductible, 0)} ded` : 'Where listed';
  const plan3Recurring = recurring + 2;

  const html = replaceTokens(masterTemplate, {
    AGENCY_ADDRESS_LINE: `${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip} | ${BRAND.phone}`,
    AGENCY_EMAIL: BRAND.email.toLowerCase(),
    AGENCY_PHONE_RAW: `1${BRAND.phoneRaw}`,
    AGENCY_SMS_RAW: `1${BRAND.phoneRaw}`,
    AGENCY_WEBSITE: BRAND.website.toLowerCase(),
    AUDIO_SECTION_HTML: audioSectionHtml(),
    CARRIER_LOGO_URL: carrier.logoUrl || BRAND.logoUrl,
    CARRIER_NAME: carrier.displayName,
    CLIENT_DISPLAY_NAMES: data.clientFullName,
    CLIENT_NAME: data.clientFullName,
    HERO_IMAGE_URL: normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl),
    HERO_INTRO_TEXT: `I shopped ${carrier.displayName} as a fast-start option. See the start cost, monthly payment, and vehicle details below.`,
    LOWEST_DOWN_PAYMENT: money(down),
    LOWEST_MONTHLY_PAYMENT: money(recurring),
    LOWEST_PAYMENT_COUNT: String(recurringCount),
    TOTAL_TERM_PREMIUM: money(data.totalPremium),
    PAID_IN_FULL_TOTAL: money(paidInFull),
    QUOTE_DATE: formatDate(data.quoteDate),
    QUOTE_NUMBER: data.quoteNumber,
    RATE_CHANGE_DISCLOSURE: `${carrier.displayName} can still verify drivers, vehicle use, garaging, prior insurance, reports, and payment details before the policy is issued.`,
    RATE_CHANGE_REASON_1: 'Driver reports, accident history, violations, or license status verify differently than expected.',
    RATE_CHANGE_REASON_2: 'VIN, garaging address, mileage, vehicle use, or listed drivers need correction.',
    RATE_CHANGE_REASON_3: 'Payment method, fees, or billing plan changes before the policy starts.',
    RATE_CHANGE_REASON_4: 'Carrier underwriting asks for additional information before final issue.',
    DRIVER_1_NAME: drivers[0]?.name || data.clientFullName,
    DRIVER_1_SUB: driverSub(drivers[0]),
    DRIVER_1_TAG_1: driver1Tags[0],
    DRIVER_1_TAG_2: driver1Tags[1],
    DRIVER_1_TAG_3: driver1Tags[2],
    DRIVER_2_NAME: drivers[1]?.name || 'No additional rated driver listed',
    DRIVER_2_SUB: driverSub(drivers[1]),
    DRIVER_2_TAG_1: driver2Tags[0],
    DRIVER_2_TAG_2: driver2Tags[1],
    DRIVER_2_TAG_3: driver2Tags[2],
    HOUSEHOLD_CARD_TITLE: 'Household reminder',
    HOUSEHOLD_CARD_SUB: 'Confirm every regular driver',
    HOUSEHOLD_CARD_TEXT: 'Please confirm household residents, regular operators, young drivers, and excluded drivers before the policy is started.',
    VEHICLE_NOTICE_TITLE: 'Vehicle coverage reminder',
    VEHICLE_NOTICE_TEXT: 'Liability-only vehicles do not have comprehensive or collision for damage to that vehicle itself. Ask us before starting if you want a price to add it.',
    VEHICLE_CARDS_HTML: vehicleCardsHtml(vehicleSlot),
    COV_1_CODE: 'BI',
    COV_1_TITLE: 'Bodily Injury Liability',
    COV_1_SUB: 'If you hurt someone in an accident',
    COV_1_LIMIT: formatLimit(data.coverages.bodilyInjuryLimit),
    COV_1_BODY: 'Helps pay injury claims and legal costs if you cause an accident and someone is hurt.',
    COV_1_PLAIN: 'This protects you from owing out of pocket for injuries you cause to other people, up to the policy limits.',
    COV_2_CODE: 'PD',
    COV_2_TITLE: 'Property Damage Liability',
    COV_2_SUB: "If you damage someone else's property",
    COV_2_LIMIT: formatLimit(data.coverages.propertyDamageLimit),
    COV_2_BODY: 'Pays for damage you cause to another vehicle, fence, mailbox, building, or other property.',
    COV_2_PLAIN: 'This fixes what you hit, not your own vehicle.',
    COV_3_CODE: 'UM',
    COV_3_TITLE: 'Uninsured / Underinsured Motorist',
    COV_3_SUB: 'When the other driver cannot pay',
    COV_3_LIMIT: umuim,
    COV_3_BODY: 'Helps if you or your passengers are injured by a driver who has no insurance or not enough insurance.',
    COV_3_PLAIN: 'You cannot control whether the other driver bought good insurance. This helps protect your household anyway.',
    COV_4_CODE: 'UP',
    COV_4_TITLE: 'UM Property Damage',
    COV_4_SUB: 'Damage from an uninsured driver',
    COV_4_LIMIT: formatLimit(data.coverages.propertyDamageLimit),
    COV_4_BODY: 'Can help with vehicle damage caused by an uninsured driver, subject to policy terms and deductibles.',
    COV_4_PLAIN: 'This is different from regular collision and depends on the claim facts.',
    COV_5_CODE: 'CP',
    COV_5_TITLE: 'Comprehensive',
    COV_5_SUB: 'Theft, hail, deer, fire, glass',
    COV_5_LIMIT: comp,
    COV_5_BODY: 'Helps with non-collision damage where comprehensive is listed on the vehicle.',
    COV_5_PLAIN: 'Think deer, hail, theft, fire, vandalism, and glass.',
    COV_6_CODE: 'CL',
    COV_6_TITLE: 'Collision',
    COV_6_SUB: 'Damage to your vehicle from a wreck',
    COV_6_LIMIT: collision,
    COV_6_BODY: 'Helps repair or replace your own vehicle after a collision where collision is listed on that vehicle.',
    COV_6_PLAIN: 'This is the coverage that protects your own car after an accident, subject to the deductible.',
    PLAN_1_NAME: 'EFT - Lowest Start',
    PLAN_1_DOWN: money(down),
    PLAN_1_DISPLAY: `${money(down)} down, then ${recurringCount} payments of ${money(recurring)}`,
    PLAN_1_MINI: `${money(down)} down • ${money(recurring)}/mo`,
    PLAN_1_SUB: `Then ${recurringCount} monthly payment${recurringCount === 1 ? '' : 's'} of ${money(recurring)}. This is the lowest-start plan from the parsed billing options.`,
    PLAN_1_TOTAL_LABEL: 'Total billed premium',
    PLAN_1_TOTAL_VALUE: money(data.totalPremium),
    PLAN_2_NAME: 'Paid In Full',
    PLAN_2_DOWN: money(paidInFull),
    PLAN_2_DOWN_LABEL: 'once',
    PLAN_2_DISPLAY: `${money(paidInFull)} paid in full`,
    PLAN_2_MINI: `${money(paidInFull)} paid in full`,
    PLAN_2_SUB: data.paymentOptions.paidInFull.savings ? `One payment, with ${money(data.paymentOptions.paidInFull.savings)} savings shown.` : 'One payment with no future monthly bills this term.',
    PLAN_2_TOTAL_LABEL: data.paymentOptions.paidInFull.savings ? 'Savings vs installments' : 'Total paid today',
    PLAN_2_TOTAL_VALUE: data.paymentOptions.paidInFull.savings ? money(data.paymentOptions.paidInFull.savings) : money(paidInFull),
    PLAN_3_NAME: 'Card Monthly',
    PLAN_3_DOWN: money(down),
    PLAN_3_DOWN_LABEL: 'down',
    PLAN_3_DISPLAY: `${money(down)} down, then ${recurringCount} card payments around ${money(plan3Recurring)}`,
    PLAN_3_MINI: `${money(down)} down • ${money(plan3Recurring)}/mo`,
    PLAN_3_SUB: 'Use this as a review option if the customer wants card billing instead of EFT. Confirm exact carrier fees before issue.',
    PLAN_3_TOTAL_LABEL: 'Estimated total billed',
    PLAN_3_TOTAL_VALUE: money(down + recurringCount * plan3Recurring),
    DISCOUNT_1_TITLE: discounts[0].title,
    DISCOUNT_1_TEXT: discounts[0].text,
    DISCOUNT_2_TITLE: discounts[1].title,
    DISCOUNT_2_TEXT: discounts[1].text,
    DISCOUNT_3_TITLE: discounts[2].title,
    DISCOUNT_3_TEXT: discounts[2].text,
    SECTION_IMAGE_URL: defaultSectionImageUrl,
    SECTION_IMAGE_ALT: 'Bill Layne reviewing auto insurance coverage with a local customer',
    SECTION_IMAGE_EYEBROW: 'Why Choose Us',
    SECTION_IMAGE_HEADLINE: 'A local agency reviews the details before you start.',
    SECTION_IMAGE_COPY: 'Bill Layne Insurance is here to help you understand the quote, confirm the drivers and vehicles, review payment options, and make sure nothing is submitted until the final details are clear.',
    GOOGLE_REVIEWS_URL: BRAND.googleReviewsUrl,
    GOOGLE_RATING: String(BRAND.googleRating),
    GOOGLE_REVIEW_COUNT: BRAND.googleReviewCount,
    STEP_1_TITLE: 'Review the quote',
    STEP_1_TEXT: 'Confirm drivers, vehicles, garaging, mileage, and mixed vehicle coverage are correct.',
    STEP_2_TITLE: 'Pick a payment plan',
    STEP_2_TEXT: 'Choose EFT, card, or paid in full. This page defaults to the lowest-start option.',
    STEP_3_TITLE: 'Start the policy',
    STEP_3_TEXT: 'Use Start Policy and we will confirm the application and payment before anything is submitted.',
    FAQ_1_Q: 'Why does this page lead with down payment instead of just total premium?',
    FAQ_1_A: 'For nonstandard-style shoppers, start-today money and monthly budget often matter first. The full term total is still shown for transparency.',
    FAQ_2_Q: 'Are all vehicles protected the same way?',
    FAQ_2_A: 'No. Each vehicle can have different protection. Review every vehicle card before starting the policy.',
    FAQ_3_Q: 'Which plan is cheapest to start?',
    FAQ_3_A: `The lowest-start plan shown starts at ${money(down)} and then bills ${recurringCount} monthly payment${recurringCount === 1 ? '' : 's'} of ${money(recurring)}.`,
    FAQ_4_Q: 'Can the rate change?',
    FAQ_4_A: 'Yes. The carrier can verify reports and information before coverage is issued.',
    FOOTER_DISCLOSURE: 'This webpage is a presentation format built from the carrier quote. It is not a binder or contract. Rates are subject to verification of information, and coverage begins only after final application approval, initial payment, and carrier issue.',
    TOKENS: 'tokens',
    ...Object.fromEntries(markets.map((market, index) => [`MARKET_LOGO_${index + 1}`, market.logoUrl || BRAND.logoUrl])),
    ...Object.fromEntries(markets.map((market, index) => [`MARKET_NAME_${index + 1}`, market.displayName])),
    ...Object.fromEntries(vehicleSlot.flatMap((slot, index) => {
      const n = index + 1;
      return [
        [`VEHICLE_${n}_NAME`, slot.name],
        [`VEHICLE_${n}_SUB`, slot.sub],
        [`VEHICLE_${n}_ICON`, slot.icon],
        [`VEHICLE_${n}_TAG_1`, slot.tags[0]],
        [`VEHICLE_${n}_TAG_2`, slot.tags[1]],
        [`VEHICLE_${n}_TAG_3`, slot.tags[2]],
        [`VEHICLE_${n}_ROW_1_LABEL`, slot.rows[0][0]],
        [`VEHICLE_${n}_ROW_1_VALUE`, slot.rows[0][1]],
        [`VEHICLE_${n}_ROW_2_LABEL`, slot.rows[1][0]],
        [`VEHICLE_${n}_ROW_2_VALUE`, slot.rows[1][1]],
        [`VEHICLE_${n}_ROW_3_LABEL`, slot.rows[2][0]],
        [`VEHICLE_${n}_ROW_3_VALUE`, slot.rows[2][1]],
        [`VEHICLE_${n}_ROW_4_LABEL`, slot.rows[3][0]],
        [`VEHICLE_${n}_ROW_4_VALUE`, slot.rows[3][1]],
        [`VEHICLE_${n}_ROW_5_LABEL`, slot.rows[4][0]],
        [`VEHICLE_${n}_ROW_5_VALUE`, slot.rows[4][1]],
      ];
    })),
  });

  return {
    html: applyActionLinks(html, actionUrl),
    title,
  };
}
