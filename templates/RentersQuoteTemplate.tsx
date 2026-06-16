import React from 'react';
import { BRAND } from '../config/brand';
import type { RentersInsured, RentersQuoteData } from '../types/renters';
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
  plural,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  StackedRow,
  carrierFor,
} from './shared/EmailParts';

const unitAddress = (data: RentersQuoteData) => `${data.unit.streetAddress}, ${data.unit.city}, ${data.unit.state} ${data.unit.zip}`;

const insuredBadge = (insured: RentersInsured) => {
  if (insured.relationship === 'named_insured') return 'Primary';
  return insured.relationship.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

export const rentersSubject = (data: RentersQuoteData) => {
  const carrier = carrierFor(data.carrierId);
  return `🏠 ${data.clientFirstName.toLowerCase()}, your renters quote is ready`;
};

export const rentersPreheader = (data: RentersQuoteData) =>
  `${money(data.annualPremium)}/yr · ${carrierFor(data.carrierId).displayName} · ${data.unit.streetAddress}`;

function UnitAddressHeroBand({ data }: { data: RentersQuoteData }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: BRAND.gradients.premiumFallback, borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '0 32px 26px 32px' }}>
            <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto' }}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: BRAND.fontFamily, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Insured Unit</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: BRAND.fontFamily, lineHeight: 1.4 }}>
                      {data.unit.streetAddress}<br />
                      {data.unit.city}, {data.unit.state} {data.unit.zip}
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

function WhyRentersMattersCard({ data }: { data: RentersQuoteData }) {
  const firstTime = data.renterProfile === 'first_time';
  const scenarios = [
    ['🔒', 'Your laptop is stolen', "Whether it happens at home, in your car, or while traveling, your policy replaces it up to your Personal Property limit after deductible."],
    ['🔥', 'A fire or water leak ruins your stuff', "The landlord's insurance covers the building. Your insurance covers your furniture, clothes, electronics, and hotel costs while you recover."],
    ['🐕', 'Your dog bites a guest', 'Your policy can pay medical bills and legal costs up to your liability limit. Liability follows you at home, at the park, and anywhere else.'],
    ['🏨', 'Your unit becomes uninhabitable', 'If your apartment is unlivable after a covered loss, your policy pays for hotel, meals, and extra costs above normal living expenses.'],
  ].slice(0, firstTime ? 4 : 2);

  return (
    <Card bg="#fafafa">
      <SectionHeader micro="What Your Policy Covers" heading="Real Scenarios, Real Coverage" />
      <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
        <tbody>
          {Array.from({ length: Math.ceil(scenarios.length / 2) }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {scenarios.slice(rowIndex * 2, rowIndex * 2 + 2).map(([emoji, title, body]) => (
                <td key={title} className="stack-mobile" width="50%" style={{ padding: '0 6px 12px 6px' }}>
                  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '15px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{emoji} {title}</p>
                          <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', lineHeight: 1.55, color: BRAND.colors.mutedText }}>{body}</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function RentersCoverageCard({ data }: { data: RentersQuoteData }) {
  const rows = [
    ['📦', 'Coverage C - Personal Property', 'Your furniture, clothes, electronics, and everything you own.', `${money(data.coverages.coverageC)} · ${data.coverages.coverageCSettlement}`],
    ['🏨', 'Coverage D - Loss of Use', 'Hotel, meals, and extra costs if your unit becomes uninhabitable.', typeof data.coverages.coverageD === 'number' ? money(data.coverages.coverageD) : data.coverages.coverageD],
    ['🛡️', 'Coverage E - Personal Liability', 'Legal and medical costs if you injure someone or damage their property.', money(data.coverages.coverageE)],
    ['🏥', 'Coverage F - Medical Payments to Others', 'No-fault medical bills for guests injured in your unit.', money(data.coverages.coverageF)],
  ];

  return (
    <Card>
      <SectionHeader micro="Coverage Details" heading="What's Included" />
      {rows.map(([emoji, label, subLabel, amount], index) => (
        <CoverageRow key={label} emoji={emoji} label={label} subLabel={subLabel} amount={amount} isLast={false} green={label.includes('Coverage C') && data.coverages.coverageCSettlement === 'Replacement Cost'} />
      ))}
      {data.endorsements.map((endorsement, index) => (
        <CoverageRow
          key={endorsement.name}
          emoji={endorsement.emoji}
          label={endorsement.name}
          subLabel={endorsement.subLabel}
          amount={`${endorsement.limit}${typeof endorsement.annualPremium === 'number' ? ` · ${money(endorsement.annualPremium, 2)}/yr` : ''}`}
          green={endorsement.status === 'included'}
          isLast={index === data.endorsements.length - 1}
        />
      ))}
      <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: data.coverages.coverageCSettlement === 'Replacement Cost' ? '#f0fdf4' : '#fffbeb', border: data.coverages.coverageCSettlement === 'Replacement Cost' ? '1px solid #86efac' : '1px solid #fde68a', borderRadius: '8px', marginTop: '14px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', fontWeight: 600, lineHeight: 1.5, color: data.coverages.coverageCSettlement === 'Replacement Cost' ? '#166534' : '#92400e' }}>
                {data.coverages.coverageCSettlement === 'Replacement Cost'
                  ? "✅ Personal Property Replacement Cost included. This means we replace your stuff at today's prices with no depreciation."
                  : 'ℹ️ Settlement type: Actual Cash Value. ACV pays depreciated value at time of loss. Ask me about Replacement Cost.'}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
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

function OffPremisesCallout() {
  return (
    <Card>
      <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
        <tbody>
          <tr>
            <td style={{ padding: '20px 24px' }}>
              <table cellPadding="0" cellSpacing="0" border={0} width="100%">
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'top', width: '48px' }}>
                      <span style={{ fontSize: '32px', lineHeight: 1 }}>🌍</span>
                    </td>
                    <td style={{ verticalAlign: 'top', paddingLeft: '16px' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0c4a6e', fontFamily: BRAND.fontFamily }}>Your stuff is covered everywhere - not just at home</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#0369a1', fontFamily: BRAND.fontFamily, lineHeight: 1.5 }}>
                        Off-premises coverage means your laptop is protected if it is stolen from your car, your luggage is covered if it is stolen at the airport, and your liability follows you anywhere.
                      </p>
                    </td>
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

function InsuredsCard({ data }: { data: RentersQuoteData }) {
  return (
    <Card bg="#fafafa">
      <SectionHeader micro="Named Insureds" heading="Who's Covered" />
      {data.insureds.map((insured, index) => (
        <StackedRow
          key={`${insured.name}-${index}`}
          title={insured.name}
          subLabel={`${insured.relationship === 'named_insured' ? 'Named Insured' : insuredBadge(insured)} · Age ${insured.age}`}
          badge={insuredBadge(insured)}
          primary={insured.relationship === 'named_insured'}
        />
      ))}
      {data.pets && data.pets.length > 0 && (
        <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '8px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '12px 16px' }}>
                <p style={{ margin: '0 0 3px 0', fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: BRAND.colors.darkSlate }}>🐾 Pets on policy: {data.pets.map((pet) => `${pet.count} ${pet.breed ? `${pet.breed} ` : ''}${pet.type}`).join(', ')}</p>
                <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>Animal Liability: {data.animalLiabilityLimit || 'Confirm with carrier'}.</p>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </Card>
  );
}

function RentersDisclaimerCard({ data }: { data: RentersQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  return (
    <Card>
      <SectionHeader micro="Quote Disclosures" heading="Important Information" />
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        This quote is prepared by Bill Layne Insurance Agency on behalf of {data.carrierLegalEntity || carrier.legalName}. Quote is based on information provided and is subject to underwriting review and final approval by the carrier.
      </p>
      <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>
        Premium and coverage may change pending verification of insured information, prior loss history, and credit-based insurance score. Coverage does not begin until the policy is bound and the down payment is processed.
      </p>
      {data.unrelatedRoommateNote && (
        <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#92400e', lineHeight: 1.6 }}><strong>Roommate note:</strong> {data.unrelatedRoommateNote}</p>
      )}
      {data.landlordRequiresCoi && data.landlordName && (
        <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '12px', color: '#1e40af', lineHeight: 1.6 }}>
          <strong>Certificate note:</strong> {data.landlordName} can be added as an Additional Interest. Certificates are typically issued within 1 business hour of bind.
        </p>
      )}
    </Card>
  );
}

export function RentersQuoteTemplate({ data }: { data: RentersQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const monthlyEquivalent = data.annualPremium / 12;
  const annualHero = !data.showMonthlyHero;
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
    subject: rentersSubject(data),
  });

  return (
    <html lang="en">
      <Head subject={rentersSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={rentersPreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label={`Renters Insurance Quote • ${carrier.displayName} • Prepared by Bill Layne Insurance Agency`} />
                        <HeroCard
                          badge={`🏠 ${carrier.displayName} Renters Quote`}
                          greeting={`${data.clientFirstName}, your renters coverage is ready.`}
                          thankYouLine={`${data.clientFirstName}, your ${carrier.displayName} renters quote is ready - ${money(data.annualPremium)}/yr covering ${money(data.coverages.coverageC)} in personal property and ${money(data.coverages.coverageE)} in liability.`}
                          premiumLabel={annualHero ? 'Est. Annual Premium' : 'Est. Monthly Payment'}
                          bigNumber={annualHero ? money(data.annualPremium, 2) : money(data.recurringPayment || monthlyEquivalent, 2)}
                          unit={annualHero ? '/yr' : '/mo'}
                          subLine={annualHero ? `${money(monthlyEquivalent, 2)} per month equivalent` : `${money(data.annualPremium, 2)} total 12-month premium`}
                          carrierList={carrierList}
                          chips={[`${money(data.coverages.coverageC)} Personal Property`, `${money(data.coverages.coverageE)} Liability`, `${money(data.coverages.deductible)} Deductible`]}
                        />
                        <UnitAddressHeroBand data={data} />
                        <HeroImageBand
                          imageUrl={data.heroImageUrl}
                          imageAlt={`Renters quote image for ${data.unit.streetAddress}`}
                          imageCaption={data.unit.streetAddress}
                        />
                        {data.pifSavings && data.pifSavings >= 10 && data.pifTotal ? <AlertCard title="Pay-in-Full Savings" body={`Pay in full and save ${money(data.pifSavings, 2)} - just ${money(data.pifTotal, 2)} total.`} /> : null}
                        {data.bundledWithAuto && data.bundleSavings ? <AlertCard title="Auto Bundle Savings" body={`Bundled with your ${carrier.displayName} auto - saves ${money(data.bundleSavings, 2)}/yr on both policies.`} /> : null}

                        <Card>
                          <p style={{ margin: '0 0 12px 0', fontFamily: BRAND.fontFamily, fontSize: '15px', color: BRAND.colors.bodyText, lineHeight: 1.65 }}>
                            Hi {data.clientFirstName}, your renters insurance quote with <strong>{carrier.displayName}</strong> is ready for <strong>{data.unit.streetAddress}</strong>. This policy covers your stuff, your liability, and a hotel if something happens to your unit.
                          </p>
                          <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '13px', color: BRAND.colors.mutedText, lineHeight: 1.6 }}>
                            If you have questions before starting the application, just reply or call. Coverage starts only after carrier acceptance and payment.
                          </p>
                        </Card>

                        <SnapshotCard
                          micro="Quick Decision Snapshot"
                          heading="The Numbers at a Glance"
                          items={[
                            { label: 'Annual Premium', value: `${money(data.annualPremium, 2)}/yr`, sub: `${money(monthlyEquivalent, 2)}/mo equivalent` },
                            { label: 'Personal Property', value: money(data.coverages.coverageC), sub: data.coverages.coverageCSettlement },
                            { label: 'Liability', value: money(data.coverages.coverageE), sub: 'Per occurrence' },
                            { label: 'Deductible', value: money(data.coverages.deductible), sub: 'Standard deductible' },
                            { label: 'Unit', value: data.unit.unitType.replace('_', ' '), sub: `${data.unit.city}, ${data.unit.state} ${data.unit.zip}` },
                            { label: 'Quote Expires', value: formatDate(data.expiryDate), sub: 'Rate subject to verification' },
                          ]}
                        />
                        <WhyRentersMattersCard data={data} />
                        <RentersCoverageCard data={data} />
                        <OffPremisesCallout />
                        <InsuredsCard data={data} />
                        {data.discounts.length > 0 && (
                          <Card>
                            <SectionHeader micro="Savings Applied" heading="Discounts on This Quote" />
                            <DiscountGrid discounts={data.discounts} />
                          </Card>
                        )}
                        <CustomerReviewCard />
                        <CTABlock
                          heading="Ready to review the next step?"
                          body={data.landlordRequiresCoi ? 'Click below and I will contact you to review the application. Proof can be sent to your landlord after bind.' : 'Click below and I will contact you to review the application before anything is submitted.'}
                          primaryLabel="Contact Me"
                          actionHref={actionHref}
                        />
                        <RentersDisclaimerCard data={data} />
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
