import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { HomeQuoteData } from '../types/home';
import type { GeneratedAudioReview } from './webAudioReview';
import { normalizeHeroImageUrl } from './heroImage';
import masterTemplate from '../templates/web/BLI_HOME_QUOTE_MASTER_TEMPLATE.html?raw';

export interface RenderedHomeWebPage {
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

const money = (value: number, digits = 0) =>
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

const cityFromAddress = (address: string) => {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? `${parts[parts.length - 2]}, ${BRAND.state}` : `${BRAND.city}, ${BRAND.state}`;
};

const limitLabel = (amount: number | string) =>
  typeof amount === 'number' ? money(amount) : String(amount || 'Included');

const defaultHeroImageUrl = 'https://i.imgur.com/e38zhwA.jpeg';

const paidInFullSavings = (data: HomeQuoteData) =>
  Math.max(data.basePremium + data.fees.reduce((total, fee) => total + fee.amount, 0) - data.annualPremium, 0);

const savingsLine = (savings: number) =>
  savings > 0 ? `Includes ${money(savings)} Pay-In-Full Savings` : 'Quoted with every eligible discount applied';

const windDeductibleInfo = (data: HomeQuoteData) => {
  if (!data.windHailDeductible) return null;
  const percent = data.coverages.coverageA > 0 ? (data.windHailDeductible / data.coverages.coverageA) * 100 : 0;
  const roundedPercent = percent > 0 ? Number(percent.toFixed(percent >= 1 ? 1 : 2)).toString() : '';
  return { amount: data.windHailDeductible, percent: roundedPercent };
};

const deductibleLine = (data: HomeQuoteData) => {
  const wind = windDeductibleInfo(data);
  const base = `${money(data.allPerilDeductible)} All Other Perils`;
  return wind ? `${base} • ${money(wind.amount)} Wind/Hail` : base;
};

const deductibleExplanation = (data: HomeQuoteData) => {
  const wind = windDeductibleInfo(data);
  const base = `You pay the first ${money(data.allPerilDeductible)} of any covered claim, and insurance handles the rest up to your limits.`;
  if (!wind) return base;
  const percentNote = wind.percent ? ` — about ${wind.percent}% of your dwelling limit` : '';
  return `${base} A separate ${money(wind.amount)} deductible${percentNote} applies to wind and hail damage, which is the most common storm claim in North Carolina.`;
};

const chevronSvg =
  '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

interface LedgerRow {
  letter: string;
  name: string;
  sub: string;
  limit: string;
  body: string;
  means: string;
}

const coverageRows = (data: HomeQuoteData): LedgerRow[] => {
  const c = data.coverages;
  const rebuildNote =
    data.dwellingLossSettlement === 'Replacement Cost'
      ? `your ${money(c.coverageA)} limit was set to rebuild your home at today's construction costs — if a storm tears your roof off, this is the coverage that rebuilds it.`
      : `your home is covered for ${money(c.coverageA)} on an actual cash value basis — ask us what that means for an older roof or siding before you bind.`;
  const contentsNote =
    data.personalPropertyLossSettlement === 'Replacement Cost'
      ? 'and they are covered at replacement cost — new for old, not garage-sale prices.'
      : 'settled at actual cash value — we can review replacement cost upgrades with you.';

  const rows: LedgerRow[] = [
    {
      letter: 'A',
      name: 'Dwelling',
      sub: 'The structure of your home',
      limit: limitLabel(c.coverageA),
      body: "Pays to repair or rebuild your home itself — walls, roof, foundation, and anything permanently attached — when it's damaged by a covered cause of loss like fire, wind, or hail.",
      means: rebuildNote,
    },
    {
      letter: 'B',
      name: 'Other Structures',
      sub: 'Detached garage, sheds, fences',
      limit: limitLabel(c.coverageB),
      body: "Covers structures on your property that aren't attached to the house — a detached garage, workshop, storage shed, or fencing.",
      means: `your detached buildings and fencing have their own ${money(c.coverageB)} limit, separate from the house.`,
    },
    {
      letter: 'C',
      name: 'Personal Property',
      sub: 'Furniture, clothes, electronics',
      limit: limitLabel(c.coverageC),
      body: "Covers your belongings — furniture, clothing, electronics, kitchenware — whether they're damaged at home or stolen while you're traveling.",
      means: `picture your house turned upside down — everything that falls out is covered up to ${money(c.coverageC)}, ${contentsNote}`,
    },
    {
      letter: 'D',
      name: 'Loss of Use',
      sub: "Living costs if you're displaced",
      limit: limitLabel(c.coverageD),
      body: 'If a covered loss makes your home unlivable, this pays the extra cost of living somewhere else — hotel, rental, additional meals — while repairs are made.',
      means: 'your family has a place to stay while we get your home rebuilt.',
    },
    {
      letter: 'E',
      name: 'Personal Liability',
      sub: 'Protects you from lawsuits',
      limit: limitLabel(c.coverageE),
      body: "Protects you and your household if you're legally responsible for injuring someone or damaging their property. It pays legal defense costs, judgments, and settlements up to your limit.",
      means: `if a guest is hurt on your property and sues, this ${money(c.coverageE)} coverage stands between the lawsuit and your savings.`,
    },
    {
      letter: 'F',
      name: 'Medical Payments',
      sub: 'Small medical claims for guests',
      limit: limitLabel(c.coverageF),
      body: 'Pays reasonable medical expenses for guests accidentally injured on your property, no matter who was at fault — no lawsuit needed.',
      means: 'a neighbor twists an ankle on your steps — their urgent-care bill gets handled quickly and quietly.',
    },
  ];

  data.endorsements.forEach((endorsement) => {
    rows.push({
      letter: '+',
      name: endorsement.name,
      sub: 'Added endorsement',
      limit: endorsement.amount || 'Included',
      body: endorsement.subLabel || 'An optional endorsement added to strengthen this policy.',
      means: 'this protection was added on top of the standard policy because it fits your home.',
    });
  });

  return rows;
};

const coverageRowsHtml = (data: HomeQuoteData) =>
  coverageRows(data)
    .map(
      (row) => `      <details class="cov">
        <summary aria-label="Coverage ${escapeHtml(row.letter)}, ${escapeHtml(row.name)}, limit ${escapeHtml(row.limit)}">
          <span class="letter">${escapeHtml(row.letter)}</span>
          <span class="cov-name"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.sub)}</span></span>
          <span class="cov-limit">${escapeHtml(row.limit)}</span>
          ${chevronSvg}
        </summary>
        <div class="cov-body">
          <p>${escapeHtml(row.body)}</p>
          <p class="means"><strong>What this means for you:</strong> ${escapeHtml(row.means)}</p>
        </div>
      </details>`,
    )
    .join('\n');

const discountsHtml = (data: HomeQuoteData) => {
  const discounts = data.discounts.length ? data.discounts : [{ label: 'Ask us which discounts your home qualifies for' }];
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
        <span class="eyebrow">45-Second Audio Review</span>
        <h3>Listen to your home quote in plain English</h3>
        <p>A friendly walkthrough of the coverages and payment choices on this page.</p>
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

const carriersComparedLabel = (data: HomeQuoteData) => {
  const count = data.carriersShoppedNames.length;
  return count >= 2 ? String(count) : 'multiple';
};

const quoteActionPremium = (data: HomeQuoteData) => `${money(data.annualPremium)}/yr`;

export const homeAudioReviewScript = (data: HomeQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  const monthly = data.annualPremium / 12;
  const wind = windDeductibleInfo(data);
  const savings = paidInFullSavings(data);
  const endorsements = data.endorsements.slice(0, 2).map((endorsement) => endorsement.name).join(' and ');
  const endorsementLine = endorsements ? `This quote also shows ${endorsements} as added coverage items.` : 'We can also review any optional endorsements that may fit the home.';

  return `Hi, this is Bill Layne Insurance. Thanks for letting us review your home insurance options. Here is the simple version. This ${carrier.displayName} quote shows an annual premium of ${money(data.annualPremium)}, which is about ${money(monthly, 2)} per month if you want a simple monthly estimate. Coverage A means the home itself is covered for ${money(data.coverages.coverageA)}. Other structures, like a shed, fence, or detached garage, are covered for ${money(data.coverages.coverageB)}. Personal property, meaning your furniture, clothes, electronics, and belongings, is ${money(data.coverages.coverageC)}. Loss of use is ${limitLabel(data.coverages.coverageD)}, liability is ${money(data.coverages.coverageE)}, and guest medical payments are ${money(data.coverages.coverageF)}. Your all other perils deductible is ${money(data.allPerilDeductible)}, and wind or hail is ${wind ? money(wind.amount) : 'not listed separately'}. For payment, you can use mortgage escrow, monthly EFT around ${money(monthly, 2)}, or pay in full${savings ? ` with ${money(savings)} in savings shown` : ''}. ${endorsementLine} Before anything is bound, we will verify the property details, coverage limits, deductibles, mortgage information, and payment choice. Tap Accept Quote or Contact Me when you are ready.`;
};

export function renderHomeWebPageHtml(data: HomeQuoteData, audioReview?: GeneratedAudioReview | null): RenderedHomeWebPage {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  const savings = paidInFullSavings(data);
  const monthly = data.annualPremium / 12;
  const title = `${data.clientFullName} — Home Quote Explained | Bill Layne Insurance`;

  const html = replaceTokens(masterTemplate, {
    AUDIO_SECTION_HTML: audioSectionHtml(audioReview),
    CARRIERS_COMPARED: escapeHtml(carriersComparedLabel(data)),
    CARRIER_LOGO_URL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CLIENT_CITY: escapeHtml(cityFromAddress(data.propertyAddress)),
    CLIENT_EMAIL: escapeHtml(data.clientEmail || ''),
    CLIENT_NAME: escapeHtml(data.clientFullName),
    COVERAGE_ROWS_HTML: coverageRowsHtml(data),
    DEDUCTIBLE_EXPLANATION: escapeHtml(deductibleExplanation(data)),
    DEDUCTIBLE_LINE: escapeHtml(deductibleLine(data)),
    DISCOUNTS_HTML: discountsHtml(data),
    EFFECTIVE_DATE: escapeHtml(formatDate(data.effectiveDate)),
    GOOGLE_RATING: escapeHtml(String(BRAND.googleRating)),
    HERO_IMAGE_URL: escapeHtml(normalizeHeroImageUrl(data.heroImageUrl, defaultHeroImageUrl)),
    MONTHLY_PREMIUM: escapeHtml(money(monthly, 2)),
    PREMIUM_PARAM: escapeHtml(quoteActionPremium(data)),
    PREPARED_DATE: escapeHtml(formatDate(data.quoteDate)),
    QUOTE_NUMBER: escapeHtml(data.quoteNumber),
    REVIEW_COUNT: escapeHtml(BRAND.googleReviewCount),
    SAVINGS_LINE: escapeHtml(savingsLine(savings)),
    TERM_PREMIUM: escapeHtml(money(data.annualPremium)),
    VALID_THROUGH: escapeHtml(formatDate(data.expiryDate)),
  });

  return { html, title };
}
