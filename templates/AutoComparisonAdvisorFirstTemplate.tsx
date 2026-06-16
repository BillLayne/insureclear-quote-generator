import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BRAND } from '../config/brand';
import { sampleAutoComparisonQuoteData } from './AutoComparisonQuoteTemplate';

type ComparisonData = typeof sampleAutoComparisonQuoteData;
type ComparisonRow = ComparisonData['priceRows'][number];

const levelLabel = (level: ComparisonRow['level']) => {
  if (level === 'same') return 'Same';
  if (level === 'better-left') return 'National General better';
  if (level === 'better-right') return 'Progressive better';
  return 'Review';
};

const winnerCarrier = (data: ComparisonData) => {
  const rightWins = data.priceRows.filter((row) => row.level === 'better-right').length;
  const leftWins = data.priceRows.filter((row) => row.level === 'better-left').length;
  return rightWins >= leftWins ? data.rightCarrier : data.leftCarrier;
};

const compactRows = (rows: ComparisonRow[], count = 4) => rows.slice(0, count);

const MobileFriendlyRows = ({
  rows,
  leftLabel,
  rightLabel,
}: {
  rows: ComparisonRow[];
  leftLabel: string;
  rightLabel: string;
}) => (
  <div className="compare-card-list">
    {rows.map((row) => (
      <article className="compare-row-card" key={`${row.label}-${row.left}-${row.right}`}>
        <h3>{row.label}</h3>
        <div className="carrier-value carrier-left">
          <span>{leftLabel}</span>
          <strong>{row.left}</strong>
        </div>
        <div className="carrier-value carrier-right">
          <span>{rightLabel}</span>
          <strong>{row.right}</strong>
        </div>
        <div className="difference-line">
          <span className={`badge ${row.level}`}>{levelLabel(row.level)}</span>
          <p>{row.difference}</p>
        </div>
      </article>
    ))}
  </div>
);

export function AutoComparisonAdvisorFirstTemplate({ data = sampleAutoComparisonQuoteData }: { data?: ComparisonData }) {
  const winner = winnerCarrier(data);
  const other = winner.id === data.leftCarrier.id ? data.rightCarrier : data.leftCarrier;
  const sameCoverageCount = data.coverageRows.filter((row) => row.level === 'same').length;
  const reviewItems = [...data.coverageRows, ...data.discountRows].filter((row) => row.level === 'review').length;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`Advisor Comparison - ${data.leftCarrier.name} vs ${data.rightCarrier.name}`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --navy:#0b2234;
            --blue:#0058b9;
            --gold:#c8a84e;
            --green:#1a7a4e;
            --amber:#a15c00;
            --ink:#102033;
            --muted:#64748b;
            --line:#dbe4ee;
            --soft:#f4f7fb;
            --white:#fff;
            --max:1080px;
          }
          * { box-sizing:border-box; margin:0; padding:0; }
          body { font-family:Inter, system-ui, -apple-system, Segoe UI, sans-serif; background:#eef4f8; color:var(--ink); line-height:1.55; }
          a { color:inherit; text-decoration:none; }
          img { max-width:100%; display:block; }
          .page { max-width:var(--max); margin:0 auto; padding:24px 18px 88px; }
          .hero {
            color:#fff;
            border-radius:30px;
            overflow:hidden;
            background:
              linear-gradient(135deg, rgba(11,34,52,.96), rgba(18,50,74,.86)),
              url('https://i.imgur.com/i0oYQkO.png') center/cover no-repeat;
            box-shadow:0 22px 55px rgba(11,34,52,.16);
          }
          .hero-inner { padding:38px; display:grid; grid-template-columns:1.08fr .92fr; gap:26px; align-items:center; }
          .eyebrow { color:#f7db86; font-size:.78rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; margin-bottom:10px; }
          h1 { font-family:Outfit, Inter, sans-serif; font-size:clamp(2.1rem,4vw,3.4rem); line-height:1.02; letter-spacing:-.04em; }
          .hero p { color:rgba(255,255,255,.86); margin-top:14px; font-size:1.02rem; max-width:680px; }
          .market-note { margin-top:18px; display:grid; grid-template-columns:auto 1fr; gap:12px; background:rgba(255,255,255,.13); border:1px solid rgba(255,255,255,.24); border-radius:18px; padding:14px 16px; }
          .market-note b { display:block; color:#fff; }
          .market-note span { color:rgba(255,255,255,.82); font-size:.92rem; }
          .market-icon { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; background:var(--gold); color:var(--navy); font-weight:900; }
          .recommendation-card { background:rgba(255,255,255,.98); color:var(--ink); border-radius:24px; padding:24px; border:1px solid rgba(255,255,255,.85); }
          .recommendation-card img { max-height:42px; max-width:150px; object-fit:contain; background:#fff; border:1px solid var(--line); border-radius:10px; padding:8px; margin-bottom:14px; }
          .recommendation-card h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:1.75rem; line-height:1.05; }
          .recommendation-card p { color:var(--muted); margin-top:10px; font-size:.95rem; }
          .winner-pill { display:inline-block; color:var(--green); background:#eaf7ef; padding:7px 12px; border-radius:999px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; font-size:.76rem; margin-bottom:12px; }
          .actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; }
          .btn { display:inline-flex; justify-content:center; align-items:center; border-radius:999px; padding:13px 18px; font-weight:900; background:var(--navy); color:#fff; }
          .btn.gold { background:var(--gold); color:var(--navy); }
          .section { margin-top:22px; background:#fff; border:1px solid var(--line); border-radius:24px; box-shadow:0 12px 35px rgba(11,34,52,.06); padding:24px; }
          .section-head { display:flex; justify-content:space-between; gap:14px; align-items:flex-end; margin-bottom:16px; }
          .section-head h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:clamp(1.4rem,2vw,2rem); line-height:1.1; }
          .section-head span { color:var(--muted); font-weight:700; font-size:.9rem; }
          .decision-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
          .decision-card { border:1px solid var(--line); border-radius:20px; background:var(--soft); padding:18px; }
          .decision-card span { color:var(--muted); font-weight:900; font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; }
          .decision-card strong { display:block; color:var(--navy); font-size:1.3rem; margin-top:7px; line-height:1.15; }
          .decision-card p { color:var(--muted); margin-top:8px; font-size:.92rem; }
          .price-band { display:grid; grid-template-columns:1fr auto 1fr; gap:14px; align-items:stretch; }
          .price-card { border:1px solid var(--line); border-radius:22px; padding:20px; background:#fff; }
          .price-card.winner { background:#f4fbf7; border-color:rgba(26,122,78,.35); }
          .price-card img { height:34px; width:auto; object-fit:contain; margin-bottom:12px; }
          .price-card h3 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:1.35rem; }
          .price { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:2.4rem; font-weight:900; letter-spacing:-.05em; margin:8px 0; }
          .price-card dl { display:grid; gap:8px; margin-top:12px; }
          .price-card div { display:flex; justify-content:space-between; gap:12px; border-top:1px solid var(--line); padding-top:8px; }
          dt { color:var(--muted); font-weight:800; }
          dd { color:var(--navy); font-weight:900; }
          .vs { display:grid; place-items:center; color:var(--muted); font-weight:900; letter-spacing:.12em; }
          .compare-card-list { display:grid; gap:12px; }
          .compare-row-card { border:1px solid var(--line); border-radius:18px; background:#fff; padding:16px; }
          .compare-row-card h3 { color:var(--navy); font-size:1rem; line-height:1.2; margin-bottom:12px; }
          .carrier-value { display:grid; gap:4px; padding:12px 14px; border:1px solid var(--line); border-radius:14px; margin-top:10px; }
          .carrier-left { background:#f8fafc; border-color:#cbd5e1; box-shadow:inset 5px 0 0 #64748b; }
          .carrier-right { background:#eff6ff; border-color:#bfdbfe; box-shadow:inset 5px 0 0 var(--blue); }
          .carrier-value span { color:#475569; font-size:.78rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
          .carrier-right span { color:var(--blue); }
          .carrier-value strong { color:var(--navy); overflow-wrap:anywhere; }
          .difference-line { margin-top:12px; padding-top:12px; border-top:1px solid var(--line); display:flex; flex-direction:column; gap:8px; align-items:flex-start; }
          .badge { display:inline-block; border-radius:999px; padding:6px 10px; font-size:.72rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
          .same { background:#eef2f7; color:#475569; }
          .better-left { background:#eaf7ef; color:var(--green); }
          .better-right { background:#eaf7ef; color:var(--green); }
          .review { background:#fff7ed; color:var(--amber); }
          .difference-line p { color:var(--muted); }
          details { border:1px solid var(--line); border-radius:20px; background:#fff; overflow:hidden; }
          details + details { margin-top:12px; }
          summary { cursor:pointer; list-style:none; padding:18px 20px; background:var(--soft); color:var(--navy); font-weight:900; display:flex; justify-content:space-between; gap:14px; align-items:center; }
          summary::-webkit-details-marker { display:none; }
          summary span { color:var(--muted); font-size:.88rem; font-weight:700; }
          .details-body { padding:18px; }
          .agent-note { display:grid; grid-template-columns:.8fr 1.2fr; gap:22px; align-items:center; }
          .agent-note img { width:100%; height:255px; object-fit:cover; border-radius:20px; }
          .agent-note h2 { color:var(--navy); font-family:Outfit, Inter, sans-serif; font-size:1.9rem; line-height:1.1; }
          .agent-note p { color:var(--muted); margin-top:10px; }
          .sticky-actions { position:sticky; bottom:0; background:rgba(238,244,248,.95); border-top:1px solid var(--line); backdrop-filter:blur(10px); padding:14px 18px; }
          .sticky-inner { max-width:var(--max); margin:0 auto; display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
          @media (max-width:820px) {
            .hero-inner, .decision-grid, .price-band, .agent-note { grid-template-columns:1fr; }
            .hero-inner { padding:28px; }
            .section { padding:20px; }
            .section-head { display:block; }
            .section-head span { display:block; margin-top:6px; }
            .vs { min-height:22px; }
            .agent-note img { height:220px; }
            .sticky-inner .btn { flex:1 1 100%; }
          }
        `}</style>
      </head>
      <body>
        <main className="page">
          <section className="hero">
            <div className="hero-inner">
              <div>
                <div className="eyebrow">Auto Quote Comparison - {data.quoteDate}</div>
                <h1>Here is the clear winner between {data.leftCarrier.name} and {data.rightCarrier.name}.</h1>
                <p>{data.firstName}, we checked the auto insurance companies available through our agency. These are the top two choices from that review.</p>
                <div className="market-note">
                  <div className="market-icon">2</div>
                  <div>
                    <b>Top two finalists, not the only companies reviewed.</b>
                    <span>This page keeps the recommendation simple first, then gives the detailed proof below.</span>
                  </div>
                </div>
              </div>
              <aside className="recommendation-card">
                <span className="winner-pill">Recommended choice</span>
                <img src={winner.logoUrl} alt={winner.name} />
                <h2>{winner.name}</h2>
                <p>{data.recommendationBody}</p>
                <div className="actions">
                  <a className="btn gold" href={winner.actionUrl} target="_blank" rel="noreferrer">Choose {winner.name}</a>
                  <a className="btn" href={`mailto:${BRAND.email}?subject=Question about my auto comparison`}>Ask a Question</a>
                </div>
              </aside>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Decision snapshot</h2>
              <span>The short version before the details</span>
            </div>
            <div className="decision-grid">
              <article className="decision-card">
                <span>Best price</span>
                <strong>{winner.name}</strong>
                <p>{data.priceRows[0]?.difference || `${winner.name} has the stronger price position.`}</p>
              </article>
              <article className="decision-card">
                <span>Coverage match</span>
                <strong>{sameCoverageCount} items same</strong>
                <p>Most core coverages line up closely. The remaining differences are listed below.</p>
              </article>
              <article className="decision-card">
                <span>Needs review</span>
                <strong>{reviewItems || 'None flagged'}</strong>
                <p>Items marked review should be confirmed before binding or switching carriers.</p>
              </article>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Price comparison</h2>
              <span>This is usually the first decision point</span>
            </div>
            <div className="price-band">
              <article className={`price-card ${winner.id === data.leftCarrier.id ? 'winner' : ''}`}>
                <img src={data.leftCarrier.logoUrl} alt={data.leftCarrier.name} />
                <h3>{data.leftCarrier.name}</h3>
                <div className="price">{data.leftCarrier.monthlyPayment}</div>
                <dl>
                  <div><dt>Initial</dt><dd>{data.leftCarrier.initialPayment}</dd></div>
                  <div><dt>Total</dt><dd>{data.leftCarrier.termPremium}</dd></div>
                  <div><dt>Pay full</dt><dd>{data.leftCarrier.paidInFull}</dd></div>
                </dl>
              </article>
              <div className="vs">VS</div>
              <article className={`price-card ${winner.id === data.rightCarrier.id ? 'winner' : ''}`}>
                <img src={data.rightCarrier.logoUrl} alt={data.rightCarrier.name} />
                <h3>{data.rightCarrier.name}</h3>
                <div className="price">{data.rightCarrier.monthlyPayment}</div>
                <dl>
                  <div><dt>Initial</dt><dd>{data.rightCarrier.initialPayment}</dd></div>
                  <div><dt>Total</dt><dd>{data.rightCarrier.termPremium}</dd></div>
                  <div><dt>Pay full</dt><dd>{data.rightCarrier.paidInFull}</dd></div>
                </dl>
              </article>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Important differences</h2>
              <span>Only the rows that matter most</span>
            </div>
            <MobileFriendlyRows rows={compactRows(data.priceRows, 3)} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Coverage summary</h2>
              <span>Core coverage check</span>
            </div>
            <MobileFriendlyRows rows={compactRows(data.coverageRows, 5)} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Detailed proof</h2>
              <span>Open only if you want the line-by-line view</span>
            </div>
            <details>
              <summary>Vehicle-by-vehicle comparison <span>{data.vehicleComparisons.length} vehicles</span></summary>
              <div className="details-body">
                {data.vehicleComparisons.map((vehicle) => (
                  <details key={vehicle.vehicle}>
                    <summary>{vehicle.vehicle} <span>{vehicle.vin}</span></summary>
                    <div className="details-body">
                      <MobileFriendlyRows rows={vehicle.rows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
                    </div>
                  </details>
                ))}
              </div>
            </details>
            <details>
              <summary>Driver comparison <span>{data.driverComparisons.length} drivers</span></summary>
              <div className="details-body">
                <div className="compare-card-list">
                  {data.driverComparisons.map((driver) => (
                    <article className="compare-row-card" key={driver.driver}>
                      <h3>{driver.driver}</h3>
                      <div className="carrier-value carrier-left"><span>{data.leftCarrier.name}</span><strong>{driver.leftStatus}</strong></div>
                      <div className="carrier-value carrier-right"><span>{data.rightCarrier.name}</span><strong>{driver.rightStatus}</strong></div>
                      <div className="difference-line"><span className="badge same">Note</span><p>{driver.note}</p></div>
                    </article>
                  ))}
                </div>
              </div>
            </details>
            <details>
              <summary>Discount comparison <span>{data.discountRows.length} rows</span></summary>
              <div className="details-body">
                <MobileFriendlyRows rows={data.discountRows} leftLabel={data.leftCarrier.name} rightLabel={data.rightCarrier.name} />
              </div>
            </details>
          </section>

          <section className="section agent-note">
            <img src="https://i.imgur.com/h00mpPA.jpeg" alt="Bill Layne reviewing auto coverage with a customer" />
            <div>
              <div className="eyebrow" style={{ color: '#0f7b8f' }}>Advisor Note</div>
              <h2>The goal is a confident choice, not a spreadsheet project.</h2>
              <p>{winner.name} is the recommendation based on the comparison shown here. {other.name} is still included because it was one of the top two options and deserves a fair side-by-side review.</p>
              <p>Before anything is submitted, I will confirm the final carrier eligibility, drivers, vehicles, deductibles, discounts, and payment setup.</p>
            </div>
          </section>
        </main>

        <nav className="sticky-actions" aria-label="Comparison actions">
          <div className="sticky-inner">
            <a className="btn gold" href={winner.actionUrl} target="_blank" rel="noreferrer">Choose {winner.name}</a>
            <a className="btn" href={other.actionUrl} target="_blank" rel="noreferrer">Choose {other.name}</a>
            <a className="btn" href={`mailto:${BRAND.email}?subject=Question about my auto quote comparison`}>Ask Bill</a>
          </div>
        </nav>
      </body>
    </html>
  );
}

export const renderAutoComparisonAdvisorFirstSampleHtml = (data = sampleAutoComparisonQuoteData) =>
  `<!DOCTYPE html>${renderToStaticMarkup(<AutoComparisonAdvisorFirstTemplate data={data} />)}`;
