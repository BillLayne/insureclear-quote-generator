import { CARRIERS } from '../config/carriers';
import { isUsableHeroImageUrl } from './heroImage';
import type { QuoteData } from '../types/quote';

export function validateQuoteData(data: QuoteData): string[] {
  const errors: string[] = [];
  if (!data.clientFirstName) errors.push('Client first name is required.');
  if (!data.clientFullName) errors.push('Client full name is required.');
  if (data.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) errors.push('Client email format looks invalid.');
  if (data.heroImageUrl && !isUsableHeroImageUrl(data.heroImageUrl)) {
    errors.push('Hero image URL must be a direct https image link or a single-image Imgur link (albums and gallery links are not supported).');
  }
  if (!CARRIERS[data.carrierId]) errors.push('Carrier must resolve to a known carrier.');
  if (!data.effectiveDate || Number.isNaN(Date.parse(data.effectiveDate))) errors.push('Effective date must be valid.');
  if (!data.expiryDate || Number.isNaN(Date.parse(data.expiryDate))) errors.push('Expiry date must be valid.');

  if (data.templateType === 'auto') {
    if (data.totalPremium <= 0) errors.push('Auto total premium must be greater than zero.');
    if (data.vehicles.length === 0) errors.push('At least one vehicle is required.');
    if (data.drivers.length === 0) errors.push('At least one driver is required.');
  } else if (data.templateType === 'home') {
    const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
    if (data.annualPremium <= 0) errors.push('Home annual premium must be greater than zero.');
    if (tiv <= 0) errors.push('Home TIV requires Coverage A + B + C.');
    if (!data.propertyAddress) errors.push('Property address is required.');
  } else if (data.templateType === 'motorcycle') {
    if (data.annualPremium <= 0) errors.push('Motorcycle annual premium must be greater than zero.');
    if (!data.bike.year || !data.bike.make || !data.bike.model) errors.push('Motorcycle year, make, and model are required.');
    if (!data.bike.vin) errors.push('Motorcycle VIN is required.');
    if (data.riders.length === 0) errors.push('At least one rider is required.');
    if (data.coverages.length === 0) errors.push('At least one motorcycle coverage row is required.');
  } else if (data.templateType === 'renters') {
    if (data.annualPremium <= 0) errors.push('Renters annual premium must be greater than zero.');
    if (!data.unit.streetAddress || !data.unit.city || !data.unit.state || !data.unit.zip) errors.push('Renters unit address is required.');
    if (data.coverages.coverageC <= 0) errors.push('Renters Coverage C must be greater than zero.');
    if (data.coverages.coverageE <= 0) errors.push('Renters liability limit must be greater than zero.');
    if (data.insureds.length === 0) errors.push('At least one named insured is required.');
  } else {
    if (data.annualPremium <= 0) errors.push('Dwelling annual premium must be greater than zero.');
    if (!data.formCode) errors.push('DP form code is required.');
    if (!data.property.streetAddress || !data.property.city || !data.property.state || !data.property.zip) errors.push('Rental property address is required.');
    if (data.coverages.coverageA <= 0) errors.push('Dwelling Coverage A must be greater than zero.');
    if (data.coverages.coverageD <= 0) errors.push('Coverage D Fair Rental Value must be greater than zero.');
    if (data.coverages.coverageD < data.rental.monthlyRent * 12) errors.push('Coverage D is less than 12 months of rent. Review Fair Rental Value adequacy.');
    if (!data.coverages.windHailDeductible) errors.push('Wind/Hail deductible must be disclosed.');
    if (data.owners.length === 0) errors.push('At least one property owner is required.');
    if (data.isSurplusLines && !data.surplusCarrierLegalEntity) errors.push('Surplus carrier legal entity is required for surplus lines placements.');
  }

  return errors;
}
