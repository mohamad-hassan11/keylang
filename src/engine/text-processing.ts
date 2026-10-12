/**
 * src/engine/text-processing.ts
 *
 * Pure Unicode processing pipeline for KeyLingo typing engine.
 * UI-independent, zero DOM/React dependencies.
 */

import { DiacriticMode } from '@/lib/types';

/**
 * Standard Arabic Tashkeel codepoints regex (D013):
 * \u064B - Fathatan
 * \u064C - Dammatan
 * \u064D - Kasratan
 * \u064E - Fatha
 * \u064F - Damma
 * \u0650 - Kasra
 * \u0651 - Shaddah
 * \u0652 - Sukun
 * \u0670 - Superscript Alif (Dagger Alif)
 */
export const ARABIC_TASHKEEL_REGEX = /[\u064B-\u0652\u0670]/g;

/**
 * Normalizes text to Unicode Canonical Composition (NFC).
 * Safe against empty or non-string inputs at runtime.
 */
export function normalizeNFC(text: string): string {
  if (!text) return '';
  return text.normalize('NFC');
}

/**
 * Segments an input string into atomic typographical grapheme clusters
 * according to Unicode Standard Annex #29.
 *
 * @param text The string to segment
 * @param locale Optional BCP 47 locale tag (e.g., 'en', 'nl', 'ar')
 * @returns Array of grapheme cluster strings
 */
export function segmentGraphemes(text: string, locale?: string): string[] {
  const normalized = normalizeNFC(text);
  if (!normalized) return [];

  const segmenter = new Intl.Segmenter(locale ?? 'und', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(normalized), (s) => s.segment);
}

/**
 * Strips Arabic tashkeel diacritics from a string, leaving base consonants,
 * Hamza characters, and non-Arabic text intact.
 */
export function stripArabicDiacritics(text: string): string {
  if (!text) return '';
  return text.replace(ARABIC_TASHKEEL_REGEX, '');
}

/**
 * Compares a target grapheme with a user input grapheme.
 * In 'strict' mode: exact NFC comparison.
 * In 'lenient' mode: strips Arabic tashkeel before comparison.
 * Note: Latin diacritics (e.g., Dutch ë, é, ö) are strictly preserved even in lenient mode.
 *
 * @param target Expected target grapheme
 * @param input Typed input grapheme
 * @param mode Matching mode ('strict' | 'lenient')
 * @returns boolean true if match, false otherwise
 */
export function compareGraphemes(
  target: string,
  input: string,
  mode: DiacriticMode = 'strict'
): boolean {
  const normTarget = normalizeNFC(target);
  const normInput = normalizeNFC(input);

  if (mode === 'lenient') {
    const strippedTarget = stripArabicDiacritics(normTarget);
    const strippedInput = stripArabicDiacritics(normInput);
    return strippedTarget === strippedInput;
  }

  return normTarget === normInput;
}
