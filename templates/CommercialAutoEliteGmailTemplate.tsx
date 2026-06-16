import { BRAND } from '../config/brand';
import { CARRIERS, type CarrierId } from '../config/carriers';
import type { AutoQuoteData } from '../types/auto';
import { quoteActionHref } from './shared/EmailParts';
import commercialAutoEliteTemplate from './email/COMMERCIAL_AUTO_ELITE_QUOTE_SAMPLE.html?raw';

const commercialCarrierIds: CarrierId[] = ['progressive', 'nationwide', 'national_general'];

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

const commercialCarrier = (carrierId: CarrierId) => {
  const safeCarrierId = commercialCarrierIds.includes(carrierId) ? carrierId : 'progressive';
  return CARRIERS[safeCarrierId];
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{${token}}`).join(value);
  });
  return html;
};

export const commercialAutoEliteSubject = (data: AutoQuoteData) =>
  `${data.clientFullName || data.clientFirstName}, your commercial auto quote is ready`;

export const commercialAutoElitePreheader = () =>
  'Commercial auto payment options, covered vehicles, rated drivers, and next steps.';

export function renderCommercialAutoEliteGmailHtml(data: AutoQuoteData) {
  const carrier = commercialCarrier(data.carrierId);
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const downPayment = data.paymentOptions.eft.downPayment || monthly;
  const paidInFull = data.paymentOptions.paidInFull.total || data.totalPremium;
  const firstVehicle = data.vehicles[0];
  const secondVehicle = data.vehicles[1];
  const firstDriver = data.drivers[0];
  const secondDriver = data.drivers[1];
  const actionUrl = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: 'commercial-auto',
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.totalPremium),
    subject: `${carrier.displayName} Commercial Auto Quote Review`,
  });

  return replaceTokens(commercialAutoEliteTemplate, {
    BusinessName: escapeHtml(data.clientFullName || 'Your Business'),
    CarrierLogoURL: escapeHtml(carrier.logoUrl || BRAND.logoUrl),
    CarrierName: escapeHtml(carrier.displayName),
    ContactFirstName: escapeHtml(data.clientFirstName || 'there'),
    Driver1Name: escapeHtml(firstDriver?.name || data.clientFullName || 'Primary driver'),
    Driver1Years: escapeHtml(firstDriver?.yearsLicensed ?? 'Not listed'),
    Driver2Name: escapeHtml(secondDriver?.name || 'Additional driver'),
    Driver2Years: escapeHtml(secondDriver?.yearsLicensed ?? 'Not listed'),
    DriverCount: escapeHtml(data.drivers.length || 1),
    HiredNonOwned: escapeHtml('Confirm if needed'),
    InitialPayment: escapeHtml(money(downPayment)),
    InstallmentCount: escapeHtml(data.paymentOptions.eft.recurringCount || Math.max(data.termMonths - 1, 1)),
    LiabilityLimit: escapeHtml(`${data.coverages.bodilyInjuryLimit} BI / ${data.coverages.propertyDamageLimit} PD`),
    MedPayLimit: escapeHtml(data.coverages.medicalPayments ? money(data.coverages.medicalPayments, 0) : 'Not listed'),
    MonthlyPayment: escapeHtml(money(monthly)),
    PaidInFullAmount: escapeHtml(money(paidInFull)),
    PolicyTerm: escapeHtml(`${data.termMonths} months`),
    QuoteActionURL: escapeHtml(actionUrl),
    TermPremium: escapeHtml(money(data.totalPremium)),
    UMUIMLimit: escapeHtml(data.coverages.underinsuredMotoristLimit ? `${data.coverages.uninsuredMotoristLimit} / ${data.coverages.underinsuredMotoristLimit}` : data.coverages.uninsuredMotoristLimit),
    Vehicle1Premium: escapeHtml(firstVehicle ? money(firstVehicle.vehiclePremium) : 'Not listed'),
    Vehicle2Premium: escapeHtml(secondVehicle ? money(secondVehicle.vehiclePremium) : 'Not listed'),
    VehicleCount: escapeHtml(data.vehicles.length || 1),
  });
}
