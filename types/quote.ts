import type { AutoQuoteData } from './auto';
import type { DwellingQuoteData } from './dwelling';
import type { HomeQuoteData } from './home';
import type { MotorcycleQuoteData } from './motorcycle';
import type { RentersQuoteData } from './renters';

export type QuoteTemplateType = 'auto' | 'home' | 'motorcycle' | 'renters' | 'dwelling';
export type QuoteData = AutoQuoteData | HomeQuoteData | MotorcycleQuoteData | RentersQuoteData | DwellingQuoteData;
