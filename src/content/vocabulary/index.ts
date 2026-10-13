import type {
  CEFRLevel,
  ContentCategory,
  LanguageCode,
  VocabularyEntry,
} from '@/lib/types';
import { ENGLISH_VOCABULARY } from './en';
import { DUTCH_VOCABULARY } from './nl';
import { ARABIC_VOCABULARY } from './ar';

export { ENGLISH_VOCABULARY } from './en';
export { DUTCH_VOCABULARY } from './nl';
export { ARABIC_VOCABULARY } from './ar';

export const ALL_VOCABULARY: readonly VocabularyEntry[] = [
  ...ENGLISH_VOCABULARY,
  ...DUTCH_VOCABULARY,
  ...ARABIC_VOCABULARY,
];

export interface VocabularyFilterOptions {
  readonly cefrLevel?: CEFRLevel;
  readonly category?: ContentCategory;
  readonly limit?: number;
}

/**
 * Get vocabulary list for a specific language with optional filters.
 */
export function getVocabulary(
  language: LanguageCode,
  options?: VocabularyFilterOptions
): readonly VocabularyEntry[] {
  let list: readonly VocabularyEntry[];
  switch (language) {
    case 'en':
      list = ENGLISH_VOCABULARY;
      break;
    case 'nl':
      list = DUTCH_VOCABULARY;
      break;
    case 'ar':
      list = ARABIC_VOCABULARY;
      break;
    default:
      list = ENGLISH_VOCABULARY;
  }

  if (!options) return list;

  let filtered = list;

  if (options.cefrLevel) {
    filtered = filtered.filter((entry) => entry.cefrLevel === options.cefrLevel);
    // If empty for this level, fall back to base list to avoid empty exercises
    if (filtered.length === 0) {
      filtered = list;
    }
  }

  if (options.category) {
    const categoryMatches = filtered.filter((entry) => entry.category === options.category);
    if (categoryMatches.length > 0) {
      filtered = categoryMatches;
    }
  }

  if (options.limit && options.limit > 0) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Look up a specific vocabulary entry by text and language.
 */
export function findVocabularyEntry(
  text: string,
  language: LanguageCode
): VocabularyEntry | undefined {
  const normalized = text.trim().toLowerCase();
  const list = getVocabulary(language);

  return list.find((entry) => {
    const entryText = entry.text.trim().toLowerCase();
    return entryText === normalized || entryText.includes(normalized) || normalized.includes(entryText);
  });
}
