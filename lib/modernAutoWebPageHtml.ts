import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Vehicle } from '../types/auto';
import { normalizeHeroImageUrl } from './heroImage';
import type { GeneratedAudioReview } from './webAudioReview';
import masterTemplate from '../templates/web/MODERN_AUTO_QUOTE_TEMPLATE.html?raw';

export interface RenderedModernAutoWebPage {
  html: string;
  title: string;
}

const defaultAgentPhotoUrl = 'https://i.imgur.com/fqclJPIl.jpg';
const defaultHeroMobileUrl = 'https://i.imgur.com/hsgl3Kpl.jpg';
const defaultHeroDesktopUrl = 'https://i.imgur.com/hsgl3Kph.jpg';
const autoGeneralAudioUrl = 'https://quote-template-studio.pages.dev/audio/bill-layne-auto-insurance-general.mp3';
const autoAudioProfileImageUrl = 'https://i.imgur.com/h00mpPA.jpeg';
const agencyTextPhoneRaw = '3368279065';
const autoGeneralAudioScript =
  'This general audio guide explains the basic parts of auto insurance, including liability, uninsured motorist, comprehensive, collision, deductibles, and common payment choices. It is not a custom reading of the exact limits on this page, so the written quote below is still the source for the customer-specific details.';
const quoteStudioBaseUrl = BRAND.quoteActionUrl.replace(/\/quote-action$/, '');
const hostedCarrierLogoUrls: Partial<Record<AutoQuoteData['carrierId'], string>> = {
  progressive: `${quoteStudioBaseUrl}/carrier-logos/progressive.png`,
  nationwide: `${quoteStudioBaseUrl}/carrier-logos/nationwide.png`,
  national_general: `${quoteStudioBaseUrl}/carrier-logos/national-general.png`,
  travelers: `${quoteStudioBaseUrl}/carrier-logos/travelers.png`,
  alamance: `${quoteStudioBaseUrl}/carrier-logos/alamance.png`,
  ncgrange: `${quoteStudioBaseUrl}/carrier-logos/ncgrange.png`,
  foremost: `${quoteStudioBaseUrl}/carrier-logos/foremost.jpg`,
  hagerty: `${quoteStudioBaseUrl}/carrier-logos/hagerty.png`,
  ncjua: `${quoteStudioBaseUrl}/carrier-logos/ncjua.png`,
  dairyland: `${quoteStudioBaseUrl}/carrier-logos/dairyland.png`,
  steadily: `${quoteStudioBaseUrl}/carrier-logos/steadily.png`,
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

const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const cleanLimit = (value?: string | number | null) => String(value ?? '').trim() || 'Not listed';

const paymentCountLabel = (recurringCount: number) => `${recurringCount + 1} payments`;

const recurringCount = (data: AutoQuoteData) =>
  data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);

const recurringAmount = (data: AutoQuoteData) =>
  data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);

const downPayment = (data: AutoQuoteData) =>
  data.paymentOptions.eft.downPayment || recurringAmount(data);

const liabilityLabel = (data: AutoQuoteData) =>
  `${cleanLimit(data.coverages.bodilyInjuryLimit)} BI, ${cleanLimit(data.coverages.propertyDamageLimit)} PD`;

const coverageValue = (vehicle: Vehicle, pattern: RegExp, fallback: string) => {
  const match = vehicle.coverages?.find((coverage) => pattern.test(coverage.name));
  if (!match) return fallback;
  if (match.status === 'rejected' || /not included|rejected|declined/i.test(match.limitOrDeductible || '')) {
    return 'Not on this vehicle';
  }
  return match.limitOrDeductible || fallback;
};

const compValue = (data: AutoQuoteData, vehicle: Vehicle) => {
  const fallback = vehicle.coverageType === 'full_coverage' && data.coverages.comprehensiveDeductible
    ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible`
    : 'Not on this vehicle';
  return coverageValue(vehicle, /comprehensive|other than collision/i, fallback);
};

const collisionValue = (data: AutoQuoteData, vehicle: Vehicle) => {
  const fallback = vehicle.coverageType === 'full_coverage' && data.coverages.collisionDeductible
    ? `${money(data.coverages.collisionDeductible, 0)} deductible`
    : 'Not on this vehicle';
  return coverageValue(vehicle, /collision/i, fallback);
};

const rentalValue = (data: AutoQuoteData, vehicle: Vehicle) =>
  coverageValue(
    vehicle,
    /rental|transportation expense|loss of use/i,
    data.coverages.rentalReimbursement || 'Not on this vehicle',
  );

const towingValue = (data: AutoQuoteData, vehicle: Vehicle) =>
  coverageValue(
    vehicle,
    /towing|roadside|labor/i,
    data.coverages.towing || 'Not on this vehicle',
  );

const quoteActionHref = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: 'modern-auto',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(downPayment(data))} down`,
    subject: `${carrier.displayName} Auto Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

const scriptJson = (value: unknown) =>
  JSON.stringify(value, null, 4)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const replaceQuoteBlock = (html: string, quote: unknown) => {
  const startNeedle = '  var QUOTE = {';
  const endNeedle = '  /* ===================== END QUOTE BLOCK ===================== */';
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle);
  if (start === -1 || end === -1 || end <= start) return html;
  return `${html.slice(0, start)}  var QUOTE = ${scriptJson(quote)};\n${html.slice(end)}`;
};

const audioCss = `    /* ===== AUDIO REVIEW ===== */
    .audio-review{margin-top:18px}
    .audio-card{display:flex;gap:14px;align-items:flex-start;background:rgba(22,32,51,.78);border:1px solid rgba(70,215,255,.18);border-radius:20px;padding:16px;box-shadow:var(--shadow-card)}
    .audio-profile{width:58px;height:58px;border-radius:50%;object-fit:cover;border:2px solid rgba(243,190,75,.65);flex:0 0 auto}
    .audio-body{flex:1 1 auto;min-width:0}
    .audio-body h3{font-size:18px;margin:2px 0 5px}
    .audio-body p{color:var(--color-text-muted);font-size:13.5px;line-height:1.45;margin-bottom:10px}
    .audio-body audio{width:100%;height:38px;display:block}
    .audio-body details{margin-top:10px;color:var(--color-text-muted);font-size:12.5px}
    .audio-body summary{cursor:pointer;color:#dce8f6;font-weight:800}`;

const audioSectionHtml = (audioReview?: GeneratedAudioReview | null) => {
  const isCustomReview = Boolean(audioReview?.audioDataUrl);
  const audioSrc = audioReview?.audioDataUrl || autoGeneralAudioUrl;
  const mimeType = audioReview?.mimeType || 'audio/mpeg';
  const script = audioReview?.script || autoGeneralAudioScript;

  return `    <!-- AUDIO REVIEW -->
    <section class="audio-review" id="audio">
      <div class="audio-card">
        <img class="audio-profile" src="${escapeHtml(autoAudioProfileImageUrl)}" alt="Bill Layne Insurance audio guide" width="58" height="58" loading="lazy" decoding="async" />
        <div class="audio-body">
          <span class="eyebrow">${isCustomReview ? 'Audio Review' : 'General Auto Coverage Guide'}</span>
          <h3>${isCustomReview ? 'Listen to this quote in plain English.' : 'Learn what auto insurance covers.'}</h3>
          <p>${isCustomReview ? 'A friendly walkthrough of the drivers, vehicles, and coverage choices on this page.' : 'A short general guide to liability, uninsured motorist, comprehensive, collision, deductibles, and common payment choices.'}</p>
          <audio controls preload="metadata">
            <source src="${escapeHtml(audioSrc)}" type="${escapeHtml(mimeType)}" />
            Your browser does not support audio playback.
          </audio>
          <details>
            <summary>${isCustomReview ? 'Read the short script' : 'What this audio explains'}</summary>
            <p>${escapeHtml(script)}</p>
          </details>
        </div>
      </div>
    </section>`;
};

const injectAudio = (html: string, audioReview?: GeneratedAudioReview | null) => {
  const withCss = html.includes('/* ===== AUDIO REVIEW ===== */')
    ? html
    : html.replace('    /* ===== TRUST BAR ===== */', `${audioCss}\n\n    /* ===== TRUST BAR ===== */`);

  return withCss.replace(
    /    <\/section>\r?\n\r?\n    <!-- TRUST BAR -->/,
    `    </section>\n\n${audioSectionHtml(audioReview)}\n\n    <!-- TRUST BAR -->`,
  );
};

const buildQuoteObject = (data: AutoQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const down = downPayment(data);
  const recurring = recurringAmount(data);
  const count = recurringCount(data);
  const paidInFull = data.paymentOptions.paidInFull.total || data.totalPremium;
  const cardRecurring = recurring;
  const clientGreeting = data.clientFirstName?.trim() || data.clientFullName;

  return {
    greeting: `${clientGreeting},`,
    carrier: carrier.displayName,
    carrierLogo: hostedCarrierLogoUrls[data.carrierId] || carrier.logoUrl || '',
    effectiveDate: formatDate(data.effectiveDate),
    plans: [
      {
        id: 'eft',
        name: paymentCountLabel(count),
        meta: 'Bank draft',
        tag: 'Best value',
        gold: true,
        big: money(down),
        cap: 'Due today, then monthly',
        line: `Then ${count} monthly payment${count === 1 ? '' : 's'} of ${money(recurring)}.`,
        total: `${data.termMonths}-month total: ${money(data.totalPremium)}`,
        note: 'Automatic bank draft - set it and forget it.',
      },
      {
        id: 'full',
        name: 'Paid in full',
        meta: 'One payment',
        tag: 'Lowest total',
        gold: false,
        big: money(paidInFull),
        cap: 'Paid in full - one and done',
        line: data.paymentOptions.paidInFull.savings
          ? `A single payment with ${money(data.paymentOptions.paidInFull.savings)} in savings already applied.`
          : 'A single payment with no future monthly bills this term.',
        total: `${data.termMonths}-month total: ${money(paidInFull)}${data.paymentOptions.paidInFull.savings ? ' - your lowest total' : ''}`,
        note: 'No monthly bills to think about.',
      },
      {
        id: 'card',
        name: paymentCountLabel(count),
        meta: 'Debit / credit',
        tag: '',
        gold: false,
        big: money(down),
        cap: 'Due today, then monthly',
        line: `Then ${count} monthly payment${count === 1 ? '' : 's'} of ${money(cardRecurring)}.`,
        total: null,
        note: 'Ask us to confirm exact card billing and carrier fees before issue.',
      },
    ],
    drivers: data.drivers.length ? data.drivers.map((driver) => driver.name) : [data.clientFullName],
    vehicles: data.vehicles.map((vehicle) => ({
      name: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' '),
      liability: liabilityLabel(data),
      comp: compValue(data, vehicle),
      collision: collisionValue(data, vehicle),
      rental: rentalValue(data, vehicle),
      towing: towingValue(data, vehicle),
      premium: vehicle.vehiclePremium ? money(vehicle.vehiclePremium) : 'Included in total',
    })),
    discounts: data.discounts.length
      ? data.discounts.map((discount) => discount.label)
      : ['Discounts reviewed', 'Carrier fit reviewed', 'Payment plan reviewed'],
    agent: {
      photo: defaultAgentPhotoUrl,
      photoAlt: 'Bill Layne with insurance clients',
      note: "When you call us, a real person answers - usually me or someone on my team right here in Elkin. We've helped North Carolina families protect what matters since 2005, across all 100 counties. No phone trees, no chatbots, no pressure. Just honest advice and a price you can actually understand. When you have a claim, we're the ones in your corner.",
      signature: '- Bill Layne',
    },
    ratingNumber: String(BRAND.googleRating),
    ratingMeta: `Based on ${BRAND.googleReviewCount} local Google reviews of Bill Layne Insurance Agency`,
    reviews: [
      { title: 'Fast and friendly', body: 'Customers mention quick responses, easy switching, and saving money without the hassle.' },
      { title: 'Explains everything clearly', body: "We turn the insurance fine print into plain English so you always know what you're buying." },
      { title: 'There when it counts', body: 'From the first quote to a claim years later, you get a local team that actually picks up the phone.' },
    ],
    links: {
      tel: `tel:1${BRAND.phoneRaw}`,
      sms: `sms:${agencyTextPhoneRaw}?body=${encodeURIComponent("Hi, I reviewed my auto quote and I'm ready to start.")}`,
      start: quoteActionHref(data),
    },
  };
};

export function renderModernAutoWebPageHtml(
  data: AutoQuoteData,
  audioReview?: GeneratedAudioReview | null,
): RenderedModernAutoWebPage {
  const title = `${data.clientFullName} Modern Auto Quote | Bill Layne Insurance`;
  const customHero = normalizeHeroImageUrl(data.heroImageUrl, '');
  let html = masterTemplate;

  html = html.replace('<title>Your 2026 Auto Quote | Bill Layne Insurance</title>', `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    '<meta name="description" content="Your real auto quote, priced and ready. See your payment, what\'s covered, and start coverage today with a local North Carolina agent." />',
    `<meta name="description" content="${escapeHtml(`${data.clientFullName}'s auto quote from Bill Layne Insurance.`)}" />`,
  );

  if (customHero) {
    html = html.split(defaultHeroMobileUrl).join(customHero);
    html = html.split(defaultHeroDesktopUrl).join(customHero);
  }

  html = html
    .replace('href="#" target="_blank" aria-label="Facebook"', `href="${escapeHtml(BRAND.facebook)}" target="_blank" aria-label="Facebook"`)
    .replace('href="#" target="_blank" aria-label="Instagram"', `href="${escapeHtml(BRAND.instagram)}" target="_blank" aria-label="Instagram"`);

  html = replaceQuoteBlock(html, buildQuoteObject(data));
  html = injectAudio(html, audioReview);

  return { html, title };
}
