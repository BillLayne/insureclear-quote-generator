import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';

type DifferenceLevel = 'same' | 'better-left' | 'better-right' | 'review';

interface CarrierColumn {
  id: string;
  name: string;
  logoUrl: string;
  monthlyPayment: string;
  initialPayment: string;
  termPremium: string;
  paidInFull: string;
  quoteNumber: string;
  actionUrl: string;
}

interface ComparisonRow {
  label: string;
  left: string;
  right: string;
  difference: string;
  level: DifferenceLevel;
}

interface VehicleComparison {
  vehicle: string;
  vin: string;
  rows: ComparisonRow[];
}

interface DriverComparison {
  driver: string;
  leftStatus: string;
  rightStatus: string;
  note: string;
}

interface AutoComparisonQuoteData {
  customerName: string;
  firstName: string;
  quoteDate: string;
  leftCarrier: CarrierColumn;
  rightCarrier: CarrierColumn;
  recommendationTitle: string;
  recommendationBody: string;
  priceRows: ComparisonRow[];
  coverageRows: ComparisonRow[];
  vehicleComparisons: VehicleComparison[];
  driverComparisons: DriverComparison[];
  discountRows: ComparisonRow[];
}

const progressive = CARRIERS.progressive;
const nationalGeneral = CARRIERS.national_general;

const quoteActionUrl = (carrier: string) => {
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: 'Sample Auto Customer',
    templateType: 'auto-comparison',
    carrier,
    quoteNumber: `${carrier.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-COMPARISON-SAMPLE`,
    premium: carrier === 'Progressive' ? '$186.42/mo' : '$201.18/mo',
    subject: `${carrier} Auto Comparison Choice`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

export const sampleAutoComparisonQuoteData: AutoComparisonQuoteData = {
  customerName: 'Sample Auto Customer',
  firstName: 'Alex',
  quoteDate: 'June 8, 2026',
  leftCarrier: {
    id: 'national-general',
    name: nationalGeneral.displayName,
    logoUrl: nationalGeneral.logoUrl || BRAND.logoUrl,
    monthlyPayment: '$201.18/mo',
    initialPayment: '$248.60',
    termPremium: '$1,454.80',
    paidInFull: '$1,384.20',
    quoteNumber: 'NG-SAMPLE-2026',
    actionUrl: quoteActionUrl('National General'),
  },
  rightCarrier: {
    id: 'progressive',
    name: progressive.displayName,
    logoUrl: progressive.logoUrl || BRAND.logoUrl,
    monthlyPayment: '$186.42/mo',
    initialPayment: '$221.15',
    termPremium: '$1,339.25',
    paidInFull: '$1,298.60',
    quoteNumber: 'PRG-SAMPLE-2026',
    actionUrl: quoteActionUrl('Progressive'),
  },
  recommendationTitle: 'Progressive appears to be the better value in this sample.',
  recommendationBody:
    'Progressive shows the lower monthly payment, lower initial payment, and lower total premium while keeping the same core liability limits. National General may still be worth reviewing if underwriting, billing, or driver eligibility is stronger for the final application.',
  priceRows: [
    { label: 'Monthly EFT', left: '$201.18/mo', right: '$186.42/mo', difference: 'Progressive lower by $14.76/mo', level: 'better-right' },
    { label: 'Initial payment', left: '$248.60', right: '$221.15', difference: 'Progressive lower today', level: 'better-right' },
    { label: 'Total 6-month premium', left: '$1,454.80', right: '$1,339.25', difference: 'Progressive lower by $115.55', level: 'better-right' },
    { label: 'Pay in full', left: '$1,384.20', right: '$1,298.60', difference: 'Progressive lower by $85.60', level: 'better-right' },
  ],
  coverageRows: [
    { label: 'Bodily Injury Liability', left: '$100,000 / $300,000', right: '$100,000 / $300,000', difference: 'Same', level: 'same' },
    { label: 'Property Damage Liability', left: '$100,000', right: '$100,000', difference: 'Same', level: 'same' },
    { label: 'Uninsured Motorist', left: '$100,000 / $300,000', right: '$100,000 / $300,000', difference: 'Same', level: 'same' },
    { label: 'Underinsured Motorist', left: '$100,000 / $300,000', right: '$100,000 / $300,000', difference: 'Same', level: 'same' },
    { label: 'Medical Payments', left: '$1,000', right: '$1,000', difference: 'Same', level: 'same' },
    { label: 'Rental Reimbursement', left: '$30/day', right: '$40/day', difference: 'Progressive higher rental limit', level: 'better-right' },
    { label: 'Roadside / Towing', left: 'Included', right: 'Included', difference: 'Same', level: 'same' },
  ],
  vehicleComparisons: [
    {
      vehicle: '2021 Toyota Camry',
      vin: 'VIN ending 4821',
      rows: [
        { label: 'Vehicle premium', left: '$742.20', right: '$681.45', difference: 'Progressive lower', level: 'better-right' },
        { label: 'Comprehensive', left: '$500 deductible', right: '$500 deductible', difference: 'Same', level: 'same' },
        { label: 'Collision', left: '$500 deductible', right: '$500 deductible', difference: 'Same', level: 'same' },
        { label: 'Rental', left: '$30/day', right: '$40/day', difference: 'Progressive higher', level: 'better-right' },
      ],
    },
    {
      vehicle: '2019 Ford F-150',
      vin: 'VIN ending 9173',
      rows: [
        { label: 'Vehicle premium', left: '$712.60', right: '$657.80', difference: 'Progressive lower', level: 'better-right' },
        { label: 'Comprehensive', left: '$500 deductible', right: '$500 deductible', difference: 'Same', level: 'same' },
        { label: 'Collision', left: '$1,000 deductible', right: '$1,000 deductible', difference: 'Same', level: 'same' },
        { label: 'Custom equipment', left: 'Not shown', right: 'Not shown', difference: 'Confirm if needed', level: 'review' },
      ],
    },
  ],
  driverComparisons: [
    { driver: 'Alex Sample', leftStatus: 'Rated primary', rightStatus: 'Rated primary', note: 'Same driver treatment shown.' },
    { driver: 'Jordan Sample', leftStatus: 'Rated household driver', rightStatus: 'Rated household driver', note: 'Same driver treatment shown.' },
  ],
  discountRows: [
    { label: 'Homeowner', left: 'Applied', right: 'Applied', difference: 'Same', level: 'same' },
    { label: 'Continuous insurance', left: 'Applied', right: 'Applied', difference: 'Same', level: 'same' },
    { label: 'EFT / automatic payment', left: 'Applied', right: 'Applied', difference: 'Same', level: 'same' },
    { label: 'Paid-in-full', left: 'Available', right: 'Available', difference: 'Compare final savings before binding', level: 'review' },
  ],
};

const levelLabel = (level: DifferenceLevel) => {
  if (level === 'same') return 'Same';
  if (level === 'better-left') return 'Left better';
  if (level === 'better-right') return 'Right better';
  return 'Review';
};

const ComparisonTable = ({
  rows,
  leftLabel = 'National General',
  rightLabel = 'Progressive',
}: {
  rows: ComparisonRow[];
  leftLabel?: string;
  rightLabel?: string;
}) => (
  <>
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>{leftLabel}</th>
            <th>{rightLabel}</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.label}-${row.left}-${row.right}`}>
              <td className="label-cell">{row.label}</td>
              <td>{row.left}</td>
              <td>{row.right}</td>
              <td>
                <span className={`difference-badge ${row.level}`}>{levelLabel(row.level)}</span>
                <span className="difference-copy">{row.difference}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mobile-comparison-list">
      {rows.map((row) => (
        <article className="mobile-compare-card" key={`mobile-${row.label}-${row.left}-${row.right}`}>
          <h3>{row.label}</h3>
          <div className="mobile-carrier-row carrier-left">
            <span>{leftLabel}</span>
            <strong>{row.left}</strong>
          </div>
          <div className="mobile-carrier-row carrier-right">
            <span>{rightLabel}</span>
            <strong>{row.right}</strong>
          </div>
          <div className="mobile-difference-row">
            <span className={`difference-badge ${row.level}`}>{levelLabel(row.level)}</span>
            <span className="difference-copy">{row.difference}</span>
          </div>
        </article>
      ))}
    </div>
  </>
);

const CarrierCard = ({ carrier, side }: { carrier: CarrierColumn; side: 'left' | 'right' }) => (
  <article className={`carrier-card ${side}`}>
    <div className="carrier-card-head">
      <img src={carrier.logoUrl} alt={carrier.name} />
      <div>
        <span>{carrier.quoteNumber}</span>
        <h2>{carrier.name}</h2>
      </div>
    </div>
    <div className="big-rate">{carrier.monthlyPayment}</div>
    <dl className="rate-list">
      <div><dt>Initial payment</dt><dd>{carrier.initialPayment}</dd></div>
      <div><dt>Total premium</dt><dd>{carrier.termPremium}</dd></div>
      <div><dt>Pay in full</dt><dd>{carrier.paidInFull}</dd></div>
    </dl>
    <a className="carrier-action" href={carrier.actionUrl} target="_blank" rel="noreferrer">Choose {carrier.name}</a>
  </article>
);

export function AutoComparisonQuoteTemplate({ data = sampleAutoComparisonQuoteData }: { data?: AutoComparisonQuoteData }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`${data.leftCarrier.name} vs ${data.rightCarrier.name} Auto Quote Comparison`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --navy:#0b2234;
            --navy2:#12324a;
            --blue:#0058b9;
            --gold:#c8a84e;
            --green:#1a7a4e;
            --amber:#a15c00;
            --ink:#102033;
            --muted:#64748b;
            --line:#dbe4ee;
            --soft:#f3f7fb;
            --white:#ffffff;
            --max:1180px;
          }
          * { box-sizing:border-box; margin:0; padding:0; }
          body { font-family:Inter, system-ui, -apple-system, Segoe UI, sans-serif; background:#eef4f8; color:var(--ink); line-height:1.55; }
          a { color:inherit; text-decoration:none; }
          img { max-width:100%; display:block; }
          .page-shell { max-width:var(--max); margin:0 auto; padding:24px 20px 90px; }
          .hero {
            border-radius:30px;
            overflow:hidden;
            color:#fff;
            background:
              linear-gradient(135deg, rgba(11,34,52,0.96), rgba(18,50,74,0.86)),
              url('https://i.imgur.com/i0oYQkO.png') center/cover no-repeat;
            box-shadow:0 22px 55px rgba(11,34,52,0.16);
          }
          .hero-inner { padding:40px; display:grid; grid-template-columns:1.1fr 0.9fr; gap:28px; align-items:center; }
          .eyebrow { color:#f7db86; font-weight:900; letter-spacing:.12em; text-transform:uppercase; font-size:.78rem; margin-bottom:10px; }
          h1 { font-family:Outfit, Inter, sans-serif; font-size:clamp(2.1rem, 4vw, 3.55rem); line-height:1.02; letter-spacing:-.04em; }
          .hero p { color:rgba(255,255,255,.86); margin-top:16px; max-width:650px; font-size:1.04rem; }
          .verdict-card { background:rgba(255,255,255,.97); color:var(--ink); border-radius:22px; padding:24px; border:1px solid rgba(255,255,255,.8); }
          .verdict-card h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; line-height:1.08; font-size:1.65rem; }
          .verdict-card p { color:var(--muted); margin-top:10px; font-size:.95rem; }
          .verdict-pill { display:inline-block; background:#eaf7ef; color:var(--green); padding:7px 12px; border-radius:999px; font-size:.78rem; font-weight:900; margin-bottom:12px; text-transform:uppercase; letter-spacing:.08em; }
          .market-review-note {
            margin-top:18px;
            display:grid;
            grid-template-columns:auto 1fr;
            gap:12px;
            align-items:start;
            max-width:680px;
            background:rgba(255,255,255,.13);
            border:1px solid rgba(255,255,255,.24);
            border-radius:18px;
            padding:14px 16px;
          }
          .market-review-note strong { display:block; color:#fff; font-weight:900; }
          .market-review-note span { display:block; color:rgba(255,255,255,.82); font-size:.93rem; margin-top:2px; }
          .market-icon {
            width:34px;
            height:34px;
            border-radius:11px;
            display:grid;
            place-items:center;
            background:var(--gold);
            color:var(--navy);
            font-weight:900;
          }
          .section { margin-top:24px; background:var(--white); border:1px solid var(--line); border-radius:24px; padding:26px; box-shadow:0 12px 35px rgba(11,34,52,.06); }
          .section-title { display:flex; justify-content:space-between; gap:14px; align-items:end; margin-bottom:16px; }
          .section-title h2 { font-family:Outfit, Inter, sans-serif; color:var(--navy); font-size:clamp(1.45rem, 2vw, 2rem); line-height:1.1; }
          .section-title span { color:var(--muted); font-weight:700; font-size:.9rem; }
          .carrier-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
          .carrier-card { border:1px solid var(--line); border-radius:22px; padding:22px; background:#fff; }
          .carrier-card.right { border-color:rgba(26,122,78,.35); background:#f4fbf7; }
          .carrier-card-head { display:flex; gap:14px; align-items:center; }
          .carrier-card-head img { max-width:122px; max-height:42px; object-fit:contain; background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px; }
          .carrier-card-head span { display:block; color:var(--muted); font-size:.76rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
          .carrier-card-head h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:1.5rem; }
          .big-rate { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:clamp(2.2rem, 4vw, 3.6rem); font-weight:900; letter-spacing:-.05em; margin:18px 0; }
          .rate-list { display:grid; gap:10px; }
          .rate-list div { display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-top:1px solid var(--line); }
          dt { color:var(--muted); font-weight:800; }
          dd { color:var(--navy); font-weight:900; }
          .carrier-action { display:block; text-align:center; margin-top:18px; background:var(--gold); color:var(--navy); font-weight:900; padding:13px 16px; border-radius:14px; }
          .comparison-table-wrap { overflow:auto; border:1px solid var(--line); border-radius:18px; }
          .comparison-table { width:100%; border-collapse:collapse; min-width:780px; background:#fff; }
          .mobile-comparison-list { display:none; }
          th { background:var(--navy); color:#fff; text-align:left; padding:13px 14px; font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; }
          td { padding:14px; border-bottom:1px solid var(--line); vertical-align:top; }
          .comparison-table td:nth-child(2) { background:#f8fafc; box-shadow:inset 4px 0 0 #64748b; }
          .comparison-table td:nth-child(3) { background:#eff6ff; box-shadow:inset 4px 0 0 #0058b9; }
          tr:last-child td { border-bottom:0; }
          .label-cell { font-weight:900; color:var(--navy); }
          .difference-badge { display:inline-block; padding:5px 9px; border-radius:999px; font-size:.72rem; font-weight:900; margin-right:8px; text-transform:uppercase; letter-spacing:.06em; }
          .same { background:#eef2f7; color:#475569; }
          .better-left { background:#eff6ff; color:var(--blue); }
          .better-right { background:#eaf7ef; color:var(--green); }
          .review { background:#fff7ed; color:var(--amber); }
          .difference-copy { color:var(--muted); font-size:.9rem; }
          .mobile-compare-card { border:1px solid var(--line); border-radius:18px; background:#fff; padding:16px; }
          .mobile-compare-card h3 { color:var(--navy); font-size:1rem; line-height:1.2; margin-bottom:12px; }
          .mobile-carrier-row { display:grid; grid-template-columns:1fr; gap:4px; padding:12px 14px; border:1px solid var(--line); border-radius:14px; margin-top:10px; }
          .mobile-carrier-row.carrier-left { background:#f8fafc; border-color:#cbd5e1; box-shadow:inset 5px 0 0 #64748b; }
          .mobile-carrier-row.carrier-right { background:#eff6ff; border-color:#bfdbfe; box-shadow:inset 5px 0 0 #0058b9; }
          .mobile-carrier-row span { color:#475569; font-size:.78rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
          .mobile-carrier-row.carrier-right span { color:#0058b9; }
          .mobile-carrier-row strong { color:var(--navy); font-size:1rem; line-height:1.3; overflow-wrap:anywhere; }
          .mobile-difference-row { display:flex; flex-direction:column; align-items:flex-start; gap:8px; padding-top:12px; margin-top:12px; border-top:1px solid var(--line); }
          .vehicle-stack, .driver-grid { display:grid; gap:16px; }
          .vehicle-card { border:1px solid var(--line); border-radius:20px; overflow:hidden; background:#fff; }
          .vehicle-head { background:var(--soft); padding:16px 18px; border-left:5px solid var(--gold); }
          .vehicle-head strong { display:block; color:var(--navy); font-size:1.1rem; }
          .vehicle-head span { color:var(--muted); font-weight:700; font-size:.88rem; }
          .vehicle-card .comparison-table-wrap { border:0; border-radius:0; }
          .driver-grid { grid-template-columns:1fr 1fr; }
          .driver-card { border:1px solid var(--line); border-radius:18px; padding:18px; background:var(--soft); }
          .driver-card strong { color:var(--navy); display:block; font-size:1.08rem; }
          .driver-card dl { margin-top:12px; display:grid; gap:8px; }
          .driver-card div { display:flex; justify-content:space-between; gap:10px; }
          .agent-note { display:grid; grid-template-columns:.75fr 1.25fr; gap:22px; align-items:center; }
          .agent-note img { width:100%; height:280px; object-fit:cover; border-radius:20px; }
          .agent-note h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:2rem; line-height:1.08; }
          .agent-note p { color:var(--muted); margin-top:12px; }
          .final-actions { position:sticky; bottom:0; background:rgba(238,244,248,.94); border-top:1px solid var(--line); backdrop-filter:blur(10px); padding:14px 20px; }
          .final-actions-inner { max-width:var(--max); margin:0 auto; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
          .action-btn { background:var(--navy); color:#fff; font-weight:900; padding:13px 18px; border-radius:999px; }
          .action-btn.gold { background:var(--gold); color:var(--navy); }
          @media (max-width: 820px) {
            .hero-inner, .carrier-grid, .agent-note, .driver-grid { grid-template-columns:1fr; }
            .hero-inner { padding:28px; }
            .section { padding:20px; }
            .section-title { display:block; }
            .section-title span { display:block; margin-top:6px; }
            .comparison-table-wrap { display:none; }
            .mobile-comparison-list { display:grid; gap:12px; }
            .agent-note img { height:230px; }
          }
        `}</style>
      </head>
      <body>
        <main className="page-shell">
          <section className="hero">
            <div className="hero-inner">
              <div>
                <div className="eyebrow">Auto Quote Comparison - {data.quoteDate}</div>
                <h1>{data.leftCarrier.name} vs {data.rightCarrier.name} for {data.customerName}</h1>
                <p>{data.firstName}, this page compares the price, coverage, vehicles, drivers, discounts, and practical differences so you can choose the quote that fits best.</p>
                <div className="market-review-note">
                  <div className="market-icon">2</div>
                  <div>
                    <strong>We checked the auto insurance companies available through our agency.</strong>
                    <span>These are the top two choices from that review, shown side by side so you can see the real differences before deciding.</span>
                  </div>
                </div>
              </div>
              <aside className="verdict-card">
                <span className="verdict-pill">Bill's recommendation</span>
                <h2>{data.recommendationTitle}</h2>
                <p>{data.recommendationBody}</p>
              </aside>
            </div>
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Price side by side</h2>
              <span>Monthly, today, term total, and paid-in-full</span>
            </div>
            <div className="carrier-grid">
              <CarrierCard carrier={data.leftCarrier} side="left" />
              <CarrierCard carrier={data.rightCarrier} side="right" />
            </div>
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Price differences</h2>
              <span>Where the money changes</span>
            </div>
            <ComparisonTable rows={data.priceRows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Coverage comparison</h2>
              <span>Same rows, carrier by carrier</span>
            </div>
            <ComparisonTable rows={data.coverageRows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Vehicle-by-vehicle comparison</h2>
              <span>Premium and coverage differences by unit</span>
            </div>
            <div className="vehicle-stack">
              {data.vehicleComparisons.map((vehicle) => (
                <article className="vehicle-card" key={vehicle.vehicle}>
                  <div className="vehicle-head">
                    <strong>{vehicle.vehicle}</strong>
                    <span>{vehicle.vin}</span>
                  </div>
                  <ComparisonTable rows={vehicle.rows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Drivers compared</h2>
              <span>Rated, excluded, or needs review</span>
            </div>
            <div className="driver-grid">
              {data.driverComparisons.map((driver) => (
                <article className="driver-card" key={driver.driver}>
                  <strong>{driver.driver}</strong>
                  <dl>
                    <div><dt>National General</dt><dd>{driver.leftStatus}</dd></div>
                    <div><dt>Progressive</dt><dd>{driver.rightStatus}</dd></div>
                    <div><dt>Note</dt><dd>{driver.note}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-title">
              <h2>Discounts compared</h2>
              <span>Confirm final carrier credits before binding</span>
            </div>
            <ComparisonTable rows={data.discountRows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
          </section>

          <section className="section agent-note">
            <img src="https://i.imgur.com/h00mpPA.jpeg" alt="Bill Layne reviewing auto coverage with a customer" />
            <div>
              <div className="eyebrow" style={{ color: '#0f7b8f' }}>Plain-English Advisor Note</div>
              <h2>Use this page to choose with confidence, not just chase the lowest number.</h2>
              <p>If the cheaper quote has the same coverage and the carrier accepts the same drivers and vehicles, it may be the stronger value. If one quote has missing rental, different deductibles, excluded drivers, or underwriting conditions, we should review that before you choose.</p>
              <p>When you are ready, choose a carrier below or ask me a question and I will review the final details before anything is submitted.</p>
            </div>
          </section>
        </main>

        <nav className="final-actions" aria-label="Comparison actions">
          <div className="final-actions-inner">
            <a className="action-btn" href={data.leftCarrier.actionUrl} target="_blank" rel="noreferrer">Choose {data.leftCarrier.name}</a>
            <a className="action-btn gold" href={data.rightCarrier.actionUrl} target="_blank" rel="noreferrer">Choose {data.rightCarrier.name}</a>
            <a className="action-btn" href={`mailto:${BRAND.email}?subject=Question about my auto quote comparison`}>Ask Bill a Question</a>
          </div>
        </nav>
      </body>
    </html>
  );
}

export const renderAutoComparisonQuoteSampleHtml = (data = sampleAutoComparisonQuoteData) =>
  `<!DOCTYPE html>${renderToStaticMarkup(<AutoComparisonQuoteTemplate data={data} />)}`;
