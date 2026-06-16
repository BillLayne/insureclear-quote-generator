import React from 'react';
import { BRAND } from '../config/brand';
import { COPY } from '../config/copy';
import type { AutoQuoteData, Driver } from '../types/auto';
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
  plural,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  StackedRow,
  carrierFor,
} from './shared/EmailParts';

const coverageType = (type: AutoQuoteData['vehicles'][number]['coverageType']) =>
  type === 'full_coverage' ? 'Full Coverage' : 'Liability Only';

const relationshipLabel = (driver: Driver) => {
  if (driver.relationship === 'insured') return 'PRIMARY';
  if (driver.relationship === 'excluded') return 'EXCLUDED';
  if (driver.isTeen) return 'TEEN';
  return driver.relationship.toUpperCase();
};

const defaultVehicleCoverages = (data: AutoQuoteData, vehicle: AutoQuoteData['vehicles'][number]) => {
  if (vehicle.coverages && vehicle.coverages.length > 0) return vehicle.coverages;

  const rows = [
    { emoji: '⚖️', name: 'Liability', limitOrDeductible: `${data.coverages.bodilyInjuryLimit} BI · ${data.coverages.propertyDamageLimit} PD`, status: 'included' as const },
    { emoji: '🛡️', name: 'Uninsured Motorist', limitOrDeductible: data.coverages.uninsuredMotoristLimit, status: 'included' as const },
  ];

  if (vehicle.coverageType === 'full_coverage') {
    if (data.coverages.comprehensiveDeductible) rows.push({ emoji: '🌊', name: 'Comprehensive', limitOrDeductible: `${money(data.coverages.comprehensiveDeductible)} ded`, status: 'included' });
    if (data.coverages.collisionDeductible) rows.push({ emoji: '💥', name: 'Collision', limitOrDeductible: `${money(data.coverages.collisionDeductible)} ded`, status: 'included' });
  } else {
    rows.push({ emoji: '🌊', name: 'Comprehensive', limitOrDeductible: 'Not included', status: 'rejected' });
    rows.push({ emoji: '💥', name: 'Collision', limitOrDeductible: 'Not included', status: 'rejected' });
  }

  if (data.coverages.medicalPayments) rows.push({ emoji: '🏥', name: 'Medical Payments', limitOrDeductible: money(data.coverages.medicalPayments), status: 'included' });
  if (data.coverages.rentalReimbursement && vehicle.coverageType === 'full_coverage') rows.push({ emoji: '🚗', name: 'Rental Reimbursement', limitOrDeductible: data.coverages.rentalReimbursement, status: 'included' });
  if (data.coverages.towing) rows.push({ emoji: '🚛', name: 'Towing and Roadside', limitOrDeductible: data.coverages.towing, status: 'included' });

  return rows;
};

export const autoSubject = (data: AutoQuoteData) => {
  const carrier = carrierFor(data.carrierId);
  return `🚗 ${data.clientFirstName.toLowerCase()}, your ${carrier.displayName.toLowerCase()} quote is ready`;
};

export const autoPreheader = (data: AutoQuoteData) => {
  const monthly = money(data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths, 2);
  return `${monthly}/mo · ${plural(data.vehicles.length, 'vehicle')} · save ${money(data.paymentOptions.paidInFull.savings)} paying in full`;
};

export function AutoQuoteTemplate({ data }: { data: AutoQuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const recurringPayment = data.paymentOptions.eft.recurringAmount || data.totalPremium / data.termMonths;
  const hasEftSchedule = data.paymentOptions.eft.downPayment > 0 || data.paymentOptions.eft.recurringCount > 0;
  const carrierList = data.carriersShoppedNames
    .map((name, index) => (index === 0 ? `<strong>${name}</strong>` : name))
    .join(' &bull; ');
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.totalPremium, 2),
    subject: autoSubject(data),
  });

  return (
    <html lang="en">
      <Head subject={autoSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={autoPreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label="Auto Insurance Quote" />
                        <HeroCard
                          badge="🚗 Auto Insurance Quote"
                          greeting={`${data.clientFirstName}, your ${carrier.displayName} auto quote is ready.`}
                          thankYouLine={COPY.thankYouQuote}
                          premiumLabel={hasEftSchedule ? 'EFT Recurring Payment' : 'Est. Average Monthly Cost'}
                          bigNumber={money(recurringPayment, 2)}
                          unit="/mo"
                          subLine={
                            hasEftSchedule
                              ? `${money(data.paymentOptions.eft.downPayment, 2)} down · ${money(data.paymentOptions.eft.recurringAmount, 2)} × ${data.paymentOptions.eft.recurringCount} · ${money(data.totalPremium, 2)} total`
                              : `${money(data.totalPremium, 2)} total ${data.termMonths}-month premium`
                          }
                          carrierList={carrierList}
                          chips={[`${data.termMonths}-month term`, plural(data.vehicles.length, 'vehicle'), plural(data.drivers.length, 'driver')]}
                          imageUrl={data.heroImageUrl}
                          imageAlt={`${data.clientFirstName}'s auto quote image`}
                          imageCaption={`${carrier.displayName} Auto Quote`}
                        />
                        <EarlyActionCard
                          heading="Ready for me to start the application?"
                          body="Click below and confirm you want me to contact you. I will review the application details, effective date, and first payment before anything is submitted."
                          primaryLabel="Contact Me"
                          actionHref={actionHref}
                        />
                        <IntroCard firstName={data.clientFirstName} carrier={carrier} />

                        <SnapshotCard
                          micro="Quick Decision Snapshot"
                          heading="The Numbers at a Glance"
                          items={[
                            { label: 'Recurring EFT', value: `${money(recurringPayment, 2)}/mo`, sub: `${money(data.paymentOptions.eft.downPayment, 2)} down payment` },
                            { label: 'Total Premium', value: money(data.totalPremium, 2), sub: `${data.termMonths}-month term` },
                            { label: 'Carrier', value: carrier.displayName, sub: `Quote ${data.quoteNumber}` },
                            { label: 'Vehicles', value: plural(data.vehicles.length, 'vehicle'), sub: `${plural(data.drivers.length, 'driver')} rated` },
                            { label: 'Liability', value: `${data.coverages.bodilyInjuryLimit} / ${data.coverages.propertyDamageLimit}`, sub: 'BI / property damage' },
                            { label: 'Quote Expires', value: formatDate(data.expiryDate), sub: 'Rate subject to verification' },
                          ]}
                        />

                        <Card bg="#fafafa">
                          <img
                            src={BRAND.autoLifestyleImageUrl}
                            alt="Family beside their vehicle at home"
                            width="520"
                            style={{ display: 'block', border: 0, width: '100%', maxWidth: '520px', height: 'auto', margin: '0 auto', borderRadius: '8px' }}
                          />
                          <p style={{ margin: '12px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText, lineHeight: 1.5, textAlign: 'center' }}>
                            Coverage for the everyday drives, errands, and family routines that matter.
                          </p>
                        </Card>

                        <Card>
                          <SectionHeader micro="Insured Vehicles" heading={`${plural(data.vehicles.length, 'Vehicle')} on This Quote`} />
                          {data.vehicles.map((vehicle, index) => (
                            <table
                              key={`${vehicle.vinLast8}-${index}`}
                              cellPadding="0"
                              cellSpacing="0"
                              border={0}
                              width="100%"
                              style={{
                                backgroundColor: index === 0 ? BRAND.colors.blueTint : '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '14px',
                              }}
                            >
                              <tbody>
                                <tr>
                                  <td style={{ padding: '16px 20px 10px 20px' }}>
                                    <table cellPadding="0" cellSpacing="0" border={0} width="100%">
                                      <tbody>
                                        <tr>
                                          <td style={{ verticalAlign: 'middle' }}>
                                            <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: BRAND.colors.darkSlate, fontFamily: BRAND.fontFamily }}>
                                              {vehicle.year} {vehicle.make} {vehicle.model}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '12px', color: BRAND.colors.mutedText, fontFamily: BRAND.fontFamily }}>
                                              VIN •••{vehicle.vinLast8} · {coverageType(vehicle.coverageType)} · ZIP {vehicle.garagingZip}
                                            </p>
                                          </td>
                                          <td align="right" valign="middle">
                                            <table cellPadding="0" cellSpacing="0" border={0}>
                                              <tbody>
                                                <tr>
                                                  <td style={{ backgroundColor: index === 0 ? BRAND.colors.navy : BRAND.colors.mutedText, borderRadius: '4px', padding: '4px 10px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', fontFamily: BRAND.fontFamily, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                                      Vehicle {index + 1}
                                                    </span>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '0 20px 16px 20px' }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                      <tbody>
                                        <tr>
                                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                                            <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '10px', fontWeight: 700, color: BRAND.colors.navy, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                              Coverage on this vehicle
                                            </p>
                                          </td>
                                        </tr>
                                        {defaultVehicleCoverages(data, vehicle).map((coverage, coverageIndex, rows) => (
                                          <tr key={`${coverage.name}-${coverageIndex}`}>
                                            <td style={{ padding: '9px 14px', borderBottom: coverageIndex === rows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                              <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                                <tbody>
                                                  <tr>
                                                    <td style={{ fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: coverage.status === 'included' ? BRAND.colors.darkSlate : BRAND.colors.mutedText }}>
                                                      {coverage.emoji} {coverage.name}
                                                    </td>
                                                    <td align="right" style={{ whiteSpace: 'nowrap', fontFamily: BRAND.fontFamily, fontSize: '13px', fontWeight: 700, color: coverage.status === 'included' ? BRAND.colors.navy : BRAND.colors.amberText }}>
                                                      {coverage.limitOrDeductible}
                                                      {typeof coverage.premium === 'number' ? ` · ${money(coverage.premium, 2)}` : ''}
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                        ))}
                                        <tr>
                                          <td style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '0 0 8px 8px' }}>
                                            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                              <tbody>
                                                <tr>
                                                  <td style={{ fontFamily: BRAND.fontFamily, fontSize: '12px', fontWeight: 700, color: BRAND.colors.bodyText }}>Vehicle Premium</td>
                                                  <td align="right" style={{ fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.navy }}>{money(vehicle.vehiclePremium, 2)}</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          ))}
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Rated Drivers" heading={`${plural(data.drivers.length, 'Driver')} on This Policy`} />
                          {data.drivers.map((driver) => (
                            <React.Fragment key={`${driver.name}-${driver.age}`}>
                              <StackedRow
                                title={driver.name}
                                subLabel={`${driver.relationship.charAt(0).toUpperCase()}${driver.relationship.slice(1)} · Age ${driver.age} · ${driver.yearsLicensed} yrs licensed`}
                                badge={relationshipLabel(driver)}
                                primary={driver.relationship === 'insured'}
                                warning={driver.isTeen}
                              />
                              {driver.relationship === 'excluded' && (
                                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fef3c7', border: '1px solid #fed7aa', borderRadius: '8px', marginTop: '8px', marginBottom: '12px' }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '12px 16px' }}>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontFamily: BRAND.fontFamily, lineHeight: 1.5 }}>
                                          <strong>Excluded driver notice:</strong> This driver is not covered under this policy. If they operate a covered vehicle, no coverage applies for any resulting loss.
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </React.Fragment>
                          ))}
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Savings Applied" heading="Discounts on This Quote" />
                          <DiscountGrid discounts={data.discounts} />
                        </Card>

                        <Card>
                          <SectionHeader micro="Premium Detail" heading="Premium Breakdown" />
                          {data.vehicles.map((vehicle) => (
                            <table key={vehicle.vinLast8} width="100%" cellPadding="0" cellSpacing="0" border={0}>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                      <tbody>
                                        <tr>
                                          <td><span style={{ fontSize: '14px', color: BRAND.colors.darkSlate, fontFamily: BRAND.fontFamily }}>{vehicle.year} {vehicle.make} {vehicle.model}</span></td>
                                          <td align="right"><span style={{ fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate, fontFamily: BRAND.fontFamily }}>{money(vehicle.vehiclePremium, 2)}</span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          ))}
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: BRAND.colors.navy, borderRadius: '8px', marginTop: '12px' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '16px 20px' }}>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                    <tbody>
                                      <tr>
                                        <td><span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px', textTransform: 'uppercase', fontFamily: BRAND.fontFamily }}>Total {data.termMonths}-Month Premium</span></td>
                                        <td align="right"><span style={{ fontSize: '22px', fontWeight: 700, color: BRAND.colors.gold, fontFamily: BRAND.fontFamily }}>{money(data.totalPremium, 2)}</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Card>

                        <Card bg="#fafafa">
                          <SectionHeader micro="Payment Options" heading="Choose the Payment Plan That Fits" />
                          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
                            <tbody>
                              <tr>
                                <td className="stack-mobile" width="50%" style={{ padding: '0 6px 0 0' }}>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '10px' }}>
                                    <tbody><tr><td style={{ padding: '18px' }}>
                                      <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>🔁 Pay Monthly (EFT)</p>
                                      <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '22px', fontWeight: 700, color: BRAND.colors.navy }}>{money(data.paymentOptions.eft.downPayment, 2)} down</p>
                                      <p style={{ margin: '4px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText }}>{money(data.paymentOptions.eft.recurringAmount, 2)} × {data.paymentOptions.eft.recurringCount}</p>
                                    </td></tr></tbody>
                                  </table>
                                </td>
                                <td className="stack-mobile" width="50%" style={{ padding: '0 0 0 6px' }}>
                                  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fff7ed', border: '1px solid #C8A84E', borderRadius: '10px' }}>
                                    <tbody><tr><td style={{ padding: '18px' }}>
                                      <p style={{ margin: '0 0 8px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate }}>🎉 Pay in Full</p>
                                      <p style={{ margin: 0, fontFamily: BRAND.fontFamily, fontSize: '22px', fontWeight: 700, color: BRAND.colors.navy }}>{money(data.paymentOptions.paidInFull.total, 2)}</p>
                                      <p style={{ margin: '4px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.greenText }}>Save {money(data.paymentOptions.paidInFull.savings, 2)}</p>
                                    </td></tr></tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Card>

                        {data.showInfographic && (
                          <Card>
                            <SectionHeader micro="Understanding Your Coverage" heading="What You're Protected For" />
                            <img src={BRAND.autoCoverageInfographicUrl} alt="Coverage guide: Comprehensive, Collision, Bodily Injury, UM, Med Pay, Towing" width="400" style={{ display: 'block', border: 0, width: '100%', maxWidth: '400px', height: 'auto', margin: '0 auto' }} />
                          </Card>
                        )}
                        {data.hasTeenDriver && <AlertCard title="Teen Driver Reminder" body="Teen driver rating can change if garaging, school status, or vehicle assignment changes before binding." />}
                        <CustomerReviewCard />
                        <CTABlock heading="Ready to review the next step?" body="Click below, call, or reply and I will walk you through the application and first payment before anything is submitted." primaryLabel="Contact Me" actionHref={actionHref} />
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
