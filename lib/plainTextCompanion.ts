import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { AutoQuoteData } from '../types/auto';
import type { DwellingQuoteData } from '../types/dwelling';
import type { HomeQuoteData } from '../types/home';
import type { MotorcycleQuoteData } from '../types/motorcycle';
import type { QuoteData } from '../types/quote';
import type { RentersQuoteData } from '../types/renters';
import { money } from '../templates/shared/EmailParts';

const carrierName = (data: QuoteData) => CARRIERS[data.carrierId]?.displayName || data.carrierId;
const carrierLegal = (data: QuoteData) => CARRIERS[data.carrierId]?.legalName || carrierName(data);

export function generatePlainText(data: QuoteData): string {
  return data.templateType === 'auto' ? autoText(data) : data.templateType === 'home' ? homeText(data) : data.templateType === 'motorcycle' ? motorcycleText(data) : data.templateType === 'renters' ? rentersText(data) : dwellingText(data);
}

function autoText(data: AutoQuoteData): string {
  const monthly = money(data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths, 2);
  return `${data.clientFirstName}, your ${carrierName(data)} auto insurance quote is ready. ${monthly}/mo, ${money(data.totalPremium, 2)} total.

QUOTE SUMMARY
=============
EFT Recurring Payment: ${monthly}/mo
Down Payment: ${money(data.paymentOptions.eft.downPayment, 2)}
Total ${data.termMonths}-Month Premium: ${money(data.totalPremium, 2)}
Pay in Full: ${money(data.paymentOptions.paidInFull.total, 2)} (save ${money(data.paymentOptions.paidInFull.savings, 2)})
Carrier: ${carrierName(data)}
Vehicles: ${data.vehicles.length}
Quoted: ${data.quoteDate}

VEHICLES
========
${data.vehicles.map((v) => `${v.year} ${v.make} ${v.model} - ${v.coverageType === 'full_coverage' ? 'Full Coverage' : 'Liability Only'} - ${money(v.vehiclePremium, 2)}
${(v.coverages || []).map((c) => `  - ${c.name}: ${c.limitOrDeductible}${c.status !== 'included' ? ` (${c.status.replace('_', ' ')})` : ''}`).join('\n')}`).join('\n\n')}

DRIVERS
=======
${data.drivers.map((d) => `${d.name} - Age ${d.age} - ${d.relationship}`).join('\n')}

DISCOUNTS APPLIED
=================
${data.discounts.map((d) => d.label).join(', ')}

WHAT HAPPENS NEXT
=================
1. Reply START or call to begin the application
2. Sign the application
3. Make your first payment

Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.

Bill Layne
Call: ${BRAND.phone}
Email: ${BRAND.email}
Web: ${BRAND.website}

This is a quote only. Coverage is not bound until application is submitted, accepted by ${carrierLegal(data)}, and initial payment received.

${BRAND.name} | ${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip}
To unsubscribe, reply with UNSUBSCRIBE.`;
}

function homeText(data: HomeQuoteData): string {
  const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
  return `${data.clientFirstName}, your ${carrierName(data)} home insurance quote is ready. ${money(data.annualPremium)}/yr, ${money(tiv)} combined property coverage.

QUOTE SUMMARY
=============
Annual Premium: ${money(data.annualPremium, 2)}
Carrier: ${carrierName(data)}
Policy Type: ${data.policyType}
Dwelling Coverage: ${money(data.coverages.coverageA)}
Combined Coverage Value: ${money(tiv)}
Quoted: ${data.quoteDate}

PROPERTY
========
${data.propertyAddress}
Year Built: ${data.yearBuilt}
Construction: ${data.constructionType || 'Not listed'}
Roof: ${[data.roofYear, data.roofMaterial].filter(Boolean).join(' ') || 'Not listed'}

COVERAGE
========
Coverage A Dwelling: ${money(data.coverages.coverageA)}
Coverage B Other Structures: ${money(data.coverages.coverageB)}
Coverage C Personal Property: ${money(data.coverages.coverageC)}
Coverage D Loss of Use: ${formatCoverageD(data.coverages.coverageD)}
Coverage E Liability: ${money(data.coverages.coverageE)}
Coverage F Medical Payments: ${money(data.coverages.coverageF)}

DISCOUNTS APPLIED
=================
${data.discounts.map((d) => d.label).join(', ')}

WHAT HAPPENS NEXT
=================
1. Reply START or call to begin the application
2. Confirm any binding requirements
3. Make your first payment

Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.

Bill Layne
Call: ${BRAND.phone}
Email: ${BRAND.email}
Web: ${BRAND.website}

This is a quote only. Coverage is not bound until application is submitted, accepted by ${carrierLegal(data)}, and initial payment received.

${BRAND.name} | ${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip}
To unsubscribe, reply with UNSUBSCRIBE.`;
}

function formatCoverageD(value: number | string) {
  if (value === 'Included') return 'Included';
  if (typeof value === 'number') return money(value);
  const parsed = Number(value.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? money(parsed) : value;
}

function motorcycleText(data: MotorcycleQuoteData): string {
  const carrier = carrierName(data);
  const bike = [data.bike.year, data.bike.make, data.bike.model, data.bike.trim].filter(Boolean).join(' ');
  return `${data.clientFirstName}, your ${carrier} motorcycle quote for the ${bike} is ready. ${money(data.annualPremium, 2)}/yr.

QUOTE SUMMARY
=============
Annual Premium: ${money(data.annualPremium, 2)}
Monthly Equivalent: ${money(data.annualPremium / 12, 2)}/mo
Carrier: ${carrier}
Bike: ${bike}
Quote Number: ${data.quoteNumber}
Quoted: ${data.quoteDate}

MOTORCYCLE
==========
VIN: ${data.bike.vin}
Engine: ${data.bike.engine}
Type: ${data.bike.bikeType}
Garaging ZIP: ${data.bike.garagingZip}
Storage: ${data.bike.storageType || 'Not listed'}

COVERAGE
========
${data.coverages.map((coverage) => `${coverage.name}: ${coverage.limit} - ${coverage.subLabel}`).join('\n')}

RIDERS
======
${data.riders.map((rider) => `${rider.name} - Age ${rider.age} - ${rider.yearsRiding} yrs riding${rider.classMYear ? ` - Class M ${rider.classMYear}` : ''}${rider.msfYear ? ` - MSF ${rider.msfYear}` : ''}`).join('\n')}

DISCOUNTS APPLIED
=================
${data.discounts.map((discount) => discount.label).join(', ')}

WHAT HAPPENS NEXT
=================
1. Reply or call to begin the application
2. Confirm rider and motorcycle details
3. Make your first payment

Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.

Bill Layne
Call: ${BRAND.phone}
Email: ${BRAND.email}
Web: ${BRAND.website}

This is a quote only. Coverage is not bound until application is submitted, accepted by ${data.carrierLegalEntity || carrierLegal(data)}, and initial payment received.

${BRAND.name} | ${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip}
To unsubscribe, reply with UNSUBSCRIBE.`;
}

function rentersText(data: RentersQuoteData): string {
  const carrier = carrierName(data);
  const address = `${data.unit.streetAddress}, ${data.unit.city}, ${data.unit.state} ${data.unit.zip}`;
  return `${data.clientFirstName}, your ${carrier} renters quote is ready. ${money(data.annualPremium, 2)}/yr for ${address}.

QUOTE SUMMARY
=============
Annual Premium: ${money(data.annualPremium, 2)}
Monthly Equivalent: ${money(data.annualPremium / 12, 2)}/mo
Carrier: ${carrier}
Unit: ${address}
Quote Number: ${data.quoteNumber}
Quoted: ${data.quoteDate}

COVERAGE
========
Coverage C Personal Property: ${money(data.coverages.coverageC)} (${data.coverages.coverageCSettlement})
Coverage D Loss of Use: ${formatCoverageD(data.coverages.coverageD)}
Coverage E Personal Liability: ${money(data.coverages.coverageE)}
Coverage F Medical Payments: ${money(data.coverages.coverageF)}
Deductible: ${money(data.coverages.deductible)}

INSUREDS
========
${data.insureds.map((insured) => `${insured.name} - Age ${insured.age} - ${insured.relationship.replace('_', ' ')}`).join('\n')}

DISCOUNTS APPLIED
=================
${data.discounts.map((discount) => discount.label).join(', ') || 'None listed'}

WHAT HAPPENS NEXT
=================
1. Reply or call to begin the application
2. Confirm the effective date and landlord certificate needs
3. Make your first payment

Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.

Bill Layne
Call: ${BRAND.phone}
Email: ${BRAND.email}
Web: ${BRAND.website}

This is a quote only. Coverage is not bound until application is submitted, accepted by ${data.carrierLegalEntity || carrierLegal(data)}, and initial payment received.

${BRAND.name} | ${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip}
To unsubscribe, reply with UNSUBSCRIBE.`;
}

function dwellingText(data: DwellingQuoteData): string {
  const carrier = carrierName(data);
  const address = `${data.property.streetAddress}, ${data.property.city}, ${data.property.state} ${data.property.zip}`;
  const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
  return `${data.clientFirstName}, your ${carrier} ${data.formCode} dwelling fire quote for ${address} is ready. ${money(data.annualPremium, 2)}/yr.

QUOTE SUMMARY
=============
Annual Premium: ${money(data.annualPremium, 2)}
Monthly Equivalent: ${money(data.annualPremium / 12, 2)}/mo
Carrier: ${carrier}
Form: ${data.formCode}
Property: ${address}
Quote Number: ${data.quoteNumber}
Quoted: ${data.quoteDate}

COVERAGE
========
Coverage A Dwelling: ${money(data.coverages.coverageA)} (${data.coverages.coverageASettlement})
Coverage B Other Structures: ${money(data.coverages.coverageB)}
Coverage C Landlord Personal Property: ${money(data.coverages.coverageC)} (${data.coverages.coverageCSettlement})
Coverage D Fair Rental Value: ${money(data.coverages.coverageD)}
Liability: ${money(data.coverages.liability)}
Medical Payments: ${money(data.coverages.medicalPayments)}
All Other Perils Deductible: ${money(data.coverages.deductible)}
Wind/Hail Deductible: ${data.coverages.windHailDeductible}
Combined Insurable Value: ${money(tiv)}

RENTAL USE
==========
Use Type: ${data.rental.useType}
Lease Type: ${data.rental.leaseType}
Current Status: ${data.rental.currentStatus}
Monthly Rent: ${money(data.rental.monthlyRent)}

OWNERS
======
${data.owners.map((owner) => `${owner.name} - ${owner.relationship}`).join('\n')}

WHAT HAPPENS NEXT
=================
1. Reply or call to begin the application
2. Confirm occupancy, vacancy, and lender details
3. Make your first payment

Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.

Important: Coverage D is Fair Rental Value for the landlord. Tenant belongings are not covered by this policy.

Bill Layne
Call: ${BRAND.phone}
Email: ${BRAND.email}
Web: ${BRAND.website}

This is a quote only. Coverage is not bound until application is submitted, accepted by ${data.carrierLegalEntity || carrierLegal(data)}, and initial payment received.

${BRAND.name} | ${BRAND.street} | ${BRAND.city}, ${BRAND.state} ${BRAND.zip}
To unsubscribe, reply with UNSUBSCRIBE.`;
}
