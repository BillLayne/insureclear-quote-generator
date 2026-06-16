import { BRAND } from '../config/brand';
import { CARRIERS, type CarrierId } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import masterTemplate from '../templates/web/COMMERCIAL_AUTO_QUOTE_MASTER_TEMPLATE.html?raw';

export interface RenderedCommercialAutoWebPage {
  html: string;
  title: string;
}

const commercialCarrierIds: CarrierId[] = ['progressive', 'nationwide', 'national_general'];

const WEB_ASSETS = {
  agentHeadshotUrl: 'https://i.imgur.com/dPA8slE.jpeg',
  agencyLogoUrl: 'https://i.imgur.com/wCeVUt1.png',
} as const;

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
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

const commercialCarrier = (carrierId: CarrierId) => {
  const safeCarrierId = commercialCarrierIds.includes(carrierId) ? carrierId : 'progressive';
  return CARRIERS[safeCarrierId];
};

const businessName = (data: AutoQuoteData) => data.clientFullName || data.clientFirstName || 'Your Business';

const driverMeta = (driver: Driver) => {
  const parts = [
    driver.age ? `Age ${driver.age}` : '',
    driver.yearsLicensed ? `${driver.yearsLicensed} years licensed` : '',
    driver.relationship === 'insured' ? 'Owner / primary operator' : 'Listed operator',
  ].filter(Boolean);
  return parts.join(' | ');
};

const driverCards = (data: AutoQuoteData) =>
  data.drivers
    .map(
      (driver) => `<article class="item-card">
          <div class="item-head">
            <div>
              <strong>${escapeHtml(driver.name)}</strong>
              <span>${escapeHtml(driverMeta(driver))}</span>
            </div>
            <span class="badge">${driver.relationship === 'excluded' ? 'Excluded' : 'Rated'}</span>
          </div>
        </article>`,
    )
    .join('\n');

const coverageLabel = (coverage: VehicleCoverage) => {
  const rejected = coverage.status === 'rejected' || /not included|rejected/i.test(coverage.limitOrDeductible || '');
  if (rejected) return 'Not included';
  const amount = coverage.limitOrDeductible || 'Included';
  const premium = coverage.premium ? ` | ${money(coverage.premium)} premium` : '';
  return `${amount}${premium}`;
};

const defaultVehicleCoverages = (data: AutoQuoteData, vehicle: Vehicle): Array<[string, string]> => {
  if (vehicle.coverages?.length) {
    return vehicle.coverages.map((coverage) => [coverage.name, coverageLabel(coverage)]);
  }

  const rows: Array<[string, string]> = [
    ['Liability', `${data.coverages.bodilyInjuryLimit} BI / ${data.coverages.propertyDamageLimit} PD`],
    ['Uninsured / Underinsured Motorist', data.coverages.underinsuredMotoristLimit ? `${data.coverages.uninsuredMotoristLimit} / ${data.coverages.underinsuredMotoristLimit}` : data.coverages.uninsuredMotoristLimit],
  ];

  if (vehicle.coverageType === 'full_coverage') {
    rows.push(['Comprehensive', data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Included']);
    rows.push(['Collision', data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Included']);
  } else {
    rows.push(['Physical Damage', 'Liability only - confirm no comp/collision']);
  }

  if (data.coverages.towing) rows.push(['Roadside / Towing', data.coverages.towing]);
  if (data.coverages.rentalReimbursement) rows.push(['Rental Reimbursement', data.coverages.rentalReimbursement]);
  return rows;
};

const vehicleCards = (data: AutoQuoteData) =>
  data.vehicles
    .map((vehicle) => {
      const rows: Array<[string, string]> = [
        ['Garaging ZIP', vehicle.garagingZip || 'Confirm'],
        ['Coverage type', vehicle.coverageType === 'full_coverage' ? 'Full coverage' : 'Liability only'],
        ...defaultVehicleCoverages(data, vehicle),
      ];
      const details = rows
        .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
        .join('\n');

      return `<article class="item-card">
          <div class="item-head">
            <div>
              <strong>${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</strong>
              <span>VIN ending ${escapeHtml(vehicle.vinLast8 || 'Confirm')} | Commercial use details must be confirmed</span>
            </div>
            <span class="badge">${money(vehicle.vehiclePremium)}</span>
          </div>
          <div class="item-body">
            <table class="detail-table">${details}</table>
          </div>
        </article>`;
    })
    .join('\n');

const discountCards = (data: AutoQuoteData) => {
  const discountRows = data.discounts.length
    ? data.discounts.map((discount) => [discount.label, 'Included on this quote.'])
    : [['Policy review', 'No specific discount list parsed. Confirm carrier discounts before binding.']];

  if (data.paymentOptions.paidInFull.savings > 0) {
    discountRows.unshift(['Paid-in-full discount', `${money(data.paymentOptions.paidInFull.savings)} savings shown if paid in full.`]);
  }

  return discountRows
    .map(
      ([title, detail]) => `<article class="item-card">
          <div class="item-head">
            <div>
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(detail)}</span>
            </div>
          </div>
        </article>`,
    )
    .join('\n');
};

const monthlySchedule = (data: AutoQuoteData) => {
  const count = data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1);
  const amount = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const installmentWord = count === 1 ? 'automatic monthly installment' : 'automatic monthly installments';
  return `${count} ${installmentWord} of ${money(amount)}`;
};

const quoteActionHref = (data: AutoQuoteData) => {
  const carrier = commercialCarrier(data.carrierId);
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const params = new URLSearchParams({
    action: 'application_review',
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: 'commercial-auto',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: `${money(monthly)}/mo`,
    subject: `${carrier.displayName} Commercial Auto Quote Review`,
  });
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

export function renderCommercialAutoWebPageHtml(data: AutoQuoteData): RenderedCommercialAutoWebPage {
  const carrier = commercialCarrier(data.carrierId);
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const payFullTotal = data.paymentOptions.paidInFull.total || data.totalPremium;
  const liabilityLimit = data.coverages.bodilyInjuryLimit && data.coverages.propertyDamageLimit
    ? `${data.coverages.bodilyInjuryLimit} BI / ${data.coverages.propertyDamageLimit} PD`
    : data.coverages.bodilyInjuryLimit || data.coverages.propertyDamageLimit || 'Confirm';
  const umuimLimit = data.coverages.underinsuredMotoristLimit
    ? `${data.coverages.uninsuredMotoristLimit} / ${data.coverages.underinsuredMotoristLimit}`
    : data.coverages.uninsuredMotoristLimit || 'Confirm';
  const title = `${businessName(data)} ${carrier.displayName} Commercial Auto Quote`;

  const html = replaceTokens(masterTemplate, {
    AGENT_HEADSHOT_URL: WEB_ASSETS.agentHeadshotUrl,
    BUSINESS_NAME: escapeHtml(businessName(data)),
    CARRIER_LOGO_SRC: escapeHtml(carrier.logoUrl || WEB_ASSETS.agencyLogoUrl),
    CARRIER_NAME: escapeHtml(carrier.displayName),
    CONTACT_FIRST_NAME: escapeHtml(data.clientFirstName || businessName(data).split(/\s+/)[0] || 'there'),
    DISCOUNTS_HTML: discountCards(data),
    DRIVER_COUNT: escapeHtml(data.drivers.length),
    DRIVERS_HTML: driverCards(data),
    HIRED_NON_OWNED_STATUS: 'Confirm if needed',
    INITIAL_PAYMENT_FOR_LOWEST_MONTHLY: escapeHtml(money(data.paymentOptions.eft.downPayment || monthly)),
    INSTALLMENT_TERM_TOTAL: escapeHtml(money(data.totalPremium)),
    LIABILITY_LIMIT: escapeHtml(liabilityLimit),
    LOWEST_MONTHLY_PAYMENT: escapeHtml(money(monthly)),
    MED_PAY_LIMIT: escapeHtml(data.coverages.medicalPayments ? money(data.coverages.medicalPayments, 0) : 'Rejected / not shown'),
    MONTHLY_PAYMENT_SCHEDULE: escapeHtml(monthlySchedule(data)),
    PAID_IN_FULL_AMOUNT: escapeHtml(money(payFullTotal)),
    POLICY_TERM_LABEL: `${escapeHtml(data.termMonths)}-month`,
    QUOTE_ACTION_URL: escapeHtml(quoteActionHref(data)),
    QUOTE_DATE_SHORT: escapeHtml(formatDate(data.quoteDate)),
    REVIEW_1_NAME: 'Local business customer',
    REVIEW_1_TEXT: 'Bill Layne Insurance helped us understand the details and made the quote process much easier to review.',
    REVIEW_2_NAME: 'Local customer review',
    REVIEW_2_TEXT: 'They explain coverage in plain English and are quick to answer questions when something needs to be corrected.',
    UMUIM_LIMIT: escapeHtml(umuimLimit),
    VEHICLE_COUNT: escapeHtml(data.vehicles.length),
    VEHICLES_HTML: vehicleCards(data),
  });

  return { html, title };
}
