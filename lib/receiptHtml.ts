import type { ReceiptData } from '../types/receipt';
import receiptDefaultTemplate from '../templates/email/RECEIPT_DEFAULT.html?raw';

export interface RenderedReceipt {
  html: string;
  subject: string;
  preheader: string;
}

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const amountDisplay = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const isoDate = (value: string) => {
  const raw = (value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString().slice(0, 10);
};

const policyLast4 = (policyNumber: string) => {
  const compact = (policyNumber || '').replace(/\s+/g, '');
  if (!compact) return '—';
  const last4 = compact.slice(-4);
  return `••${last4}`;
};

const brandTitle = (raw: string) => {
  const lower = raw.toLowerCase();
  if (/amex|american express/.test(lower)) return 'Amex';
  if (/mastercard|master card/.test(lower)) return 'Mastercard';
  if (/discover/.test(lower)) return 'Discover';
  if (/visa/.test(lower)) return 'Visa';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

// Compact label for the dark meta strip (e.g. "Visa ••4242", "Bank Draft").
const paymentMethodShort = (method: string) => {
  const value = (method || '').trim();
  if (!value) return '—';
  const last4 = (value.match(/(\d{4})(?!.*\d)/) || [])[1];
  const brand = value.match(/visa|mastercard|master card|amex|american express|discover/i);
  if (last4) return `${brand ? brandTitle(brand[0]) : 'Card'} ••${last4}`;
  if (/eft|ach|bank|draft|e-?check|echeck/i.test(value)) return 'Bank Draft';
  return value.length > 18 ? `${value.slice(0, 16)}…` : value;
};

const replaceTokens = (template: string, values: Record<string, string>) => {
  let html = template;
  Object.entries(values).forEach(([token, value]) => {
    html = html.split(`{{${token}}}`).join(value);
  });
  return html;
};

export const receiptSubject = (data: ReceiptData) => {
  const name = [data.clientFirstName, data.clientLastName].filter(Boolean).join(' ').trim() || 'Customer';
  return `Payment Receipt — ${data.carrierName || 'Insurance'} — ${name}`;
};

export const receiptPreheader = (data: ReceiptData) =>
  `$${amountDisplay(data.paymentAmount)} received — ${data.carrierName || 'your carrier'} — your receipt is enclosed for your records.`;

export function validateReceiptData(data: ReceiptData): string[] {
  const errors: string[] = [];
  if (!data.clientFirstName.trim()) errors.push('Customer first name is required.');
  if (!data.carrierName.trim()) errors.push('Carrier name is required.');
  if (!(data.paymentAmount > 0)) errors.push('Payment amount must be greater than zero.');
  if (!data.confirmationNumber.trim()) errors.push('Confirmation number is required.');
  return errors;
}

export function receiptPlainText(data: ReceiptData): string {
  const name = [data.clientFirstName, data.clientLastName].filter(Boolean).join(' ').trim();
  return [
    `Payment Receipt — Bill Layne Insurance Agency`,
    ``,
    `Hi ${data.clientFirstName || 'there'}, we've received your payment.`,
    ``,
    `Amount paid: $${amountDisplay(data.paymentAmount)}`,
    `Date: ${data.paymentDate}${data.paymentTime ? ` ${data.paymentTime}` : ''}`,
    `Payment method: ${data.paymentMethod}`,
    `Confirmation #: ${data.confirmationNumber}`,
    `Carrier: ${data.carrierLegal || data.carrierName}`,
    `Policy #: ${data.policyNumber}`,
    `Coverage type: ${data.policyType}`,
    `Coverage period: ${data.coverageStart} — ${data.coverageEnd}`,
    ``,
    `Prepared for ${name || 'our valued customer'}.`,
    `Bill Layne Insurance Agency · 1283 N Bridge St, Elkin, NC 28621 · (336) 835-1993`,
    `Save@BillLayneInsurance.com · www.BillLayneInsurance.com`,
  ].join('\n');
}

export function renderReceiptHtml(data: ReceiptData): RenderedReceipt {
  const html = replaceTokens(receiptDefaultTemplate, {
    FIRST_NAME: escapeHtml(data.clientFirstName),
    LAST_NAME: escapeHtml(data.clientLastName),
    CARRIER_NAME: escapeHtml(data.carrierName),
    CARRIER_LEGAL: escapeHtml(data.carrierLegal || data.carrierName),
    POLICY_NUMBER: escapeHtml(data.policyNumber),
    POLICY_NUMBER_LAST4: escapeHtml(policyLast4(data.policyNumber)),
    POLICY_TYPE: escapeHtml(data.policyType),
    COVERAGE_START: escapeHtml(data.coverageStart),
    COVERAGE_END: escapeHtml(data.coverageEnd),
    PAYMENT_AMOUNT: escapeHtml(amountDisplay(data.paymentAmount)),
    PAYMENT_AMOUNT_RAW: escapeHtml(Number(data.paymentAmount || 0).toFixed(2)),
    PAYMENT_DATE: escapeHtml(data.paymentDate),
    PAYMENT_DATE_ISO: escapeHtml(isoDate(data.paymentDate)),
    PAYMENT_TIME: escapeHtml(data.paymentTime),
    PAYMENT_METHOD: escapeHtml(data.paymentMethod),
    PAYMENT_METHOD_SHORT: escapeHtml(paymentMethodShort(data.paymentMethod)),
    CONFIRMATION_NUMBER: escapeHtml(data.confirmationNumber),
    TRANSACTION_ID: escapeHtml(data.transactionId),
  });

  return {
    html: html.trim().endsWith('</html>') ? html : `${html}`,
    subject: receiptSubject(data),
    preheader: receiptPreheader(data),
  };
}
