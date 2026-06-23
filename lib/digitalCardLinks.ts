import type { CarrierId } from '../config/carriers';

const AGENCY_CARD_URL = 'https://insurance-card-generator-2026-color-edition.pages.dev/agency-contact';

export const DIGITAL_CARD_LINKS: Partial<Record<CarrierId, string>> = {
  progressive: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Progressive',
  national_general: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=National%20General',
  nationwide: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Nationwide',
  travelers: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Travelers',
  foremost: 'https://insurance-card-generator-2026-color-edition.pages.dev/foremost-insurance',
  dairyland: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Dairyland',
  hagerty: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Hagerty',
  ncjua: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=NCJUA',
  ncgrange: 'https://insurance-card-generator-2026-color-edition.pages.dev/nc-grange-mutual-home',
  alamance: 'https://insurance-card-generator-2026-color-edition.pages.dev/carrier-contact.html?carrier=Alamance%20Farmers',
  steadily: 'https://insurance-card-generator-2026-color-edition.pages.dev/steadily-landlord-insurance',
};

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const resolveDigitalCardUrl = (carrierId: CarrierId, overrideUrl?: string | null) => {
  const trimmed = overrideUrl?.trim();
  if (trimmed && isHttpUrl(trimmed)) return trimmed;
  return DIGITAL_CARD_LINKS[carrierId] || AGENCY_CARD_URL;
};
