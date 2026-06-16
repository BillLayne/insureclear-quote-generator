import type { ReceiptData } from '../types/receipt';

export const receiptSample: ReceiptData = {
  documentType: 'receipt',
  receiptStyle: 'default',
  clientFirstName: 'Parker',
  clientLastName: 'McConville',
  carrierName: 'Progressive',
  carrierLegal: 'Progressive Casualty Insurance Company',
  policyNumber: '9472 8831 06',
  policyType: 'NC Personal Auto',
  coverageStart: 'June 16, 2026',
  coverageEnd: 'December 16, 2026',
  paymentAmount: 154.69,
  paymentDate: 'June 16, 2026',
  paymentTime: '2:14 PM ET',
  paymentMethod: 'Visa credit card ending in 4242',
  confirmationNumber: 'PRG-2026-558401',
  transactionId: 'TXN-9F2C7A10',
};
