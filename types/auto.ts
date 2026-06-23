import type { CarrierId } from '../config/carriers';

export interface AutoQuoteData {
  templateType: 'auto';
  clientFirstName: string;
  clientFullName: string;
  clientEmail: string;
  heroImageUrl?: string;
  digitalCardUrl?: string;
  foldCard?: AutoFoldCardFields;
  carrierId: CarrierId;
  carriersShoppedNames: string[];
  quoteNumber: string;
  effectiveDate: string;
  expiryDate: string;
  quoteDate: string;
  termMonths: 6 | 12;
  totalPremium: number;
  paymentOptions: {
    eft: {
      downPayment: number;
      recurringAmount: number;
      recurringCount: number;
    };
    paidInFull: {
      total: number;
      savings: number;
    };
  };
  vehicles: Vehicle[];
  drivers: Driver[];
  coverages: AutoCoverages;
  discounts: Discount[];
  showInfographic: boolean;
  hasTeenDriver: boolean;
  hasExcludedDriver: boolean;
}

export interface Vehicle {
  year: number;
  make: string;
  model: string;
  vinLast8: string;
  coverageType: 'liability_only' | 'full_coverage';
  garagingZip: string;
  vehiclePremium: number;
  isPrimary: boolean;
  coverages?: VehicleCoverage[];
}

export interface VehicleCoverage {
  emoji: string;
  name: string;
  limitOrDeductible: string;
  premium?: number;
  status: 'included' | 'rejected' | 'not_applicable';
}

export interface Driver {
  name: string;
  age: number;
  yearsLicensed: number;
  relationship: 'insured' | 'spouse' | 'child' | 'excluded';
  isTeen: boolean;
}

export interface AutoCoverages {
  bodilyInjuryLimit: string;
  propertyDamageLimit: string;
  collisionDeductible?: number;
  comprehensiveDeductible?: number;
  uninsuredMotoristLimit: string;
  underinsuredMotoristLimit?: string;
  medicalPayments?: number;
  rentalReimbursement?: string;
  towing?: string;
  customEquipment?: number;
}

export interface Discount {
  emoji: string;
  label: string;
}

export interface AutoFoldCardFields {
  companyName?: string;
  customerAddress?: string;
  priorCarrier?: string;
  setupCharge?: number;
  paymentSchedule?: string;
  coverageAlert?: string;
  qrLink?: string;
  productStrip?: string;
  agentImageUrl?: string;
}
