import React from 'react';
import { BRAND } from '../config/brand';
import { COPY } from '../config/copy';
import type { HomeQuoteData } from '../types/home';
import {
  AlertCard,
  BodySpacer,
  Card,
  CoverageRow,
  CTABlock,
  CustomerReviewCard,
  DiscountGrid,
  EarlyActionCard,
  Footer,
  formatDate,
  Head,
  HeaderCard,
  HeroCard,
  IntroCard,
  money,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  carrierFor,
} from './shared/EmailParts';

export const homeSubject = (data: HomeQuoteData) => {
  const carrier = carrierFor(data.carrierId);
  return `🏠 ${data.clientFirstName.toLowerCase()}, your ${carrier.displayName.toLowerCase()} home quote is ready`;
};

export const homePreheader = (data: HomeQuoteData) =>
  `${money(data.annualPremium)}/yr · ${money(data.coverages.coverageA / 1000)}K dwelling · review coverage`;

const value = (amount: number | string) => {
  if (amount === 'Included') return amount;
  if (typeof amount === 'number') return money(amount);
  const parsed = Number(amount.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? money(parsed) : amount;
};

export function HomeQuoteTemplate({ data }: { data: HomeQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
  const carrierList = data.carriersShoppedNames
    .map((name, index) => (index === 0 ? `<strong>${name}</strong>` : name))
    .join(' &bull; ');
  const isDwelling = data.policyType.startsWith('DP');
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.annualPremium, 2),
    subject: homeSubject(data),
  });

  const coverageRows = [
    ['🏠', 'Coverage A - Dwelling', "Replacement cost of your home's structure", money(data.coverages.coverageA)],
    ['🏗️', 'Coverage B - Other Structures', 'Detached garage, fence, shed', money(data.coverages.coverageB)],
    ['📦', 'Coverage C - Personal Property', 'Furniture, electronics, clothing', money(data.coverages.coverageC)],
    ['🏨', 'Coverage D - Loss of Use', 'Hotel and living expenses if home uninhabitable', value(data.coverages.coverageD)],
    ['🛡️', 'Coverage E - Personal Liability', 'Legal and injury protection on property', money(data.coverages.coverageE)],
    ['🏥', 'Coverage F - Medical Payments', 'No-fault medical bills for guests', money(data.coverages.coverageF)],
  ];

  return (
    <html lang="en">
      <Head subject={homeSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={homePreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label={isDwelling ? 'Dwelling Policy Quote' : 'Homeowners Quote'} />
                        <HeroCard
                          badge={isDwelling ? '🏘️ Dwelling Policy' : '🏠 Homeowners Quote'}
                          greeting={`${data.clientFirstName}, your ${carrier.displayName} ${isDwelling ? 'dwelling' : 'home'} quote is ready.`}
                          thankYouLine={COPY.thankYouQuote}
                          premiumLabel="Annual Premium"
                          bigNumber={money(data.annualPremium)}
                          unit="/yr"
                          subLine={`~${money(data.annualPremium / 12)}/mo mortgage escrow estimate`}
                          carrierList={carrierList}
                          chips={[data.policyType, `${money(data.coverages.coverageA / 1000)}K Dwelling`, `${data.yearBuilt} home`]}
                          imageUrl={data.heroImageUrl}
                          imageAlt={`Property photo for ${data.propertyAddress}`}
                          imageCaption={data.propertyAddress}
                          imagePlacement="afterGreeting"
                        />
                        <EarlyActionCard
                          heading="Ready for me to start the application?"
                          body="Click below and confirm you want me to contact you. I will review binding requirements, application details, and first payment before anything is submitted."
                          primaryLabel="Contact Me"
                          actionHref={actionHref}
                        />
                        <IntroCard firstName={data.clientFirstName} carrier={carrier} />

                        <SnapshotCard
                          micro="Quick Decision Snapshot"
                          heading="The Numbers at a Glance"
                          items={[
                            { label: 'Annual Premium', value: `${money(data.annualPremium)}/yr`, sub: `About ${money(data.annualPremium / 12)}/mo in escrow` },
                            { label: 'Carrier', value: carrier.displayName, sub: data.policyType },
                            { label: 'Dwelling', value: money(data.coverages.coverageA), sub: 'Coverage A' },
                            { label: 'Deductible', value: money(data.allPerilDeductible), sub: data.windHailDeductible ? `${money(data.windHailDeductible)} wind/hail` : 'All perils' },
                            { label: 'Property', value: `${data.yearBuilt} home`, sub: data.squareFeet ? `${data.squareFeet.toLocaleString()} sq ft` : data.propertyAddress },
                            { label: 'Quote Expires', value: formatDate(data.expiryDate), sub: 'Rate subject to verification' },
                          ]}
                        />

                        <Card>
                          <SectionHeader micro="Your Property Coverage" heading="Combined Coverage Value" />
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ background: BRAND.gradients.blue, backgroundColor: BRAND.colors.navy, borderRadius: '14px' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '24px', textAlign: 'center' }}>
                                  <p style={{ margin: '0 0 6px 0', fontFamily: BRAND.fontFamily, fontSize: '10px', fontWeight: 700, color: BRAND.colors.gold, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                                    Combined Coverage Value - Across 3 Separate Coverages
                                  </p>
                                  <p style={{ margin: '0 0 18px 0', fontFamily: BRAND.fontFamily, fontSize: '38px', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
                                    {money(tiv)}
                                  </p>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                    <tbody>
                                      <tr>
                                        {[
                                          ['Dwelling', data.coverages.coverageA],
                                          ['Other Structures', data.coverages.coverageB],
                                          ['Personal Property', data.coverages.coverageC],
                                        ].map(([label, amount]) => (
                                          <td key={label} width="33.33%" align="center" style={{ borderRight: label === 'Personal Property' ? 'none' : '1px solid rgba(255,255,255,0.25)', padding: '0 8px' }}>
                                            <p style={{ margin: '0 0 4px 0', fontFamily: BRAND.fontFamily, fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{label}</p>
                                            <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{money(Number(amount))}</p>
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginTop: '14px' }}>
                            <tbody><tr><td style={{ padding: '12px 16px' }}>
                              <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#1e40af', lineHeight: 1.55 }}>ⓘ {COPY.tivClarifier}</p>
                            </td></tr></tbody>
                          </table>
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Deductibles" heading="Your Deductibles" />
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                            <tbody><tr>
                              <td className="stack-mobile" width={data.windHailDeductible ? '50%' : '100%'} style={{ paddingRight: data.windHailDeductible ? '6px' : 0 }}>
                                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '10px' }}>
                                  <tbody><tr><td style={{ padding: '18px', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 6px 0', fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: BRAND.colors.darkSlate }}>All Peril Deductible</p>
                                    <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '26px', fontWeight: 700, color: BRAND.colors.navy }}>{money(data.allPerilDeductible)}</p>
                                    <p style={{ margin: '4px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>Per covered loss</p>
                                  </td></tr></tbody>
                                </table>
                              </td>
                              {data.windHailDeductible && (
                                <td className="stack-mobile" width="50%" style={{ paddingLeft: '6px' }}>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px' }}>
                                    <tbody><tr><td style={{ padding: '18px', textAlign: 'center' }}>
                                      <p style={{ margin: '0 0 6px 0', fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: BRAND.colors.darkSlate }}>Wind and Hail Deductible</p>
                                      <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '26px', fontWeight: 700, color: BRAND.colors.amberText }}>{money(data.windHailDeductible)}</p>
                                      <p style={{ margin: '4px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>Wind and hail events</p>
                                    </td></tr></tbody>
                                  </table>
                                </td>
                              )}
                            </tr></tbody>
                          </table>
                        </Card>

                        <Card>
                          <SectionHeader micro="Coverage Detail" heading="Your Coverage Breakdown" />
                          {coverageRows.map(([emoji, label, subLabel, amount], index) => (
                            <CoverageRow key={label} emoji={emoji} label={label} subLabel={subLabel} amount={amount} green={amount === 'Included'} isLast={index === coverageRows.length - 1} />
                          ))}
                        </Card>

                        {data.endorsements.length > 0 && (
                          <Card bg="#fafafa">
                            <SectionHeader micro="Additional Coverages" heading="Endorsements Included" />
                            {data.endorsements.map((endorsement, index) => (
                              <CoverageRow key={endorsement.name} emoji={endorsement.emoji} label={endorsement.name} subLabel={endorsement.subLabel} amount={endorsement.amount} green={endorsement.amount === 'Included'} isLast={index === data.endorsements.length - 1} />
                            ))}
                          </Card>
                        )}

                        <Card>
                          <SectionHeader micro="Property Details" heading="Home Details Used for Rating" />
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                            <tbody>
                              {[
                                ['Property Address', data.propertyAddress],
                                ['Year Built', String(data.yearBuilt)],
                                ['Square Feet', data.squareFeet ? data.squareFeet.toLocaleString() : 'Not listed'],
                                ['Construction', data.constructionType || 'Not listed'],
                                ['Roof', [data.roofYear, data.roofMaterial].filter(Boolean).join(' ') || 'Not listed'],
                                ['Monitored Alarm', data.hasMonitoredAlarm ? 'Yes' : 'No'],
                              ].map(([label, detail], index) => (
                                <tr key={label}>
                                  <td style={{ padding: '10px 0', borderBottom: index === 5 ? 'none' : '1px solid #f1f5f9', fontFamily: BRAND.fontFamily, fontSize: '13px', color: BRAND.colors.mutedText }}>{label}</td>
                                  <td align="right" style={{ padding: '10px 0', borderBottom: index === 5 ? 'none' : '1px solid #f1f5f9', fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{detail}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Loss Settlement" heading="How Claims Are Valued" />
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                            <tbody><tr>
                              {[
                                ['Dwelling', data.dwellingLossSettlement, 'Pays the cost to rebuild according to the policy settlement terms.'],
                                ['Personal Property', data.personalPropertyLossSettlement, 'Pays to replace or settle your belongings according to the policy terms.'],
                              ].map(([label, settlement, description]) => (
                                <td key={label} className="stack-mobile" width="50%" style={{ padding: '0 6px' }}>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                                    <tbody><tr><td style={{ padding: '16px' }}>
                                      <p style={{ margin: '0 0 5px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{label} - {settlement}</p>
                                      <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText, lineHeight: 1.5 }}>{description}</p>
                                    </td></tr></tbody>
                                  </table>
                                </td>
                              ))}
                            </tr></tbody>
                          </table>
                          {data.roofWarning && <AlertCard title="Roof Settlement Notice" body="Your roof is over 15 years old. Coverage may settle at Actual Cash Value (ACV) for roof claims unless replaced." />}
                        </Card>

                        <Card>
                          <SectionHeader micro="Savings Applied" heading="Discounts on This Quote" />
                          <DiscountGrid discounts={data.discounts} />
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Premium Detail" heading="Premium Breakdown" />
                          {[
                            ['Base Premium', data.basePremium],
                            ...data.fees.map((fee) => [fee.label, fee.amount] as [string, number]),
                          ].map(([label, amount]) => (
                            <table key={label} width="100%" cellPadding="0" cellSpacing="0" border={0}>
                              <tbody><tr><td style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <table width="100%" cellPadding="0" cellSpacing="0" border={0}><tbody><tr>
                                  <td><span style={{ fontFamily: BRAND.fontFamily, fontSize: '14px', color: BRAND.colors.darkSlate }}>{label}</span></td>
                                  <td align="right"><span style={{ fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{money(Number(amount), 2)}</span></td>
                                </tr></tbody></table>
                              </td></tr></tbody>
                            </table>
                          ))}
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: BRAND.colors.navy, borderRadius: '8px', marginTop: '12px' }}>
                            <tbody><tr><td style={{ padding: '16px 20px' }}>
                              <table width="100%" cellPadding="0" cellSpacing="0" border={0}><tbody><tr>
                                <td><span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: BRAND.fontFamily }}>Annual Premium</span></td>
                                <td align="right"><span style={{ fontSize: '22px', fontWeight: 700, color: BRAND.colors.gold, fontFamily: BRAND.fontFamily }}>{money(data.annualPremium, 2)}</span></td>
                              </tr></tbody></table>
                            </td></tr></tbody>
                          </table>
                        </Card>

                        {carrier.isSurplusLines || data.hasSurplusLines ? <AlertCard title="Surplus Lines Notice - North Carolina" body={COPY.surplusLinesNotice} /> : null}
                        {data.hasBindingContingency ? <AlertCard title="Before We Bind - Photos Required" body={COPY.bindingPhotos} /> : null}
                        <CustomerReviewCard />
                        <CTABlock heading="Ready to review the next step?" body="Click below, call, or reply and I will confirm the binding requirements with the carrier before anything is submitted." primaryLabel="Contact Me" actionHref={actionHref} />
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
