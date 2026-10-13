import type {
  LanguageCode,
  TranslationProvider,
  TranslationResult,
} from '@/lib/types';
import { findVocabularyEntry, getVocabulary } from '@/content/vocabulary';

/**
 * Generate external dictionary link fallback (e.g. Wiktionary)
 */
export function getExternalDictionaryUrl(word: string, language: LanguageCode): string {
  const cleanWord = encodeURIComponent(word.trim());
  switch (language) {
    case 'nl':
      return `https://nl.wiktionary.org/wiki/${cleanWord}`;
    case 'ar':
      return `https://ar.wiktionary.org/wiki/${cleanWord}`;
    case 'en':
    default:
      return `https://en.wiktionary.org/wiki/${cleanWord}`;
  }
}

/**
 * Clean text of common punctuation for dictionary lookup
 */
export function cleanLookupWord(word: string): string {
  return word.replace(/^[.,/#!$%^&*;:{}=\-_`~()«»""'']+|[.,/#!$%^&*;:{}=\-_`~()«»""'']+$/g, '').trim();
}

/**
 * Offline Translation Provider
 * Uses curated local vocabulary datasets without external API calls.
 */
export class OfflineTranslationProvider implements TranslationProvider {
  public async translate(
    text: string,
    from: LanguageCode,
    to: LanguageCode
  ): Promise<TranslationResult> {
    const cleaned = cleanLookupWord(text);
    if (!cleaned) {
      return {
        found: false,
        source: 'curated',
      };
    }

    // Direct lookup in vocabulary index
    let entry = findVocabularyEntry(cleaned, from);

    // If not found in the 'from' language dataset, search across all datasets in case language wasn't exact
    if (!entry) {
      const allEntries = getVocabulary(from);
      entry = allEntries.find((e) => e.text.toLowerCase() === cleaned.toLowerCase());
    }

    if (entry && entry.translations[to]) {
      const trans = entry.translations[to]!;
      return {
        found: true,
        translation: trans.text,
        partOfSpeech: entry.partOfSpeech,
        contextualNote: trans.contextualNote,
        example: trans.example,
        cefrLevel: entry.cefrLevel,
        source: 'curated',
        externalDictionaryUrl: getExternalDictionaryUrl(cleaned, from),
      };
    }

    // Not found in curated dataset
    return {
      found: false,
      translation: undefined,
      source: 'curated',
      externalDictionaryUrl: getExternalDictionaryUrl(cleaned, from),
    };
  }

  public async translateSentence(
    text: string,
    from: LanguageCode,
    to: LanguageCode
  ): Promise<TranslationResult> {
    // For MVP offline provider, check if full sentence is matched or return word lookup
    return this.translate(text, from, to);
  }
}

export const offlineTranslationProvider = new OfflineTranslationProvider();
