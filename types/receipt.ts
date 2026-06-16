// Receipt document type — a separate pipeline from the quote system.
// Kept out of the QuoteData union on purpose so the quote templates,
// renderers, and validation stay untouched.

export type ReceiptStyle = 'default';

export interface ReceiptData {
  documentType: 'receipt';
  receiptStyle: ReceiptStyle;
  // Customer
  clientFirstName: string;
  clientLastName: string;
  // Carrier
  carrierName: string; // short, e.g. "Progressive"
  carrierLegal: string; // legal entity, e.g. "Progressive Casualty Insurance Company"
  // Policy
  policyNumber: string;
  policyType: string; // e.g. "NC Personal Auto"
  coverageStart: string; // human-readable, e.g. "June 16, 2026"
  coverageEnd: string;
  // Payment
  paymentAmount: number; // 154.69
  paymentDate: string; // human-readable, e.g. "June 16, 2026"
  paymentTime: string; // e.g. "2:14 PM ET"
  paymentMethod: string; // e.g. "Visa credit card ending in 4242"
  confirmationNumber: string;
  transactionId: string;
}
