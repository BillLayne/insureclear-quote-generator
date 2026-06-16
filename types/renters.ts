import type { CarrierId } from '../config/carriers';
import type { Discount } from './auto';

export interface RentersQuoteData {
  templateType: 'renters';
  clientFirstName: string;
  clientFullName: string;
  clientEmail: string;
  heroImageUrl?: string;
  carrierId: CarrierId;
  carrierLegalEntity: string;
  carriersShoppedNames: string[];
  quoteNumber: string;
  quoteDate: string;
  effectiveDate: string;
  expiryDate: string;
  annualPremium: number;
  showMonthlyHero: boolean;
  downPayment?: number;
  recurringPayment?: number;
  installmentCount?: number;
  pifTotal?: number;
  pifSavings?: number;
  bundleSavings?: number;
  bundledWithAuto: boolean;
  renterProfile: 'first_time' | 'experienced' | 'condo' | 'single_family' | 'roommate' | 'short_term' | 'mobile_home' | 'bundled_auto';
  unit: RentersUnit;
  insureds: RentersInsured[];
  coverages: RentersCoverages;
  endorsements: RentersEndorsement[];
  discounts: Discount[];
  landlordRequiresCoi: boolean;
  landlordName?: string;
  landlordAddress?: string;
  unrelatedRoommateNote?: string;
  pets?: RentersPet[];
  animalLiabilityLimit?: string;
}

export interface RentersUnit {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  unitType: 'apartment' | 'condo' | 'townhome' | 'single_family' | 'mobile_home' | 'short_term';
  leaseStartDate?: string;
  occupants?: number;
  priorRentersInsurance?: boolean;
  gatedCommunity?: boolean;
  fireSprinklers?: boolean;
  monitoredAlarm?: boolean;
}

export interface RentersInsured {
  name: string;
  age: number;
  relationship: 'named_insured' | 'spouse' | 'domestic_partner' | 'family_member' | 'co_insured';
}

export interface RentersCoverages {
  coverageC: number;
  coverageCSettlement: 'Replacement Cost' | 'Actual Cash Value';
  coverageD: number | string;
  coverageDPercentage?: number;
  coverageE: number;
  coverageF: number;
  deductible: number;
}

export interface RentersEndorsement {
  emoji: string;
  name: string;
  subLabel: string;
  limit: string;
  annualPremium?: number;
  status: 'included' | 'optional';
}

export interface RentersPet {
  type: string;
  breed?: string;
  count: number;
}
