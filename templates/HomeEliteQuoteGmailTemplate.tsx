import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BRAND } from '../config/brand';
import { CARRIERS } from '../config/carriers';
import type { HomeQuoteData } from '../types/home';
import { quoteActionHref } from './shared/EmailParts';
import { normalizeHeroImageUrl } from '../lib/heroImage';

const defaultHomeImageUrl = 'https://i.imgur.com/6jDPnCX.jpeg';
const agentReviewImageUrl = 'https://i.imgur.com/5BLPVwW.png';

const elite = {
  page: '#ece4d3',
  paper: '#faf7ef',
  ink: '#2b241a',
  body: '#5f584a',
  muted: '#8c8472',
  gold: '#C8A84E',
  goldDark: '#97712a',
  line: '#e8e0cf',
  white: '#ffffff',
  soft: '#f4ead8',
};

const sans = "'Poppins', Arial, sans-serif";
const serif = "'Playfair Display', Georgia, serif";
const spacer = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
const gmailWidthAnchor = `<div style="display:none; white-space:nowrap; font:15px courier; color:${elite.page}; line-height:0; max-height:0; overflow:hidden;">${spacer}</div>`;
const msoHeadBlock = `<!--[if mso]>
  <style type="text/css">
    table, td, div, p, a {font-family: Arial, sans-serif !important;}
    h1, h2, h3, .serif {font-family: Georgia, 'Times New Roman', serif !important;}
    .button-link {padding: 15px 30px !important;}
  </style>
  <![endif]-->`;

const money = (value: number, digits = 0) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const splitName = (data: HomeQuoteData) => {
  const parts = data.clientFullName.trim().split(/\s+/).filter(Boolean);
  return {
    first: data.clientFirstName || parts[0] || 'there',
    last: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
};

const value = (amount: number | string) => {
  if (typeof amount === 'number') return money(amount);
  const parsed = Number(amount.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? money(parsed) : amount;
};

const cityFromAddress = (address: string) => {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : BRAND.city;
};

const CellText = ({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) => (
  <tr>
    <td style={{ padding: '10px 0', borderBottom: `1px solid ${elite.line}`, fontFamily: sans, fontSize: '13px', color: elite.body }}>
      {label}
    </td>
    <td align="right" style={{ padding: '10px 0', borderBottom: `1px solid ${elite.line}`, fontFamily: serif, fontSize: '15px', fontWeight: 700, color: elite.goldDark }}>
      {detail}
    </td>
  </tr>
);

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <td className="stack stack-pad" width="50%" valign="top" style={{ padding: '0 6px 12px' }}>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '12px' }}>
      <tbody>
        <tr>
          <td style={{ padding: '14px 15px' }}>
            <div style={{ fontFamily: sans, fontSize: '9px', letterSpacing: '1.8px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 600 }}>{label}</div>
            <div style={{ fontFamily: serif, fontSize: '18px', fontWeight: 700, color: elite.ink, paddingTop: '5px', lineHeight: 1.15 }}>{value}</div>
            {sub && <div style={{ fontFamily: sans, fontSize: '12px', color: elite.muted, paddingTop: '5px', lineHeight: 1.45 }}>{sub}</div>}
          </td>
        </tr>
      </tbody>
    </table>
  </td>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
    <tbody>
      <tr>
        <td style={{ fontFamily: serif, fontSize: '19px', color: elite.ink, fontWeight: 700 }}>{title}</td>
        <td align="right" style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 600 }}>{eyebrow}</td>
      </tr>
    </tbody>
  </table>
);

const Button = ({ href, label }: { href: string; label: string }) => (
  <table role="presentation" cellPadding="0" cellSpacing="0" border={0} align="center">
    <tbody>
      <tr>
        <td align="center" bgcolor={elite.goldDark} style={{ backgroundColor: elite.goldDark, borderRadius: '4px' }}>
          <a href={href} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '15px 34px', fontFamily: sans, fontSize: '14px', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>
            {label}
          </a>
        </td>
      </tr>
    </tbody>
  </table>
);

export const homeEliteQuoteSubject = (data: HomeQuoteData) => {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  return `${data.clientFirstName}, your ${carrier.displayName} home quote is ready`;
};

export const homeEliteQuotePreheader = (data: HomeQuoteData) =>
  `${money(data.annualPremium)}/yr home quote with ${money(data.coverages.coverageA)} dwelling coverage.`;

function HomeEliteQuoteEmail({ data }: { data: HomeQuoteData }) {
  const carrier = CARRIERS[data.carrierId] ?? CARRIERS.ncgrange;
  const names = splitName(data);
  const homeImage = normalizeHeroImageUrl(data.heroImageUrl, defaultHomeImageUrl);
  const carrierLogo = carrier.logoUrl || BRAND.logoUrl;
  const actionHref = quoteActionHref({
    clientName: data.clientFullName,
    clientEmail: data.clientEmail,
    templateType: data.templateType,
    carrier: carrier.displayName,
    quoteNumber: data.quoteNumber,
    premium: money(data.annualPremium, 2),
    subject: homeEliteQuoteSubject(data),
  });
  const policyHeadline = data.policyType.startsWith('DP') ? 'dwelling policy quote' : 'homeowners quote';
  const discounts = data.discounts.slice(0, 4);
  const endorsements = data.endorsements.slice(0, 4);
  const monthlyEstimate = money(data.annualPremium / 12, 2);
  const propertyCity = cityFromAddress(data.propertyAddress);

  return (
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <title>{homeEliteQuoteSubject(data)}</title>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'InsuranceAgency',
              name: BRAND.name,
              url: BRAND.websiteUrl,
              telephone: `+1${BRAND.phoneRaw}`,
              email: BRAND.email,
              address: {
                '@type': 'PostalAddress',
                streetAddress: BRAND.street,
                addressLocality: BRAND.city,
                addressRegion: BRAND.state,
                postalCode: BRAND.zip,
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: String(BRAND.googleRating),
                reviewCount: BRAND.googleReviewCount,
              },
            }),
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Poppins:wght@400;500;600;700&display=swap');
              body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; text-size-adjust:100%; }
              img { border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
              table { border-collapse:collapse; }
              a { text-decoration:none; }
              @media only screen and (min-width:601px) {
                .container { width:100% !important; }
                .h1-mobile { font-size:30px !important; line-height:1.1 !important; }
                .premium-mobile { font-size:48px !important; }
              }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: elite.page }}>
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden', fontSize: '1px', lineHeight: '1px', color: elite.page }}>
          {homeEliteQuotePreheader(data)}
        </div>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.page} style={{ backgroundColor: elite.page }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '22px 10px' }}>
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} className="container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', backgroundColor: elite.paper }}>
                  <tbody>
                    <tr>
                      <td className="pad-mobile" style={{ padding: '24px 24px 6px' }} bgcolor={elite.paper}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '14px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: 0 }}>
                                <div style={{ height: '3px', backgroundColor: elite.gold, borderRadius: '14px 14px 0 0', fontSize: '1px', lineHeight: '1px' }}>&nbsp;</div>
                              </td>
                            </tr>
                            <tr>
                              <td align="center" style={{ padding: '13px 16px 0' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2.6px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 700 }}>Home Insurance Quote</div>
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '12px 14px 16px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                  <tbody>
                                    <tr>
                                      <td width="56%" align="center" valign="middle" style={{ paddingRight: '12px' }}>
                                        <img src={BRAND.logoUrl} alt={BRAND.name} width="170" style={{ display: 'block', width: '100%', maxWidth: '170px', height: 'auto', margin: '0 auto' }} />
                                      </td>
                                      <td width="44%" align="center" valign="middle" style={{ paddingLeft: '14px', borderLeft: `1px solid ${elite.line}` }}>
                                        <img src={carrierLogo} alt={carrier.legalName || carrier.displayName} width="118" style={{ display: 'block', width: '100%', maxWidth: '118px', height: 'auto', margin: '0 auto' }} />
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
                      <td align="center" style={{ padding: '22px 16px 0 16px', fontSize: 0, lineHeight: 0 }}>
                        <img src={homeImage} alt={`Home quote for ${data.propertyAddress}`} width="568" style={{ display: 'block', width: '100%', maxWidth: '568px', height: 'auto', margin: '0 auto', border: `1px solid ${elite.line}`, borderRadius: '14px' }} />
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '24px 24px 6px' }}>
                        <div style={{ fontFamily: sans, fontSize: '11px', letterSpacing: '2.4px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 600 }}>Prepared for {names.first} {names.last}</div>
                        <h1 className="h1-mobile" style={{ margin: '10px 0 0', fontFamily: serif, fontSize: '25px', lineHeight: 1.08, fontWeight: 600, color: elite.ink }}>
                          Your <span style={{ color: elite.goldDark, fontStyle: 'italic' }}>{policyHeadline}</span> is ready.
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td className="pad-mobile" style={{ padding: '14px 24px 6px', fontFamily: sans, fontSize: '14px', lineHeight: 1.6, color: elite.body }}>
                        <p style={{ margin: '0 0 12px' }}>I reviewed this quote from {carrier.displayName} for your home at <strong style={{ color: elite.ink }}>{data.propertyAddress}</strong>. The important numbers are below so you can compare the protection and premium without digging through the carrier PDF.</p>
                        <p style={{ margin: 0 }}>If everything looks good, use the button below and I will walk you through the application, billing, and any final carrier requirements before anything is submitted.</p>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '18px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.ink} style={{ backgroundColor: elite.ink, borderRadius: '16px' }}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ padding: '22px 20px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: elite.gold, fontWeight: 700 }}>Annual Premium</div>
                                <div className="premium-mobile" style={{ fontFamily: serif, fontSize: '44px', lineHeight: 1, fontWeight: 700, color: '#ffffff', paddingTop: '8px' }}>{money(data.annualPremium)}</div>
                                <div style={{ fontFamily: sans, fontSize: '13px', color: '#e9ddbf', paddingTop: '10px' }}>About {monthlyEstimate}/mo if escrowed through your mortgage</div>
                                <div style={{ paddingTop: '18px' }}><Button href={actionHref} label="Contact Me" /></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '22px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '16px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '18px 20px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2.4px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 600 }}>Property Quoted</div>
                                <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: elite.ink, paddingTop: '7px', lineHeight: 1.15 }}>{data.propertyAddress}</div>
                                <div style={{ fontFamily: sans, fontSize: '14px', color: elite.body, paddingTop: '5px' }}>{propertyCity}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '14px 18px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                          <tbody>
                            <tr>
                              <StatCard label="Carrier" value={carrier.displayName} sub={carrier.legalName} />
                              <StatCard label="Policy Type" value={data.policyType} sub={data.policyType.startsWith('DP') ? 'Dwelling policy' : 'Homeowners policy'} />
                            </tr>
                            <tr>
                              <StatCard label="Dwelling" value={money(data.coverages.coverageA)} sub="Coverage A" />
                              <StatCard label="Deductible" value={money(data.allPerilDeductible)} sub={data.windHailDeductible ? `${money(data.windHailDeductible)} wind/hail` : 'All peril deductible'} />
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '18px 24px 0' }}>
                        <SectionTitle eyebrow="Snapshot" title="Coverage at a glance" />
                      </td>
                    </tr>
                    <tr>
                      <td className="pad-mobile" style={{ padding: '10px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '14px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '6px 18px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                  <tbody>
                                    <CellText label="Coverage A - Dwelling" detail={money(data.coverages.coverageA)} />
                                    <CellText label="Coverage B - Other Structures" detail={money(data.coverages.coverageB)} />
                                    <CellText label="Coverage C - Personal Property" detail={money(data.coverages.coverageC)} />
                                    <CellText label="Coverage D - Loss of Use" detail={value(data.coverages.coverageD)} />
                                    <CellText label="Coverage E - Liability" detail={money(data.coverages.coverageE)} />
                                    <tr>
                                      <td style={{ padding: '10px 0', fontFamily: sans, fontSize: '13px', color: elite.body }}>Coverage F - Medical Payments</td>
                                      <td align="right" style={{ padding: '10px 0', fontFamily: serif, fontSize: '15px', fontWeight: 700, color: elite.goldDark }}>{money(data.coverages.coverageF)}</td>
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
                      <td className="pad-mobile" style={{ padding: '18px 24px 0' }}>
                        <SectionTitle eyebrow="Details" title="Property and deductible details" />
                      </td>
                    </tr>
                    <tr>
                      <td className="pad-mobile" style={{ padding: '10px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '14px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '6px 18px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                  <tbody>
                                    <CellText label="Effective Date" detail={formatDate(data.effectiveDate)} />
                                    <CellText label="Quote Number" detail={data.quoteNumber} />
                                    <CellText label="Year Built" detail={String(data.yearBuilt)} />
                                    <CellText label="Square Feet" detail={data.squareFeet ? data.squareFeet.toLocaleString() : 'Not listed'} />
                                    <CellText label="Construction" detail={data.constructionType || 'Not listed'} />
                                    <CellText label="Roof" detail={[data.roofYear, data.roofMaterial].filter(Boolean).join(' ') || 'Not listed'} />
                                    <tr>
                                      <td style={{ padding: '10px 0', fontFamily: sans, fontSize: '13px', color: elite.body }}>Protection Class</td>
                                      <td align="right" style={{ padding: '10px 0', fontFamily: serif, fontSize: '15px', fontWeight: 700, color: elite.goldDark }}>{data.protectionClass || 'Not listed'}</td>
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
                      <td className="pad-mobile" style={{ padding: '22px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                          <tbody>
                            <tr>
                              <td className="stack stack-pad" width="50%" valign="top" style={{ paddingRight: '6px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '14px' }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '15px 17px' }}>
                                        <div style={{ fontFamily: serif, fontSize: '15px', color: elite.ink, fontWeight: 700, paddingBottom: '10px' }}>Added coverages</div>
                                        {(endorsements.length ? endorsements : [
                                          { name: 'Policy Review', amount: 'Included' },
                                          { name: 'Claims Guidance', amount: 'Included' },
                                          { name: 'Local Agency Support', amount: 'Included' },
                                        ]).slice(0, 3).map((item) => (
                                          <table key={item.name} role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                            <tbody><tr>
                                              <td style={{ padding: '6px 0', fontFamily: sans, fontSize: '13px', color: elite.body }}>{item.name}</td>
                                              <td align="right" style={{ padding: '6px 0', fontFamily: sans, fontSize: '13px', color: elite.goldDark, fontWeight: 600 }}>{item.amount || 'Included'}</td>
                                            </tr></tbody>
                                          </table>
                                        ))}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td className="stack" width="50%" valign="top" style={{ paddingLeft: '6px' }}>
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '14px' }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ padding: '15px 17px' }}>
                                        <div style={{ fontFamily: serif, fontSize: '15px', color: elite.ink, fontWeight: 700, paddingBottom: '10px' }}>Discounts reviewed</div>
                                        {(discounts.length ? discounts : [
                                          { label: 'Carrier discount review' },
                                          { label: 'Account review' },
                                          { label: 'Agency support' },
                                        ]).slice(0, 3).map((item) => (
                                          <table key={item.label} role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
                                            <tbody><tr>
                                              <td style={{ padding: '6px 0', fontFamily: sans, fontSize: '13px', color: elite.body }}>{item.label}</td>
                                            </tr></tbody>
                                          </table>
                                        ))}
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
                      <td className="pad-mobile" style={{ padding: '24px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '16px' }}>
                          <tbody>
                            <tr>
                              <td align="center" style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
                                <img src={agentReviewImageUrl} alt="Local agency service" width="532" style={{ display: 'block', width: '100%', maxWidth: '532px', height: 'auto', margin: '0 auto', borderRadius: '16px 16px 0 0' }} />
                              </td>
                            </tr>
                            <tr>
                              <td valign="middle" style={{ padding: '20px 22px 22px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 700 }}>Local Review</div>
                                <div style={{ fontFamily: serif, fontSize: '20px', fontWeight: 700, color: elite.ink, paddingTop: '7px' }}>I review the details before you bind.</div>
                                <p style={{ margin: '9px 0 0', fontFamily: sans, fontSize: '13px', lineHeight: 1.6, color: elite.body }}>I will confirm the application details, payment option, carrier requirements, and effective date with you before coverage is started.</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" style={{ padding: '24px 24px 0' }}>
                        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} bgcolor={elite.white} style={{ backgroundColor: elite.white, border: `1px solid ${elite.line}`, borderRadius: '16px' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '20px' }}>
                                <div style={{ fontFamily: sans, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: elite.goldDark, fontWeight: 700 }}>Local Customer Review</div>
                                <div style={{ fontFamily: serif, fontSize: '21px', fontWeight: 700, color: elite.ink, paddingTop: '5px' }}>Trusted by local families</div>
                                <p style={{ margin: '12px 0 8px', fontFamily: serif, fontSize: '18px', lineHeight: 1.55, color: elite.body, fontStyle: 'italic' }}>"Bill Layne Insurance is hands down the best insurance agency I've ever dealt with. They're always friendly, helpful, and quick to respond."</p>
                                <p style={{ margin: '0 0 16px', fontFamily: sans, fontSize: '12px', fontWeight: 700, color: elite.ink }}>Sarah M. - Google review</p>
                                <Button href={BRAND.googleReviewsUrl} label="Read Our Google Reviews" />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" align="center" style={{ padding: '28px 24px 0' }}>
                        <div style={{ fontFamily: serif, fontSize: '22px', fontWeight: 700, color: elite.ink, lineHeight: 1.12 }}>Ready to review the next step?</div>
                        <p style={{ margin: '10px 0 18px', fontFamily: sans, fontSize: '14px', lineHeight: 1.6, color: elite.body }}>Click below, call, or reply and I will walk you through the application and payment before anything is submitted.</p>
                        <Button href={actionHref} label="Contact Me" />
                      </td>
                    </tr>

                    <tr>
                      <td className="pad-mobile" align="center" style={{ padding: '26px 24px 30px' }}>
                        <img src={BRAND.logoUrl} alt={BRAND.name} width="150" style={{ display: 'block', width: '150px', height: 'auto', margin: '0 auto 14px' }} />
                        <p style={{ margin: 0, fontFamily: sans, fontSize: '12px', lineHeight: 1.65, color: elite.muted }}>
                          Bill Layne Insurance Agency<br />
                          {BRAND.street}, {BRAND.city}, {BRAND.state} {BRAND.zip}<br />
                          <a href={`tel:${BRAND.phoneRaw}`} style={{ color: elite.goldDark, fontWeight: 700 }}>{BRAND.phone}</a> &nbsp;|&nbsp; <a href={`mailto:${BRAND.email}`} style={{ color: elite.goldDark, fontWeight: 700 }}>{BRAND.email}</a>
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

export function renderHomeEliteQuoteGmailHtml(data: HomeQuoteData) {
  const html = `<!DOCTYPE html>${renderToStaticMarkup(<HomeEliteQuoteEmail data={data} />)}`;
  return html
    .replace(/&#x27;/g, "'")
    .replace(/\scellPadding=/g, ' cellpadding=')
    .replace(/\scellSpacing=/g, ' cellspacing=')
    .replace(/<tbody>/g, '')
    .replace(/<\/tbody>/g, '')
    .replace('</title>', `</title>\n        ${msoHeadBlock}`)
    .replace(/<body([^>]*)>/, `<body$1>${gmailWidthAnchor}`);
}
