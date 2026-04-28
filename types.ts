export type QuoteType = 'home' | 'auto' | 'other' | 'home-hero';

export interface CoverageItem {
  title: string;
  amount: string;
  explanation: string;
  example: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'teal' | 'rose';
  icon: string;
}

export interface ExtraCoverage {
  name: string;
  description: string;
  cost: string;
  isIncluded: boolean;
  icon: string;
}

export interface DiscountItem {
  name: string;
}

export interface VehicleCoverage {
  name: string;
  limit?: string;
  deductible?: string;
  premium?: string;
  included?: boolean;
  icon?: string;
}

export interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  usage?: string;
  zip?: string;
  annualPremium?: string;
  coverages?: VehicleCoverage[];
}

export interface Driver {
  name: string;
  details: string; // "Age 61 • Male..."
  isRated?: boolean;
}

export interface PaymentOption {
  planName: string;
  downPayment: string;
  monthlyAmount: string;
  installments?: string; // "11 x $128.09"
}

export interface InsuranceData {
  type: QuoteType;
  homePhotoUrl?: string; // For Home + Hero template
  customer: {
    name: string;
    address: string;
    quoteDate: string;
    policyPeriod: string;
  };
  carrier: {
    name: string;
    subText: string;
  };
  // Specific to Home
  property?: {
    type: string;
    built: string;
    construction: string;
    acreage: string;
    fireProtection: string;
    occupancy: string;
  };
  // Specific to Auto
  vehicles?: Vehicle[];
  drivers?: Driver[];
  // Specific to Other
  subject?: string; 

  coverages: CoverageItem[]; // Core/Policy-wide coverages
  deductible: {
    amount: string;
    description: string;
  };
  extras: ExtraCoverage[];
  premium: {
    base: string;
    extrasCost: string;
    discountsAmount: string;
    totalAnnual: string;
    monthlyEstimate: string;
  };
  paymentOptions?: PaymentOption[];
  discounts: string[];
  agent: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl?: string;
  };
  notCovered: string; 
}

export const INITIAL_DATA: InsuranceData = {
  type: 'home',
  customer: { name: 'Client Name', address: '123 Main St', quoteDate: 'Today', policyPeriod: '12 Months' },
  carrier: { name: 'Carrier Name', subText: 'Policy Type' },
  property: { type: '-', built: '-', construction: '-', acreage: '-', fireProtection: '-', occupancy: '-' },
  coverages: [],
  deductible: { amount: '$1,000', description: 'Standard Deductible' },
  extras: [],
  premium: { base: '$0', extrasCost: '$0', discountsAmount: '$0', totalAnnual: '$0', monthlyEstimate: '$0' },
  paymentOptions: [],
  discounts: [],
  agent: { 
    name: 'Bill Layne Insurance Agency', 
    address: '1283 N Bridge St, Elkin, NC 28621', 
    phone: '(336) 835-1993', 
    email: 'Save@BillLayneInsurance.com', 
    website: 'www.BillLayneInsurance.com',
    logoUrl: 'https://i.imgur.com/zCUkP2V.png' 
  },
  notCovered: 'Standard exclusions apply.'
};