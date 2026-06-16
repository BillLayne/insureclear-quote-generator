import type { CarrierId } from '../config/carriers';
import type { Discount } from './auto';

export interface MotorcycleQuoteData {
  templateType: 'motorcycle';
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
  layupAvailable: boolean;
  layupSavings?: number;
  layupMonths?: string;
  bike: MotorcycleBike;
  riders: MotorcycleRider[];
  coverages: MotorcycleCoverage[];
  discounts: Discount[];
  hasActionRequired: boolean;
  actionRequiredReason?: string;
  hasSurplusLines: boolean;
}

export interface MotorcycleBike {
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin: string;
  engine: string;
  bikeType: MotorcycleBikeType;
  mileage?: number;
  garagingZip: string;
  storageType?: string;
  purchasePrice?: number;
  agreedValue?: number;
  lienholderName?: string;
  aftermarketModifications?: string[];
  photoUrl?: string;
}

export type MotorcycleBikeType =
  | 'Cruiser'
  | 'Sport'
  | 'Sport-Touring'
  | 'Touring'
  | 'Standard'
  | 'Adventure'
  | 'Dual-Sport'
  | 'Dirt'
  | 'Scooter'
  | 'Trike'
  | 'Custom'
  | 'Vintage';

export interface MotorcycleRider {
  name: string;
  age: number;
  relationship: 'insured' | 'spouse' | 'co_rider' | 'other' | 'excluded';
  yearsRiding: number;
  classMYear?: number;
  msfYear?: number;
}

export interface MotorcycleCoverage {
  emoji: string;
  name: string;
  subLabel: string;
  limit: string;
  annualPremium?: number;
  status: 'included' | 'optional' | 'credit' | 'not_included';
}
