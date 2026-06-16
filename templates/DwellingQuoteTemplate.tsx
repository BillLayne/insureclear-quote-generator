import React from 'react';
import { BRAND } from '../config/brand';
import type { DwellingQuoteData } from '../types/dwelling';
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
  HeroImageBand,
  money,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  StackedRow,
  carrierFor,
} from './shared/EmailParts';

const propertyAddress = (data: DwellingQuoteData) =>
  `${data.property.streetAddress}, ${data.property.city}, ${data.property.state} ${data.property.zip}`;

const carrierList = (data: DwellingQuoteData) =>
  data.carriersShoppedNames
    .map((name, index) => (index === 0 ? `<strong>${name}</strong>` : name))
    .join(' &bull; ');

export const dwellingSubject = (data: DwellingQuoteData) =>
  `${data.clientFirstName.toLowerCase()}, your dwelling fire quote`;

export const dwellingPreheader = (data: DwellingQuoteData) =>
  `${money(data.annualPremium)}/yr · ${carrierFor(data.carrierId).displayName} · ${data.property.streetAddress}`;

function AddressBand({ data }: { data: DwellingQuoteData }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: BRAND.gradients.premiumFallback, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '0 32px 26px 32px' }}>
            <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto' }}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: BRAND.fontFamily, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Insured Property</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: BRAND.fontFamily, lineHeight: 1.4 }}>
                      {data.property.streetAddress}<br />
                      {data.property.city}, {data.property.state} {data.property.zip}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PolicyOverviewCard({ data }: { data: DwellingQuoteData }) {
  if (!data.showEducationCard) return null;
  const rows = [
    ['The Building', `Coverage A pays to repair or rebuild the structure after a covered loss under the ${data.formCode} form.`],
    ['Your Rental Income', 'Coverage D - Fair Rental Value - pays your lost rental income while the rental is repaired after a covered loss.'],
    ['Landlord Liability', 'Liability coverage protects you if a tenant or guest is injured on the property and sues.'],
    ['Not Tenant Property', "This policy does not cover your tenant's belongings. The tenant needs their own renters policy."],
  ];

  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Policy Overview" heading="What Your Dwelling Policy Covers" />
      {rows.map(([title, body]) => (
        <p key={title} style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '13px', lineHeight: 1.55, color: BRAND.colors.bodyText }}>
          <strong>{title}:</strong> {body}
        </p>
      ))}
    </Card>
  );
}

function CoverageCard({ data }: { data: DwellingQuoteData }) {
  const rows = [
    ['Home', 'Coverage A - Dwelling', 'The structure itself: walls, roof, foundation, built-in fixtures.', `${money(data.coverages.coverageA)} · ${data.coverages.coverageASettlement}`],
    ['Other', 'Coverage B - Other Structures', 'Detached garage, fence, shed, anything not attached to the main dwelling.', `${money(data.coverages.coverageB)} · ${data.coverages.coverageBSettlement}`],
    ['Box', "Coverage C - Personal Property (Landlord's only)", "Appliances and furnishings YOU own at the property. Does NOT cover tenant belongings.", `${money(data.coverages.coverageC)} · ${data.coverages.coverageCSettlement}`],
    ['Rent', 'Coverage D - Fair Rental Value', 'Your lost rental income while the property is uninhabitable after a covered loss.', money(data.coverages.coverageD)],
    ['Hotel', 'Coverage E - Additional Living Expense', 'Hotel/relocation if YOU occupy a portion. $0 on pure rentals.', money(data.coverages.coverageE)],
    ['Shield', 'Personal Liability', 'Legal and medical costs if a tenant or guest is injured on the property.', money(data.coverages.liability)],
    ['Medical', 'Medical Payments to Others', 'No-fault medical bills for guests injured at the property.', money(data.coverages.medicalPayments)],
    ['Deductible', 'All Other Perils Deductible', 'Standard deductible for non-wind/hail claims.', money(data.coverages.deductible)],
    ['Wind', 'Wind/Hail Deductible', 'Separate deductible specifically for windstorm and hail damage.', data.coverages.windHailDeductible],
  ];

  return (
    <Card>
      <SectionHeader micro="Coverage Details" heading="Your Coverage at a Glance" />
      {rows.map(([emoji, label, subLabel, amount], index) => {
        const coverageSplit = label.includes('Coverage A')
          ? { amount: money(data.coverages.coverageA), sub: data.coverages.coverageASettlement }
          : label.includes('Coverage B')
            ? { amount: money(data.coverages.coverageB), sub: data.coverages.coverageBSettlement }
            : label.includes('Coverage C')
              ? { amount: money(data.coverages.coverageC), sub: data.coverages.coverageCSettlement }
              : undefined;

        return (
          <CoverageRow
            key={label}
            emoji={emoji}
            label={label}
            subLabel={subLabel}
            amount={coverageSplit?.amount || amount}
            amountSubLabel={coverageSplit?.sub}
            isLast={index === rows.length - 1 && data.endorsements.length === 0}
          />
        );
      })}
      {data.endorsements.map((endorsement, index) => (
        <CoverageRow
          key={endorsement.name}
          emoji={endorsement.emoji}
          label={endorsement.name}
          subLabel={endorsement.subLabel}
          amount={`${endorsement.limit}${typeof endorsement.annualPremium === 'number' ? ` · ${money(endorsement.annualPremium, 2)}/yr` : ''}`}
          isLast={index === data.endorsements.length - 1}
          green={endorsement.status === 'included'}
        />
      ))}
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

function TIVCard({ data }: { data: DwellingQuoteData }) {
  const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Total Protection" heading="Combined Insurable Value" />
      <SnapshotCard
        micro="A + B + C Only"
        heading={money(tiv)}
        items={[
          { label: 'Coverage A', value: money(data.coverages.coverageA), sub: 'Dwelling' },
          { label: 'Coverage B', value: money(data.coverages.coverageB), sub: 'Other Structures' },
          { label: 'Coverage C', value: money(data.coverages.coverageC), sub: "Landlord's Personal Property" },
          { label: 'Not Included', value: 'Coverage D', sub: 'Fair Rental Value is separate' },
        ]}
      />
      <p style={{ margin: '12px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
        Each coverage applies separately, subject to its own limit and deductible. Coverage D (Fair Rental Value) is not included in this combined value.
      </p>
    </Card>
  );
}

function PropertyDetailsCard({ data }: { data: DwellingQuoteData }) {
  const p = data.property;
  const items = [
    { label: 'Year Built', value: String(p.yearBuilt) },
    { label: 'Square Feet', value: p.squareFeet ? `${p.squareFeet.toLocaleString()} sq ft` : 'Needs review' },
    { label: 'Construction', value: p.constructionType || 'Needs review' },
    { label: 'Roof', value: [p.roofType, p.roofAge ? `${p.roofAge} yrs` : ''].filter(Boolean).join(', ') || 'Needs review' },
    { label: 'Bedrooms / Baths', value: `${p.bedrooms || '-'}BR / ${p.bathrooms || '-'}BA` },
    { label: 'Foundation', value: p.foundationType || 'Needs review' },
    { label: 'HVAC', value: [p.hvacType, p.hvacAge ? `${p.hvacAge} yrs` : ''].filter(Boolean).join(', ') || 'Needs review' },
    { label: 'Electrical', value: [p.electricalAmps ? `${p.electricalAmps}A` : '', p.panelType].filter(Boolean).join(', ') || 'Needs review' },
    { label: 'Plumbing', value: p.plumbingType || 'Needs review' },
    { label: 'Use Type', value: data.rental.useType },
  ];
  return <SnapshotCard micro="Insured Property" heading={p.streetAddress} items={items} />;
}

function VacancyNotice({ data }: { data: DwellingQuoteData }) {
  return (
    <AlertCard
      title="Important - Vacancy & Use"
      body={`Use Type: ${data.rental.useType}. Current Status: ${data.rental.currentStatus}. Lease Type: ${data.rental.leaseType}. If the property sits vacant for more than 60 consecutive days, coverage for vandalism, glass breakage, theft, and water damage from frozen pipes may be excluded or restricted. Call before the 60-day mark if vacancy is expected.`}
    />
  );
}

function OwnersCard({ data }: { data: DwellingQuoteData }) {
  return (
    <Card>
      <SectionHeader micro="Named Insureds" heading="Property Owners" />
      {data.owners.map((owner, index) => (
        <StackedRow key={`${owner.name}-${index}`} title={owner.name} subLabel={`${owner.relationship} · Property Owner`} badge={owner.badge} primary={index === 0} />
      ))}
      {data.mortgagee?.lenderName && (
        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '8px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px 16px' }}>
                <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '13px', color: BRAND.colors.bodyText, fontWeight: 700 }}>
                  Lender: {data.mortgagee.lenderName}{data.mortgagee.loanNumber ? ` - Loan ${data.mortgagee.loanNumber}` : ''}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </Card>
  );
}

function DisclaimerCard({ data }: { data: DwellingQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Quote Disclosures" heading="Important Information" />
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        This quote is prepared by Bill Layne Insurance Agency on behalf of {data.carrierLegalEntity || carrier.legalName}. Quote is based on information provided and is subject to underwriting review and final approval by the carrier.
      </p>
      {data.isSurplusLines && (
        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', margin: '0 0 12px 0' }}>
          <tbody>
            <tr>
              <td style={{ padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', fontWeight: 800, color: '#78350f' }}>SURPLUS LINES NOTICE (Required by NC Law)</p>
                <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#78350f', lineHeight: 1.55 }}>
                  This policy is being placed with {data.surplusCarrierLegalEntity || data.carrierLegalEntity}, a non-admitted surplus lines insurer. Surplus lines insurers are NOT protected by the North Carolina Insurance Guaranty Association. In the event of insurer insolvency, you may not have access to the guaranty fund protections that apply to admitted carriers. Surplus lines premium is subject to NC surplus lines tax of {data.surplusTaxRate || 5}% and applicable stamping fees. Taxes and fees are non-refundable upon cancellation. This policy was placed in the surplus lines market because {data.surplusPlacementReason || "the property's use type, condition, or claim history made it ineligible for admitted market carriers"}.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        Vacancy Provision: This policy contains a 60-day vacancy clause. Coverage for vandalism, glass breakage, theft, and water damage from frozen pipes is excluded or restricted if the property is vacant for more than 60 consecutive days.
      </p>
      <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        Tenant belongings are not covered by this policy. We recommend requiring tenants to carry renters insurance with at least $100,000 liability and naming you as Additional Interest.
      </p>
    </Card>
  );
}

export function DwellingQuoteTemplate({ data }: { data: DwellingQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const fairRentalAdequacy = data.coverages.coverageD >= data.rental.monthlyRent * 12 ? 'Adequate' : 'Review needed';
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.annualPremium, 2),
    subject: dwellingSubject(data),
  });

  return (
    <html lang="en">
      <Head subject={dwellingSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={dwellingPreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label={`Dwelling Fire Quote (${data.formCode}) • ${carrier.displayName} • Prepared by Bill Layne Insurance Agency`} />
                        <HeroCard
                          badge={`${carrier.displayName} Dwelling Policy (${data.formCode})`}
                          greeting={`${data.clientFirstName}, here's your rental dwelling coverage quote.`}
                          thankYouLine={`${data.clientFirstName}, your ${carrier.displayName} ${data.formCode} dwelling fire quote for ${data.property.streetAddress} is ready - ${money(data.annualPremium, 2)}/yr with ${money(data.coverages.coverageA)} dwelling and ${money(data.coverages.coverageD)} fair rental value.`}
                          premiumLabel={data.showMonthlyHero ? 'Est. Monthly Payment' : 'Est. Annual Premium'}
                          bigNumber={data.showMonthlyHero ? money(data.annualPremium / 12, 2) : money(data.annualPremium, 2)}
                          unit={data.showMonthlyHero ? '/mo' : '/yr'}
                          subLine={data.showMonthlyHero ? `${money(data.annualPremium, 2)} total 12-month premium` : `${money(data.annualPremium / 12, 2)} per month equivalent`}
                          carrierList={carrierList(data)}
                          chips={[`${money(data.coverages.coverageA)} Dwelling`, `${data.coverages.windHailDeductible} W/H Ded`, `${money(data.coverages.liability)} Liability`]}
                        />
                        <AddressBand data={data} />
                        <HeroImageBand
                          imageUrl={data.heroImageUrl || data.propertyPhotoUrl}
                          imageAlt={`Property photo for ${propertyAddress(data)}`}
                          imageCaption={data.property.streetAddress}
                        />
                        {data.isSurplusLines && <AlertCard title="Surplus Lines Tax & Fees" body={`Premium includes NC surplus lines tax (${money(data.surplusTax || 0, 2)}) and policy fees (${money(data.policyFee || 0, 2)}) - non-refundable upon cancellation.`} />}
                        <Card>
                          <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '15px', color: BRAND.colors.bodyText, lineHeight: 1.65 }}>
                            Hi {data.clientFirstName}, your {data.formCode} dwelling fire quote with <strong>{carrier.displayName}</strong> is ready for <strong>{propertyAddress(data)}</strong>. This policy is designed for landlords: it covers the structure, your landlord liability, and rental income if the property becomes uninhabitable after a covered loss.
                          </p>
                          <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '13px', color: BRAND.colors.mutedText, lineHeight: 1.6 }}>
                            Coverage starts only after carrier acceptance and payment. Tenant belongings are separate and should be handled with a renters policy.
                          </p>
                        </Card>
                        <SnapshotCard
                          micro="Landlord Snapshot"
                          heading="Rental Coverage Summary"
                          items={[
                            { label: 'Annual Premium', value: money(data.annualPremium, 2), sub: `${money(data.annualPremium / 12, 2)}/mo equivalent` },
                            { label: 'Form', value: data.formCode, sub: data.isSurplusLines ? 'Surplus lines' : 'Admitted placement' },
                            { label: 'Monthly Rent', value: money(data.rental.monthlyRent), sub: `${money(data.rental.monthlyRent * 12)} annual rent` },
                            { label: 'Fair Rental Value', value: money(data.coverages.coverageD), sub: fairRentalAdequacy },
                            { label: 'Use Type', value: data.rental.useType, sub: data.rental.currentStatus },
                            { label: 'Quote Expires', value: formatDate(data.expiryDate), sub: 'Rate subject to verification' },
                          ]}
                        />
                        <PolicyOverviewCard data={data} />
                        <CoverageCard data={data} />
                        <TIVCard data={data} />
                        <PropertyDetailsCard data={data} />
                        <VacancyNotice data={data} />
                        <OwnersCard data={data} />
                        {data.discounts.length > 0 && (
                          <Card bg="#fafafa">
                            <SectionHeader micro="Savings Applied" heading="Discounts on This Quote" />
                            <DiscountGrid discounts={data.discounts} />
                          </Card>
                        )}
                        <CustomerReviewCard />
                        <CTABlock
                          heading="Ready to review the next step?"
                          body={data.mortgagee ? 'Click below and I will contact you to review the application. Evidence of Insurance can be sent to your lender after bind.' : 'Click below and I will contact you to review the application before anything is submitted.'}
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
