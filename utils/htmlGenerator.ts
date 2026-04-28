import { InsuranceData, Vehicle, Driver } from '../types';

/* -------------------------------------------------------------------------- */
/*                                AUTO TEMPLATE                               */
/* -------------------------------------------------------------------------- */
const generateAutoHtml = (data: InsuranceData): string => {
  // 1. Drivers HTML
  const driversHtml = data.drivers?.map(d => `
    <div class="driver-card">
      <div class="driver-name">👤 ${d.name} ${d.isRated ? '<span class="driver-badge">Rated</span>' : ''}</div>
      <div class="driver-details">${d.details}</div>
    </div>
  `).join('') || '';

  // 2. Policy-Wide Coverages HTML
  const policyCoveragesHtml = data.coverages.map(c => `
    <div class="cov-card ${c.color}">
      <div class="cov-header">
        <div class="cov-title">${c.icon} ${c.title}</div>
        <div class="cov-amount">${c.amount}</div>
      </div>
      <div class="cov-explain">${c.explanation}</div>
    </div>
  `).join('');

  // 3. Vehicles HTML
  const vehiclesHtml = data.vehicles?.map(v => {
    // Build the coverage rows for this vehicle
    const vehicleCoveragesHtml = v.coverages?.map(vc => `
      <div class="vc-row">
        <div class="vc-name"><span class="vc-icon">${vc.icon || '🔹'}</span> ${vc.name} ${vc.deductible ? `<span style="color:#94a3b8;font-size:8.5px;margin-left:2px;">${vc.deductible} ded</span>` : ''}</div>
        <div class="vc-premium ${vc.included ? 'vc-included' : ''}">${vc.included ? 'Included' : (vc.premium || '-')}</div>
      </div>
    `).join('') || '<div class="vc-row"><div class="vc-name">Coverage details see above</div></div>';

    return `
    <div class="vehicle-box">
      <div class="vehicle-header">
        <h3>🚙 ${v.year} ${v.make} ${v.model}</h3>
        <div>
          <div class="vehicle-premium">${v.annualPremium || '-'}</div>
          <div class="vehicle-premium-label">/ year</div>
        </div>
      </div>
      <div class="vehicle-meta">
        <span>VIN: ${v.vin.slice(-8)}</span><span class="sep">|</span>
        <span>${v.usage || ''}</span><span class="sep">|</span>
        <span>${v.zip || ''}</span>
      </div>
      <div class="vehicle-coverages-compact">
        ${vehicleCoveragesHtml}
      </div>
      <div class="vehicle-total-bar">
        <span>Vehicle Total</span>
        <span class="vt-amount">${v.annualPremium || '-'}</span>
      </div>
    </div>
    `;
  }).join('') || '';

  // 4. Premium Breakdown HTML
  const vehiclePremiumsHtml = data.vehicles?.map(v => `
    <div class="premium-row">
      <span>🚙 ${v.year} ${v.make} ${v.model}</span>
      <span>${v.annualPremium || '$0.00'}</span>
    </div>
  `).join('') || '';

  // 5. Payment Options HTML
  const paymentOptionsHtml = data.paymentOptions?.map((p, idx) => `
    <tr class="${idx === 0 ? 'pay-highlight' : ''}">
      <td>${p.planName} ${idx === 0 ? '<span class="pay-badge">Recommended</span>' : ''}</td>
      <td>${p.downPayment}</td>
      <td>${p.installments || `x ${p.monthlyAmount}/mo`}</td>
    </tr>
  `).join('') || '';

  const discountsHtml = data.discounts.map(d => `<span class="discount-tag">${d}</span>`).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Auto Insurance Quote - ${data.customer.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.35in 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Source Sans 3', sans-serif; color: #2d3748; font-size: 12px; line-height: 1.35; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; min-height: 10in; margin: 0 auto; padding: 0.3in 0.5in; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  
  /* HEADER */
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 7px; border-bottom: 3px solid #1a3a5c; margin-bottom: 8px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-title h1 { font-family: 'Merriweather', serif; font-size: 17px; font-weight: 900; color: #1a3a5c; letter-spacing: -0.3px; }
  .header-title p { font-size: 10px; color: #64748b; margin-top: 1px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
  .header-carrier { text-align: right; }
  .header-carrier .carrier-name { font-family: 'Merriweather', serif; font-size: 12px; font-weight: 700; color: #1a3a5c; }
  .header-carrier .carrier-sub { font-size: 9.5px; color: #94a3b8; margin-top: 1px; }

  /* CUSTOMER INFO */
  .customer-bar { background: linear-gradient(135deg, #f0f5fa 0%, #e8eff7 100%); border-radius: 7px; padding: 7px 12px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border: 1px solid #d4e0ed; }
  .customer-info h2 { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; color: #1a3a5c; margin-bottom: 1px; }
  .customer-info .address { font-size: 11px; color: #475569; }
  .quote-details { text-align: right; font-size: 11px; color: #475569; }
  .quote-details .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; font-weight: 600; }
  .quote-details .value { font-weight: 700; color: #1a3a5c; font-size: 12px; }

  /* GENERAL */
  .section-title { font-family: 'Merriweather', serif; font-size: 11.5px; font-weight: 700; color: #1a3a5c; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 5px; }
  .section-title .icon { font-size: 12px; }

  /* DRIVERS */
  .drivers-row { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
  .driver-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; background: #fff; position: relative; overflow: hidden; min-width: 45%; }
  .driver-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #2563eb; border-radius: 6px 0 0 6px; }
  .driver-name { font-weight: 700; font-size: 11.5px; color: #1a3a5c; display: flex; align-items: center; gap: 4px; margin-bottom: 1px; }
  .driver-details { font-size: 10px; color: #64748b; line-height: 1.3; }
  .driver-badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.3px; margin-left: 3px; }

  /* COVERAGES */
  .policy-coverages { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; margin-bottom: 8px; }
  .cov-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; background: #fff; position: relative; overflow: hidden; }
  .cov-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 6px 0 0 6px; }
  .cov-card.blue::before { background: #2563eb; }
  .cov-card.green::before { background: #16a34a; }
  .cov-card.amber::before { background: #d97706; }
  .cov-card.purple::before { background: #7c3aed; }
  .cov-card.teal::before { background: #0d9488; }
  .cov-card.rose::before { background: #e11d48; }
  .cov-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .cov-title { font-weight: 700; font-size: 10px; color: #1a3a5c; display: flex; align-items: center; gap: 3px; }
  .cov-amount { font-family: 'Merriweather', serif; font-weight: 900; font-size: 11px; color: #1a3a5c; white-space: nowrap; }
  .cov-explain { font-size: 9.5px; color: #64748b; line-height: 1.2; }

  /* VEHICLES */
  .vehicles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
  .vehicle-box { border: 1px solid #d4e0ed; border-radius: 7px; overflow: hidden; }
  .vehicle-header { background: linear-gradient(135deg, #1e3a5f 0%, #2a5080 100%); color: #fff; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center; }
  .vehicle-header h3 { font-family: 'Merriweather', serif; font-size: 10px; font-weight: 700; display: flex; align-items: center; gap: 4px; line-height: 1.25; }
  .vehicle-header .vehicle-premium { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 900; white-space: nowrap; }
  .vehicle-header .vehicle-premium-label { font-size: 7px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.3px; text-align: right; }
  .vehicle-meta { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 9px; color: #64748b; padding: 3px 8px; gap: 4px; flex-wrap: wrap; }
  .vehicle-meta .sep { color: #cbd5e1; }
  .vehicle-coverages-compact { padding: 4px 8px; }
  .vc-row { display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
  .vc-row:last-child { border-bottom: none; }
  .vc-name { color: #475569; flex: 1; display: flex; align-items: center; gap: 3px; }
  .vc-name .vc-icon { font-size: 10px; }
  .vc-premium { font-weight: 700; color: #1a3a5c; flex-shrink: 0; text-align: right; min-width: 48px; }
  .vc-included { color: #16a34a; font-weight: 600; font-size: 9px; }
  .vehicle-total-bar { background: #f0f5fa; padding: 3px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 10.5px; color: #1a3a5c; }
  .vehicle-total-bar .vt-amount { font-family: 'Merriweather', serif; font-size: 12px; font-weight: 900; }

  /* PREMIUM & PAYMENTS */
  .premium-box { border: 2px solid #1a3a5c; border-radius: 7px; overflow: hidden; margin-bottom: 8px; }
  .premium-header { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); color: #fff; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
  .premium-header h3 { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 700; }
  .premium-total { font-family: 'Merriweather', serif; font-size: 22px; font-weight: 900; }
  .premium-sub { font-size: 9px; opacity: 0.8; }
  .premium-breakdown { padding: 6px 14px; background: #f8fafc; }
  .premium-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10.5px; color: #475569; }
  .premium-monthly { text-align: center; padding: 5px 14px; background: #e8eff7; font-size: 11px; color: #1a3a5c; }
  .premium-monthly strong { font-size: 15px; font-family: 'Merriweather', serif; }
  
  .pay-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  .pay-table th { text-align: left; font-size: 8px; text-transform: uppercase; color: #94a3b8; font-weight: 600; padding: 3px 6px; border-bottom: 2px solid #e2e8f0; }
  .pay-table th:last-child { text-align: right; }
  .pay-table td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; color: #475569; }
  .pay-table td:last-child { text-align: right; font-weight: 600; color: #1a3a5c; }
  .pay-highlight { background: #f0fdf4; }
  .pay-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 8px; margin-left: 3px; }

  /* MISC */
  .not-covered { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; }
  .not-covered h3 { font-weight: 700; font-size: 11px; color: #991b1b; margin-bottom: 2px; display: flex; align-items: center; gap: 4px; }
  .not-covered p { font-size: 10px; color: #b91c1c; line-height: 1.3; }
  
  .discounts-bar { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #86efac; border-radius: 6px; padding: 5px 10px; margin-bottom: 6px; }
  .discounts-bar h3 { font-weight: 700; font-size: 10.5px; color: #166534; margin-bottom: 3px; display: flex; align-items: center; gap: 4px; }
  .discount-tags { display: flex; gap: 4px; flex-wrap: wrap; }
  .discount-tag { background: #bbf7d0; color: #14532d; font-size: 9px; font-weight: 600; padding: 1px 7px; border-radius: 10px; }

  .glossary { margin-bottom: 8px; }
  .glossary-item { display: flex; gap: 6px; padding: 2px 0; border-bottom: 1px solid #f1f5f9; }
  .glossary-term { font-weight: 700; font-size: 10px; color: #1a3a5c; min-width: 90px; }
  .glossary-def { font-size: 9.5px; color: #64748b; }

  .cta-box { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); border-radius: 7px; padding: 10px 16px; text-align: center; margin-bottom: 8px; color: #fff; }
  .cta-box h3 { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .cta-box p { font-size: 10px; opacity: 0.85; margin-bottom: 5px; }
  .cta-contacts { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; }
  .cta-contact { font-size: 11px; font-weight: 700; }
  .cta-contact a { color: #93c5fd; text-decoration: none; }

  .footer { margin-top: auto; padding-top: 8px; border-top: 2px solid #e2e8f0; text-align: center; }
  .footer-logo { height: 30px; width: auto; margin-bottom: 2px; }
  .footer-info { font-size: 9.5px; color: #94a3b8; line-height: 1.35; }
  .footer-info a { color: #2563eb; text-decoration: none; }
  .footer-disclaimer { margin-top: 3px; font-size: 8.5px; color: #b0bec5; font-style: italic; }

  /* B&W PRINT OPTIMIZATIONS */
  @media print {
    body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: auto; padding: 0; margin: 0; border: none; }
    
    /* Force high contrast text */
    * { color: #000 !important; text-shadow: none !important; }
    
    /* Remove colored backgrounds/gradients */
    .header, .customer-bar, .vehicle-header, .premium-header, .cta-box, .discounts-bar, .not-covered, .vehicle-meta, .vehicle-total-bar, .premium-breakdown, .premium-monthly, .pay-highlight {
      background: #fff !important;
      background-image: none !important;
    }
    
    /* Add borders to define sections */
    .customer-bar, .discounts-bar, .not-covered, .cta-box { border: 1px solid #000 !important; }
    .vehicle-box, .premium-box, .driver-card, .cov-card { border: 1px solid #000 !important; }
    
    /* Header distinctions */
    .vehicle-header, .premium-header {
      border-bottom: 1px solid #000 !important;
      background: #f0f0f0 !important; /* Light gray for headers */
    }
    .header { border-bottom: 2px solid #000 !important; }
    .section-title { border-bottom: 1px solid #000 !important; }

    /* Card colored bars -> black */
    .driver-card::before, .cov-card::before { background: #000 !important; }
    
    /* Badges -> Outline style */
    .driver-badge, .pay-badge, .discount-tag {
      background: #fff !important;
      border: 1px solid #000 !important;
      font-weight: bold !important;
    }
    
    /* Tables/Lists */
    .pay-table th { border-bottom: 1px solid #000 !important; }
    .pay-table td, .vc-row, .premium-row, .glossary-item { border-bottom: 1px solid #ccc !important; }
    
    /* Hide URL links visual, keep text */
    a { text-decoration: none !important; }
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="header">
    <div class="header-left">
       ${data.agent.logoUrl ? `<img src="${data.agent.logoUrl}" alt="Agency Logo" style="height:46px; width:auto;">` : ''}
       <div class="header-title">
         <h1>Your Auto Insurance Quote</h1>
         <p>Personalized Coverage Summary</p>
       </div>
    </div>
    <div class="header-carrier">
      <div class="carrier-name">${data.carrier.name}</div>
      <div class="carrier-sub">${data.carrier.subText}</div>
    </div>
  </div>

  <div class="customer-bar">
    <div class="customer-info">
      <h2>${data.customer.name}</h2>
      <div class="address">${data.customer.address}</div>
    </div>
    <div class="quote-details">
      <div class="date-row"><div class="label">Policy Term</div><div class="value">${data.customer.policyPeriod}</div></div>
      <div class="date-row"><div class="label">Quote Date</div><div class="value">${data.customer.quoteDate}</div></div>
    </div>
  </div>

  <div class="section-title"><span class="icon">👤</span> Drivers on This Policy</div>
  <div class="drivers-row">
    ${driversHtml}
  </div>

  <div class="section-title"><span class="icon">🛡️</span> Coverage Limits — Same on All Vehicles</div>
  <div class="policy-coverages">
    ${policyCoveragesHtml}
  </div>

  <div class="section-title"><span class="icon">🚘</span> Vehicle Coverage Breakdown</div>
  <div class="vehicles-grid">
    ${vehiclesHtml}
  </div>

  <div class="discounts-bar">
    <h3>✅ Discounts Applied to Your Quote</h3>
    <div class="discount-tags">
      ${discountsHtml}
    </div>
  </div>

  <div class="footer">
    ${data.agent.logoUrl ? `<img src="${data.agent.logoUrl}" alt="Agency Logo" class="footer-logo">` : ''}
    <div class="footer-info">
      ${data.agent.address} &bull; <strong>${data.agent.phone}</strong> &bull; <a href="mailto:${data.agent.email}">${data.agent.email}</a> &bull; <a href="https://${data.agent.website}">${data.agent.website}</a>
    </div>
    <div class="footer-disclaimer">Page 1 of 2 &bull; This is a quote only. Coverage is not bound until a policy is issued.</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page2-header">
    <h2>Premium Summary, Payment Options & Important Info</h2>
    <div class="name-ref">${data.customer.name}</div>
  </div>

  <div class="premium-box">
    <div class="premium-header">
      <div><h3>Your Premium</h3><div class="premium-sub">Total Policy Cost</div></div>
      <div style="text-align:right;"><div class="premium-total">${data.premium.totalAnnual}</div><div class="premium-sub">/term</div></div>
    </div>
    <div class="premium-breakdown">
      ${vehiclePremiumsHtml}
      <div class="premium-row" style="border-top:1px solid #e2e8f0;padding-top:3px;margin-top:2px;">
        <span>Subtotal</span><span>${data.premium.base}</span>
      </div>
       <div class="premium-row fee"><span>Fees/Other</span><span>${data.premium.extrasCost}</span></div>
    </div>
    <div class="premium-monthly">That's approximately <strong>${data.premium.monthlyEstimate}</strong> per month</div>
  </div>

  <div class="section-title"><span class="icon">💳</span> Payment Plan Options</div>
  <div class="payment-options">
    <table class="pay-table">
      <thead><tr><th>Plan</th><th>Down Payment</th><th>Then Pay</th></tr></thead>
      <tbody>
        ${paymentOptionsHtml}
      </tbody>
    </table>
  </div>

  <div class="not-covered">
    <h3>⚠️ What's Generally NOT Covered</h3>
    <p>${data.notCovered}</p>
  </div>

  <div class="section-title"><span class="icon">📖</span> Quick Auto Insurance Terms Made Simple</div>
  <div class="glossary">
      <div class="glossary-item"><div class="glossary-term">Liability</div><div class="glossary-def">Covers damage or injuries <strong>you cause to others</strong>.</div></div>
      <div class="glossary-item"><div class="glossary-term">Collision</div><div class="glossary-def">Pays to fix your car after hitting another vehicle or object, regardless of fault.</div></div>
      <div class="glossary-item"><div class="glossary-term">Comprehensive</div><div class="glossary-def">Covers non-crash damage: theft, hail, flood, fire, animal strikes.</div></div>
      <div class="glossary-item"><div class="glossary-term">UM / UIM</div><div class="glossary-def">Protects you when the other driver has no or too little insurance.</div></div>
      <div class="glossary-item"><div class="glossary-term">Medical Payments</div><div class="glossary-def">Pays medical bills for you and your passengers after an accident.</div></div>
      <div class="glossary-item"><div class="glossary-term">Deductible</div><div class="glossary-def">The amount you pay out-of-pocket before insurance covers the rest.</div></div>
  </div>

  <div class="cta-box">
    <h3>Ready to Get Covered?</h3>
    <p>This quote is valid for a limited time. Contact us today.</p>
    <div class="cta-contacts">
      <div class="cta-contact">📞 <a href="tel:${data.agent.phone}">${data.agent.phone}</a></div>
      <div class="cta-contact">📧 <a href="mailto:${data.agent.email}">${data.agent.email}</a></div>
      <div class="cta-contact">🌐 <a href="https://${data.agent.website}">${data.agent.website}</a></div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-info">
      ${data.agent.address} &bull; <strong>${data.agent.phone}</strong> &bull; <a href="mailto:${data.agent.email}">${data.agent.email}</a>
    </div>
    <div class="footer-disclaimer">Page 2 of 2 &bull; This is a quote only. Coverage is not bound until a policy is issued.</div>
  </div>
</div>

</body>
</html>
  `;
};

/* -------------------------------------------------------------------------- */
/*                                HOME HERO TEMPLATE (V3)                     */
/* -------------------------------------------------------------------------- */
const generateHomeHeroHtml = (data: InsuranceData): string => {
  const p = data.property || { type: '-', built: '-', construction: '-', acreage: '-', fireProtection: '-', occupancy: '-' };

  // Helper to safely format annual to monthly
  const annual = parseFloat(data.premium.totalAnnual.replace(/[^0-9.]/g, '')) || 0;
  const monthlyExact = annual / 12;
  const monthlyDisplay = Math.floor(monthlyExact); // Rounded down for hero badge

  // Generate Coverages Grid
  const coveragesHtml = data.coverages.map(c => `
    <div class="coverage-card ${c.color}">
      <div class="card-header">
        <div class="card-title">${c.icon} ${c.title}</div>
        <div class="card-amount">${c.amount}</div>
      </div>
      <div class="card-explain">${c.explanation}</div>
    </div>
  `).join('');

  const extrasHtml = data.extras.map(e => `
    <tr>
      <td>
        <div class="extra-name">${e.icon} ${e.name}</div>
        <div class="extra-desc">${e.description}</div>
      </td>
      <td class="extra-cost">${e.isIncluded ? '<span class="included-badge">Included</span>' : e.cost}</td>
    </tr>
  `).join('');

  const discountsHtml = data.discounts.map(d => `<span class="discount-tag">${d}</span>`).join('');

  // Default glossary for Home
  const glossaryHtml = `
      <div class="glossary-item"><div class="glossary-term">Deductible</div><div class="glossary-def">The amount you pay first before insurance pays the rest. Think of it like a co-pay at the doctor.</div></div>
      <div class="glossary-item"><div class="glossary-term">Premium</div><div class="glossary-def">The price you pay for your insurance policy — typically paid annually or monthly.</div></div>
      <div class="glossary-item"><div class="glossary-term">Replacement Cost</div><div class="glossary-def">The amount it costs to replace a damaged item with a brand-new one — no reduction for age or wear.</div></div>
      <div class="glossary-item"><div class="glossary-term">HO-3 Policy</div><div class="glossary-def">The most common homeowner policy type. Covers your home against all risks except those specifically excluded.</div></div>
  `;

  // Hardcoded Agency Constants for Home Hero Template
  const AGENCY = {
    name: "Bill Layne Insurance Agency",
    address: "1283 N Bridge St, Elkin, NC 28621",
    phone: "336-835-1993",
    email: "Save@BillLayneInsurance.com",
    website: "www.BillLayneInsurance.com",
    logoUrl: "https://i.imgur.com/zCUkP2V.png"
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Home Quote - ${data.customer.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.25in 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Source Sans 3', sans-serif; color: #2d3748; font-size: 13px; line-height: 1.4; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; min-height: 10.2in; max-height: 11in; margin: 0 auto; padding: 0.25in 0.5in; page-break-after: always; position: relative; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  
  /* SLIM TOP BAR */
  .top-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; margin-bottom: 8px; border-bottom: 3px solid #1a3a5c; }
  .top-bar-left { display: flex; align-items: center; gap: 10px; }
  .top-bar-logo { height: 32px; width: auto; }
  .top-bar-title { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 700; color: #1a3a5c; }
  .top-bar-right { text-align: right; }
  .top-bar-carrier { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 700; color: #1a3a5c; }
  .top-bar-sub { font-size: 10px; color: #94a3b8; }

  /* HOME PHOTO HERO — BIG & CLEAN */
  .home-hero { border-radius: 10px; overflow: hidden; margin-bottom: 0; position: relative; border: 3px solid #1a3a5c; background: #e2e8f0; min-height: 230px; }
  .home-hero img { width: 100%; height: 230px; object-fit: cover; object-position: center; display: block; background: #e2e8f0; }
  .home-hero-label { position: absolute; bottom: 10px; left: 12px; background: rgba(26,58,92,0.9); color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 5px; letter-spacing: 0.3px; }
  .home-hero-label span { color: #93c5fd; }

  /* CUSTOMER + PRICE BANNER */
  .info-banner { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 10px; border-radius: 0 0 10px 10px; overflow: hidden; border: 3px solid #1a3a5c; border-top: none; }
  .info-banner-left { flex: 1; background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); padding: 10px 16px; color: #fff; }
  .banner-name { font-family: 'Merriweather', serif; font-size: 16px; font-weight: 900; color: #fff; line-height: 1.2; }
  .banner-address { font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 2px; }
  .banner-period { font-size: 11px; color: rgba(255,255,255,0.65); margin-top: 3px; }
  .info-banner-right { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 10px 18px; text-align: center; min-width: 160px; display: flex; flex-direction: column; justify-content: center; }
  .price-label { font-size: 9px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
  .price-monthly { font-family: 'Merriweather', serif; font-size: 30px; font-weight: 900; color: #fff; line-height: 1.05; }
  .price-mo { font-size: 14px; font-weight: 400; }
  .price-annual { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 2px; }

  /* PROPERTY SNAPSHOT */
  .property-snapshot { display: flex; gap: 0; margin-bottom: 10px; border: 1px solid #d4e0ed; border-radius: 7px; overflow: hidden; }
  .prop-item { flex: 1; text-align: center; padding: 6px 4px; border-right: 1px solid #d4e0ed; }
  .prop-item:last-child { border-right: none; }
  .prop-icon { font-size: 15px; margin-bottom: 1px; }
  .prop-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; }
  .prop-value { font-size: 12px; font-weight: 700; color: #1a3a5c; }

  /* SECTION TITLE */
  .section-title { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; color: #1a3a5c; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 6px; }
  .section-title .icon { font-size: 15px; }

  /* COVERAGE CARDS */
  .coverage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .coverage-card { border: 1px solid #e2e8f0; border-radius: 7px; padding: 8px 11px; background: #fff; position: relative; overflow: hidden; }
  .coverage-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 7px 0 0 7px; }
  .coverage-card.blue::before { background: #2563eb; }
  .coverage-card.green::before { background: #16a34a; }
  .coverage-card.amber::before { background: #d97706; }
  .coverage-card.purple::before { background: #7c3aed; }
  .coverage-card.teal::before { background: #0d9488; }
  .coverage-card.rose::before { background: #e11d48; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .card-title { font-weight: 700; font-size: 12px; color: #1a3a5c; display: flex; align-items: center; gap: 4px; }
  .card-amount { font-family: 'Merriweather', serif; font-weight: 900; font-size: 14px; color: #1a3a5c; white-space: nowrap; }
  .card-explain { font-size: 11px; color: #64748b; line-height: 1.3; }

  /* DEDUCTIBLE */
  .deductible-bar { background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); border: 1px solid #f5d679; border-radius: 7px; padding: 8px 12px; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .ded-icon { font-size: 20px; }
  .ded-text h3 { font-weight: 700; font-size: 13px; color: #92400e; }
  .ded-text p { font-size: 11px; color: #a16207; line-height: 1.3; }
  .ded-amount { margin-left: auto; font-family: 'Merriweather', serif; font-weight: 900; font-size: 20px; color: #92400e; }

  /* DISCOUNTS */
  .discounts-bar { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #86efac; border-radius: 7px; padding: 8px 12px; margin-bottom: 8px; }
  .discounts-bar h3 { font-weight: 700; font-size: 12px; color: #166534; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
  .discount-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .discount-tag { background: #bbf7d0; color: #14532d; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 12px; }

  /* FOOTER */
  .footer { margin-top: auto; padding-top: 8px; border-top: 2px solid #e2e8f0; text-align: center; }
  .footer-logo { height: 30px; width: auto; margin-bottom: 3px; }
  .footer-info { font-size: 10px; color: #94a3b8; line-height: 1.4; }
  .footer-info a { color: #2563eb; text-decoration: none; }
  .footer-disclaimer { margin-top: 3px; font-size: 9px; color: #b0bec5; font-style: italic; line-height: 1.3; }

  /* PAGE 2 ELEMENTS */
  .page2-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 3px solid #1a3a5c; margin-bottom: 12px; }
  .page2-header h2 { font-family: 'Merriweather', serif; font-size: 15px; font-weight: 700; color: #1a3a5c; }
  .page2-header .name-ref { font-size: 10px; color: #94a3b8; }

  .extras-section { margin-bottom: 12px; }
  .extras-table { width: 100%; border-collapse: collapse; }
  .extras-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; font-weight: 600; padding: 5px 10px; border-bottom: 2px solid #e2e8f0; }
  .extras-table th:last-child { text-align: right; }
  .extras-table td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .extra-name { font-weight: 700; font-size: 13px; color: #1a3a5c; display: flex; align-items: center; gap: 5px; }
  .extra-desc { font-size: 11px; color: #64748b; margin-top: 2px; line-height: 1.3; }
  .extra-cost { text-align: right; font-weight: 700; font-size: 13px; color: #1a3a5c; white-space: nowrap; }
  .included-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.4px; }

  .premium-box { border: 2px solid #1a3a5c; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
  .premium-header { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .premium-header h3 { font-family: 'Merriweather', serif; font-size: 15px; font-weight: 700; }
  .premium-total { font-family: 'Merriweather', serif; font-size: 26px; font-weight: 900; }
  .premium-sub { font-size: 11px; opacity: 0.8; }
  .premium-breakdown { padding: 8px 16px; background: #f8fafc; }
  .premium-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #475569; }
  .premium-row.savings { color: #16a34a; font-weight: 600; }
  .premium-monthly { text-align: center; padding: 8px 16px; background: #e8eff7; font-size: 13px; color: #1a3a5c; }
  .premium-monthly strong { font-size: 18px; font-family: 'Merriweather', serif; }

  .not-covered { background: #fef2f2; border: 1px solid #fecaca; border-radius: 7px; padding: 9px 12px; margin-bottom: 12px; }
  .not-covered h3 { font-weight: 700; font-size: 13px; color: #991b1b; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
  .not-covered p { font-size: 11.5px; color: #b91c1c; line-height: 1.35; }

  .glossary { margin-bottom: 12px; }
  .glossary-item { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
  .glossary-term { font-weight: 700; font-size: 12px; color: #1a3a5c; min-width: 110px; }
  .glossary-def { font-size: 11.5px; color: #64748b; line-height: 1.3; }

  .cta-box { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); border-radius: 8px; padding: 14px 18px; text-align: center; margin-bottom: 10px; color: #fff; }
  .cta-box h3 { font-family: 'Merriweather', serif; font-size: 15px; font-weight: 700; margin-bottom: 3px; }
  .cta-box p { font-size: 12px; opacity: 0.85; margin-bottom: 6px; }
  .cta-contacts { display: flex; justify-content: center; gap: 22px; flex-wrap: wrap; }
  .cta-contact { font-size: 13px; font-weight: 700; }
  .cta-contact a { color: #93c5fd; text-decoration: none; }

  /* B&W PRINT OPTIMIZATIONS (HOME HERO SPECIFIC) */
  @media print {
    body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: auto; padding: 0; margin: 0; border: none; }
    * { text-shadow: none !important; }
    a { text-decoration: none !important; color: #000 !important; }

    /* TOP BAR */
    .top-bar { border-bottom: 3px solid #000 !important; }
    .top-bar-title, .top-bar-carrier { color: #000 !important; }
    .top-bar-sub { color: #666 !important; }

    /* HERO IMAGE */
    .home-hero { border: 3px solid #000 !important; }
    .home-hero-label { background: rgba(0,0,0,0.85) !important; color: #fff !important; }
    .home-hero-label span { color: #fff !important; }

    /* INFO BANNER */
    .info-banner { border: 3px solid #000 !important; }
    .info-banner-left { background: #222 !important; color: #fff !important; }
    .banner-name { color: #fff !important; }
    .banner-address { color: rgba(255,255,255,0.9) !important; }
    .banner-period { color: rgba(255,255,255,0.7) !important; }
    .info-banner-right { background: #fff !important; border-left: 3px solid #000 !important; }
    .price-label { color: #555 !important; }
    .price-monthly { color: #000 !important; }
    .price-annual { color: #444 !important; }

    /* PROPERTY SNAPSHOT */
    .property-snapshot { border: 2px solid #000 !important; }
    .prop-item { border-right: 1px solid #000 !important; }
    .prop-label { color: #666 !important; }
    .prop-value { color: #000 !important; }

    /* SECTION TITLES */
    .section-title { color: #000 !important; border-bottom: 2px solid #000 !important; }

    /* COVERAGE CARDS */
    .coverage-card { border: 1.5px solid #000 !important; }
    .coverage-card::before { background: #000 !important; }
    .card-title { color: #000 !important; }
    .card-amount { color: #000 !important; }
    .card-explain { color: #444 !important; }

    /* DEDUCTIBLE BAR */
    .deductible-bar { background: #f5f5f5 !important; border: 2px solid #000 !important; }
    .ded-text h3 { color: #000 !important; }
    .ded-text p { color: #444 !important; }
    .ded-amount { color: #000 !important; }

    /* DISCOUNTS BAR */
    .discounts-bar { background: #f5f5f5 !important; border: 1.5px solid #000 !important; }
    .discounts-bar h3 { color: #000 !important; }
    .discount-tag { background: #fff !important; border: 1.5px solid #000 !important; color: #000 !important; }

    /* FOOTER */
    .footer { border-top: 2px solid #000 !important; }
    .footer-info { color: #444 !important; }
    .footer-info a { color: #000 !important; }
    .footer-info strong { color: #000 !important; }
    .footer-disclaimer { color: #777 !important; }

    /* PAGE 2 HEADER */
    .page2-header { border-bottom: 3px solid #000 !important; }
    .page2-header h2 { color: #000 !important; }

    /* EXTRAS TABLE */
    .extras-table th { color: #555 !important; border-bottom: 2px solid #000 !important; }
    .extras-table td { border-bottom: 1px solid #ccc !important; }
    .extra-name { color: #000 !important; }
    .extra-desc { color: #444 !important; }
    .extra-cost { color: #000 !important; }
    .included-badge { background: #fff !important; border: 1.5px solid #000 !important; color: #000 !important; }

    /* PREMIUM BOX */
    .premium-box { border: 3px solid #000 !important; }
    .premium-header { background: #222 !important; color: #fff !important; }
    .premium-header h3 { color: #fff !important; }
    .premium-total { color: #fff !important; }
    .premium-sub { color: rgba(255,255,255,0.8) !important; }
    .premium-breakdown { background: #f5f5f5 !important; }
    .premium-row { color: #000 !important; }
    .premium-row.savings { color: #000 !important; font-weight: 700 !important; }
    .premium-monthly { background: #eee !important; color: #000 !important; }
    .premium-monthly strong { color: #000 !important; }

    /* NOT COVERED */
    .not-covered { background: #f5f5f5 !important; border: 2px solid #000 !important; }
    .not-covered h3 { color: #000 !important; }
    .not-covered p { color: #333 !important; }

    /* GLOSSARY */
    .glossary-item { border-bottom: 1px solid #ccc !important; }
    .glossary-term { color: #000 !important; }
    .glossary-def { color: #444 !important; }

    /* CTA BOX */
    .cta-box { background: #222 !important; border: 3px solid #000 !important; color: #fff !important; }
    .cta-box h3 { color: #fff !important; }
    .cta-box p { color: rgba(255,255,255,0.85) !important; }
    .cta-contact { color: #fff !important; }
    .cta-contact a { color: #fff !important; }
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="top-bar">
    <div class="top-bar-left">
      <img src="${AGENCY.logoUrl}" alt="${AGENCY.name}" class="top-bar-logo">
      <div class="top-bar-title">Your Home Insurance Quote</div>
    </div>
    <div class="top-bar-right">
      <div class="top-bar-carrier">${data.carrier.name}</div>
      <div class="top-bar-sub">${data.carrier.subText}</div>
    </div>
  </div>

  <div class="home-hero">
    <img src="${data.homePhotoUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}" alt="Your home at ${data.customer.address}" referrerpolicy="no-referrer">
    <div class="home-hero-label">
      📸 <span>Your Home</span> — ${data.customer.address}
    </div>
  </div>

  <div class="info-banner">
    <div class="info-banner-left">
      <div class="banner-name">${data.customer.name}</div>
      <div class="banner-address">${data.customer.address}</div>
      <div class="banner-period">Policy Period: ${data.customer.policyPeriod} &bull; Quote Date: ${data.customer.quoteDate}</div>
    </div>
    <div class="info-banner-right">
      <div class="price-label">As Low As</div>
      <div class="price-monthly">$${monthlyDisplay}<span class="price-mo">/mo</span></div>
      <div class="price-annual">${data.premium.totalAnnual} / year</div>
    </div>
  </div>

  <div class="property-snapshot">
    <div class="prop-item"><div class="prop-icon">🏠</div><div class="prop-label">Home Type</div><div class="prop-value">${p.type}</div></div>
    <div class="prop-item"><div class="prop-icon">🔨</div><div class="prop-label">Built</div><div class="prop-value">${p.built}</div></div>
    <div class="prop-item"><div class="prop-icon">🪵</div><div class="prop-label">Construction</div><div class="prop-value">${p.construction}</div></div>
    <div class="prop-item"><div class="prop-icon">🌳</div><div class="prop-label">Acreage</div><div class="prop-value">${p.acreage}</div></div>
    <div class="prop-item"><div class="prop-icon">🔥</div><div class="prop-label">Fire Prot.</div><div class="prop-value">${p.fireProtection}</div></div>
    <div class="prop-item"><div class="prop-icon">👤</div><div class="prop-label">Occupancy</div><div class="prop-value">${p.occupancy}</div></div>
  </div>

  <div class="section-title"><span class="icon">🛡️</span> Your Core Coverages — What's Protected</div>
  <div class="coverage-grid">
    ${coveragesHtml}
  </div>

  <div class="deductible-bar">
    <div class="ded-icon">💰</div>
    <div class="ded-text">
      <h3>Your Deductible</h3>
      <p>${data.deductible.description}</p>
    </div>
    <div class="ded-amount">${data.deductible.amount}</div>
  </div>

  <div class="discounts-bar">
    <h3>✅ Discounts Applied to Your Quote</h3>
    <div class="discount-tags">
      ${discountsHtml}
    </div>
  </div>

  <div class="footer">
    <img src="${AGENCY.logoUrl}" alt="Agency Logo" class="footer-logo">
    <div class="footer-info">
      ${AGENCY.address} &bull; <strong>${AGENCY.phone}</strong> &bull; <a href="mailto:${AGENCY.email}">${AGENCY.email}</a> &bull; <a href="https://${AGENCY.website}">${AGENCY.website}</a>
    </div>
    <div class="footer-disclaimer">Page 1 of 2 &bull; This is a quote only. Coverage is not bound until a policy is issued.</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page2-header">
    <h2>Additional Coverages, Premium & Important Info</h2>
    <div class="name-ref">${data.customer.name} &bull; ${data.customer.address}</div>
  </div>

  <div class="section-title"><span class="icon">➕</span> Additional Coverages Included</div>
  <div class="extras-section">
    <table class="extras-table">
      <thead><tr><th>Coverage</th><th style="text-align:right;">Annual Cost</th></tr></thead>
      <tbody>${extrasHtml}</tbody>
    </table>
  </div>

  <div class="premium-box">
    <div class="premium-header">
      <div><h3>Your Annual Premium</h3><div class="premium-sub">12-Month Policy Period</div></div>
      <div style="text-align:right;"><div class="premium-total">${data.premium.totalAnnual}</div><div class="premium-sub">per year</div></div>
    </div>
    <div class="premium-breakdown">
      <div class="premium-row"><span>Base Premium</span><span>${data.premium.base}</span></div>
      <div class="premium-row"><span>Additional Coverages</span><span>${data.premium.extrasCost}</span></div>
      <div class="premium-row savings"><span>Discounts & Credits Applied</span><span>${data.premium.discountsAmount}</span></div>
    </div>
    <div class="premium-monthly">That's approximately <strong>${data.premium.monthlyEstimate}</strong> per month</div>
  </div>

  <div class="not-covered">
    <h3>⚠️ What's Generally NOT Covered</h3>
    <p>${data.notCovered}</p>
  </div>

  <div class="section-title"><span class="icon">📖</span> Quick Insurance Terms Made Simple</div>
  <div class="glossary">
    ${glossaryHtml}
  </div>

  <div class="cta-box">
    <h3>Ready to Protect Your Home?</h3>
    <p>This quote is valid for a limited time. Contact us today to get started.</p>
    <div class="cta-contacts">
      <div class="cta-contact">📞 <a href="tel:${AGENCY.phone.replace(/[^0-9]/g, '')}">${AGENCY.phone}</a></div>
      <div class="cta-contact">📧 <a href="mailto:${AGENCY.email}">${AGENCY.email}</a></div>
      <div class="cta-contact">🌐 <a href="https://${AGENCY.website}">${AGENCY.website}</a></div>
    </div>
  </div>

  <div class="footer">
    <img src="${AGENCY.logoUrl}" alt="Agency Logo" class="footer-logo">
    <div class="footer-info">
      ${AGENCY.address} &bull; <strong>${AGENCY.phone}</strong> &bull; <a href="mailto:${AGENCY.email}">${AGENCY.email}</a> &bull; <a href="https://${AGENCY.website}">${AGENCY.website}</a>
    </div>
    <div class="footer-disclaimer">Page 2 of 2 &bull; This is a quote only. Coverage is not bound until a policy is issued. &bull; Quote Date: ${data.customer.quoteDate}</div>
  </div>
</div>

</body>
</html>
  `;
};

/* -------------------------------------------------------------------------- */
/*                                HOME TEMPLATE                               */
/* -------------------------------------------------------------------------- */
const generateHomeHtml = (data: InsuranceData): string => {
  // Existing Home Template Logic (Re-used)
  const coveragesHtml = data.coverages.map(c => `
    <div class="coverage-card ${c.color}">
      <div class="card-header">
        <div class="card-title">${c.icon} ${c.title}</div>
        <div class="card-amount">${c.amount}</div>
      </div>
      <div class="card-explain">${c.explanation}</div>
      <div class="card-example"><strong>Example:</strong> ${c.example}</div>
    </div>
  `).join('');

  const extrasHtml = data.extras.map(e => `
    <tr>
      <td>
        <div class="extra-name">${e.icon} ${e.name}</div>
        <div class="extra-desc">${e.description}</div>
      </td>
      <td class="extra-cost">${e.isIncluded ? '<span class="included-badge">Included</span>' : e.cost}</td>
    </tr>
  `).join('');

  const discountsHtml = data.discounts.map(d => `<span class="discount-tag">${d}</span>`).join('');

  const p = data.property || { type: '-', built: '-', construction: '-', acreage: '-', fireProtection: '-', occupancy: '-' };
  
  // Default glossary for Home
  const glossaryHtml = `
      <div class="glossary-item"><div class="glossary-term">Deductible</div><div class="glossary-def">The amount you pay first before insurance pays the rest. Think of it like a co-pay at the doctor.</div></div>
      <div class="glossary-item"><div class="glossary-term">Premium</div><div class="glossary-def">The price you pay for your insurance policy — typically paid annually or monthly.</div></div>
      <div class="glossary-item"><div class="glossary-term">Replacement Cost</div><div class="glossary-def">The amount it costs to replace a damaged item with a brand-new one — no reduction for age or wear.</div></div>
      <div class="glossary-item"><div class="glossary-term">HO-3 Policy</div><div class="glossary-def">The most common homeowner policy type. Covers your home against all risks except those specifically excluded.</div></div>
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Home Insurance Quote - ${data.customer.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: letter; margin: 0.35in 0.55in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Source Sans 3', sans-serif; color: #2d3748; font-size: 12.5px; line-height: 1.4; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 8.5in; min-height: 10in; margin: 0 auto; padding: 0.35in 0.55in; page-break-after: always; position: relative; }
  .page:last-child { page-break-after: auto; }
  
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 3px solid #1a3a5c; margin-bottom: 12px; }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-title h1 { font-family: 'Merriweather', serif; font-size: 18px; font-weight: 900; color: #1a3a5c; letter-spacing: -0.3px; }
  .header-title p { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
  .header-carrier { text-align: right; }
  .header-carrier .carrier-name { font-family: 'Merriweather', serif; font-size: 13px; font-weight: 700; color: #1a3a5c; }
  .header-carrier .carrier-sub { font-size: 10px; color: #94a3b8; margin-top: 1px; }

  .customer-bar { background: linear-gradient(135deg, #f0f5fa 0%, #e8eff7 100%); border-radius: 8px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border: 1px solid #d4e0ed; }
  .customer-info h2 { font-family: 'Merriweather', serif; font-size: 15px; font-weight: 700; color: #1a3a5c; margin-bottom: 2px; }
  .customer-info .address { font-size: 12.5px; color: #475569; }
  .quote-details { text-align: right; font-size: 12px; color: #475569; }
  .quote-details .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; font-weight: 600; }
  .quote-details .value { font-weight: 700; color: #1a3a5c; font-size: 13px; }

  .property-snapshot { display: flex; gap: 0; margin-bottom: 12px; border: 1px solid #d4e0ed; border-radius: 8px; overflow: hidden; }
  .prop-item { flex: 1; text-align: center; padding: 7px 6px; border-right: 1px solid #d4e0ed; }
  .prop-item:last-child { border-right: none; }
  .prop-icon { font-size: 16px; margin-bottom: 2px; }
  .prop-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; margin-bottom: 0px; }
  .prop-value { font-size: 12px; font-weight: 700; color: #1a3a5c; }

  .section-title { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; color: #1a3a5c; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 7px; }
  .section-title .icon { font-size: 15px; }

  .coverage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .coverage-card { border: 1px solid #e2e8f0; border-radius: 7px; padding: 9px 12px; background: #fff; position: relative; overflow: hidden; }
  .coverage-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 8px 0 0 8px; }
  .coverage-card.blue::before { background: #2563eb; }
  .coverage-card.green::before { background: #16a34a; }
  .coverage-card.amber::before { background: #d97706; }
  .coverage-card.purple::before { background: #7c3aed; }
  .coverage-card.teal::before { background: #0d9488; }
  .coverage-card.rose::before { background: #e11d48; }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
  .card-title { font-weight: 700; font-size: 12px; color: #1a3a5c; display: flex; align-items: center; gap: 5px; }
  .card-amount { font-family: 'Merriweather', serif; font-weight: 900; font-size: 14px; color: #1a3a5c; white-space: nowrap; }
  .card-explain { font-size: 11px; color: #64748b; line-height: 1.35; }
  .card-example { margin-top: 4px; font-size: 10.5px; color: #7c8da5; background: #f8fafc; padding: 4px 7px; border-radius: 4px; border-left: 2px solid #cbd5e1; line-height: 1.3; }
  .card-example strong { color: #475569; }

  .deductible-bar { background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%); border: 1px solid #f5d679; border-radius: 7px; padding: 9px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .ded-icon { font-size: 22px; }
  .ded-text h3 { font-weight: 700; font-size: 13px; color: #92400e; }
  .ded-text p { font-size: 10.5px; color: #a16207; line-height: 1.35; }
  .ded-amount { margin-left: auto; font-family: 'Merriweather', serif; font-weight: 900; font-size: 20px; color: #92400e; }

  .extras-section { margin-bottom: 10px; }
  .extras-table { width: 100%; border-collapse: collapse; }
  .extras-table th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; font-weight: 600; padding: 4px 8px; border-bottom: 2px solid #e2e8f0; }
  .extras-table th:last-child { text-align: right; }
  .extras-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .extra-name { font-weight: 700; font-size: 11.5px; color: #1a3a5c; display: flex; align-items: center; gap: 5px; }
  .extra-desc { font-size: 10px; color: #64748b; margin-top: 1px; line-height: 1.3; }
  .extra-cost { text-align: right; font-weight: 700; font-size: 12px; color: #1a3a5c; white-space: nowrap; }
  .included-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.4px; }

  .premium-box { border: 2px solid #1a3a5c; border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
  .premium-header { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
  .premium-header h3 { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; }
  .premium-total { font-family: 'Merriweather', serif; font-size: 24px; font-weight: 900; }
  .premium-sub { font-size: 10px; opacity: 0.8; }
  .premium-breakdown { padding: 8px 16px; background: #f8fafc; }
  .premium-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #475569; }
  .premium-row.savings { color: #16a34a; font-weight: 600; }
  .premium-monthly { text-align: center; padding: 7px 16px; background: #e8eff7; font-size: 12px; color: #1a3a5c; }
  .premium-monthly strong { font-size: 16px; font-family: 'Merriweather', serif; }

  .not-covered { background: #fef2f2; border: 1px solid #fecaca; border-radius: 7px; padding: 8px 12px; margin-bottom: 10px; }
  .not-covered h3 { font-weight: 700; font-size: 12px; color: #991b1b; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
  .not-covered p { font-size: 10.5px; color: #b91c1c; line-height: 1.35; }

  .discounts-bar { background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 1px solid #86efac; border-radius: 7px; padding: 8px 14px; margin-bottom: 12px; }
  .discounts-bar h3 { font-weight: 700; font-size: 12px; color: #166534; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
  .discount-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .discount-tag { background: #bbf7d0; color: #14532d; font-size: 10.5px; font-weight: 600; padding: 2px 9px; border-radius: 12px; }

  .footer { margin-top: auto; padding-top: 10px; border-top: 2px solid #e2e8f0; text-align: center; }
  .footer-logo { height: 32px; width: auto; margin-bottom: 3px; }
  .footer-info { font-size: 10px; color: #94a3b8; line-height: 1.4; }
  .footer-info a { color: #2563eb; text-decoration: none; }
  .footer-disclaimer { margin-top: 4px; font-size: 9px; color: #b0bec5; font-style: italic; line-height: 1.35; }

  .cta-box { background: linear-gradient(135deg, #1a3a5c 0%, #234e7a 100%); border-radius: 8px; padding: 12px 18px; text-align: center; margin-bottom: 10px; color: #fff; }
  .cta-box h3 { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; margin-bottom: 3px; }
  .cta-box p { font-size: 11px; opacity: 0.85; margin-bottom: 6px; }
  .cta-contacts { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
  .cta-contact { font-size: 12px; font-weight: 700; }
  .cta-contact a { color: #93c5fd; text-decoration: none; }

  .glossary { margin-bottom: 10px; }
  .glossary-item { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
  .glossary-term { font-weight: 700; font-size: 11px; color: #1a3a5c; min-width: 100px; }
  .glossary-def { font-size: 10.5px; color: #64748b; line-height: 1.3; }

  .page2-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 7px; border-bottom: 2px solid #e2e8f0; margin-bottom: 10px; }
  .page2-header h2 { font-family: 'Merriweather', serif; font-size: 14px; font-weight: 700; color: #1a3a5c; }
  .page2-header .name-ref { font-size: 10px; color: #94a3b8; }

  /* B&W PRINT OPTIMIZATIONS (HOME) */
  @media print {
    body { background: #fff !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: auto; padding: 0; margin: 0; border: none; }
    
    /* Force high contrast text */
    * { color: #000 !important; text-shadow: none !important; }
    
    /* Remove colored backgrounds/gradients */
    .header, .customer-bar, .vehicle-header, .premium-header, .cta-box, .discounts-bar, .not-covered, .vehicle-meta, .vehicle-total-bar, .premium-breakdown, .premium-monthly, .pay-highlight, .deductible-bar, .included-badge, .card-example {
      background: #fff !important;
      background-image: none !important;
    }
    
    /* Add borders to define sections */
    .customer-bar, .discounts-bar, .not-covered, .cta-box { border: 1px solid #000 !important; }
    .vehicle-box, .premium-box, .driver-card, .cov-card, .coverage-card, .deductible-bar { border: 1px solid #000 !important; }
    
    /* Property Snapshot Specifics */
    .property-snapshot { border: 1px solid #000 !important; }
    .prop-item { border-right: 1px solid #000 !important; }
    
    /* Card Example Specifics */
    .card-example { border: 1px solid #000 !important; }

    /* Header distinctions */
    .vehicle-header, .premium-header {
      border-bottom: 1px solid #000 !important;
      background: #f0f0f0 !important; /* Light gray for headers */
    }
    .header { border-bottom: 2px solid #000 !important; }
    .section-title { border-bottom: 1px solid #000 !important; }

    /* Card colored bars -> black */
    .driver-card::before, .cov-card::before, .coverage-card::before { background: #000 !important; }
    
    /* Badges -> Outline style */
    .driver-badge, .pay-badge, .discount-tag, .included-badge {
      background: #fff !important;
      border: 1px solid #000 !important;
      font-weight: bold !important;
    }
    
    /* Tables/Lists */
    .pay-table th, .extras-table th { border-bottom: 1px solid #000 !important; }
    .pay-table td, .vc-row, .premium-row, .glossary-item, .extras-table td { border-bottom: 1px solid #ccc !important; }
    
    /* Hide URL links visual, keep text */
    a { text-decoration: none !important; }
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="header">
    <div class="header-left">
      ${data.agent.logoUrl ? `<img src="${data.agent.logoUrl}" alt="Agency Logo" style="height:46px; width:auto; margin-right:12px;">` : ''}
      <div class="header-title">
        <h1>Your Home Insurance Quote</h1>
        <p>Personalized Coverage Summary</p>
      </div>
    </div>
    <div class="header-carrier">
      <div class="carrier-name">${data.carrier.name}</div>
      <div class="carrier-sub">${data.carrier.subText}</div>
    </div>
  </div>

  <div class="customer-bar">
    <div class="customer-info">
      <h2>${data.customer.name}</h2>
      <div class="address">${data.customer.address}</div>
    </div>
    <div class="quote-details">
      <div class="date-row"><div class="label">Policy Period</div><div class="value">${data.customer.policyPeriod}</div></div>
      <div class="date-row"><div class="label">Quote Date</div><div class="value">${data.customer.quoteDate}</div></div>
    </div>
  </div>

  <div class="property-snapshot">
    <div class="prop-item"><div class="prop-icon">🏠</div><div class="prop-label">Home Type</div><div class="prop-value">${p.type}</div></div>
    <div class="prop-item"><div class="prop-icon">🔨</div><div class="prop-label">Built</div><div class="prop-value">${p.built}</div></div>
    <div class="prop-item"><div class="prop-icon">🪵</div><div class="prop-label">Construction</div><div class="prop-value">${p.construction}</div></div>
    <div class="prop-item"><div class="prop-icon">🌳</div><div class="prop-label">Acreage</div><div class="prop-value">${p.acreage}</div></div>
    <div class="prop-item"><div class="prop-icon">🔥</div><div class="prop-label">Fire Prot.</div><div class="prop-value">${p.fireProtection}</div></div>
    <div class="prop-item"><div class="prop-icon">👤</div><div class="prop-label">Occupancy</div><div class="prop-value">${p.occupancy}</div></div>
  </div>

  <div class="section-title"><span class="icon">🛡️</span> Your Core Coverages — What's Protected</div>
  <div class="coverage-grid">
    ${coveragesHtml}
  </div>

  <div class="deductible-bar">
    <div class="ded-icon">💰</div>
    <div class="ded-text">
      <h3>Your Deductible</h3>
      <p>${data.deductible.description}</p>
    </div>
    <div class="ded-amount">${data.deductible.amount}</div>
  </div>

  <div class="discounts-bar">
    <h3>✅ Discounts Applied to Your Quote</h3>
    <div class="discount-tags">
      ${discountsHtml}
    </div>
  </div>

  <div class="footer">
    ${data.agent.logoUrl ? `<img src="${data.agent.logoUrl}" alt="Agency Logo" class="footer-logo">` : ''}
    <div class="footer-info">
      ${data.agent.address} &bull; <strong>${data.agent.phone}</strong> &bull; <a href="mailto:${data.agent.email}">${data.agent.email}</a> &bull; <a href="https://${data.agent.website}">${data.agent.website}</a>
    </div>
    <div class="footer-disclaimer">Page 1 of 2 &bull; This is a quote only. Coverage is not bound until a policy is issued.</div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page2-header">
    <h2>Additional Coverages, Premium & Important Info</h2>
    <div class="name-ref">${data.customer.name} &bull; ${data.customer.address}</div>
  </div>

  <div class="section-title"><span class="icon">➕</span> Additional Coverages Included</div>
  <div class="extras-section">
    <table class="extras-table">
      <thead><tr><th>Coverage</th><th style="text-align:right;">Annual Cost</th></tr></thead>
      <tbody>${extrasHtml}</tbody>
    </table>
  </div>

  <div class="premium-box">
    <div class="premium-header">
      <div><h3>Your Annual Premium</h3><div class="premium-sub">12-Month Policy Period</div></div>
      <div style="text-align:right;"><div class="premium-total">${data.premium.totalAnnual}</div><div class="premium-sub">per year</div></div>
    </div>
    <div class="premium-breakdown">
      <div class="premium-row"><span>Base Premium</span><span>${data.premium.base}</span></div>
      <div class="premium-row"><span>Additional Coverages</span><span>${data.premium.extrasCost}</span></div>
      <div class="premium-row savings"><span>Discounts &amp; Credits Applied</span><span>${data.premium.discountsAmount}</span></div>
    </div>
    <div class="premium-monthly">That's approximately <strong>${data.premium.monthlyEstimate}</strong> per month</div>
  </div>

  <div class="not-covered">
    <h3>⚠️ What's Generally NOT Covered</h3>
    <p>${data.notCovered}</p>
  </div>

  <div class="section-title"><span class="icon">📖</span> Quick Insurance Terms Made Simple</div>
  <div class="glossary">
    ${glossaryHtml}
  </div>

  <div class="cta-box">
    <h3>Ready to Protect Your Asset?</h3>
    <p>This quote is valid for a limited time. Contact us today.</p>
    <div class="cta-contacts">
      <div class="cta-contact">📞 <a href="tel:${data.agent.phone}">${data.agent.phone}</a></div>
      <div class="cta-contact">📧 <a href="mailto:${data.agent.email}">${data.agent.email}</a></div>
      <div class="cta-contact">🌐 <a href="https://${data.agent.website}">${data.agent.website}</a></div>
    </div>
  </div>

  <div class="footer">
    ${data.agent.logoUrl ? `<img src="${data.agent.logoUrl}" alt="Agency Logo" class="footer-logo">` : ''}
    <div class="footer-info">
      ${data.agent.address} &bull; <strong>${data.agent.phone}</strong> &bull; <a href="mailto:${data.agent.email}">${data.agent.email}</a> &bull; <a href="https://${data.agent.website}">${data.agent.website}</a>
    </div>
    <div class="footer-disclaimer">Page 2 of 2 &bull; This is a quote only — coverage is not bound by this document.</div>
  </div>
</div>

</body>
</html>
  `;
};

/* -------------------------------------------------------------------------- */
/*                                MAIN EXPORT                                 */
/* -------------------------------------------------------------------------- */
export const generateInsuranceHtml = (data: InsuranceData): string => {
  if (data.type === 'home-hero') {
    return generateHomeHeroHtml(data);
  } else if (data.type === 'auto') {
    return generateAutoHtml(data);
  } else {
    // Default to Home/Generic template
    return generateHomeHtml(data);
  }
};