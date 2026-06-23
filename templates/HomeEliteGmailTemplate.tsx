import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { HomeQuoteData } from '../types/home';
import { resolveDigitalCardUrl } from '../lib/digitalCardLinks';
import { normalizeHeroImageUrl } from '../lib/heroImage';
import homeEliteTemplate from './email/HOME_ELITE_WELCOME.html?raw';

const defaultHomeImageUrl = 'https://i.imgur.com/6jDPnCX.jpeg';

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

const splitName = (data: HomeQuoteData) => {
  const parts = data.clientFullName.trim().split(/\s+/).filter(Boolean);
  const first = data.clientFirstName || parts[0] || '';
  const last = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { first, last };
};

const cityFromAddress = (address: string) => {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : BRAND.city;
};

const value = (amount: number | string) => {
  if (typeof amount === 'number') return money(amount);
  const parsed = Number(amount.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? money(parsed) : amount;
};

const firstThree = <T,>(items: T[], fallback: T[]): T[] => {
  const merged = [...items, ...fallback];
  return merged.slice(0, 3);
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{${token}}`).join(value);
  });
  return html;
};

export const homeEliteSubject = (data: HomeQuoteData) =>
  `Welcome to the family, ${data.clientFirstName} - your home coverage is set`;

export const homeElitePreheader = () =>
  'Your concierge welcome: coverage at a glance, what happens next, and how to reach us anytime.';

export function renderHomeEliteGmailHtml(data: HomeQuoteData) {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  const names = splitName(data);
  const carrierLogo = carrier.logoUrl || BRAND.logoUrl;
  const carrierWebsite = carrier.portalUrl || BRAND.websiteUrl;
  const carrierCardUrl = resolveDigitalCardUrl(data.carrierId, data.digitalCardUrl);
  const homeImage = normalizeHeroImageUrl(data.heroImageUrl, defaultHomeImageUrl);
  const isDwelling = data.policyType.startsWith('DP');
  const policyHeadline = isDwelling ? 'dwelling' : 'homeowners';
  const endorsements = firstThree(data.endorsements, [
    { name: 'Policy Review', amount: 'Included', subLabel: '', emoji: '' },
    { name: 'Claims Guidance', amount: 'Included', subLabel: '', emoji: '' },
    { name: 'Local Agency Support', amount: 'Included', subLabel: '', emoji: '' },
  ]);
  const discounts = firstThree(data.discounts, [
    { label: 'Policy Review', emoji: '' },
    { label: 'Account Review', emoji: '' },
    { label: 'Agency Support', emoji: '' },
  ]);

  const tokenized = replaceTokens(homeEliteTemplate, {
    AddedCov1: escapeHtml(endorsements[0]?.name),
    AddedCov1Val: escapeHtml(endorsements[0]?.amount || 'Included'),
    AddedCov2: escapeHtml(endorsements[1]?.name),
    AddedCov2Val: escapeHtml(endorsements[1]?.amount || 'Included'),
    AddedCov3: escapeHtml(endorsements[2]?.name),
    AddedCov3Val: escapeHtml(endorsements[2]?.amount || 'Included'),
    AOPDeductible: escapeHtml(money(data.allPerilDeductible)),
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
    DwellingA: escapeHtml(money(data.coverages.coverageA)),
    EffectiveDate: escapeHtml(formatDate(data.effectiveDate)),
    ExpirationDate: escapeHtml(formatDate(data.expiryDate)),
    FirstName: escapeHtml(names.first),
    LastName: escapeHtml(names.last),
    LiabilityE: escapeHtml(money(data.coverages.coverageE)),
    LossOfUseD: escapeHtml(value(data.coverages.coverageD)),
    MedPayF: escapeHtml(money(data.coverages.coverageF)),
    OtherStructuresB: escapeHtml(money(data.coverages.coverageB)),
    PersonalPropertyC: escapeHtml(money(data.coverages.coverageC)),
    PolicyForm: escapeHtml(data.policyType),
    PolicyHeadline: escapeHtml(policyHeadline),
    PolicyNumber: escapeHtml(data.quoteNumber),
    PropertyAddress: escapeHtml(data.propertyAddress),
    PropertyCity: escapeHtml(cityFromAddress(data.propertyAddress)),
    ReviewURL: escapeHtml(BRAND.googleReviewsUrl),
    TotalPremium: escapeHtml(money(data.annualPremium)),
    WindHail: escapeHtml(data.windHailDeductible ? money(data.windHailDeductible) : 'Not listed'),
  });

  return tokenized.replace(new RegExp(defaultHomeImageUrl, 'g'), escapeHtml(homeImage));
}
