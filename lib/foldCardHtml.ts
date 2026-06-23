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

const escapeAttr = (value: unknown) => escapeHtml(value);

const cssUrl = (value: string) => `url("${String(value).replace(/"/g, '%22')}")`;

const localCarrierLogo = (carrierId: keyof typeof CARRIERS) => {
  const logos: Partial<Record<keyof typeof CARRIERS, string>> = {
    progressive: `${STUDIO_ORIGIN}/carrier-logos/progressive.png`,
    nationwide: `${STUDIO_ORIGIN}/carrier-logos/nationwide.png`,
    national_general: `${STUDIO_ORIGIN}/carrier-logos/national-general.png`,
    travelers: `${STUDIO_ORIGIN}/carrier-logos/travelers.png`,
  };
  return logos[carrierId] || carrierLogo(carrierId);
};

const autoCarrierTheme = (carrierId: keyof typeof CARRIERS) => {
  const themes: Partial<Record<keyof typeof CARRIERS, { nav: string; green: string; companyDefault: string; help: Array<[string, string]> }>> = {
    national_general: {
      nav: '#003366',
      green: '#0f7a54',
      companyDefault: 'Integon Preferred Insurance Company / National General',
      help: [['Claims', '1-800-468-3466'], ['Auto Service', '1-888-293-5108'], ['MyPolicy', 'mynatgenpolicy.com']],
    },
    nationwide: {
      nav: '#0b4ea2',
      green: '#1f7a53',
      companyDefault: 'Nationwide',
      help: [['Claims', '1-800-421-3535'], ['Service / Billing', '1-877-669-6877'], ['Website', 'nationwide.com']],
    },
    progressive: {
      nav: '#0b5ca7',
      green: '#15836b',
      companyDefault: 'Progressive',
      help: [['Claims', '1-800-776-4737'], ['Roadside', '1-800-776-2778'], ['Service', '1-888-671-4405']],
    },
    travelers: {
      nav: '#b32025',
      green: '#6b7280',
      companyDefault: 'Travelers',
      help: [['Claims / Roadside', '1-800-252-4633'], ['Customer Service', '1-800-238-6225'], ['Bill Pay', '1-800-252-2268']],
    },
  };
  return themes[carrierId] || {
    nav: '#003366',
    green: '#0f7a54',
    companyDefault: CARRIERS[carrierId]?.legalName || carrierName(carrierId),
    help: [['Claims', CARRIERS[carrierId]?.claimsPhone || 'Confirm with carrier'], ['Service', CARRIERS[carrierId]?.claimsPhone || 'Confirm with carrier'], ['Website', CARRIERS[carrierId]?.portalUrl || 'Confirm with carrier']],
  };
};

const formatLimit = (value?: string, type: 'split' | 'single' = 'split') => {
  if (!value) return 'Review';
  const trimmed = value.trim();
  if (trimmed.includes('$') || /k/i.test(trimmed)) return trimmed;
  const parts = trimmed.split('/').map((part) => part.trim()).filter(Boolean);
  if (type === 'single' && parts.length === 1 && /^\d+$/.test(parts[0])) return `$${parts[0]}k each accident`;
  if (parts.length >= 2 && parts.every((part) => /^\d+$/.test(part))) return `$${parts[0]}k / $${parts[1]}k`;
  if (parts.length === 1 && /^\d+$/.test(parts[0])) return `$${parts[0]}k`;
  return trimmed;
};

const coverageText = (vehicle: Vehicle, names: string[], fallback: string) => {
  const match = vehicle.coverages?.find((coverage) => names.some((name) => coverage.name.toLowerCase().includes(name)));
  if (!match) return fallback;
  if (match.status === 'rejected' || /not included|not shown/i.test(match.limitOrDeductible)) return 'Not shown';
  return match.limitOrDeductible || fallback;
};

const driverStatus = (relationship: string) => {
  if (relationship === 'excluded') return 'Excluded';
  if (relationship === 'child') return 'Rated Driver';
  return 'Rated Driver';
};

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

const originalAutoStyles = `
  <style>
    :root {
      --navy: #003366;
      --deep: #061f3f;
      --green: #0f7a54;
      --gold: #ffc300;
      --ink: #12213a;
      --muted: #667085;
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
      box-shadow: 0 20px 70px rgba(7, 20, 44, 0.24);
    }
    .sheet::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      border-left: 1px dotted rgba(11, 35, 71, 0.35);
      pointer-events: none;
    }
    .panel {
      position: relative;
      width: 5.5in;
      height: 8.5in;
      overflow: hidden;
    }
    .back-cover,
    .inside-panel {
      padding: 0.28in;
      background:
        linear-gradient(90deg, rgba(0, 51, 102, 0.08), transparent 20%),
        linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%);
    }
    .front-cover {
      color: var(--deep);
      background:
        linear-gradient(180deg, rgba(0, 25, 60, 0.14) 0%, rgba(0, 25, 60, 0.02) 30%, rgba(0, 25, 60, 0.24) 58%, rgba(255, 255, 255, 0) 76%),
        var(--front-cover-image) center top / cover no-repeat;
    }
    .front-safe {
      position: absolute;
      inset: 0.28in;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-logo-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.16in;
    }
    .logo-box {
      display: grid;
      place-items: center;
      min-width: 1.62in;
      min-height: 0.62in;
      padding: 0.1in;
      border-radius: 0.13in;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 0.14in 0.34in rgba(5, 17, 38, 0.16);
    }
    .logo-box img {
      max-width: 1.35in;
      max-height: 0.38in;
      object-fit: contain;
    }
    .quote-pill {
      padding: 0.08in 0.13in;
      border-radius: 99px;
      color: #fff;
      background: rgba(6, 31, 63, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 0.12in 0.3in rgba(5, 17, 38, 0.2);
      font-size: 8.8pt;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .front-title {
      margin: 0 0 0.12in;
      max-width: 3.2in;
      color: #fff;
      font-size: 22.5pt;
      line-height: 0.95;
      font-weight: 900;
      letter-spacing: 0;
      text-shadow: 0 0.06in 0.22in rgba(0, 0, 0, 0.62);
      transform: translateY(-2.75in);
    }
    .front-subtitle {
      margin: 0;
      max-width: 3.56in;
      color: rgba(255, 255, 255, 0.94);
      font-size: 9.4pt;
      line-height: 1.35;
      font-weight: 850;
      text-shadow: 0 0.05in 0.18in rgba(0, 0, 0, 0.55);
      transform: translateY(-2.75in);
    }
    .cover-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.09in;
      max-width: 4.25in;
      margin-top: 0.18in;
    }
    .meta-tile {
      min-height: 0.56in;
      padding: 0.1in;
      border-radius: 0.12in;
      background: rgba(255, 255, 255, 0.93);
      border: 1px solid rgba(0, 51, 102, 0.12);
      box-shadow: 0 0.08in 0.22in rgba(5, 17, 38, 0.1);
    }
    .label {
      display: block;
      margin: 0 0 0.03in;
      color: #667085;
      font-size: 6.7pt;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .value {
      display: block;
      color: var(--deep);
      font-size: 10.4pt;
      line-height: 1.05;
      font-weight: 900;
    }
    .cover-bottom {
      display: grid;
      grid-template-columns: 1fr 0.96in;
      align-items: end;
      gap: 0.14in;
      transform: translateY(-0.42in);
    }
    .qr-box {
      display: grid;
      place-items: center;
      padding: 0.07in;
      border-radius: 0.12in;
      background: #fff;
      box-shadow: 0 0.1in 0.28in rgba(5, 17, 38, 0.16);
    }
    .qr-box img {
      width: 0.82in;
      height: 0.82in;
      display: block;
    }
    .qr-caption {
      margin: 0.06in 0 0;
      color: #41556f;
      font-size: 6.5pt;
      font-weight: 900;
      line-height: 1.2;
      text-align: center;
    }
    .prepared {
      padding: 0.11in 0.13in;
      border-radius: 0.13in;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid rgba(0, 51, 102, 0.12);
    }
    .prepared strong {
      display: block;
      margin-bottom: 0.03in;
      color: var(--deep);
      font-size: 8.7pt;
      font-weight: 900;
    }
    .prepared span {
      display: block;
      color: #475569;
      font-size: 7.2pt;
      line-height: 1.25;
      font-weight: 750;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.16in;
      margin-bottom: 0.18in;
    }
    .small-logo {
      display: grid;
      place-items: center;
      width: 1.4in;
      min-height: 0.5in;
      padding: 0.08in;
      border-radius: 0.12in;
      background: #fff;
      border: 1px solid var(--line);
    }
    .small-logo img {
      max-width: 1.15in;
      max-height: 0.3in;
      object-fit: contain;
    }
    .panel-title h2 {
      margin: 0;
      color: var(--deep);
      font-size: 17pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0;
    }
    .panel-title p {
      margin: 0.05in 0 0;
      color: #667085;
      font-size: 8pt;
      line-height: 1.25;
      font-weight: 750;
    }
    .summary-card {
      padding: 0.15in;
      border-radius: 0.16in;
      color: #fff;
      background: linear-gradient(135deg, #07305f 0%, var(--navy) 72%, var(--green) 100%);
      box-shadow: inset 0 -0.05in 0 rgba(0, 0, 0, 0.12);
    }
    .premium-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.12in;
      align-items: start;
    }
    .premium-row .amount {
      color: #fff;
      font-size: 31pt;
      line-height: 0.9;
      font-weight: 900;
      letter-spacing: 0;
    }
    .premium-row .term {
      margin-top: 0.04in;
      color: rgba(255, 255, 255, 0.78);
      font-size: 8pt;
      font-weight: 850;
      line-height: 1.25;
    }
    .status-pill {
      align-self: start;
      padding: 0.08in 0.13in;
      border-radius: 99px;
      color: #fff;
      background: rgba(255, 255, 255, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.28);
      font-size: 8pt;
      font-weight: 900;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .auto-mini-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.07in;
      margin-top: 0.14in;
    }
    .mini {
      padding: 0.08in;
      border-radius: 0.1in;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.23);
    }
    .mini span,
    .mini strong { display: block; }
    .mini span {
      color: rgba(255, 255, 255, 0.75);
      font-size: 6.3pt;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .mini strong {
      margin-top: 0.03in;
      color: #fff;
      font-size: 8.5pt;
      line-height: 1.1;
      font-weight: 900;
    }
    .section {
      margin-top: 0.14in;
      padding: 0.12in;
      border-radius: 0.13in;
      background: #fff;
      border: 1px solid var(--line);
    }
    .section h3 {
      margin: 0 0 0.08in;
      color: var(--deep);
      font-size: 10pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0;
    }
    .plain-table {
      width: 100%;
      border-collapse: collapse;
    }
    .plain-table th,
    .plain-table td {
      padding: 0.045in 0.04in;
      border-bottom: 1px solid #e5ebf4;
      vertical-align: top;
      font-size: 7pt;
      line-height: 1.2;
      text-align: left;
    }
    .plain-table th {
      color: #667085;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .plain-table td {
      color: #1f2f46;
      font-weight: 750;
    }
    .plain-table tr:last-child td { border-bottom: 0; }
    .limits-condensed { padding: 0.1in; }
    .limit-strip {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.055in 0.08in;
    }
    .limit-item {
      display: grid;
      grid-template-columns: 0.86in 1fr;
      gap: 0.06in;
      align-items: baseline;
      padding: 0.04in 0;
      border-bottom: 1px solid #e5ebf4;
      min-height: 0.22in;
    }
    .limit-item span {
      color: #667085;
      font-size: 5.8pt;
      font-weight: 900;
      letter-spacing: 0.06em;
      line-height: 1.05;
      text-transform: uppercase;
    }
    .limit-item strong {
      color: #172a43;
      font-size: 6.6pt;
      line-height: 1.08;
      font-weight: 900;
    }
    .vehicle-ledger {
      margin-top: 0.12in;
      padding: 0.1in;
      border-radius: 0.13in;
      background: #fff;
      border: 1px solid var(--line);
    }
    .ledger-heading {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.08in;
      margin-bottom: 0.07in;
    }
    .ledger-heading h3 {
      margin: 0;
      color: var(--deep);
      font-size: 10pt;
      line-height: 1;
      font-weight: 900;
    }
    .ledger-heading span {
      color: #667085;
      font-size: 6.5pt;
      line-height: 1.1;
      font-weight: 850;
      text-align: right;
    }
    .vehicle-fit-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border: 1px solid #dfe7f1;
      border-radius: 0.09in;
    }
    .vehicle-fit-table th,
    .vehicle-fit-table td {
      border-right: 1px solid #e6edf6;
      border-bottom: 1px solid #e6edf6;
      vertical-align: top;
      text-align: left;
    }
    .vehicle-fit-table th:last-child,
    .vehicle-fit-table td:last-child { border-right: 0; }
    .vehicle-fit-table tr:last-child td { border-bottom: 0; }
    .vehicle-fit-table th {
      padding: 0.04in 0.045in;
      color: #667085;
      background: #f3f7fc;
      font-size: 5.45pt;
      line-height: 1.05;
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .vehicle-fit-table td {
      padding: 0.055in 0.045in;
      color: #1f2f46;
      background: #fff;
      font-size: 5.9pt;
      line-height: 1.08;
      font-weight: 800;
    }
    .vehicle-fit-table .vehicle-name {
      width: 1.16in;
      color: var(--deep);
      font-size: 6.3pt;
      font-weight: 900;
    }
    .vehicle-fit-table .vehicle-name span {
      display: block;
      margin-top: 0.025in;
      color: #667085;
      font-size: 5.3pt;
      line-height: 1.05;
      font-weight: 800;
    }
    .vehicle-fit-table .premium-cell {
      color: var(--green);
      font-weight: 900;
      white-space: nowrap;
    }
    .coverage-key {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.055in;
      margin-top: 0.08in;
    }
    .coverage-key span {
      padding: 0.055in 0.065in;
      border-radius: 0.07in;
      color: #334155;
      background: #f8fbff;
      border: 1px solid #e7edf5;
      font-size: 5.8pt;
      line-height: 1.12;
      font-weight: 800;
    }
    .quote-photo {
      margin-top: 0.42in;
      height: 2in;
      overflow: hidden;
      border-radius: 0.14in;
      background: #dfe7f1;
      border: 1px solid var(--line);
      box-shadow: 0 0.1in 0.26in rgba(7, 20, 44, 0.1);
    }
    .quote-photo img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      object-position: center 48%;
    }
    .quote-product-strip {
      margin: 0.07in auto 0;
      padding: 0.055in 0.08in;
      width: 4.25in;
      border-radius: 0.1in;
      color: #17345b;
      background: #f8fbff;
      border: 1px solid #dbe7f6;
      box-shadow: 0 0.06in 0.16in rgba(7, 20, 44, 0.06);
      font-size: 6.5pt;
      line-height: 1.12;
      font-weight: 850;
      text-align: center;
    }
    .quote-product-strip strong {
      color: var(--blue);
      font-weight: 900;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .alert {
      margin-top: 0.12in;
      padding: 0.1in;
      border-radius: 0.12in;
      color: #663c00;
      background: #fff7e6;
      border: 1px solid #f3d39b;
      font-size: 7.2pt;
      line-height: 1.3;
      font-weight: 800;
    }
    .discount-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.055in;
    }
    .discount-grid span {
      padding: 0.055in 0.07in;
      border-radius: 0.08in;
      color: #334155;
      background: #f8fbff;
      border: 1px solid #e7edf5;
      font-size: 6.6pt;
      line-height: 1.1;
      font-weight: 800;
    }
    .step-list {
      display: grid;
      gap: 0.07in;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .step-list li {
      display: grid;
      grid-template-columns: 0.26in 1fr;
      gap: 0.07in;
      align-items: start;
      color: #334155;
      font-size: 7.4pt;
      line-height: 1.25;
      font-weight: 750;
    }
    .step-list b {
      color: var(--deep);
      font-weight: 900;
    }
    .step-list em {
      display: grid;
      place-items: center;
      width: 0.24in;
      height: 0.24in;
      border-radius: 50%;
      color: #fff;
      background: var(--navy);
      font-size: 7pt;
      font-style: normal;
      font-weight: 900;
    }
    .agency-box {
      display: grid;
      grid-template-columns: 1fr 0.98in;
      gap: 0.11in;
      align-items: center;
      padding: 0.12in;
      border-radius: 0.15in;
      color: #fff;
      background: linear-gradient(135deg, #07305f 0%, var(--navy) 72%, var(--green) 100%);
    }
    .agency-head {
      display: flex;
      align-items: center;
      gap: 0.08in;
      margin-bottom: 0.08in;
    }
    .agency-logo {
      display: grid;
      place-items: center;
      width: 0.64in;
      height: 0.38in;
      padding: 0.04in;
      border-radius: 0.08in;
      background: #fff;
    }
    .agency-logo img {
      max-width: 0.52in;
      max-height: 0.24in;
      object-fit: contain;
    }
    .agency-head h2 {
      margin: 0;
      color: #fff;
      font-size: 12pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0;
    }
    .agency-lines {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.055in 0.08in;
    }
    .agency-line {
      color: rgba(255, 255, 255, 0.78);
      font-size: 6.6pt;
      line-height: 1.15;
      font-weight: 800;
    }
    .agency-line strong {
      display: block;
      color: #fff;
      font-size: 6.4pt;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }
    .agency-line span {
      display: block;
      margin-top: 0.02in;
      color: rgba(255, 255, 255, 0.92);
      font-weight: 900;
    }
    .fine-print {
      margin: 0.12in 0 0;
      color: #64748b;
      font-size: 6.3pt;
      line-height: 1.28;
      font-weight: 700;
    }
    .back-bottom {
      position: absolute;
      left: 0.28in;
      right: 0.28in;
      bottom: 0.24in;
    }
    @page { size: 11in 8.5in; margin: 0; }
    @media print {
      html,
      body {
        width: 11in;
        min-height: 17in;
        margin: 0;
        background: #fff;
      }
      .print-toolbar { display: none !important; }
      .sheet-wrap { padding: 0; }
      .sheet {
        width: 11in;
        height: 8.5in;
        margin: 0;
        box-shadow: none;
        page-break-after: always;
        break-after: page;
      }
      .sheet:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
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

const autoShell = (title: string, body: string, theme: { nav: string; green: string }) => `<!DOCTYPE html>
<html lang="en" style="--navy:${escapeAttr(theme.nav)};--green:${escapeAttr(theme.green)};">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  ${originalAutoStyles}
</head>
<body>
  <div class="print-toolbar">
    <div>
      <h1>${escapeHtml(title)}</h1>
      <p>Fill from parsed PDF, print landscape, two-sided, flip on short edge.</p>
    </div>
    <button onclick="window.print()">Print / Save PDF</button>
  </div>
  <main class="sheet-wrap">${body}</main>
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
  const theme = autoCarrierTheme(data.carrierId);
  const fold = data.foldCard || {};
  const vehicles = activeVehicles(data.vehicles);
  const logo = localCarrierLogo(data.carrierId);
  const total = money(data.totalPremium);
  const down = money(data.paymentOptions.eft.downPayment);
  const setupCharge = fold.setupCharge || 0;
  const subtotal = setupCharge ? money(Math.max(data.totalPremium - setupCharge, 0)) : money(data.totalPremium);
  const setup = setupCharge ? money(setupCharge) : 'review';
  const payments = fold.paymentSchedule || `${data.paymentOptions.eft.recurringCount} x ${money(data.paymentOptions.eft.recurringAmount)}`;
  const term = `${data.termMonths || 6} Month Direct Bill`;
  const coverageAlert = fold.coverageAlert || 'Review all listed drivers, VINs, deductibles, and liability limits before starting the policy.';
  const productStrip = fold.productStrip || DEFAULT_PRODUCT_STRIP;
  const company = fold.companyName || theme.companyDefault;
  const customerAddress = fold.customerAddress || (vehicles[0]?.garagingZip ? `Garaging ZIP ${vehicles[0].garagingZip}` : 'Address pending');
  const quoteDate = dateText(data.quoteDate);
  const effectiveDate = dateText(data.effectiveDate);
  const biLimit = formatLimit(data.coverages.bodilyInjuryLimit);
  const pdLimit = formatLimit(data.coverages.propertyDamageLimit, 'single');
  const medPay = data.coverages.medicalPayments ? `${compactMoney(data.coverages.medicalPayments)} each person` : 'Review';
  const umLimit = formatLimit(data.coverages.uninsuredMotoristLimit);
  const umpdLimit = data.coverages.underinsuredMotoristLimit ? formatLimit(data.coverages.underinsuredMotoristLimit) : pdLimit;
  const compLimit = data.coverages.comprehensiveDeductible ? `${compactMoney(data.coverages.comprehensiveDeductible)} deductible` : 'Review';
  const qrTarget = fold.qrLink || data.digitalCardUrl || AGENCY_QR_FALLBACK;
  const qrCaption = fold.qrLink || data.digitalCardUrl ? 'Scan for quote' : 'Scan for local help';
  const driverRows = data.drivers.length
    ? data.drivers.map((driver) => `<tr><td>${escapeHtml(driver.name || 'Driver')}</td><td>${escapeHtml(driver.age || '')}</td><td>${escapeHtml(driverStatus(driver.relationship))}</td><td>${driver.relationship === 'excluded' ? 'Excluded' : '0'}</td></tr>`).join('')
    : '<tr><td>Driver name</td><td>Age</td><td>Status</td><td>Points</td></tr>';
  const vehicleSummaryRows = vehicles.length
    ? vehicles.map((vehicle) => `<tr><td>${escapeHtml(vehicleName(vehicle))}</td><td>${escapeHtml(vehicle.vinLast8 || '')}</td><td>${escapeHtml(vehicle.coverageType === 'full_coverage' ? 'Full coverage' : 'Liability only')}</td></tr>`).join('')
    : '<tr><td>Vehicle</td><td>VIN</td><td>Use</td></tr>';
  const vehicleLedgerRows = vehicles.length
    ? vehicles.map((vehicle) => {
      const biPd = `${formatLimit(data.coverages.bodilyInjuryLimit)} / ${formatLimit(data.coverages.propertyDamageLimit, 'single')}`;
      return `<tr>
        <td class="vehicle-name">${escapeHtml(vehicleName(vehicle))}<span>${escapeHtml(vehicle.vinLast8 || '')}</span></td>
        <td>${escapeHtml(biPd)}</td>
        <td>${escapeHtml(coverageText(vehicle, ['comprehensive', 'comp'], compLimit))}</td>
        <td>${escapeHtml(coverageText(vehicle, ['collision'], vehicle.coverageType === 'full_coverage' ? 'Confirm deductible' : 'Not shown'))}</td>
        <td>${escapeHtml(coverageText(vehicle, ['medical'], medPay))}</td>
        <td>${escapeHtml(coverageText(vehicle, ['uninsured', 'underinsured', 'um'], `${umLimit} / ${umpdLimit}`))}</td>
        <td class="premium-cell">${escapeHtml(vehicle.vehiclePremium ? money(vehicle.vehiclePremium) : 'Review')}</td>
      </tr>`;
    }).join('')
    : '<tr><td class="vehicle-name">Vehicle details pending<span>Add vehicles in the form</span></td><td colspan="6">No vehicle coverage rows entered yet.</td></tr>';
  const carrierHelpRows = theme.help.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  const discounts = data.discounts.map((discount) => discount.label).filter(Boolean);
  const discountGrid = discounts.slice(0, 8).map((discount) => `<span>${escapeHtml(discount)}</span>`).join('');
  const title = `${data.clientFullName} - Auto Quote Fold Card`;
  const body = `
    <section class="sheet" aria-label="Outside of folded auto quote card">
      <article class="panel back-cover">
        <div class="panel-header">
          <div class="panel-title">
            <h2>Ready To Review?</h2>
            <p>Use this quote card as a simple guide while we confirm details and bind coverage.</p>
          </div>
          <div class="small-logo"><img src="${DEFAULT_AGENCY_LOGO}" alt="Bill Layne Insurance Agency"></div>
        </div>

        <section class="agency-box" aria-label="Bill Layne Insurance contact information">
          <div>
            <div class="agency-head">
              <div class="agency-logo"><img src="${DEFAULT_AGENCY_LOGO}" alt="Bill Layne Insurance Agency"></div>
              <h2>Bill Layne Insurance</h2>
            </div>
            <div class="agency-lines">
              <div class="agency-line"><strong>Call</strong><span>336-835-1993</span></div>
              <div class="agency-line"><strong>Text</strong><span>336-827-9065</span></div>
              <div class="agency-line"><strong>Email</strong><span>Save@BillLayneInsurance.com</span></div>
              <div class="agency-line"><strong>Office</strong><span>Elkin, NC</span></div>
            </div>
          </div>
          <div>
            <div class="qr-box"><img src="${qrUrl(AGENCY_QR_FALLBACK)}" alt="Bill Layne Insurance digital contact QR"></div>
            <p class="qr-caption">Agency contact card</p>
          </div>
        </section>

        <section class="section">
          <h3>Before Coverage Can Be Bound</h3>
          <ol class="step-list">
            <li><em>1</em><span><b>Confirm drivers and vehicles.</b> Names, dates of birth, license status, VINs, garaging address, and vehicle use must be correct.</span></li>
            <li><em>2</em><span><b>Confirm coverage choices.</b> Review deductibles, rental, roadside, comp, collision, and lender needs before binding.</span></li>
            <li><em>3</em><span><b>Make first payment.</b> Coverage is not active until the company accepts payment and the policy is bound.</span></li>
            <li><em>4</em><span><b>Save the final documents.</b> After binding, keep your ID cards and declarations page with your records.</span></li>
          </ol>
        </section>

        <section class="section">
          <h3>${escapeHtml(carrier)} Help</h3>
          <table class="plain-table"><tbody>${carrierHelpRows}</tbody></table>
        </section>

        <section class="section">
          <h3>Discounts Shown On Quote</h3>
          <div class="discount-grid">${discountGrid}</div>
        </section>

        <div class="back-bottom">
          <p class="fine-print">This printed piece is a quote summary only. It is not an insurance policy, binder, ID card, or proof of insurance. Premiums and payment plans may change if rating information, underwriting, reports, payment timing, vehicles, drivers, discounts, or coverage selections change.</p>
        </div>
      </article>

      <article class="panel front-cover" style="--front-cover-image:${cssUrl(data.heroImageUrl || DEFAULT_AUTO_COVER)};">
        <div class="front-safe">
          <div class="cover-logo-row">
            <div class="logo-box"><img src="${escapeAttr(logo)}" alt="${escapeAttr(carrier)}"></div>
            <div class="quote-pill">Auto Quote</div>
          </div>
          <div class="cover-bottom">
            <div>
              <h1 class="front-title">${escapeHtml(data.clientFullName || 'Customer Name')}, your personalized auto quote</h1>
              <p class="front-subtitle">Prepared by Bill Layne Insurance Agency with ${escapeHtml(carrier)}. Review the premium, vehicles, drivers, coverage snapshot, and next steps before binding.</p>
              <div class="cover-meta">
                <div class="meta-tile"><span class="label">Quote Number</span><span class="value">${escapeHtml(data.quoteNumber || 'Pending')}</span></div>
                <div class="meta-tile"><span class="label">Effective Date</span><span class="value">${escapeHtml(effectiveDate)}</span></div>
                <div class="meta-tile"><span class="label">Total Quote</span><span class="value">${escapeHtml(total)}</span></div>
                <div class="meta-tile"><span class="label">Down Payment</span><span class="value">${escapeHtml(down)}</span></div>
              </div>
              <div class="prepared">
                <strong>Bill Layne Insurance Agency</strong>
                <span>Call 336-835-1993 or text 336-827-9065 with questions, changes, or to bind when ready.</span>
              </div>
            </div>
            <div>
              <div class="qr-box"><img src="${qrUrl(qrTarget)}" alt="Quote QR"></div>
              <p class="qr-caption">${escapeHtml(qrCaption)}</p>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="sheet" aria-label="Inside of folded auto quote card">
      <article class="panel inside-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>Quote At A Glance</h2>
            <p>The main numbers and people listed on the carrier quote.</p>
          </div>
          <div class="small-logo"><img src="${escapeAttr(logo)}" alt="${escapeAttr(carrier)}"></div>
        </div>

        <section class="summary-card">
          <div class="premium-row">
            <div>
              <span class="label" style="color: rgba(255,255,255,.76);">Total Auto Quote</span>
              <div class="amount">${escapeHtml(total)}</div>
              <div class="term">Subtotal premium ${escapeHtml(subtotal)} plus ${escapeHtml(setup)} pay plan setup charge.</div>
            </div>
            <div class="status-pill">Quote Only</div>
          </div>
          <div class="auto-mini-grid">
            <div class="mini"><span>Down</span><strong>${escapeHtml(down)}</strong></div>
            <div class="mini"><span>Payments</span><strong>${escapeHtml(payments)}</strong></div>
            <div class="mini"><span>Term</span><strong>${escapeHtml(term)}</strong></div>
          </div>
        </section>

        <section class="section">
          <h3>Applicant And Quote Details</h3>
          <table class="plain-table">
            <tbody>
              <tr><th>Named Insureds</th><td>${escapeHtml(data.clientFullName)}</td></tr>
              <tr><th>Company</th><td>${escapeHtml(company)}</td></tr>
              <tr><th>Quote Date</th><td>${escapeHtml(quoteDate)}</td></tr>
              <tr><th>Address</th><td>${escapeHtml(customerAddress)}</td></tr>
              <tr><th>Prior Carrier</th><td>${escapeHtml(fold.priorCarrier || 'Prior carrier pending')}</td></tr>
            </tbody>
          </table>
        </section>

        <section class="section">
          <h3>Drivers Listed</h3>
          <table class="plain-table">
            <thead><tr><th>Name</th><th>Age</th><th>Status</th><th>Points</th></tr></thead>
            <tbody>${driverRows}</tbody>
          </table>
        </section>

        <section class="section">
          <h3>Vehicles Quoted</h3>
          <table class="plain-table">
            <thead><tr><th>Vehicle</th><th>VIN</th><th>Use</th></tr></thead>
            <tbody>${vehicleSummaryRows}</tbody>
          </table>
        </section>
      </article>

      <article class="panel inside-panel">
        <div class="panel-header">
          <div class="panel-title">
            <h2>Coverage Snapshot</h2>
            <p>Compact vehicle ledger designed to still fit when a quote has up to five autos.</p>
          </div>
        </div>

        <section class="section limits-condensed" style="margin-top: 0;">
          <h3>Shared Quoted Limits</h3>
          <div class="limit-strip">
            <div class="limit-item"><span>BI</span><strong>${escapeHtml(biLimit)}</strong></div>
            <div class="limit-item"><span>PD</span><strong>${escapeHtml(pdLimit)}</strong></div>
            <div class="limit-item"><span>Med Pay</span><strong>${escapeHtml(medPay)}</strong></div>
            <div class="limit-item"><span>UM/UIM BI</span><strong>${escapeHtml(umLimit)}</strong></div>
            <div class="limit-item"><span>UMPD</span><strong>${escapeHtml(umpdLimit)}</strong></div>
            <div class="limit-item"><span>OTC/Comp</span><strong>${escapeHtml(compLimit)}</strong></div>
          </div>
          <div class="alert">${escapeHtml(coverageAlert)}</div>
        </section>

        <section class="vehicle-ledger">
          <div class="ledger-heading">
            <h3>Vehicle Coverage Ledger</h3>
            <span>Only entered vehicles appear on the printed quote.</span>
          </div>
          <table class="vehicle-fit-table">
            <thead>
              <tr><th>Vehicle</th><th>BI / PD</th><th>Comp / OTC</th><th>Collision</th><th>Med Pay</th><th>UM / UMPD</th><th>Total</th></tr>
            </thead>
            <tbody>${vehicleLedgerRows}</tbody>
          </table>
          <div class="coverage-key">
            <span>BI / PD = injury and property damage liability.</span>
            <span>OTC/Comp = theft, glass, deer, fire, weather, and similar losses.</span>
            <span>Collision, rental, and roadside should be confirmed per vehicle.</span>
          </div>
        </section>

        <figure class="quote-photo" aria-label="Bill Layne Insurance local quote review">
          <img src="${escapeAttr(fold.agentImageUrl || DEFAULT_AGENT_IMAGE)}" alt="Local insurance agent reviewing an auto quote with customers">
        </figure>
        <p class="quote-product-strip"><strong>Also ask us about:</strong> ${escapeHtml(productStrip)}</p>
      </article>
    </section>`;

  return {
    html: autoShell(title, body, theme),
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
