import type { CarrierId } from '../config/carriers';
import type { Discount } from './auto';

export interface HomeQuoteData {
  templateType: 'home';
  clientFirstName: string;
  clientFullName: string;
  clientEmail: string;
  heroImageUrl?: string;
  carrierId: CarrierId;
  carriersShoppedNames: string[];
  quoteNumber: string;
  effectiveDate: string;
  expiryDate: string;
  quoteDate: string;
  policyType: 'HO3' | 'DP1' | 'DP2' | 'DP3';
  annualPremium: number;
  basePremium: number;
  fees: PremiumLine[];
  propertyAddress: string;
  yearBuilt: number;
  squareFeet?: number;
  constructionType?: string;
  roofYear?: number;
  roofMaterial?: string;
  protectionClass?: string;
  fireDistance?: string;
  hasMonitoredAlarm?: boolean;
  coverages: HomeCoverages;
  allPerilDeductible: number;
  windHailDeductible?: number;
  endorsements: Endorsement[];
  discounts: Discount[];
  dwellingLossSettlement: 'Replacement Cost' | 'Actual Cash Value';
  personalPropertyLossSettlement: 'Replacement Cost' | 'Actual Cash Value';
  roofWarning?: boolean;
  hasSurplusLines: boolean;
  hasBindingContingency: boolean;
}

export interface HomeCoverages {
  coverageA: number;
  coverageB: number;
  coverageC: number;
  coverageD: number | 'Included' | string;
  coverageE: number;
  coverageF: number;
}

export interface Endorsement {
  emoji: string;
  name: string;
  subLabel: string;
  amount: string;
}

export interface PremiumLine {
  label: string;
  amount: number;
  isFee: boolean;
}
