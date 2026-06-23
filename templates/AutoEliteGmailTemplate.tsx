import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData, Driver, Vehicle, VehicleCoverage } from '../types/auto';
import { resolveDigitalCardUrl } from '../lib/digitalCardLinks';
import { normalizeHeroImageUrl } from '../lib/heroImage';
import autoEliteTemplate from './email/AUTO_ELITE_WELCOME.html?raw';

const defaultVehicleImageUrl = 'https://i.imgur.com/SG4NI0r.png';

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

const splitName = (data: AutoQuoteData) => {
  const parts = data.clientFullName.trim().split(/\s+/).filter(Boolean);
  const first = data.clientFirstName || parts[0] || '';
  const last = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { first, last };
};

const relationshipCopy = (driver?: Driver) => {
  if (!driver) return 'Driver';
  if (driver.relationship === 'insured') return 'Named Insured';
  if (driver.relationship === 'spouse') return 'Spouse';
  if (driver.relationship === 'child') return 'Household Driver';
  if (driver.relationship === 'excluded') return 'Excluded';
  return 'Driver';
};

const vehicleName = (vehicle?: Vehicle) =>
  vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Not listed';

const vehicleUse = (vehicle?: Vehicle) =>
  vehicle ? `${vehicle.coverageType === 'full_coverage' ? 'Comprehensive/collision selected' : 'Liability only'} - ZIP ${vehicle.garagingZip}` : 'Not listed';

const defaultCoverages = (data: AutoQuoteData, vehicle?: Vehicle): VehicleCoverage[] => {
  if (!vehicle) return [];
  if (vehicle.coverages?.length) return vehicle.coverages;

  const rows: VehicleCoverage[] = [
    {
      emoji: '',
      name: 'Liability',
      limitOrDeductible: `${data.coverages.bodilyInjuryLimit} BI + ${data.coverages.propertyDamageLimit} PD`,
      status: 'included',
    },
    {
      emoji: '',
      name: 'Uninsured Motorist',
      limitOrDeductible: data.coverages.uninsuredMotoristLimit,
      status: 'included',
    },
  ];

  if (vehicle.coverageType === 'full_coverage') {
    rows.push({
      emoji: '',
      name: 'Comprehensive',
      limitOrDeductible: data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Included',
      status: 'included',
    });
    rows.push({
      emoji: '',
      name: 'Collision',
      limitOrDeductible: data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Included',
      status: 'included',
    });
  }

  return rows;
};

const coverageValue = (data: AutoQuoteData, vehicle: Vehicle | undefined, pattern: RegExp, fallback: string) => {
  const match = defaultCoverages(data, vehicle).find((coverage) => pattern.test(coverage.name));
  if (!vehicle) return 'Not listed';
  if (!match) return fallback;
  if (match.status === 'rejected' || /not included/i.test(match.limitOrDeductible)) return 'Not included';
  return match.limitOrDeductible || fallback;
};

const firstThree = <T,>(items: T[], fallback: T[]): T[] => [...items, ...fallback].slice(0, 3);

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{${token}}`).join(value);
  });
  return html;
};

export const autoEliteSubject = (data: AutoQuoteData) =>
  `Welcome aboard, ${data.clientFirstName} - your auto coverage is active`;

export const autoElitePreheader = () =>
  'Your policy at a glance, ID cards, claims info, and how to reach us anytime.';

export function renderAutoEliteGmailHtml(data: AutoQuoteData) {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.progressive;
  const names = splitName(data);
  const carrierLogo = carrier.logoUrl || BRAND.logoUrl;
  const carrierWebsite = carrier.portalUrl || BRAND.websiteUrl;
  const carrierCardUrl = resolveDigitalCardUrl(data.carrierId, data.digitalCardUrl);
  const vehicleImage = normalizeHeroImageUrl(data.heroImageUrl, defaultVehicleImageUrl);
  const monthly = data.paymentOptions.eft.recurringAmount || data.totalPremium / Math.max(data.termMonths, 1);
  const vehicles = [data.vehicles[0], data.vehicles[1]];
  const drivers = [data.drivers[0], data.drivers[1]];
  const addedCoverages = firstThree(
    [
      data.coverages.rentalReimbursement ? { name: 'Rental Reimbursement', amount: data.coverages.rentalReimbursement } : null,
      data.coverages.towing ? { name: 'Roadside Assistance', amount: data.coverages.towing } : null,
      data.coverages.medicalPayments ? { name: 'Medical Payments', amount: money(data.coverages.medicalPayments, 0) } : null,
      data.coverages.customEquipment ? { name: 'Custom Equipment', amount: money(data.coverages.customEquipment, 0) } : null,
    ].filter((item): item is { name: string; amount: string } => Boolean(item)),
    [
      { name: 'Policy Review', amount: 'Included' },
      { name: 'Claims Guidance', amount: 'Included' },
      { name: 'Local Agency Support', amount: 'Included' },
    ],
  );
  const discounts = firstThree(data.discounts, [
    { label: 'Policy Review', emoji: '' },
    { label: 'Account Review', emoji: '' },
    { label: 'Agency Support', emoji: '' },
  ]);

  const tokenized = replaceTokens(autoEliteTemplate, {
    AddedCov1: escapeHtml(addedCoverages[0]?.name),
    AddedCov1Val: escapeHtml(addedCoverages[0]?.amount),
    AddedCov2: escapeHtml(addedCoverages[1]?.name),
    AddedCov2Val: escapeHtml(addedCoverages[1]?.amount),
    AddedCov3: escapeHtml(addedCoverages[2]?.name),
    AddedCov3Val: escapeHtml(addedCoverages[2]?.amount),
    BodilyInjury: escapeHtml(data.coverages.bodilyInjuryLimit),
    CarrierCardURL: escapeHtml(carrierCardUrl),
    CarrierClaimsPhone: escapeHtml(carrier.claimsPhone || BRAND.phone),
    CarrierLogoURL: escapeHtml(carrierLogo),
    CarrierName: escapeHtml(carrier.legalName || carrier.displayName),
    CarrierShort: escapeHtml(carrier.displayName),
    CarrierWebsite: escapeHtml(carrierWebsite),
    Discount1: escapeHtml(discounts[0]?.label),
    Discount2: escapeHtml(discounts[1]?.label),
    Discount3: escapeHtml(discounts[2]?.label),
    DocumentsURL: escapeHtml(carrierWebsite),
    Driver1Age: escapeHtml(drivers[0]?.age ?? 'Not listed'),
    Driver1Name: escapeHtml(drivers[0]?.name || data.clientFullName || 'Primary driver'),
    Driver1Years: escapeHtml(drivers[0]?.yearsLicensed ?? 'Not listed'),
    Driver2Age: escapeHtml(drivers[1]?.age ?? 'Not listed'),
    Driver2Name: escapeHtml(drivers[1]?.name || 'No additional driver listed'),
    Driver2Relationship: escapeHtml(relationshipCopy(drivers[1])),
    Driver2Role: escapeHtml(drivers[1] ? relationshipCopy(drivers[1]) : 'Not Listed'),
    Driver2Years: escapeHtml(drivers[1]?.yearsLicensed ?? 'Not listed'),
    EffectiveDate: escapeHtml(formatDate(data.effectiveDate)),
    ExpirationDate: escapeHtml(formatDate(data.expiryDate)),
    FirstName: escapeHtml(names.first),
    LastName: escapeHtml(names.last),
    MedPay: escapeHtml(data.coverages.medicalPayments ? money(data.coverages.medicalPayments, 0) : 'Not listed'),
    MonthlyPayment: escapeHtml(money(monthly)),
    PolicyForm: escapeHtml(`${data.termMonths}-Month Auto`),
    PolicyHeadline: 'auto',
    PolicyNumber: escapeHtml(data.quoteNumber),
    PropertyDamage: escapeHtml(data.coverages.propertyDamageLimit),
    ReviewURL: escapeHtml(BRAND.googleReviewsUrl),
    TermMonths: escapeHtml(data.termMonths),
    TermPremium: escapeHtml(money(data.totalPremium)),
    UMUIM: escapeHtml(data.coverages.underinsuredMotoristLimit ? `${data.coverages.uninsuredMotoristLimit} / ${data.coverages.underinsuredMotoristLimit}` : data.coverages.uninsuredMotoristLimit),
    Veh1Coll: escapeHtml(coverageValue(data, vehicles[0], /collision/i, data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Not listed')),
    Veh1Comp: escapeHtml(coverageValue(data, vehicles[0], /comprehensive|other than collision/i, data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Not listed')),
    Veh1Rental: escapeHtml(data.coverages.rentalReimbursement || 'Not listed'),
    Veh1Roadside: escapeHtml(data.coverages.towing || 'Not listed'),
    Veh2Coll: escapeHtml(coverageValue(data, vehicles[1], /collision/i, data.coverages.collisionDeductible ? `${money(data.coverages.collisionDeductible, 0)} deductible` : 'Not listed')),
    Veh2Comp: escapeHtml(coverageValue(data, vehicles[1], /comprehensive|other than collision/i, data.coverages.comprehensiveDeductible ? `${money(data.coverages.comprehensiveDeductible, 0)} deductible` : 'Not listed')),
    Veh2Rental: escapeHtml(vehicles[1] ? data.coverages.rentalReimbursement || 'Not listed' : 'Not listed'),
    Veh2Roadside: escapeHtml(vehicles[1] ? data.coverages.towing || 'Not listed' : 'Not listed'),
    Vehicle1: escapeHtml(vehicleName(vehicles[0])),
    Vehicle1Premium: escapeHtml(vehicles[0] ? money(vehicles[0].vehiclePremium) : 'Not listed'),
    Vehicle1Use: escapeHtml(vehicleUse(vehicles[0])),
    Vehicle1VIN: escapeHtml(vehicles[0]?.vinLast8 || 'Not listed'),
    Vehicle2: escapeHtml(vehicleName(vehicles[1])),
    Vehicle2Premium: escapeHtml(vehicles[1] ? money(vehicles[1].vehiclePremium) : 'Not listed'),
    Vehicle2Use: escapeHtml(vehicleUse(vehicles[1])),
    Vehicle2VIN: escapeHtml(vehicles[1]?.vinLast8 || 'Not listed'),
  });

  return tokenized
    .replace(new RegExp(defaultVehicleImageUrl, 'g'), escapeHtml(vehicleImage))
    .replace(/336-835-1993/g, '(336) 835-1993')
    .replace(/Elkin NC 28621/g, 'Elkin, NC 28621');
}
