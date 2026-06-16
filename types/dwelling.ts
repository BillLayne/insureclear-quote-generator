import type { CarrierId } from '../config/carriers';
import type { Discount } from './auto';

export interface DwellingQuoteData {
  templateType: 'dwelling';
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
  formCode: 'DP-1' | 'DP-2' | 'DP-3' | 'DP-0003';
  annualPremium: number;
  basePremium?: number;
  surplusTax?: number;
  policyFee?: number;
  isSurplusLines: boolean;
  surplusCarrierLegalEntity?: string;
  surplusTaxRate?: number;
  surplusPlacementReason?: string;
  showMonthlyHero: boolean;
  property: DwellingProperty;
  rental: RentalUse;
  owners: DwellingOwner[];
  mortgagee?: Mortgagee;
  coverages: DwellingCoverages;
  endorsements: DwellingEndorsement[];
  discounts: Discount[];
  showEducationCard: boolean;
  propertyPhotoUrl?: string;
}

export interface DwellingProperty {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  yearBuilt: number;
  constructionType?: string;
  roofType?: string;
  roofAge?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  numberOfUnits: 1 | 2 | 3 | 4;
  foundationType?: string;
  hvacType?: string;
  hvacAge?: number;
  electricalAmps?: number;
  panelType?: string;
  plumbingType?: string;
  protectionClass?: string;
  hydrantDistance?: string;
}

export interface RentalUse {
  useType: 'LTR' | 'STR' | 'Vacation' | 'Inherited' | 'Between Tenants' | 'Vacant' | 'House Hack' | 'Owner-Financed' | 'Multi-Unit';
  leaseType: '12-month' | 'Month-to-month' | 'Short-term/Airbnb' | 'Vacant' | 'Owner-use mix';
  currentStatus: 'Tenant Occupied' | 'Between Tenants' | 'Vacant' | 'Vacant for Renovation' | 'Owner-Occupied Portion';
  monthlyRent: number;
  vacancyDurationDays?: number;
  propertyManagerName?: string;
  propertyManagerPhone?: string;
  petsAllowed?: boolean;
}

export interface DwellingOwner {
  name: string;
  relationship: 'Property Owner' | 'Co-Owner' | 'LLC' | 'Trust' | 'Estate';
  badge: 'OWNER' | 'CO-OWNER' | 'LLC' | 'TRUST' | 'ESTATE';
}

export interface Mortgagee {
  lenderName: string;
  loanNumber?: string;
}

export interface DwellingCoverages {
  coverageA: number;
  coverageASettlement: 'Replacement Cost' | 'Actual Cash Value';
  coverageB: number;
  coverageBSettlement: 'Replacement Cost' | 'Actual Cash Value';
  coverageC: number;
  coverageCSettlement: 'Replacement Cost' | 'Actual Cash Value';
  coverageD: number;
  coverageE: number;
  liability: number;
  medicalPayments: number;
  deductible: number;
  windHailDeductible: string;
}

export interface DwellingEndorsement {
  emoji: string;
  name: string;
  subLabel: string;
  limit: string;
  annualPremium?: number;
  status: 'included' | 'optional';
}
