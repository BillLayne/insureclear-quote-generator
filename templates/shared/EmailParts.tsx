import React from 'react';
import { BRAND } from '../../config/brand';
import { CARRIERS, type CarrierInfo } from '../../config/carriers';
import { COPY } from '../../config/copy';
import { resolveHeroImageUrl } from '../../lib/heroImage';
import type { Discount } from '../../types/auto';

const font = BRAND.fontFamily;

export const money = (value: number, digits = 0) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const plural = (count: number, singular: string, pluralWord = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export const Head = ({ subject }: { subject: string }) => (
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="format-detection" content="telephone=no" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <title>{subject}</title>
    <style
      dangerouslySetInnerHTML={{
        __html: `
        ${BRAND.fontImport}
        body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table { border-collapse:collapse; }
        img { -ms-interpolation-mode:bicubic; }
        a { text-decoration:none; }
        @media only screen and (max-width:600px) {
          .container { width:100% !important; }
          .card-pad { padding:20px !important; }
          .hero-pad { padding:32px 20px !important; }
          .premium-num { font-size:36px !important; }
          .stack-mobile { display:block !important; width:100% !important; }
          .hide-mobile { display:none !important; }
        }
        @media (prefers-color-scheme:dark) {
          body { background-color:#f1f5f9 !important; }
        }
      `,
      }}
    />
  </head>
);

export const BodySpacer = () => (
  <div
    style={{
      display: 'none',
      whiteSpace: 'nowrap',
      font: '15px courier',
      color: '#ffffff',
      lineHeight: 0,
      width: '600px',
      minWidth: '600px',
      maxWidth: '600px',
    }}
  >
    {'\u00a0 '.repeat(30)}
  </div>
);

export const Preheader = ({ text }: { text: string }) => (
  <div
    style={{
      display: 'none',
      fontSize: '1px',
      color: '#fefefe',
      lineHeight: '1px',
      maxHeight: 0,
      maxWidth: 0,
      opacity: 0,
      overflow: 'hidden',
    }}
  >
    {text}
    {'\u034f'.repeat(14)}
  </div>
);

const LogoCell = ({ carrier }: { carrier?: CarrierInfo }) => (
  <td
    style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 18px',
      textAlign: 'center',
    }}
  >
    {carrier ? (
      carrier.logoUrl ? (
        <img
          src={carrier.logoUrl}
          width="120"
          alt={carrier.displayName}
          style={{ display: 'block', width: '120px', height: 'auto', border: 0 }}
        />
      ) : (
        <>
          <div
            style={{
              fontFamily: font,
              fontSize: '11px',
              fontWeight: 700,
              color: BRAND.colors.navy,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {carrier.textPillMain || carrier.displayName}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '10px',
              fontWeight: 500,
              color: BRAND.colors.mutedText,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              paddingTop: '2px',
            }}
          >
            {carrier.textPillSub || 'Insurance Company'}
          </div>
        </>
      )
    ) : (
      <img
        src={BRAND.logoUrl}
        width="120"
        alt={BRAND.name}
        style={{ display: 'block', width: '120px', height: 'auto', border: 0 }}
      />
    )}
  </td>
);

export const HeaderCard = ({
  carrier,
  label,
}: {
  carrier: CarrierInfo;
  label: string;
}) => (
  <table
    role="presentation"
    cellPadding="0"
    cellSpacing="0"
    border={0}
    width="100%"
    style={{
      backgroundColor: '#fafafa',
      border: '1px solid #e2e8f0',
      borderRadius: '16px 16px 0 0',
      borderBottom: 'none',
    }}
  >
    <tbody>
      <tr>
        <td>
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
            <tbody>
              <tr>
                <td
                  height="5"
                  style={{
                    background: 'linear-gradient(90deg,#003f87 0%,#0076d3 50%,#003f87 100%)',
                    backgroundColor: BRAND.colors.navy,
                    fontSize: 0,
                    lineHeight: 0,
                    height: '5px',
                  }}
                >
                  &nbsp;
                </td>
              </tr>
            </tbody>
          </table>
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
            <tbody>
              <tr>
                <td style={{ padding: '24px' }} align="center">
                  <table role="presentation" cellPadding="0" cellSpacing="0" border={0}>
                    <tbody>
                      <tr>
                        <LogoCell />
                        <td width="20" style={{ width: '20px', fontSize: 0, lineHeight: 0 }}>
                          <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="1" height="40">
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    backgroundColor: '#e2e8f0',
                                    fontSize: 0,
                                    lineHeight: 0,
                                    width: '1px',
                                    height: '40px',
                                  }}
                                >
                                  &nbsp;
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <LogoCell carrier={carrier} />
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0}>
            <tbody>
              <tr>
                <td align="center" style={{ padding: '0 24px 18px 24px' }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: font,
                      fontSize: '10px',
                      fontWeight: 700,
                      color: BRAND.colors.mutedText,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
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

export const SectionHeader = ({ micro, heading }: { micro: string; heading: string }) => (
  <>
    <p
      style={{
        margin: '0 0 4px 0',
        fontSize: '10px',
        fontWeight: 700,
        color: BRAND.colors.navy,
        fontFamily: font,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
      }}
    >
      &#9679; {micro}
    </p>
    <p
      style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: 700,
        color: BRAND.colors.darkSlate,
        fontFamily: font,
      }}
    >
      {heading}
    </p>
  </>
);

export const Card = ({
  children,
  bg = '#ffffff',
}: {
  children: React.ReactNode;
  bg?: string;
}) => (
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: bg, border: '1px solid #e2e8f0', borderTop: 'none' }}>
    <tbody>
      <tr>
        <td style={{ padding: '32px' }} className="card-pad">
          {children}
        </td>
      </tr>
    </tbody>
  </table>
);

export const CoverageRow = ({
  emoji,
  label,
  subLabel,
  amount,
  amountSubLabel,
  isLast,
  green,
}: {
  emoji: string;
  label: string;
  subLabel: string;
  amount: string;
  amountSubLabel?: string;
  isLast?: boolean;
  green?: boolean;
}) => (
  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
    <tbody>
      <tr>
        <td style={{ padding: isLast ? '14px 0 0 0' : '14px 0' }}>
          <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
            <tbody>
              <tr>
                <td valign="top" style={{ paddingRight: '12px' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: BRAND.colors.darkSlate, fontFamily: font }}>
                    {emoji} {label}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: BRAND.colors.mutedText, fontFamily: font, lineHeight: 1.45 }}>
                    {subLabel}
                  </p>
                </td>
                <td align="right" valign="middle" style={amountSubLabel ? { width: '112px' } : { whiteSpace: 'nowrap' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: green ? 600 : 700,
                      color: green ? BRAND.colors.greenText : BRAND.colors.navy,
                      fontFamily: font,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {amount}
                  </p>
                  {amountSubLabel && (
                    <p
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: BRAND.colors.mutedText,
                        fontFamily: font,
                        lineHeight: 1.25,
                      }}
                    >
                      {amountSubLabel}
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

export const StackedRow = ({
  title,
  subLabel,
  badge,
  primary,
  warning,
}: {
  title: string;
  subLabel: string;
  badge: string;
  primary?: boolean;
  warning?: boolean;
}) => (
  <table
    cellPadding="0"
    cellSpacing="0"
    border={0}
    width="100%"
    style={{
      backgroundColor: primary ? BRAND.colors.blueTint : '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '12px',
    }}
  >
    <tbody>
      <tr>
        <td style={{ padding: '16px 20px' }}>
          <table cellPadding="0" cellSpacing="0" border={0} width="100%">
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: BRAND.colors.darkSlate, fontFamily: font }}>
                    {title}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: BRAND.colors.mutedText, fontFamily: font }}>
                    {subLabel}
                  </p>
                </td>
                <td align="right" valign="middle">
                  <table cellPadding="0" cellSpacing="0" border={0}>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            backgroundColor: warning ? BRAND.colors.warning : primary ? BRAND.colors.navy : BRAND.colors.mutedText,
                            borderRadius: '4px',
                            padding: '4px 10px',
                          }}
                        >
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#ffffff', fontFamily: font, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {badge}
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
    </tbody>
  </table>
);

export const DiscountGrid = ({ discounts }: { discounts: Discount[] }) => (
  <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
    <tbody>
      {Array.from({ length: Math.ceil(discounts.length / 4) }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {discounts.slice(rowIndex * 4, rowIndex * 4 + 4).map((discount) => (
            <td key={`${discount.emoji}-${discount.label}`} width="25%" align="center" valign="top" style={{ padding: '6px', width: '25%' }}>
              <table cellPadding="0" cellSpacing="0" border={0} width="100%" height="88" style={{ height: '88px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td height="88" align="center" valign="middle" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 6px', textAlign: 'center', height: '88px' }}>
                      <p style={{ margin: '0 0 3px 0', fontSize: '20px', lineHeight: 1 }}>{discount.emoji}</p>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#065f46', fontFamily: font, lineHeight: 1.25 }}>
                        {discount.label}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          ))}
          {Array.from({ length: 4 - discounts.slice(rowIndex * 4, rowIndex * 4 + 4).length }).map((__, index) => (
            <td key={`empty-${rowIndex}-${index}`} width="25%" style={{ padding: '6px', width: '25%' }} />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const cleanHeroImageUrl = (imageUrl?: string) => resolveHeroImageUrl(imageUrl);

export const HeroImage = ({
  imageUrl,
  imageAlt,
  imageCaption,
  marginTop = '22px',
}: {
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  marginTop?: string;
}) => {
  const src = cleanHeroImageUrl(imageUrl);
  if (!src) return null;

  return (
    <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: `${marginTop} auto 0 auto`, maxWidth: '520px' }}>
      <tbody>
        <tr>
          <td align="center" style={{ backgroundColor: BRAND.gradients.premiumFallback }}>
            <img
              src={src}
              width="520"
              alt={imageAlt || 'Quote image'}
              loading="lazy"
              decoding="async"
              style={{
                display: 'block',
                width: '100%',
                maxWidth: '520px',
                height: 'auto',
                border: '2px solid rgba(255,255,255,0.22)',
                borderRadius: '12px',
              }}
            />
            {imageCaption && (
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.62)', fontFamily: font, letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.4 }}>
                {imageCaption}
              </p>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export const HeroImageBand = ({
  imageUrl,
  imageAlt,
  imageCaption,
}: {
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
}) => {
  if (!cleanHeroImageUrl(imageUrl)) return null;

  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ background: BRAND.gradients.premium, backgroundColor: BRAND.gradients.premiumFallback }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '0 32px 28px 32px' }} className="hero-pad">
            <HeroImage imageUrl={imageUrl} imageAlt={imageAlt} imageCaption={imageCaption} marginTop="0" />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export const HeroCard = ({
  badge,
  greeting,
  thankYouLine,
  premiumLabel,
  bigNumber,
  unit,
  subLine,
  carrierList,
  chips,
  imageUrl,
  imageAlt,
  imageCaption,
  imagePlacement = 'afterChips',
}: {
  badge: string;
  greeting: string;
  thankYouLine?: string;
  premiumLabel: string;
  bigNumber: string;
  unit: string;
  subLine: string;
  carrierList: string;
  chips: string[];
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  imagePlacement?: 'afterGreeting' | 'afterChips' | 'none';
}) => (
  <table role="presentation" cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ background: BRAND.gradients.premium, backgroundColor: BRAND.gradients.premiumFallback }}>
    <tbody>
      <tr>
        <td style={{ padding: '48px 32px', textAlign: 'center' }} className="hero-pad">
          <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto 20px auto' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: 'rgba(200,168,78,0.15)', border: '1px solid rgba(200,168,78,0.4)', borderRadius: '20px', padding: '6px 16px' }}>
                  <span style={{ fontFamily: font, fontSize: '11px', fontWeight: 700, color: BRAND.colors.gold, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {badge}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: '0 0 8px 0', fontFamily: font, fontSize: '32px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
            {greeting}
          </p>
          {imagePlacement === 'afterGreeting' && <HeroImage imageUrl={imageUrl} imageAlt={imageAlt} imageCaption={imageCaption} marginTop="18px" />}
          {thankYouLine?.trim() && (
            <p style={{ margin: imagePlacement === 'afterGreeting' && cleanHeroImageUrl(imageUrl) ? '18px 0 28px 0' : '0 0 28px 0', fontFamily: font, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              {thankYouLine}
            </p>
          )}
          <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px 36px', border: '1px solid rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 700, color: BRAND.colors.gold, fontFamily: font, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                    {premiumLabel}
                  </p>
                  <p style={{ margin: 0, fontSize: '40px', fontWeight: 700, color: '#ffffff', fontFamily: font, lineHeight: 1.1 }} className="premium-num">
                    {bigNumber}
                    <span style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>{unit}</span>
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontFamily: font }}>{subLine}</p>
                </td>
              </tr>
            </tbody>
          </table>
          <table cellPadding="0" cellSpacing="0" border={0} width="100%" style={{ margin: '18px auto 0 auto', maxWidth: '520px' }}>
            <tbody>
              <tr>
                <td style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px 18px', border: '1px solid rgba(200,168,78,0.4)' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 700, color: BRAND.colors.gold, fontFamily: font, letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center' }}>
                    &#128722; We Shopped Your Rate
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#ffffff', fontFamily: font, lineHeight: 1.5, textAlign: 'center' }}>
                    As your independent agent, I compared <strong>multiple top carriers</strong> to find your best value:
                  </p>
                  <p
                    style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontFamily: font, lineHeight: 1.7, textAlign: 'center' }}
                    dangerouslySetInnerHTML={{ __html: carrierList }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '18px auto 0 auto' }}>
            <tbody>
              <tr>
                {chips.slice(0, 4).map((chip) => (
                  <td key={chip} style={{ padding: '0 4px' }}>
                    <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto' }}>
                      <tbody>
                        <tr>
                          <td style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 12px' }}>
                            <span style={{ fontFamily: font, fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>{chip}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {imagePlacement === 'afterChips' && <HeroImage imageUrl={imageUrl} imageAlt={imageAlt} imageCaption={imageCaption} />}
        </td>
      </tr>
    </tbody>
  </table>
);

export const IntroCard = ({
  firstName,
  carrier,
}: {
  firstName: string;
  carrier: CarrierInfo;
}) => (
  <Card>
    <p style={{ margin: '0 0 14px 0', fontFamily: font, fontSize: '16px', lineHeight: 1.65, color: BRAND.colors.bodyText }}>
      Hi {firstName}, I prepared this quote with <strong>{carrier.displayName}</strong> and included the important coverage details below so you can review it without digging through the carrier PDF.
    </p>
    <p style={{ margin: 0, fontFamily: font, fontSize: '12px', lineHeight: 1.6, color: BRAND.colors.mutedText }}>
      {COPY.disclaimerQuote.replace('{carrier_legal}', carrier.legalName)}
    </p>
  </Card>
);

export const EarlyActionCard = ({
  heading,
  body,
  primaryLabel,
  actionHref,
}: {
  heading: string;
  body: string;
  primaryLabel: string;
  actionHref?: string;
}) => (
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none' }}>
    <tbody>
      <tr>
        <td style={{ padding: '24px 32px', textAlign: 'center' }} className="card-pad">
          <p style={{ margin: '0 0 8px 0', fontFamily: font, fontSize: '20px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{heading}</p>
          <p style={{ margin: '0 0 16px 0', fontFamily: font, fontSize: '13px', color: BRAND.colors.bodyText, lineHeight: 1.6 }}>{body}</p>
          <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto 10px auto' }}>
            <tbody>
              <tr>
                <td style={{ background: 'linear-gradient(135deg,#003f87 0%,#0076d3 100%)', backgroundColor: BRAND.colors.navy, borderRadius: '8px' }}>
                  <a href={actionHref || `mailto:${BRAND.email}`} style={{ display: 'inline-block', padding: '13px 30px', fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: font, textDecoration: 'none' }}>
                    {primaryLabel}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: 0, fontFamily: font, fontSize: '11px', color: BRAND.colors.mutedText, lineHeight: 1.5 }}>
            Coverage starts only after carrier acceptance and initial payment. Replying does not bind coverage by itself.
          </p>
        </td>
      </tr>
    </tbody>
  </table>
);

export const SnapshotCard = ({
  micro,
  heading,
  items,
}: {
  micro: string;
  heading: string;
  items: Array<{ label: string; value: string; sub?: string }>;
}) => (
  <Card bg="#fafafa">
    <SectionHeader micro={micro} heading={heading} />
    <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
      <tbody>
        {Array.from({ length: Math.ceil(items.length / 2) }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {items.slice(rowIndex * 2, rowIndex * 2 + 2).map((item) => (
              <td key={item.label} className="stack-mobile" width="50%" style={{ padding: '0 6px 12px 6px' }}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ margin: '0 0 4px 0', fontFamily: font, fontSize: '10px', fontWeight: 700, color: BRAND.colors.mutedText, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                          {item.label}
                        </p>
                        <p style={{ margin: 0, fontFamily: font, fontSize: '17px', fontWeight: 700, color: BRAND.colors.navy, lineHeight: 1.2 }}>{item.value}</p>
                        {item.sub && <p style={{ margin: '4px 0 0 0', fontFamily: font, fontSize: '11px', color: BRAND.colors.mutedText, lineHeight: 1.4 }}>{item.sub}</p>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            ))}
            {items.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && <td width="50%" style={{ padding: '0 6px 12px 6px' }} />}
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

export const CTABlock = ({
  heading,
  body,
  primaryLabel,
  actionHref,
}: {
  heading: string;
  body: string;
  primaryLabel: string;
  actionHref?: string;
}) => (
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none' }}>
    <tbody>
      <tr>
        <td style={{ padding: '36px 32px', textAlign: 'center' }} className="card-pad">
          <p style={{ margin: '0 0 8px 0', fontFamily: font, fontSize: '22px', fontWeight: 700, color: BRAND.colors.darkSlate }}>{heading}</p>
          <p style={{ margin: '0 0 24px 0', fontFamily: font, fontSize: '14px', color: BRAND.colors.mutedText, lineHeight: 1.6 }}>{body}</p>
          <p style={{ margin: '0 0 16px 0', fontFamily: font, fontSize: '13px', color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>{COPY.replyBaitQuote}</p>
          <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto 12px auto' }}>
            <tbody>
              <tr>
                <td style={{ background: 'linear-gradient(135deg,#003f87 0%,#0076d3 100%)', backgroundColor: BRAND.colors.navy, borderRadius: '8px' }}>
                  <a href={actionHref || `mailto:${BRAND.email}`} style={{ display: 'inline-block', padding: '14px 36px', fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: font, textDecoration: 'none' }}>
                    {primaryLabel}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto 12px auto' }}>
            <tbody>
              <tr>
                <td align="center" style={{ border: '2px solid #003f87', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                  <a href={`tel:${BRAND.phoneRaw}`} style={{ display: 'inline-block', padding: '12px 32px', fontSize: '14px', fontWeight: 700, color: BRAND.colors.navy, fontFamily: font, textDecoration: 'none' }}>
                    &#128222; Call {BRAND.phone}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ margin: 0, fontSize: '11px', color: BRAND.colors.quietText, fontFamily: font }}>
            Available Mon-Fri 9am-5pm &bull; We reply within 1 business hour
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: BRAND.colors.mutedText, fontFamily: font, lineHeight: 1.5 }}>
            Coverage starts only after the application is submitted, accepted by the carrier, and initial payment is received.
          </p>
        </td>
      </tr>
    </tbody>
  </table>
);

export const CustomerReviewCard = () => (
  <Card bg="#fafafa">
    <SectionHeader micro="Local Customer Review" heading="Trusted by Local Families" />
    <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
      <tbody>
        <tr>
          <td style={{ padding: '22px 24px' }}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', paddingRight: '14px', width: '38px' }}>
                    <img src={BRAND.googleIconUrl} width="24" alt="Google" style={{ display: 'block', width: '24px', height: '24px', border: 0 }} />
                  </td>
                  <td style={{ verticalAlign: 'top' }}>
                    <p style={{ margin: '0 0 6px 0', fontFamily: font, fontSize: '12px', fontWeight: 700, color: BRAND.colors.gold, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {BRAND.googleRating} Star Google Rating
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontFamily: font, fontSize: '15px', color: BRAND.colors.bodyText, lineHeight: 1.65, fontStyle: 'italic' }}>
                      &ldquo;Bill Layne Insurance is hands down the best insurance agency I've ever dealt with. They're always friendly, helpful, and quick to respond.&rdquo;
                    </p>
                    <p style={{ margin: '0 0 16px 0', fontFamily: font, fontSize: '12px', fontWeight: 700, color: BRAND.colors.darkSlate }}>
                      Sarah M. - Google review
                    </p>
                    <table cellPadding="0" cellSpacing="0" border={0}>
                      <tbody>
                        <tr>
                          <td style={{ backgroundColor: '#ffffff', border: `2px solid ${BRAND.colors.navy}`, borderRadius: '8px' }}>
                            <a href={BRAND.googleReviewsUrl} style={{ display: 'inline-block', padding: '10px 18px', fontFamily: font, fontSize: '13px', fontWeight: 700, color: BRAND.colors.navy, textDecoration: 'none' }}>
                              Read Our Google Reviews
                            </a>
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
      </tbody>
    </table>
  </Card>
);

export const quoteActionHref = ({
  action = 'application_review',
  clientName,
  clientEmail,
  templateType,
  carrier,
  quoteNumber,
  premium,
  subject,
}: {
  action?: string;
  clientName: string;
  clientEmail?: string;
  templateType: string;
  carrier: string;
  quoteNumber: string;
  premium: string;
  subject: string;
}) => {
  const params = new URLSearchParams({
    action,
    clientName,
    templateType,
    carrier,
    quoteNumber,
    premium,
    subject,
  });
  if (clientEmail) params.set('clientEmail', clientEmail);
  return `${BRAND.quoteActionUrl}?${params.toString()}`;
};

export const AlertCard = ({ title, body }: { title: string; body: string }) => (
  <table width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #f59e0b' }}>
    <tbody>
      <tr>
        <td style={{ padding: '20px 24px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: '#92400e', fontFamily: font, letterSpacing: '1px', textTransform: 'uppercase' }}>
            &#9888; {title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', fontFamily: font, lineHeight: 1.6 }}>{body}</p>
        </td>
      </tr>
    </tbody>
  </table>
);

export const Footer = () => (
  <>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#fafafa', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
      <tbody>
        <tr>
          <td height="3" style={{ background: BRAND.gradients.goldLine, backgroundColor: BRAND.colors.gold, fontSize: 0, lineHeight: 0 }}>
            &nbsp;
          </td>
        </tr>
        <tr>
          <td align="center" style={{ padding: '26px 24px 16px 24px' }}>
            <table cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 18px' }}>
                    <img src={BRAND.logoUrl} width="136" alt={BRAND.name} style={{ display: 'block', width: '136px', height: 'auto', border: 0 }} />
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ margin: '16px 0 0 0', fontFamily: font, fontSize: '13px', color: BRAND.colors.bodyText, lineHeight: 1.8 }}>
              {BRAND.street}<br />
              {BRAND.city}, {BRAND.state} {BRAND.zip}<br />
              <a href={`tel:${BRAND.phoneRaw}`} style={{ color: BRAND.colors.navy, fontWeight: 700 }}>{BRAND.phone}</a> &bull;{' '}
              <a href={`mailto:${BRAND.email}`} style={{ color: BRAND.colors.navy, fontWeight: 700 }}>{BRAND.email}</a><br />
              <a href={BRAND.websiteUrl} style={{ color: BRAND.colors.navy, fontWeight: 700 }}>{BRAND.website}</a>
            </p>
            <table role="presentation" cellPadding="0" cellSpacing="0" border={0} style={{ margin: '16px auto 0 auto' }}>
              <tbody>
                <tr>
                  {[
                    { label: 'f', name: 'Facebook', href: BRAND.facebook, bg: '#1877F2' },
                    { label: 'IG', name: 'Instagram', href: BRAND.instagram, bg: '#C13584' },
                    { label: 'YT', name: 'YouTube', href: BRAND.youtube, bg: '#FF0000' },
                    { label: 'X', name: 'X', href: BRAND.twitter, bg: '#0f172a' },
                    { label: 'M', name: 'Messenger', href: BRAND.messenger, bg: '#0084FF' },
                  ].map((item) => (
                    <td key={item.name} style={{ padding: '0 4px' }}>
                      <table role="presentation" cellPadding="0" cellSpacing="0" border={0}>
                        <tbody>
                          <tr>
                            <td width="28" height="28" align="center" valign="middle" style={{ backgroundColor: item.bg, borderRadius: '6px', width: '28px', height: '28px' }}>
                              <a href={item.href} aria-label={item.name} style={{ display: 'block', width: '28px', height: '28px', lineHeight: '28px', fontFamily: font, fontSize: '10px', fontWeight: 700, color: '#ffffff', textDecoration: 'none' }}>
                                {item.label}
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p style={{ margin: '14px 0 0 0', fontFamily: font, fontSize: '12px', color: BRAND.colors.bodyText }}>
              <img src={BRAND.googleIconUrl} width="16" alt="Google" style={{ verticalAlign: 'middle', border: 0, marginRight: '4px' }} />
              {BRAND.googleRating} stars on Google from {BRAND.googleReviewCount} reviews
            </p>
          </td>
        </tr>
      </tbody>
    </table>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
      <tbody>
        <tr>
          <td style={{ padding: '18px 24px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontFamily: font, fontSize: '10px', color: BRAND.colors.quietText, lineHeight: 1.6 }}>{COPY.unsubscribe}</p>
          </td>
        </tr>
      </tbody>
    </table>
  </>
);

export const SchemaJsonLd = ({ quoteNumber }: { quoteNumber: string }) => {
  const schema = {
    '@context': 'http://schema.org',
    '@type': 'EmailMessage',
    about: {
      '@type': 'Quotation',
      '@id': quoteNumber,
    },
    sender: {
      '@type': 'InsuranceAgency',
      name: BRAND.name,
      telephone: '+1-336-835-1993',
      email: BRAND.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: BRAND.street,
        addressLocality: BRAND.city,
        addressRegion: BRAND.state,
        postalCode: BRAND.zip,
      },
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
};

export const carrierFor = (id: keyof typeof CARRIERS) => CARRIERS[id] ?? CARRIERS.progressive;
