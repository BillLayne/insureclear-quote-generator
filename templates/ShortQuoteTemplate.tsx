import React from 'react';
import { BRAND } from '../config/brand';
import type { QuoteData } from '../types/quote';
import {
  BodySpacer,
  Card,
  CTABlock,
  CustomerReviewCard,
  Footer,
  formatDate,
  Head,
  HeaderCard,
  HeroCard,
  money,
  Preheader,
  quoteActionHref,
  SchemaJsonLd,
  SectionHeader,
  SnapshotCard,
  carrierFor,
} from './shared/EmailParts';

const carrierList = (data: QuoteData) =>
  data.carriersShoppedNames
    .map((name, index) => (index === 0 ? `<strong>${name}</strong>` : name))
    .join(' &bull; ');

export function shortSubject(data: QuoteData) {
  const carrier = carrierFor(data.carrierId);
  return `${data.clientFirstName.toLowerCase()}, your ${carrier.displayName.toLowerCase()} quote is ready`;
}

export function shortPreheader(data: QuoteData) {
  const carrier = carrierFor(data.carrierId);
  return `${primaryPremium(data)} · ${carrier.displayName} · quick review`;
}

function primaryPremium(data: QuoteData) {
  if (data.templateType === 'auto') return `${money(data.totalPremium / data.termMonths, 2)}/mo`;
  return `${money(data.annualPremium, 2)}/yr`;
}

function heroCopy(data: QuoteData) {
  const carrier = carrierFor(data.carrierId);
  if (data.templateType === 'auto') {
    return {
      badge: 'Auto Quote',
      greeting: `${data.clientFirstName}, your auto quote is ready.`,
      line: `${money(data.totalPremium / data.termMonths, 2)}/mo estimated with ${carrier.displayName}. Coverage starts only after carrier acceptance and payment.`,
      label: 'Est. Monthly Payment',
      big: money(data.totalPremium / data.termMonths, 2),
      unit: '/mo',
      sub: `${money(data.totalPremium, 2)} total ${data.termMonths}-month premium`,
      chips: [`${data.termMonths}-month term`, `${data.vehicles.length} vehicles`, `${data.drivers.length} drivers`],
    };
  }
  if (data.templateType === 'home') {
    return {
      badge: `${data.policyType} Home Quote`,
      greeting: `${data.clientFirstName}, your home quote is ready.`,
      line: `${carrier.displayName} quoted ${money(data.annualPremium, 2)}/yr for ${data.propertyAddress}.`,
      label: 'Annual Premium',
      big: money(data.annualPremium, 2),
      unit: '/yr',
      sub: `${money(data.annualPremium / 12, 2)}/mo escrow estimate`,
      chips: [`${money(data.coverages.coverageA)} Dwelling`, `${money(data.allPerilDeductible)} deductible`, `${data.policyType}`],
    };
  }
  if (data.templateType === 'motorcycle') {
    const bike = [data.bike.year, data.bike.make, data.bike.model].filter(Boolean).join(' ');
    return {
      badge: 'Motorcycle Quote',
      greeting: `${data.clientFirstName}, your motorcycle quote is ready.`,
      line: `${carrier.displayName} quoted ${money(data.annualPremium, 2)}/yr for the ${bike}.`,
      label: 'Annual Premium',
      big: money(data.annualPremium, 2),
      unit: '/yr',
      sub: `${money(data.annualPremium / 12, 2)}/mo equivalent`,
      chips: [data.bike.bikeType, data.bike.garagingZip, data.coverages[0]?.limit || 'Coverage reviewed'],
    };
  }
  if (data.templateType === 'dwelling') {
    return {
      badge: `${data.formCode} Dwelling Quote`,
      greeting: `${data.clientFirstName}, your rental dwelling quote is ready.`,
      line: `${carrier.displayName} quoted ${money(data.annualPremium, 2)}/yr for ${data.property.streetAddress}.`,
      label: 'Annual Premium',
      big: money(data.annualPremium, 2),
      unit: '/yr',
      sub: `${money(data.annualPremium / 12, 2)}/mo equivalent`,
      chips: [`${money(data.coverages.coverageA)} Dwelling`, data.coverages.windHailDeductible, `${money(data.coverages.liability)} Liability`],
    };
  }
  return {
    badge: 'Renters Quote',
    greeting: `${data.clientFirstName}, your renters quote is ready.`,
    line: `${carrier.displayName} quoted ${money(data.annualPremium, 2)}/yr for ${data.unit.streetAddress}.`,
    label: 'Annual Premium',
    big: money(data.annualPremium, 2),
    unit: '/yr',
    sub: `${money(data.annualPremium / 12, 2)}/mo equivalent`,
    chips: [`${money(data.coverages.coverageC)} Personal Property`, `${money(data.coverages.coverageE)} Liability`, `${money(data.coverages.deductible)} Deductible`],
  };
}

function snapshotItems(data: QuoteData) {
  if (data.templateType === 'auto') {
    return [
      { label: 'Monthly', value: `${money(data.totalPremium / data.termMonths, 2)}/mo`, sub: 'Estimated payment' },
      { label: 'Total Premium', value: money(data.totalPremium, 2), sub: `${data.termMonths}-month term` },
      { label: 'Vehicles', value: String(data.vehicles.length), sub: data.vehicles.map((vehicle) => `${vehicle.year} ${vehicle.make}`).join(', ') },
      { label: 'Effective', value: formatDate(data.effectiveDate), sub: 'After bind and payment' },
    ];
  }
  if (data.templateType === 'home') {
    const tiv = data.coverages.coverageA + data.coverages.coverageB + data.coverages.coverageC;
    return [
      { label: 'Annual Premium', value: money(data.annualPremium, 2), sub: `${money(data.annualPremium / 12, 2)}/mo estimate` },
      { label: 'Dwelling', value: money(data.coverages.coverageA), sub: data.policyType },
      { label: 'Combined Property', value: money(tiv), sub: 'A + B + C separate limits' },
      { label: 'Deductible', value: money(data.allPerilDeductible), sub: 'All peril' },
    ];
  }
  if (data.templateType === 'motorcycle') {
    const bike = [data.bike.year, data.bike.make, data.bike.model].filter(Boolean).join(' ');
    return [
      { label: 'Annual Premium', value: money(data.annualPremium, 2), sub: `${money(data.annualPremium / 12, 2)}/mo equivalent` },
      { label: 'Motorcycle', value: bike, sub: data.bike.bikeType },
      { label: 'VIN', value: data.bike.vin || 'Needs review', sub: data.bike.garagingZip },
      { label: 'Riders', value: String(data.riders.length), sub: data.riders.map((rider) => rider.name).join(', ') },
    ];
  }
  if (data.templateType === 'dwelling') {
    return [
      { label: 'Annual Premium', value: money(data.annualPremium, 2), sub: `${money(data.annualPremium / 12, 2)}/mo equivalent` },
      { label: 'Form', value: data.formCode, sub: data.isSurplusLines ? 'Surplus lines' : 'Admitted placement' },
      { label: 'Property', value: data.property.streetAddress, sub: `${data.property.city}, ${data.property.state} ${data.property.zip}` },
      { label: 'Fair Rental Value', value: money(data.coverages.coverageD), sub: `${money(data.rental.monthlyRent * 12)} annual rent` },
    ];
  }
  return [
    { label: 'Annual Premium', value: money(data.annualPremium, 2), sub: `${money(data.annualPremium / 12, 2)}/mo equivalent` },
    { label: 'Personal Property', value: money(data.coverages.coverageC), sub: data.coverages.coverageCSettlement },
    { label: 'Liability', value: money(data.coverages.coverageE), sub: 'Per occurrence' },
    { label: 'Unit', value: data.unit.streetAddress, sub: `${data.unit.city}, ${data.unit.state} ${data.unit.zip}` },
  ];
}

function KeyCoverageCard({ data }: { data: QuoteData }) {
  const rows =
    data.templateType === 'auto'
      ? data.vehicles.map((vehicle) => `${vehicle.year} ${vehicle.make} ${vehicle.model}: ${vehicle.coverageType === 'full_coverage' ? 'Full Coverage' : 'Liability Only'}`)
      : data.templateType === 'home'
        ? [`Dwelling: ${money(data.coverages.coverageA)}`, `Personal Property: ${money(data.coverages.coverageC)}`, `Liability: ${money(data.coverages.coverageE)}`]
        : data.templateType === 'motorcycle'
          ? data.coverages.slice(0, 5).map((coverage) => `${coverage.name}: ${coverage.limit}`)
          : data.templateType === 'dwelling'
            ? [`Dwelling: ${money(data.coverages.coverageA)}`, `Fair Rental Value: ${money(data.coverages.coverageD)}`, `Liability: ${money(data.coverages.liability)}`, `Wind/Hail Deductible: ${data.coverages.windHailDeductible}`]
          : [`Personal Property: ${money(data.coverages.coverageC)}`, `Loss of Use: ${typeof data.coverages.coverageD === 'number' ? money(data.coverages.coverageD) : data.coverages.coverageD}`, `Liability: ${money(data.coverages.coverageE)}`];

  return (
    <Card>
      <SectionHeader micro="Key Coverage" heading="Quick Review" />
      {rows.map((row) => (
        <p key={row} style={{ margin: '0 0 10px 0', fontFamily: BRAND.fontFamily, fontSize: '14px', color: BRAND.colors.bodyText, lineHeight: 1.5 }}>
          {row}
        </p>
      ))}
      <p style={{ margin: '12px 0 0 0', fontFamily: BRAND.fontFamily, fontSize: '12px', color: BRAND.colors.mutedText, lineHeight: 1.5 }}>
        This is the short version for ready-to-buy clients. Reply with questions before starting the application.
      </p>
    </Card>
  );
}

export function ShortQuoteTemplate({ data }: { data: QuoteData }) {
  const carrier = carrierFor(data.carrierId);
  const hero = heroCopy(data);
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: primaryPremium(data),
    subject: shortSubject(data),
  });
  return (
    <html lang="en">
      <Head subject={shortSubject(data)} />
      <body style={{ margin: 0, padding: 0, backgroundColor: BRAND.colors.pageBg }}>
        <BodySpacer />
        <Preheader text={shortPreheader(data)} />
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '20px 0' }}>
                <table role="presentation" width={BRAND.containerWidth} cellPadding="0" cellSpacing="0" border={0} className="container">
                  <tbody>
                    <tr>
                      <td>
                        <HeaderCard carrier={carrier} label={`Short Quote Review • ${carrier.displayName} • Prepared by Bill Layne Insurance Agency`} />
                        <HeroCard
                          badge={hero.badge}
                          greeting={hero.greeting}
                          thankYouLine={hero.line}
                          premiumLabel={hero.label}
                          bigNumber={hero.big}
                          unit={hero.unit}
                          subLine={hero.sub}
                          carrierList={carrierList(data)}
                          chips={hero.chips}
                          imageUrl={data.heroImageUrl}
                          imageAlt={`${data.clientFirstName}'s quote image`}
                          imageCaption={`${carrier.displayName} ${data.templateType} quote`}
                        />
                        <SnapshotCard micro="Decision Snapshot" heading="The Important Numbers" items={snapshotItems(data)} />
                        <KeyCoverageCard data={data} />
                        <CustomerReviewCard />
                        <CTABlock
                          heading="Ready to review the next step?"
                          body="Click below, call, or reply and I will walk through the final details. Coverage starts only after carrier acceptance and payment."
                          primaryLabel="Contact Me"
                          actionHref={actionHref}
                        />
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
