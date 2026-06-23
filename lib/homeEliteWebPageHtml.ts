import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { Endorsement, HomeQuoteData } from '../types/home';
import { resolveDigitalCardUrl } from './digitalCardLinks';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/HOME_ELITE_WEBPAGE_TEMPLATE.html?raw';

export interface RenderedHomeEliteWebPage {
  html: string;
  title: string;
}

interface PaymentPlan {
  key: string;
  name: string;
  amount: string;
  unitHtml: string;
  sub: string;
  total: string;
  tag: string;
  display: string;
  plan: string;
  premiumParam: string;
  recommended: boolean;
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

const money = (value: number | undefined | null, digits = 0) =>
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
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const limitLabel = (amount: number | string | undefined | null) =>
  typeof amount === 'number' ? money(amount) : String(amount || 'Included');

const numberValue = (amount: number | string | undefined | null) =>
  typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;

const percentOfCoverageA = (amount: number | string | undefined | null, coverageA: number) => {
  const numeric = numberValue(amount);
  if (!numeric || !coverageA) return '';
  const percent = (numeric / coverageA) * 100;
  return `${Number(percent.toFixed(percent >= 1 ? 1 : 2))}%`;
};

const paidInFullSavings = (data: HomeQuoteData) =>
  Math.max(data.basePremium + data.fees.reduce((total, fee) => total + fee.amount, 0) - data.annualPremium, 0);

const addressParts = (address: string) =>
  address.split(',').map((part) => part.trim()).filter(Boolean);

const propertyPill = (data: HomeQuoteData) => {
  const parts = addressParts(data.propertyAddress);
  return parts.length ? parts.map(escapeHtml).join(' &middot; ') : 'Property address under review';
};

const propertyShort = (data: HomeQuoteData) => {
  const parts = addressParts(data.propertyAddress);
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return data.propertyAddress || 'the insured home';
};

const roofLine = (data: HomeQuoteData) => {
  const pieces = [data.roofMaterial, data.roofYear ? String(data.roofYear) : ''].filter(Boolean);
  return pieces.length ? pieces.join(' | ') : 'Not listed';
};

const squareFeetLine = (data: HomeQuoteData) =>
  data.squareFeet ? `${data.squareFeet.toLocaleString()} sq ft` : 'Not listed';

const propertyCard = (label: string, value: string, icon: string) => `    <div style="background:#fdfbf6;border:1px solid #e3dccd;border-radius:14px;padding:18px;display:flex;gap:13px;align-items:center;">
      <div style="flex:0 0 auto;width:40px;height:40px;border-radius:11px;background:#e7efe8;color:#1f4a3a;display:flex;align-items:center;justify-content:center;">${icon}</div>
      <div><div style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#9aa093;">${escapeHtml(label)}</div><div style="font-size:16px;font-weight:700;color:#1f4a3a;line-height:1.2;">${escapeHtml(value)}</div></div>
    </div>`;

const icons = {
  home: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path></svg>',
  grid: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18M3 15h18M9 3v18"></path></svg>',
  roof: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"></path><path d="M5 10v10h14V10"></path></svg>',
  wall: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"></path><path d="M9 4v16M15 4v16"></path></svg>',
  shield: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  bolt: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"></path></svg>',
  water: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7S5 10 5 14a7 7 0 0 0 14 0c0-4-7-11.3-7-11.3z"></path></svg>',
  service: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"></path><circle cx="6" cy="12" r="2"></circle><circle cx="18" cy="12" r="2"></circle></svg>',
  equipment: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09c0 .69.41 1.31 1 1.51"></path></svg>',
  identity: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
};

const propertyCardsHtml = (data: HomeQuoteData) =>
  [
    propertyCard('Year built', data.yearBuilt ? String(data.yearBuilt) : 'Not listed', icons.home),
    propertyCard('Living area', squareFeetLine(data), icons.grid),
    propertyCard('Roof', roofLine(data), icons.roof),
    propertyCard('Construction', data.constructionType || 'Not listed', icons.wall),
    propertyCard('Protection class', data.protectionClass ? `Class ${data.protectionClass}` : 'Not listed', icons.shield),
    propertyCard('Alarm / fire', data.hasMonitoredAlarm ? 'Monitored alarm' : data.fireDistance || 'Review available credits', icons.bolt),
  ].join('\n');

interface CoverageRow {
  open?: boolean;
  letter: string;
  name: string;
  sub: string;
  limit: string;
  small: string;
  body: string;
  means: string;
}

const chevronSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa093" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const coverageRowHtml = (row: CoverageRow) => `    <details${row.open ? ' open' : ''} style="border-top:1px solid #e3dccd;">
      <summary style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:18px 22px;min-height:44px;">
        <span style="flex:0 0 auto;width:32px;font-family:'Newsreader',serif;font-weight:700;font-size:19px;color:#a9763a;text-align:center;">${escapeHtml(row.letter)}</span>
        <span style="flex:1 1 auto;min-width:0;"><strong style="display:block;font-size:15.5px;color:#1f4a3a;">${escapeHtml(row.name)}</strong><span style="display:block;font-size:13px;color:#6e7268;">${escapeHtml(row.sub)}</span></span>
        <span style="font-weight:700;font-size:15px;color:#1f4a3a;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;">${escapeHtml(row.limit)}<small style="display:block;font-size:11px;font-weight:600;color:#9aa093;">${escapeHtml(row.small)}</small></span>
        ${chevronSvg}
      </summary>
      <div style="padding:0 22px 20px clamp(22px,4vw,68px);font-size:14.5px;line-height:1.6;color:#3a4038;">
        <p style="margin:0;">${escapeHtml(row.body)}</p>
        <p style="margin:12px 0 0;padding:11px 15px;border-left:4px solid #a9763a;background:#f6efe2;border-radius:0 10px 10px 0;font-size:13.5px;"><strong style="color:#a9763a;">What this means for you:</strong> ${escapeHtml(row.means)}</p>
      </div>
    </details>`;

const coverageRowsHtml = (data: HomeQuoteData) => {
  const c = data.coverages;
  const coverageBPercent = percentOfCoverageA(c.coverageB, c.coverageA) || 'other structures';
  const coverageDPercent = percentOfCoverageA(c.coverageD, c.coverageA) || 'loss of use';
  const dwellingSettlement = data.dwellingLossSettlement.toLowerCase();
  const propertySettlement = data.personalPropertyLossSettlement.toLowerCase();
  const rows: CoverageRow[] = [
    {
      open: true,
      letter: 'A',
      name: 'Dwelling',
      sub: "Your home's structure",
      limit: limitLabel(c.coverageA),
      small: dwellingSettlement,
      body: 'Pays to rebuild or repair the physical structure of your home: roof, walls, floors, built-in cabinets, and attached systems like plumbing, wiring, and HVAC after a covered loss such as fire, wind, or a burst pipe.',
      means: data.dwellingLossSettlement === 'Replacement Cost'
        ? "this is replacement-cost coverage, so a covered total loss is rebuilt at today's construction prices, not a depreciated cash value."
        : 'this is actual cash value coverage, so depreciation can affect a covered payout. Ask us to review replacement-cost options before you bind.',
    },
    {
      letter: 'B',
      name: 'Other Structures',
      sub: 'Detached buildings on your lot',
      limit: limitLabel(c.coverageB),
      small: coverageBPercent === 'other structures' ? 'separate limit' : `${coverageBPercent} of dwelling`,
      body: "Covers structures that aren't attached to your home: a detached garage, storage shed, fence, mailbox, or in-ground pool for the same covered causes of loss as your dwelling.",
      means: "if a storm takes out your fence or shed, that's covered here without touching your dwelling limit.",
    },
    {
      letter: 'C',
      name: 'Personal Property',
      sub: 'Your belongings, inside and out',
      limit: limitLabel(c.coverageC),
      small: propertySettlement,
      body: "Covers your stuff: furniture, clothing, electronics, appliances, and tools whether it is in the house or with you away from home.",
      means: data.personalPropertyLossSettlement === 'Replacement Cost'
        ? 'your belongings are covered at replacement cost, not depreciated value.'
        : 'your belongings are covered at actual cash value, so we should discuss replacement-cost options if you want stronger contents protection.',
    },
    {
      letter: 'D',
      name: 'Loss of Use',
      sub: "Living expenses if you're displaced",
      limit: limitLabel(c.coverageD),
      small: coverageDPercent,
      body: "If a covered loss makes your home unlivable while it is repaired, this pays the extra cost of living elsewhere: hotel or rental, meals, and other expenses above your normal household spending.",
      means: "a kitchen fire does not also mean paying out of pocket for a place to stay for two months.",
    },
    {
      letter: 'E',
      name: 'Personal Liability',
      sub: "If you're responsible for injury or damage",
      limit: limitLabel(c.coverageE),
      small: 'each occurrence',
      body: "Protects you if someone is injured on your property or you accidentally damage someone else's property. It pays their claims and your legal defense, at home or away.",
      means: "a guest slip-and-fall or dog incident is handled here instead of out of your savings, and we can raise this limit or add an umbrella if you'd like more.",
    },
    {
      letter: 'F',
      name: 'Medical Payments to Others',
      sub: 'Guest medical, no fault needed',
      limit: limitLabel(c.coverageF),
      small: 'each person',
      body: 'Pays small medical bills for a guest who gets hurt at your home, regardless of who was at fault. No lawsuit required.',
      means: "a neighbor's twisted ankle on your steps gets handled quickly and quietly, which often keeps a minor accident from becoming a liability claim.",
    },
  ];
  return rows.map(coverageRowHtml).join('\n');
};

const endorsementCopy = (endorsement: Endorsement) => {
  const name = endorsement.name.toLowerCase();
  if (/water|backup|sump|flood/.test(name)) {
    return {
      icon: icons.water,
      sub: endorsement.subLabel || 'Drains, sewers, sump pumps',
      body: 'A standard home policy can limit or exclude some water losses that back up through drains, sewers, sump pumps, or similar systems. This added protection helps close that gap.',
      means: "a backed-up drain or covered water event does not turn into a surprise out-of-pocket repair bill without us first reviewing the protection available here.",
    };
  }
  if (/service|line|pipe|wire|underground/.test(name)) {
    return {
      icon: icons.service,
      sub: endorsement.subLabel || 'Underground pipes and wires you own',
      body: 'Covers buried lines running to your house, such as water, sewer, power, or internet lines, when they fail or are damaged and you are responsible for repair.',
      means: 'a collapsed service line under the yard can mean digging, repair, and re-landscaping. This endorsement is built for that kind of problem.',
    };
  }
  if (/equipment|breakdown|hvac|appliance/.test(name)) {
    return {
      icon: icons.equipment,
      sub: endorsement.subLabel || 'Home systems and major appliances',
      body: 'Covers mechanical or electrical breakdown of home systems like HVAC, water heater, well pump, smart-home panels, and major appliances that a normal policy may not pay for.',
      means: 'when a heat pump or major system fails, this can help replace it instead of you eating the whole bill.',
    };
  }
  if (/identity|theft|fraud/.test(name)) {
    return {
      icon: icons.identity,
      sub: endorsement.subLabel || 'Expenses to restore your identity',
      body: 'Reimburses costs of recovering from identity theft, including legal fees, lost wages, notarization, and filing, plus access to resolution help when included by the carrier.',
      means: 'if someone opens accounts in your name, you have a path to get help fixing it instead of just a headache.',
    };
  }
  return {
    icon: icons.shield,
    sub: endorsement.subLabel || 'Added protection',
    body: endorsement.subLabel || 'An added endorsement included with this homeowners quote to strengthen the standard policy.',
    means: 'this was included on the quote because it may fit the home, the carrier package, or your protection needs.',
  };
};

const endorsementRowsHtml = (data: HomeQuoteData) => {
  const endorsements = data.endorsements.length
    ? data.endorsements
    : [{ emoji: '', name: 'Endorsements review', subLabel: 'We will review optional add-ons before binding', amount: 'Review' }];
  return endorsements
    .map((endorsement) => {
      const copy = endorsementCopy(endorsement);
      return `    <details style="border-top:1px solid #e3dccd;">
      <summary style="cursor:pointer;display:flex;align-items:center;gap:14px;padding:18px 22px;min-height:44px;">
        <span style="flex:0 0 auto;width:36px;height:36px;border-radius:10px;background:#e7efe8;color:#1f4a3a;display:flex;align-items:center;justify-content:center;">${copy.icon}</span>
        <span style="flex:1 1 auto;min-width:0;"><strong style="display:block;font-size:15.5px;color:#1f4a3a;">${escapeHtml(endorsement.name)}</strong><span style="display:block;font-size:13px;color:#6e7268;">${escapeHtml(copy.sub)}</span></span>
        <span style="font-weight:700;font-size:15px;color:#1f4a3a;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;">${escapeHtml(endorsement.amount || 'Included')}<small style="display:block;font-size:11px;font-weight:600;color:#2c5d44;">included</small></span>
        ${chevronSvg}
      </summary>
      <div style="padding:0 22px 20px clamp(22px,4vw,72px);font-size:14.5px;line-height:1.6;color:#3a4038;">
        <p style="margin:0;">${escapeHtml(copy.body)}</p>
        <p style="margin:12px 0 0;padding:11px 15px;border-left:4px solid #a9763a;background:#f6efe2;border-radius:0 10px 10px 0;font-size:13.5px;"><strong style="color:#a9763a;">What this means for you:</strong> ${escapeHtml(copy.means)}</p>
      </div>
    </details>`;
    })
    .join('\n');
};

const paymentPlans = (data: HomeQuoteData): PaymentPlan[] => {
  const annual = data.annualPremium;
  const monthly = annual / 12;
  const semi = annual / 2;
  return [
    {
      key: 'payinfull',
      name: 'Pay In Full',
      amount: money(annual, 2),
      unitHtml: '/ yr',
      sub: 'One payment for the full year. No installment fees.',
      total: money(annual, 2),
      tag: 'lowest cost',
      display: `${money(annual, 2)} paid in full`,
      plan: 'Annual - Pay In Full',
      premiumParam: `${money(annual, 2)}/yr`,
      recommended: false,
    },
    {
      key: 'semiannual',
      name: 'Semi-Annual',
      amount: money(semi, 2),
      unitHtml: '&times;2',
      sub: 'Two payments, six months apart. Minimal fees.',
      total: money(annual, 2),
      tag: 'split in two',
      display: `${money(semi, 2)} twice a year`,
      plan: 'Semi-Annual (2-Pay)',
      premiumParam: `${money(semi, 2)} x2`,
      recommended: false,
    },
    {
      key: 'monthly',
      name: 'Monthly Auto-Pay',
      amount: money(monthly, 2),
      unitHtml: '/ mo',
      sub: 'Automatic monthly payments from your bank (EFT).',
      total: money(annual, 2),
      tag: 'easiest on cash flow',
      display: `${money(monthly, 2)}/mo with auto-pay`,
      plan: 'Monthly Auto-Pay (EFT)',
      premiumParam: `${money(monthly, 2)}/mo`,
      recommended: true,
    },
  ];
};

const paymentPlanCardsHtml = (plans: PaymentPlan[]) =>
  plans
    .map((plan) => {
      const selected = plan.recommended;
      return `    <button type="button" role="radio" data-plan-card data-plan-key="${escapeHtml(plan.key)}" data-plan-label="${escapeHtml(plan.plan)}" data-plan-display="${escapeHtml(plan.display)}" data-premium-param="${escapeHtml(plan.premiumParam)}" aria-checked="${selected ? 'true' : 'false'}" style="position:relative;text-align:left;cursor:pointer;width:100%;background:#fdfbf6;border:1.5px solid ${selected ? '#1f4a3a' : '#e3dccd'};border-radius:16px;padding:22px 20px 18px;font-family:inherit;transition:border-color .2s, box-shadow .2s, transform .2s;box-shadow:${selected ? '0 14px 34px rgba(31,74,58,.16)' : 'none'};">
      ${plan.recommended ? '<span style="position:absolute;top:-11px;left:18px;background:#a9763a;color:#fff;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:4px 12px;border-radius:999px;">Recommended</span>' : ''}
      <span data-plan-check style="position:absolute;top:16px;right:16px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid ${selected ? '#1f4a3a' : '#d8d0c0'};background:${selected ? '#1f4a3a' : 'transparent'};color:#fff;transition:.2s;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" data-plan-check-icon style="opacity:${selected ? '1' : '0'};"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
      <span style="display:block;font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#9aa093;">${escapeHtml(plan.name)}</span>
      <span style="display:flex;align-items:baseline;gap:5px;margin:8px 0 2px;"><span style="font-family:'Newsreader',serif;font-weight:600;font-size:31px;color:#1f4a3a;font-variant-numeric:tabular-nums;">${escapeHtml(plan.amount)}</span><span style="font-size:14px;font-weight:600;color:#9aa093;">${plan.unitHtml}</span></span>
      <span style="display:block;font-size:13px;color:#6e7268;min-height:38px;line-height:1.45;">${escapeHtml(plan.sub)}</span>
      <span style="display:block;margin-top:12px;padding-top:12px;border-top:1px solid #e3dccd;font-size:13px;color:#3a4038;">Total year: <b style="color:#1f4a3a;font-variant-numeric:tabular-nums;">${escapeHtml(plan.total)}</b> &middot; ${escapeHtml(plan.tag)}</span>
    </button>`;
    })
    .join('\n');

const creditsHtml = (data: HomeQuoteData) => {
  const discounts = data.discounts.length ? data.discounts : [{ emoji: '', label: 'Carrier credits reviewed' }];
  return discounts
    .map((discount) => `    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#eaf1ea;border:1px solid #d3e0d4;border-radius:13px;padding:13px 15px;font-size:14px;font-weight:600;color:#2c5d44;"><span>&#10003;&nbsp; ${escapeHtml(discount.label)}</span><span style="font-variant-numeric:tabular-nums;font-weight:800;">Applied</span></div>`)
    .join('\n');
};

const carrierComparisonLine = (data: HomeQuoteData) => {
  const carriers = data.carriersShoppedNames.filter(Boolean);
  if (!carriers.length) return 'the carriers we represent';
  if (carriers.length === 1) return carriers[0];
  if (carriers.length === 2) return `${carriers[0]} and ${carriers[1]}`;
  return `${carriers.slice(0, -1).join(', ')}, and ${carriers[carriers.length - 1]}`;
};

const quoteActionHref = (data: HomeQuoteData, carrierName: string, plan: PaymentPlan) => {
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail || '',
    templateType: 'home',
    carrier: carrierName,
    quoteNumber: data.quoteNumber,
    premium: plan.premiumParam,
    payPlan: plan.plan,
    subject: `${carrierName} Home Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const smsHref = (data: HomeQuoteData) =>
  `sms:${BRAND.phoneRaw}?body=${encodeURIComponent(`Hi Bill, I'm reviewing my home quote (#${data.quoteNumber}) and had a question about...`)}`;

const windDeductibleLabel = (data: HomeQuoteData) => {
  if (!data.windHailDeductible) return 'Not listed';
  const percent = percentOfCoverageA(data.windHailDeductible, data.coverages.coverageA);
  return percent ? `${percent} | ${money(data.windHailDeductible)}` : money(data.windHailDeductible);
};

const windDeductibleNote = (data: HomeQuoteData) =>
  data.windHailDeductible
    ? 'A percentage of your dwelling limit, common in NC for storm damage.'
    : 'No separate wind and hail deductible was parsed from this quote.';

const windFaq = (data: HomeQuoteData) => {
  if (!data.windHailDeductible) return 'not listed separately on this quote';
  const percent = percentOfCoverageA(data.windHailDeductible, data.coverages.coverageA);
  return percent ? `about ${percent} of your dwelling limit (${money(data.windHailDeductible)})` : money(data.windHailDeductible);
};

export function renderHomeEliteWebPageHtml(data: HomeQuoteData): RenderedHomeEliteWebPage {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  const plans = paymentPlans(data);
  const selectedPlan = plans.find((plan) => plan.recommended) ?? plans[0];
  const savings = paidInFullSavings(data);
  const monthly = data.annualPremium / 12;
  const agencyLogoUrl = publicAssetUrl('/home-elite-webpage/agency-logo-sample.png');
  const agentPhotoUrl = publicAssetUrl('/home-elite-webpage/agent-sample.jpg');
  const heroFallbackUrl = publicAssetUrl('/home-elite-webpage/home-hero-sample.jpg');
  const officePhotoUrl = publicAssetUrl('/home-elite-webpage/office-sample.jpg');
  const heroUrl = normalizeHeroImageUrl(data.heroImageUrl, heroFallbackUrl);
  const digitalCardUrl = resolveDigitalCardUrl(data.carrierId, data.digitalCardUrl);
  const title = `${data.clientFullName} - Home Elite Webpage Quote | Bill Layne Insurance`;

  const html = replaceTokens(masterTemplate, {
    ACCEPT_URL: escapeHtml(quoteActionHref(data, carrier.displayName, selectedPlan)),
    AGENCY_EMAIL: escapeHtml(BRAND.email),
    AGENCY_LOGO_URL: escapeHtml(agencyLogoUrl),
    AGENCY_PHONE: escapeHtml(BRAND.phone),
    AGENCY_PHONE_RAW: escapeHtml(BRAND.phoneRaw),
    AGENT_PHOTO_URL: escapeHtml(agentPhotoUrl),
    ALL_PERIL_DEDUCTIBLE: escapeHtml(money(data.allPerilDeductible)),
    ANNUAL_PREMIUM: escapeHtml(money(data.annualPremium, 2)),
    CARRIERS_COMPARED: escapeHtml(carrierComparisonLine(data)),
    CARRIER_LOGO_URL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CLIENT_EMAIL: escapeHtml(data.clientEmail || ''),
    CLIENT_NAME: escapeHtml(data.clientFullName),
    COVERAGE_ROWS_HTML: coverageRowsHtml(data),
    CREDITS_HTML: creditsHtml(data),
    CREDITS_LINE: escapeHtml(savings > 0 ? `${money(savings)} in credits already applied` : 'Credits already applied'),
    CREDITS_TOTAL: escapeHtml(savings > 0 ? `${money(savings)} / yr` : 'Included credits'),
    DWELLING_SETTLEMENT: escapeHtml(data.dwellingLossSettlement.toLowerCase()),
    EFFECTIVE_DATE: escapeHtml(formatDate(data.effectiveDate)),
    EXPIRY_DATE: escapeHtml(formatDate(data.expiryDate)),
    ENDORSEMENT_ROWS_HTML: endorsementRowsHtml(data),
    DIGITAL_CARD_URL: escapeHtml(digitalCardUrl),
    GOOGLE_RATING: escapeHtml(String(BRAND.googleRating)),
    GOOGLE_REVIEWS_URL: escapeHtml(BRAND.googleReviewsUrl),
    HERO_IMAGE_URL: escapeHtml(heroUrl),
    MINI_PLAN_TEXT: escapeHtml(`Selected: ${selectedPlan.plan}`),
    MONTHLY_PREMIUM: escapeHtml(money(monthly, 2)),
    OFFICE_PHOTO_URL: escapeHtml(officePhotoUrl),
    PAYMENT_PLAN_CARDS_HTML: paymentPlanCardsHtml(plans),
    POLICY_TYPE: escapeHtml(data.policyType),
    PREPARED_DATE: escapeHtml(formatDate(data.quoteDate)),
    PROPERTY_ALT: escapeHtml(`The insured home at ${data.propertyAddress || 'the quoted property'}`),
    PROPERTY_CARDS_HTML: propertyCardsHtml(data),
    PROPERTY_PILL: propertyPill(data),
    PROPERTY_SETTLEMENT: escapeHtml(data.personalPropertyLossSettlement.toLowerCase()),
    PROPERTY_SHORT: escapeHtml(propertyShort(data)),
    QUOTE_ACTION_URL: escapeHtml(BRAND.quoteActionUrl),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber),
    REVIEW_COUNT: escapeHtml(BRAND.googleReviewCount),
    SELECTED_PLAN_LABEL: escapeHtml(`${selectedPlan.plan} - ${selectedPlan.display}`),
    SMS_HREF: escapeHtml(smsHref(data)),
    WIND_HAIL_DEDUCTIBLE: escapeHtml(windDeductibleLabel(data)),
    WIND_HAIL_FAQ: escapeHtml(windFaq(data)),
    WIND_HAIL_NOTE: escapeHtml(windDeductibleNote(data)),
  });

  return { html, title };
}
