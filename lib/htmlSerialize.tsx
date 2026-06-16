import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderAutoEmailHtml } from './autoEmailHtml';
import type { QuoteData } from '../types/quote';
import { autoEliteQuotePreheader, autoEliteQuoteSubject, renderAutoEliteQuoteGmailHtml } from '../templates/AutoEliteQuoteGmailTemplate';
import { autoElitePreheader, autoEliteSubject, renderAutoEliteGmailHtml } from '../templates/AutoEliteGmailTemplate';
import { autoPreheader, autoSubject } from '../templates/AutoQuoteTemplate';
import { commercialAutoElitePreheader, commercialAutoEliteSubject, renderCommercialAutoEliteGmailHtml } from '../templates/CommercialAutoEliteGmailTemplate';
import { DwellingQuoteTemplate, dwellingPreheader, dwellingSubject } from '../templates/DwellingQuoteTemplate';
import { homeElitePreheader, homeEliteSubject, renderHomeEliteGmailHtml } from '../templates/HomeEliteGmailTemplate';
import { homeEliteQuotePreheader, homeEliteQuoteSubject, renderHomeEliteQuoteGmailHtml } from '../templates/HomeEliteQuoteGmailTemplate';
import { HomeQuoteTemplate, homePreheader, homeSubject } from '../templates/HomeQuoteTemplate';
import { MotorcycleQuoteTemplate, motorcyclePreheader, motorcycleSubject } from '../templates/MotorcycleQuoteTemplate';
import { RentersQuoteTemplate, rentersPreheader, rentersSubject } from '../templates/RentersQuoteTemplate';
import { ShortQuoteTemplate, shortPreheader, shortSubject } from '../templates/ShortQuoteTemplate';

export interface RenderedQuote {
  html: string;
  subject: string;
  preheader: string;
}

export type EmailMode = 'full' | 'short' | 'homeElite' | 'homeEliteQuote' | 'autoElite' | 'autoEliteQuote' | 'commercialAutoElite';

export function renderQuoteHtml(data: QuoteData, mode: EmailMode = 'full'): RenderedQuote {
  if (mode === 'commercialAutoElite' && data.templateType === 'auto') {
    return {
      subject: commercialAutoEliteSubject(data),
      preheader: commercialAutoElitePreheader(),
      html: renderCommercialAutoEliteGmailHtml(data),
    };
  }

  if (mode === 'autoElite' && data.templateType === 'auto') {
    return {
      subject: autoEliteSubject(data),
      preheader: autoElitePreheader(),
      html: renderAutoEliteGmailHtml(data),
    };
  }

  if (mode === 'autoEliteQuote' && data.templateType === 'auto') {
    return {
      subject: autoEliteQuoteSubject(data),
      preheader: autoEliteQuotePreheader(data),
      html: renderAutoEliteQuoteGmailHtml(data),
    };
  }

  if (mode === 'homeElite' && data.templateType === 'home') {
    return {
      subject: homeEliteSubject(data),
      preheader: homeElitePreheader(),
      html: renderHomeEliteGmailHtml(data),
    };
  }

  if (mode === 'homeEliteQuote' && data.templateType === 'home') {
    return {
      subject: homeEliteQuoteSubject(data),
      preheader: homeEliteQuotePreheader(data),
      html: renderHomeEliteQuoteGmailHtml(data),
    };
  }

  if (mode === 'short') {
    const markup = renderToStaticMarkup(<ShortQuoteTemplate data={data} />);
    return {
      subject: shortSubject(data),
      preheader: shortPreheader(data),
      html: `<!DOCTYPE html>${markup}`,
    };
  }

  const subject =
    data.templateType === 'auto'
      ? autoSubject(data)
      : data.templateType === 'home'
        ? homeSubject(data)
        : data.templateType === 'motorcycle'
          ? motorcycleSubject(data)
          : data.templateType === 'renters'
            ? rentersSubject(data)
            : dwellingSubject(data);
  const preheader =
    data.templateType === 'auto'
      ? autoPreheader(data)
      : data.templateType === 'home'
        ? homePreheader(data)
        : data.templateType === 'motorcycle'
          ? motorcyclePreheader(data)
          : data.templateType === 'renters'
            ? rentersPreheader(data)
            : dwellingPreheader(data);
  if (data.templateType === 'auto') {
    return {
      subject,
      preheader,
      html: renderAutoEmailHtml(data),
    };
  }

  const markup = renderToStaticMarkup(
    data.templateType === 'home'
        ? <HomeQuoteTemplate data={data} />
        : data.templateType === 'motorcycle'
          ? <MotorcycleQuoteTemplate data={data} />
          : data.templateType === 'renters'
            ? <RentersQuoteTemplate data={data} />
            : <DwellingQuoteTemplate data={data} />,
  );

  return {
    subject,
    preheader,
    html: `<!DOCTYPE html>${markup}`,
  };
}
