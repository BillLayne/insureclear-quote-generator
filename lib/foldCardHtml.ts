import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Vehicle } from '../types/auto';
import type { HomeQuoteData } from '../types/home';

const STUDIO_ORIGIN = 'https://quote-template-studio.pages.dev';
const AGENCY_QR_FALLBACK = 'https://insurance-card-generator-2026-color-edition.pages.dev/agency-contact';
const DEFAULT_PRODUCT_STRIP = 'Home | Renters | Motorcycle | Boat | RV | Umbrella | Life';
const DEFAULT_AGENT_IMAGE = `${STUDIO_ORIGIN}/fold-card/auto-quote-agent-review.png`;
const DEFAULT_AGENCY_LOGO = `${STUDIO_ORIGIN}/fold-card/agency-logo.png`;
const DEFAULT_AUTO_COVER = `${STUDIO_ORIGIN}/fold-card/auto-quote-cover.png`;
const DEFAULT_HOME_COVER = `${STUDIO_ORIGIN}/home-elite-webpage/home-hero-sample.jpg`;

interface RenderedFoldCard {
  html: string;
  title: string;
  preheader: string;
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value?: number, fallback = '$0.00') => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const compactMoney = (value?: number) => money(value).replace('.00', '');

const dateText = (value?: string) => {
  if (!value) return 'Review';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const qrUrl = (target?: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(target || AGENCY_QR_FALLBACK)}`;

const carrierLogo = (carrierId: keyof typeof CARRIERS) => CARRIERS[carrierId]?.logoUrl || DEFAULT_AGENCY_LOGO;

const carrierName = (carrierId: keyof typeof CARRIERS) => CARRIERS[carrierId]?.displayName || String(carrierId);

const activeVehicles = (vehicles: Vehicle[]) =>
  vehicles.filter((vehicle) => [vehicle.year, vehicle.make, vehicle.model, vehicle.vinLast8].some(Boolean)).slice(0, 5);

const vehicleName = (vehicle: Vehicle) =>
  [vehicle.year || '', vehicle.make || '', vehicle.model || ''].filter(Boolean).join(' ') || 'Vehicle';

const listItems = (items: string[]) =>
  items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('');

const baseStyles = `
  <style>
    :root {
      --navy: #063663;
      --deep: #061f3f;
      --blue: #eaf3ff;
      --green: #0f7a54;
      --gold: #ffc300;
      --ink: #12213a;
      --muted: #627084;
      --line: #d8e0ec;
      --paper: #ffffff;
    }
    * { box-sizing: border-box; }
    html { background: #d8e4f5; }
    body {
      margin: 0;
      color: var(--ink);
      background: #d8e4f5;
      font-family: Inter, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 18px;
      color: #fff;
      background: #0b2347;
      box-shadow: 0 10px 30px rgba(7, 20, 44, 0.22);
    }
    .print-toolbar h1 { margin: 0; font-size: 15px; line-height: 1.1; }
    .print-toolbar p { margin: 3px 0 0; color: rgba(255,255,255,.78); font-size: 12px; font-weight: 700; }
    .print-toolbar button {
      min-height: 36px;
      border: 0;
      border-radius: 8px;
      padding: 0 14px;
      color: #061f3f;
      background: var(--gold);
      font: 900 12px/1 Inter, Arial, sans-serif;
      cursor: pointer;
    }
    .sheet-wrap { padding: 18px; }
    .sheet {
      position: relative;
      width: 11in;
      height: 8.5in;
      margin: 0 auto 26px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
      background: var(--paper);
      border: 1px solid rgba(7,20,44,.16);
      box-shadow: 0 18px 55px rgba(7,20,44,.16);
    }
    .sheet::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      border-left: 1px dashed rgba(7,20,44,.25);
      pointer-events: none;
    }
    .panel {
      position: relative;
      min-width: 0;
      height: 100%;
      padding: .36in;
      overflow: hidden;
    }
    .back-panel {
      color: #fff;
      background: linear-gradient(145deg, #061f3f 0%, #083866 64%, #0f7a54 100%);
    }
    .back-panel::before {
      content: "";
      position: absolute;
      inset: auto -1.1in -1.35in auto;
      width: 3.2in;
      height: 3.2in;
      border-radius: 50%;
      background: rgba(255,195,0,.18);
    }
    .brand-row { display: flex; align-items: center; gap: .16in; position: relative; z-index: 1; }
    .agency-logo { width: 1.04in; height: .74in; object-fit: contain; padding: .07in; background: #fff; border-radius: .08in; }
    .carrier-logo { width: 1.36in; max-height: .58in; object-fit: contain; padding: .06in .08in; background: #fff; border-radius: .08in; }
    .tiny-kicker { margin: 0; color: rgba(255,255,255,.72); font-size: .105in; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .back-panel h2 { margin: .18in 0 .08in; max-width: 4in; font-size: .34in; line-height: .96; letter-spacing: 0; }
    .back-copy { margin: 0 0 .2in; max-width: 4in; color: rgba(255,255,255,.84); font-size: .138in; line-height: 1.35; font-weight: 700; }
    .contact-grid { display: grid; gap: .1in; margin-top: .18in; position: relative; z-index: 1; }
    .contact-card { padding: .13in; border: 1px solid rgba(255,255,255,.18); border-radius: .08in; background: rgba(255,255,255,.11); }
    .contact-card span { display: block; color: rgba(255,255,255,.72); font-size: .095in; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .contact-card strong { display: block; margin-top: .03in; color: #fff; font-size: .145in; line-height: 1.2; }
    .fine-print { position: absolute; left: .36in; right: .36in; bottom: .3in; color: rgba(255,255,255,.64); font-size: .078in; line-height: 1.35; }
    .cover-panel {
      padding: 0;
      background: #eef6ff;
    }
    .cover-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .cover-shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,.05) 0%, rgba(255,255,255,.02) 46%, rgba(255,255,255,.84) 72%, #fff 100%);
    }
    .cover-title {
      position: absolute;
      left: .34in;
      right: .34in;
      top: .32in;
      color: #063663;
      text-shadow: 0 1px 18px rgba(255,255,255,.76);
    }
    .cover-title h1 { margin: .08in 0 0; max-width: 3.85in; font-size: .38in; line-height: .94; letter-spacing: 0; }
    .cover-title p { margin: .08in 0 0; max-width: 3.35in; color: #173d69; font-size: .125in; line-height: 1.3; font-weight: 800; }
    .cover-summary {
      position: absolute;
      left: .32in;
      right: .32in;
      bottom: .28in;
      display: grid;
      grid-template-columns: 1fr .95in;
      gap: .13in;
      align-items: end;
      color: var(--ink);
    }
    .summary-card { padding: .16in; border-radius: .1in; background: rgba(255,255,255,.94); border: 1px solid rgba(8,39,78,.12); box-shadow: 0 .08in .28in rgba(8,39,78,.14); }
    .quote-line { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .08in; margin-bottom: .1in; }
    .stat span { display: block; color: var(--muted); font-size: .085in; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
    .stat strong { display: block; margin-top: .02in; color: var(--deep); font-size: .15in; line-height: 1.12; }
    .price-row { display: grid; grid-template-columns: 1.1fr .9fr; gap: .08in; padding-top: .1in; border-top: 1px solid #e6edf6; }
    .price-row .big strong { font-size: .22in; color: var(--green); }
    .qr-card { display: grid; place-items: center; gap: .05in; padding: .08in; border-radius: .08in; background: #fff; border: 1px solid #d8e0ec; }
    .qr-card img { width: .78in; height: .78in; }
    .qr-card span { color: var(--muted); font-size: .075in; font-weight: 900; text-align: center; line-height: 1.1; }
    .inside-left { background: #fff; }
    .inside-right { background: #f7fbff; }
    .section-title { margin: 0 0 .1in; color: var(--deep); font-size: .18in; line-height: 1; }
    .section-copy { margin: 0 0 .12in; color: var(--muted); font-size: .095in; line-height: 1.35; font-weight: 700; }
    .mini-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .09in; }
    .info-box { padding: .1in; border: 1px solid var(--line); border-radius: .08in; background: #fff; }
    .info-box span { display: block; color: var(--muted); font-size: .078in; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
    .info-box strong { display: block; margin-top: .025in; color: var(--deep); font-size: .12in; line-height: 1.18; }
    .alert-box { margin: .12in 0; padding: .11in .13in; border-radius: .08in; background: #fff8d6; border: 1px solid #f2dd86; color: #6b4e00; font-size: .1in; line-height: 1.32; font-weight: 800; }
    .driver-list, .discount-list { margin: .1in 0 0; padding-left: .16in; color: var(--ink); font-size: .095in; line-height: 1.35; font-weight: 750; }
    .ledger { width: 100%; border-collapse: collapse; margin-top: .1in; background: #fff; border: 1px solid var(--line); border-radius: .08in; overflow: hidden; }
    .ledger th { padding: .065in .06in; color: #fff; background: var(--deep); font-size: .075in; text-transform: uppercase; letter-spacing: .05em; text-align: left; }
    .ledger td { padding: .065in .06in; border-top: 1px solid #e7edf5; font-size: .085in; line-height: 1.2; vertical-align: top; }
    .ledger strong { color: var(--deep); }
    .agent-block { position: absolute; left: .36in; right: .36in; bottom: .34in; display: grid; grid-template-columns: 1.25in 1fr; gap: .13in; align-items: end; }
    .agent-block img { width: 1.25in; height: 1.55in; object-fit: cover; border-radius: .08in; border: .035in solid #fff; box-shadow: 0 .08in .22in rgba(7,20,44,.2); }
    .agent-note { padding: .12in; background: #fff; border: 1px solid var(--line); border-radius: .08in; }
    .agent-note h3 { margin: 0 0 .04in; color: var(--deep); font-size: .14in; }
    .agent-note p { margin: 0; color: var(--muted); font-size: .09in; line-height: 1.3; font-weight: 700; }
    .product-strip { margin-top: .08in; padding-top: .07in; border-top: 1px solid #e4eaf2; color: var(--green); font-size: .078in; line-height: 1.25; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    .home-cover .cover-title h1 { color: #102d23; }
    .home-cover .cover-title p { color: #21483a; }
    .home-cover .cover-shade { background: linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.05) 42%, rgba(255,255,255,.86) 72%, #fff 100%); }
    @page { size: letter landscape; margin: 0; }
    @media print {
      html, body { width: 11in; background: #fff; }
      .print-toolbar { display: none; }
      .sheet-wrap { padding: 0; }
      .sheet { margin: 0; border: 0; box-shadow: none; page-break-after: always; break-after: page; }
      .sheet:last-child { page-break-after: auto; break-after: auto; }
      .sheet::after { border-left-color: rgba(0,0,0,.18); }
    }
  </style>
`;

const shell = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  ${baseStyles}
</head>
<body>
  <div class="print-toolbar">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p>Letter landscape - duplex short edge - fold down the center</p>
    </div>
    <button onclick="window.print()">Print Fold Card</button>
  </div>
  <div class="sheet-wrap">${body}</div>
</body>
</html>`;

const backPanel = (variant: 'auto' | 'home', carrierId: keyof typeof CARRIERS, companyName?: string) => `
  <section class="panel back-panel">
    <div class="brand-row">
      <img class="agency-logo" src="${DEFAULT_AGENCY_LOGO}" alt="Bill Layne Insurance Agency">
      <div>
        <p class="tiny-kicker">Independent quote review</p>
        <h2>${variant === 'home' ? 'A clearer way to review your home quote.' : 'Your auto quote, folded into plain English.'}</h2>
      </div>
    </div>
    <p class="back-copy">${escapeHtml(companyName || 'Bill Layne Insurance Agency')} prepared this card so you can compare the quote, payment plan, and important coverage notes before you start the policy.</p>
    <div class="contact-grid">
      <div class="contact-card"><span>Call or text</span><strong>336-835-1993</strong></div>
      <div class="contact-card"><span>Visit</span><strong>1283 N Bridge St, Elkin, NC 28621</strong></div>
      <div class="contact-card"><span>Agency</span><strong>Bill Layne Insurance Agency</strong></div>
      <div class="contact-card"><span>Carrier quoted</span><strong>${escapeHtml(carrierName(carrierId))}</strong></div>
    </div>
    <p class="fine-print">Quote summary only. This card is not a binder, policy, ID card, or proof of insurance. Final eligibility, underwriting, payment terms, and issued coverage are controlled by the carrier and policy documents.</p>
  </section>`;

const coverPanel = ({
  variant,
  data,
  title,
  subtitle,
  totalLabel,
  totalAmount,
  downPayment,
  coverImage,
  qrTarget,
}: {
  variant: 'auto' | 'home';
  data: AutoQuoteData | HomeQuoteData;
  title: string;
  subtitle: string;
  totalLabel: string;
  totalAmount: number;
  downPayment?: number;
  coverImage: string;
  qrTarget?: string;
}) => `
  <section class="panel cover-panel ${variant === 'home' ? 'home-cover' : ''}">
    <img class="cover-image" src="${escapeHtml(coverImage)}" alt="">
    <div class="cover-shade"></div>
    <div class="cover-title">
      <img class="carrier-logo" src="${escapeHtml(carrierLogo(data.carrierId))}" alt="${escapeHtml(carrierName(data.carrierId))}">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </div>
    <div class="cover-summary">
      <div class="summary-card">
        <div class="quote-line">
          <div class="stat"><span>Quote #</span><strong>${escapeHtml(data.quoteNumber || 'Review')}</strong></div>
          <div class="stat"><span>Effective</span><strong>${escapeHtml(dateText(data.effectiveDate))}</strong></div>
        </div>
        <div class="price-row">
          <div class="stat big"><span>${escapeHtml(totalLabel)}</span><strong>${escapeHtml(money(totalAmount))}</strong></div>
          <div class="stat"><span>${downPayment ? 'Down payment' : 'Quote date'}</span><strong>${escapeHtml(downPayment ? money(downPayment) : dateText(data.quoteDate))}</strong></div>
        </div>
      </div>
      <div class="qr-card">
        <img src="${qrUrl(qrTarget || data.digitalCardUrl)}" alt="Quote QR code">
        <span>Scan for contact or quote link</span>
      </div>
    </div>
  </section>`;

export function renderAutoFoldCardHtml(data: AutoQuoteData): RenderedFoldCard {
  const carrier = carrierName(data.carrierId);
  const fold = data.foldCard || {};
  const vehicles = activeVehicles(data.vehicles);
  const vehicleRows = vehicles.map((vehicle) => {
    const coverage = vehicle.coverages?.slice(0, 3).map((item) => `${item.name}: ${item.limitOrDeductible}`).join('<br>') || (vehicle.coverageType === 'full_coverage' ? 'Full coverage selected' : 'Liability only');
    return `<tr>
      <td><strong>${escapeHtml(vehicleName(vehicle))}</strong><br>VIN: ${escapeHtml(vehicle.vinLast8 || 'Review')}</td>
      <td>${escapeHtml(vehicle.coverageType === 'full_coverage' ? 'Full Coverage' : 'Liability Only')}</td>
      <td>${coverage}</td>
      <td>${escapeHtml(compactMoney(vehicle.vehiclePremium))}</td>
    </tr>`;
  }).join('');
  const paymentSchedule = fold.paymentSchedule || `${money(data.paymentOptions.eft.downPayment)} down, then ${data.paymentOptions.eft.recurringCount} payments of ${money(data.paymentOptions.eft.recurringAmount)}`;
  const coverageAlert = fold.coverageAlert || 'Review all listed drivers, VINs, deductibles, and liability limits before starting the policy.';
  const productStrip = fold.productStrip || DEFAULT_PRODUCT_STRIP;
  const title = `${data.clientFullName} - Auto Quote Fold Card`;
  const body = `
    <article class="sheet outside-sheet">
      ${backPanel('auto', data.carrierId, fold.companyName)}
      ${coverPanel({
        variant: 'auto',
        data,
        title: `${carrier} auto quote for ${data.clientFirstName || data.clientFullName}`,
        subtitle: 'A print-ready quote card with payment, drivers, vehicles, and coverage details.',
        totalLabel: `${data.termMonths || 6}-month total`,
        totalAmount: data.totalPremium,
        downPayment: data.paymentOptions.eft.downPayment,
        coverImage: data.heroImageUrl || DEFAULT_AUTO_COVER,
        qrTarget: fold.qrLink,
      })}
    </article>
    <article class="sheet inside-sheet">
      <section class="panel inside-left">
        <h2 class="section-title">Quote details</h2>
        <p class="section-copy">Review these fields against the carrier PDF before printing or presenting the fold card.</p>
        <div class="mini-grid">
          <div class="info-box"><span>Customer</span><strong>${escapeHtml(data.clientFullName)}</strong></div>
          <div class="info-box"><span>Address</span><strong>${escapeHtml(fold.customerAddress || 'Review / add address')}</strong></div>
          <div class="info-box"><span>Carrier</span><strong>${escapeHtml(carrier)}</strong></div>
          <div class="info-box"><span>Prior carrier</span><strong>${escapeHtml(fold.priorCarrier || 'Not shown')}</strong></div>
          <div class="info-box"><span>Quote date</span><strong>${escapeHtml(dateText(data.quoteDate))}</strong></div>
          <div class="info-box"><span>Expires</span><strong>${escapeHtml(dateText(data.expiryDate))}</strong></div>
          <div class="info-box"><span>Setup charge</span><strong>${escapeHtml(fold.setupCharge ? money(fold.setupCharge) : 'Review')}</strong></div>
          <div class="info-box"><span>Payment schedule</span><strong>${escapeHtml(paymentSchedule)}</strong></div>
        </div>
        <div class="alert-box">${escapeHtml(coverageAlert)}</div>
        <h2 class="section-title">Drivers</h2>
        <ul class="driver-list">
          ${listItems(data.drivers.map((driver) => `${driver.name || 'Driver'} - ${driver.relationship || 'driver'}${driver.age ? `, age ${driver.age}` : ''}`))}
        </ul>
        <h2 class="section-title" style="margin-top:.16in;">Shared limits</h2>
        <div class="mini-grid">
          <div class="info-box"><span>Bodily injury</span><strong>${escapeHtml(data.coverages.bodilyInjuryLimit || 'Review')}</strong></div>
          <div class="info-box"><span>Property damage</span><strong>${escapeHtml(data.coverages.propertyDamageLimit || 'Review')}</strong></div>
          <div class="info-box"><span>UM/UIM</span><strong>${escapeHtml([data.coverages.uninsuredMotoristLimit, data.coverages.underinsuredMotoristLimit].filter(Boolean).join(' / ') || 'Review')}</strong></div>
          <div class="info-box"><span>Med pay</span><strong>${escapeHtml(data.coverages.medicalPayments ? money(data.coverages.medicalPayments, '$0') : 'Review')}</strong></div>
        </div>
      </section>
      <section class="panel inside-right">
        <h2 class="section-title">Vehicle coverage ledger</h2>
        <p class="section-copy">Blank vehicle rows do not print. Add or edit vehicles in the Studio field boxes before downloading.</p>
        <table class="ledger">
          <thead><tr><th>Vehicle</th><th>Type</th><th>Coverage notes</th><th>Premium</th></tr></thead>
          <tbody>${vehicleRows || '<tr><td colspan="4">Add vehicle details before printing.</td></tr>'}</tbody>
        </table>
        <h2 class="section-title" style="margin-top:.16in;">Discounts shown</h2>
        <ul class="discount-list">
          ${listItems(data.discounts.map((discount) => discount.label)).trim() || '<li>Confirm discounts shown on PDF</li>'}
        </ul>
        <div class="agent-block">
          <img src="${escapeHtml(fold.agentImageUrl || DEFAULT_AGENT_IMAGE)}" alt="Agent reviewing quote with customer">
          <div class="agent-note">
            <h3>Questions before you start?</h3>
            <p>We can review payment timing, driver assignments, vehicle coverages, discounts, and any carrier requirements before you bind coverage.</p>
            <div class="product-strip">Also ask us about: ${escapeHtml(productStrip)}</div>
          </div>
        </div>
      </section>
    </article>`;

  return {
    html: shell(title, body),
    title,
    preheader: `${carrier} auto fold-card brochure for ${data.clientFullName}`,
  };
}

export function renderHomeFoldCardHtml(data: HomeQuoteData): RenderedFoldCard {
  const carrier = carrierName(data.carrierId);
  const fold = data.foldCard || {};
  const productStrip = fold.productStrip || DEFAULT_PRODUCT_STRIP;
  const coverageD = typeof data.coverages.coverageD === 'number' ? money(data.coverages.coverageD) : data.coverages.coverageD;
  const coverageAlert = fold.coverageAlert || 'Review replacement cost, deductibles, roof details, endorsements, and any inspection or binding requirements before starting the policy.';
  const paymentSchedule = fold.paymentSchedule || `Annual premium ${money(data.annualPremium)}${data.fees?.length ? ` including ${data.fees.length} fee line(s)` : ''}`;
  const title = `${data.clientFullName} - Home Quote Fold Card`;
  const body = `
    <article class="sheet outside-sheet">
      ${backPanel('home', data.carrierId, fold.companyName)}
      ${coverPanel({
        variant: 'home',
        data,
        title: `${carrier} home quote for ${data.clientFirstName || data.clientFullName}`,
        subtitle: 'A print-ready quote card with premium, deductibles, property details, and coverage limits.',
        totalLabel: 'Annual premium',
        totalAmount: data.annualPremium,
        coverImage: data.heroImageUrl || DEFAULT_HOME_COVER,
        qrTarget: fold.qrLink,
      })}
    </article>
    <article class="sheet inside-sheet">
      <section class="panel inside-left">
        <h2 class="section-title">Home quote details</h2>
        <p class="section-copy">Review these fields against the carrier PDF before printing or presenting the fold card.</p>
        <div class="mini-grid">
          <div class="info-box"><span>Customer</span><strong>${escapeHtml(data.clientFullName)}</strong></div>
          <div class="info-box"><span>Property</span><strong>${escapeHtml(fold.customerAddress || data.propertyAddress || 'Review address')}</strong></div>
          <div class="info-box"><span>Carrier</span><strong>${escapeHtml(carrier)}</strong></div>
          <div class="info-box"><span>Policy form</span><strong>${escapeHtml(data.policyType || 'Review')}</strong></div>
          <div class="info-box"><span>Effective</span><strong>${escapeHtml(dateText(data.effectiveDate))}</strong></div>
          <div class="info-box"><span>Expires</span><strong>${escapeHtml(dateText(data.expiryDate))}</strong></div>
          <div class="info-box"><span>All peril ded.</span><strong>${escapeHtml(money(data.allPerilDeductible))}</strong></div>
          <div class="info-box"><span>Wind/Hail ded.</span><strong>${escapeHtml(data.windHailDeductible ? money(data.windHailDeductible) : 'Review')}</strong></div>
        </div>
        <div class="alert-box">${escapeHtml(coverageAlert)}</div>
        <h2 class="section-title">Property snapshot</h2>
        <div class="mini-grid">
          <div class="info-box"><span>Year built</span><strong>${escapeHtml(data.yearBuilt || 'Review')}</strong></div>
          <div class="info-box"><span>Square feet</span><strong>${escapeHtml(data.squareFeet ? data.squareFeet.toLocaleString() : 'Review')}</strong></div>
          <div class="info-box"><span>Construction</span><strong>${escapeHtml(data.constructionType || 'Review')}</strong></div>
          <div class="info-box"><span>Roof</span><strong>${escapeHtml([data.roofMaterial, data.roofYear].filter(Boolean).join(' - ') || 'Review')}</strong></div>
          <div class="info-box"><span>Protection class</span><strong>${escapeHtml(data.protectionClass || 'Review')}</strong></div>
          <div class="info-box"><span>Fire distance</span><strong>${escapeHtml(data.fireDistance || 'Review')}</strong></div>
        </div>
      </section>
      <section class="panel inside-right">
        <h2 class="section-title">Coverage ledger</h2>
        <p class="section-copy">Coverage values are generated from the parsed PDF and can be corrected in the field boxes.</p>
        <table class="ledger">
          <thead><tr><th>Coverage</th><th>Limit</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td><strong>A - Dwelling</strong></td><td>${escapeHtml(money(data.coverages.coverageA))}</td><td>${escapeHtml(data.dwellingLossSettlement)}</td></tr>
            <tr><td><strong>B - Other Structures</strong></td><td>${escapeHtml(money(data.coverages.coverageB))}</td><td>Review percentage and detached structures</td></tr>
            <tr><td><strong>C - Personal Property</strong></td><td>${escapeHtml(money(data.coverages.coverageC))}</td><td>${escapeHtml(data.personalPropertyLossSettlement)}</td></tr>
            <tr><td><strong>D - Loss of Use</strong></td><td>${escapeHtml(coverageD)}</td><td>Confirm carrier wording</td></tr>
            <tr><td><strong>E - Liability</strong></td><td>${escapeHtml(money(data.coverages.coverageE))}</td><td>Personal liability</td></tr>
            <tr><td><strong>F - Med Pay</strong></td><td>${escapeHtml(money(data.coverages.coverageF))}</td><td>Medical payments to others</td></tr>
          </tbody>
        </table>
        <h2 class="section-title" style="margin-top:.16in;">Endorsements and discounts</h2>
        <ul class="discount-list">
          ${listItems([...data.endorsements.map((item) => `${item.name}: ${item.amount || item.subLabel}`), ...data.discounts.map((discount) => discount.label)]).trim() || '<li>Confirm endorsements and discounts shown on PDF</li>'}
        </ul>
        <div class="agent-block">
          <img src="${escapeHtml(fold.agentImageUrl || DEFAULT_AGENT_IMAGE)}" alt="Agent reviewing quote with customer">
          <div class="agent-note">
            <h3>Ready for a quick review?</h3>
            <p>We can compare the deductible choices, roof details, settlement terms, endorsements, and carrier requirements before you start the policy.</p>
            <div class="product-strip">Also ask us about: ${escapeHtml(productStrip)}</div>
          </div>
        </div>
      </section>
    </article>`;

  return {
    html: shell(title, body),
    title,
    preheader: `${carrier} home fold-card brochure for ${data.clientFullName}`,
  };
}
