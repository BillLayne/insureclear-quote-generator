import React from 'react';
import { BRAND } from '../config/brand';
import type { MotorcycleQuoteData, MotorcycleRider } from '../types/motorcycle';
import {
  AlertCard,
  BodySpacer,
  Card,
  CoverageRow,
  CTABlock,
  CustomerReviewCard,
  DiscountGrid,
  Footer,
  formatDate,
  Head,
  HeaderCard,
  HeroCard,
  money,
  plural,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  StackedRow,
  carrierFor,
} from './shared/EmailParts';

const bikeName = (data: MotorcycleQuoteData) =>
  [data.bike.year, data.bike.make, data.bike.model, data.bike.trim].filter(Boolean).join(' ');

const liabilityChip = (data: MotorcycleQuoteData) => {
  const bi = data.coverages.find((coverage) => /bodily injury/i.test(coverage.name));
  const pd = data.coverages.find((coverage) => /property damage/i.test(coverage.name));
  if (!bi && !pd) return 'Liability selected';
  return [bi?.limit.replace(/\$|,000| per person| per accident/gi, '').replace(/\s+/g, ' ').trim(), pd?.limit.replace(/\$|,000| per accident/gi, '').trim()]
    .filter(Boolean)
    .join(' / ');
};

const deductibleChip = (data: MotorcycleQuoteData) => {
  const comp = data.coverages.find((coverage) => /^comprehensive/i.test(coverage.name));
  const coll = data.coverages.find((coverage) => /^collision/i.test(coverage.name));
  if (!comp && !coll) return 'Liability only';
  const compDed = comp?.limit.match(/\$[\d,]+/)?.[0];
  const collDed = coll?.limit.match(/\$[\d,]+/)?.[0];
  return compDed && collDed && compDed === collDed ? `${compDed} Comp/Coll` : [compDed && `${compDed} Comp`, collDed && `${collDed} Coll`].filter(Boolean).join(' · ');
};

const riderBadge = (rider: MotorcycleRider) => {
  if (rider.relationship === 'insured') return 'Primary';
  if (rider.relationship === 'co_rider') return 'Co-Rider';
  return rider.relationship.charAt(0).toUpperCase() + rider.relationship.slice(1).replace('_', ' ');
};

export const motorcycleSubject = (data: MotorcycleQuoteData) => {
  const carrier = carrierFor(data.carrierId);
  return `🏍️ ${data.clientFirstName.toLowerCase()}, your ${carrier.displayName.toLowerCase()} motorcycle quote`;
};

export const motorcyclePreheader = (data: MotorcycleQuoteData) =>
  `${money(data.annualPremium)}/yr · ${carrierFor(data.carrierId).displayName} · ${data.bike.year} ${data.bike.make} ${data.bike.model}`;

function PaymentPlanCard({ data }: { data: MotorcycleQuoteData }) {
  const hasInstallments = data.downPayment || data.recurringPayment || data.installmentCount;
  const hasPif = typeof data.pifTotal === 'number';

  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Payment Options" heading="Choose Your Plan" />
      <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          <tr>
            {hasInstallments && (
              <td className="stack-mobile" width={hasPif ? '50%' : '100%'} style={{ padding: hasPif ? '0 6px 0 0' : 0 }}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '18px' }}>
                        <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>Monthly Card Payment</p>
                        <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '22px', fontWeight: 700, color: BRAND.colors.navy }}>{money(data.recurringPayment || 0, 2)}/mo</p>
                        <p style={{ margin: '5px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>
                          Down: {money(data.downPayment || 0, 2)} · Then {data.installmentCount || 0} monthly charges
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            )}
            {hasPif && (
              <td className="stack-mobile" width={hasInstallments ? '50%' : '100%'} style={{ padding: hasInstallments ? '0 0 0 6px' : 0 }}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '18px' }}>
                        <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>
                          Pay in Full {data.pifSavings ? `- Save ${money(data.pifSavings, 2)} 💰` : ''}
                        </p>
                        <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '22px', fontWeight: 700, color: BRAND.colors.greenText }}>{money(data.pifTotal || data.annualPremium, 2)}</p>
                        <p style={{ margin: '5px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>One payment, no installment fees</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

function BikeDetailsCard({ data }: { data: MotorcycleQuoteData }) {
  const rows = [
    ['VIN', data.bike.vin],
    ['Engine', data.bike.engine],
    ['Type', data.bike.bikeType],
    ['Mileage', data.bike.mileage ? data.bike.mileage.toLocaleString() : 'Not listed'],
    ['Garaging ZIP', data.bike.garagingZip],
    ['Storage', data.bike.storageType || 'Not listed'],
    ['Purchase / Agreed Value', data.bike.agreedValue ? money(data.bike.agreedValue) : data.bike.purchasePrice ? money(data.bike.purchasePrice) : 'Not listed'],
    ['Lien', data.bike.lienholderName || 'None listed'],
  ];

  return (
    <Card>
      <SectionHeader micro="Insured Motorcycle" heading={bikeName(data)} />
      <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          {Array.from({ length: Math.ceil(rows.length / 2) }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {rows.slice(rowIndex * 2, rowIndex * 2 + 2).map(([label, value]) => (
                <td key={label} className="stack-mobile" width="50%" style={{ padding: '0 8px 12px 0' }}>
                  <p style={{ margin: '0 0 3px 0', fontFamily: BRAND.fontFamily, fontSize: '10px', fontWeight: 700, color: BRAND.colors.mutedText, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</p>
                  <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{value}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.bike.aftermarketModifications && data.bike.aftermarketModifications.length > 0 && (
        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginTop: '4px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px 16px' }}>
                <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', lineHeight: 1.5, color: '#1e40af' }}>
                  <strong>Aftermarket additions:</strong> {data.bike.aftermarketModifications.join(', ')}. Confirm these fit inside your Custom Parts & Equipment limit before binding.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </Card>
  );
}

function MotorcycleCoverageCard({ data }: { data: MotorcycleQuoteData }) {
  const includedBundle = data.coverages
    .filter((coverage) => /helmet|trip interruption|roadside/i.test(coverage.name) && coverage.status === 'included')
    .map((coverage) => coverage.name);

  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Coverage Details" heading="What's Included" />
      {data.coverages.map((coverage, index) => (
        <CoverageRow
          key={`${coverage.name}-${index}`}
          emoji={coverage.emoji}
          label={coverage.name}
          subLabel={coverage.subLabel}
          amount={`${coverage.limit}${typeof coverage.annualPremium === 'number' ? ` · ${money(coverage.annualPremium, 2)}/yr` : ''}`}
          green={coverage.status === 'included' || coverage.status === 'credit'}
          isLast={index === data.coverages.length - 1}
        />
      ))}
      {includedBundle.length > 1 && (
        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginTop: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px 16px' }}>
                <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#0369a1', fontWeight: 600, lineHeight: 1.5 }}>
                  🎁 Also included with Comp & Collision: {includedBundle.join(', ')}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: BRAND.colors.navy, borderRadius: '8px', marginTop: '14px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '16px 20px' }}>
              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td><span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: BRAND.fontFamily }}>Total Annual Premium</span></td>
                    <td align="right"><span style={{ fontSize: '22px', fontWeight: 700, color: BRAND.colors.gold, fontFamily: BRAND.fontFamily }}>{money(data.annualPremium, 2)}</span></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

function RidersCard({ data }: { data: MotorcycleQuoteData }) {
  return (
    <Card>
      <SectionHeader micro="Rated Riders" heading={`${plural(data.riders.length, 'Rider')} on This Policy`} />
      {data.riders.map((rider, index) => (
        <StackedRow
          key={`${rider.name}-${index}`}
          title={rider.name}
          subLabel={`${rider.relationship === 'insured' ? 'Insured' : riderBadge(rider)} · Age ${rider.age} · ${rider.yearsRiding} yrs riding${rider.classMYear ? ` · Class M ${rider.classMYear}` : ''}${rider.msfYear ? ` · MSF ${rider.msfYear}` : ''}`}
          badge={riderBadge(rider)}
          primary={rider.relationship === 'insured'}
          warning={rider.relationship === 'excluded'}
        />
      ))}
    </Card>
  );
}

function DisclaimerCard({ data }: { data: MotorcycleQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Quote Disclosures" heading="Important Information" />
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        This quote is prepared by Bill Layne Insurance Agency on behalf of {data.carrierLegalEntity || carrier.legalName}. Quote is based on information provided and is subject to underwriting review and final approval by the carrier.
      </p>
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        Premium and coverage may change pending verification of vehicle data, motor vehicle records, rider history, and prior loss history. Coverage does not begin until the policy is bound and the down payment is processed.
      </p>
      {data.layupAvailable && data.layupMonths && (
        <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#92400e', lineHeight: 1.6 }}>
          <strong>Layup credit note:</strong> Layup credit may apply during designated storage months ({data.layupMonths}). Physical damage coverage may be suspended during these months, so confirm exact terms before selecting it.
        </p>
      )}
      {data.hasSurplusLines && <AlertCard title="Surplus Lines Notice" body="This policy may be placed with a non-admitted carrier. Surplus lines insurers are not protected by the North Carolina Insurance Guaranty Association." />}
    </Card>
  );
}

export function MotorcycleQuoteTemplate({ data }: { data: MotorcycleQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const annualHero = !data.showMonthlyHero;
  const monthlyEquivalent = data.annualPremium / 12;
  const heroBig = annualHero ? money(data.annualPremium, 2) : money(data.recurringPayment || monthlyEquivalent, 2);
  const heroUnit = annualHero ? '/yr' : '/mo';
  const heroSub = annualHero ? `${money(monthlyEquivalent, 2)} per month equivalent` : `${money(data.annualPremium, 2)} total 12-month premium`;
  const carrierList = data.carriersShoppedNames
    .map((name, index) => (index === 0 ? `<strong>${name}</strong>` : name))
    .join(' &bull; ');
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.annualPremium, 2),
    subject: motorcycleSubject(data),
  });

  return (
    <html lang="en">
      <Head subject={motorcycleSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={motorcyclePreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label={`Motorcycle Insurance Quote • ${carrier.displayName} • Prepared by Bill Layne Insurance Agency`} />
                        <HeroCard
                          badge={`🏍️ ${carrier.displayName} Motorcycle Quote`}
                          greeting={`Your ${bikeName(data)} is ready to ride.`}
                          thankYouLine={`${data.clientFirstName}, your ${carrier.displayName} motorcycle quote for the ${bikeName(data)} is ready - ${money(data.annualPremium)}/yr with the key coverage details below.`}
                          premiumLabel={annualHero ? 'Est. Annual Premium' : 'Est. Monthly Payment'}
                          bigNumber={heroBig}
                          unit={heroUnit}
                          subLine={heroSub}
                          carrierList={carrierList}
                          chips={[data.bike.bikeType, liabilityChip(data), deductibleChip(data)]}
                          imageUrl={data.heroImageUrl || data.bike.photoUrl}
                          imageAlt={bikeName(data)}
                          imageCaption={bikeName(data)}
                          imagePlacement="afterGreeting"
                        />
                        {data.pifSavings && data.pifTotal ? (
                          <AlertCard title="Pay-in-Full Savings" body={`Pay in full and save ${money(data.pifSavings, 2)} - just ${money(data.pifTotal, 2)} total.`} />
                        ) : null}
                        {data.layupAvailable && data.layupSavings ? (
                          <AlertCard title="Layup Credit Available" body={`Save up to ${money(data.layupSavings, 2)} by suspending physical damage during stored months. Confirm exact terms before binding.`} />
                        ) : null}
                        <Card>
                          <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '15px', color: BRAND.colors.bodyText, lineHeight: 1.65 }}>
                            Hey {data.clientFirstName}, your {carrier.displayName} motorcycle quote is all set for the <strong>{bikeName(data)}</strong>. That is a great {data.bike.bikeType.toLowerCase()} bike, and I laid out the important coverages so you can see exactly what is included.
                          </p>
                          <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '13px', color: BRAND.colors.mutedText, lineHeight: 1.6 }}>
                            To start the application, call or reply and I will confirm the payment plan, rider details, and effective date. Coverage starts only after carrier acceptance and payment.
                          </p>
                        </Card>

                        {data.hasActionRequired && (
                          <AlertCard
                            title="Action Required"
                            body={data.actionRequiredReason || `To start coverage, call with payment information. The initial charge is ${money(data.downPayment || 0, 2)}, then ${money(data.recurringPayment || 0, 2)} monthly from there.`}
                          />
                        )}

                        <SnapshotCard
                          micro="Quick Decision Snapshot"
                          heading="The Numbers at a Glance"
                          items={[
                            { label: 'Annual Premium', value: `${money(data.annualPremium, 2)}/yr`, sub: `${money(monthlyEquivalent, 2)}/mo equivalent` },
                            { label: 'Carrier', value: carrier.displayName, sub: data.carrierLegalEntity },
                            { label: 'Motorcycle', value: bikeName(data), sub: data.bike.vin ? `VIN ${data.bike.vin.slice(-8)}` : data.bike.bikeType },
                            { label: 'Deductible', value: deductibleChip(data), sub: 'Comp / collision when selected' },
                            { label: 'CPE Limit', value: data.coverages.find((coverage) => /custom parts|cpe/i.test(coverage.name))?.limit || 'Review selected limit', sub: 'Aftermarket parts and accessories' },
                            { label: 'Quote Expires', value: formatDate(data.expiryDate), sub: 'Rate subject to verification' },
                          ]}
                        />
                        <PaymentPlanCard data={data} />
                        <BikeDetailsCard data={data} />
                        <MotorcycleCoverageCard data={data} />
                        <RidersCard data={data} />
                        <Card bg="#fafafa">
                          <SectionHeader micro="Savings Applied" heading="Discounts on This Quote" />
                          <DiscountGrid discounts={data.discounts} />
                        </Card>
                        <CustomerReviewCard />
                        <CTABlock
                          heading="Ready to review the next step?"
                          body="Click below and confirm you want me to contact you. Coverage can begin on the date you choose after the application is accepted and payment is processed."
                          primaryLabel="Contact Me"
                          actionHref={actionHref}
                        />
                        <DisclaimerCard data={data} />
                        <Footer />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <SchemaJsonLd quoteNumber={data.quoteNumber} />
      </body>
    </html>
  );
}
