import { describe, expect, it } from 'vitest';
import {
  ARABIC_TASHKEEL_REGEX,
  compareGraphemes,
  normalizeNFC,
  segmentGraphemes,
  stripArabicDiacritics,
} from '../text-processing';

describe('text-processing module', () => {
  describe('normalizeNFC', () => {
    it('returns empty string for empty or falsy text', () => {
      expect(normalizeNFC('')).toBe('');
      expect(normalizeNFC(null as unknown as string)).toBe('');
      expect(normalizeNFC(undefined as unknown as string)).toBe('');
    });

    it('leaves standard ASCII unchanged', () => {
      expect(normalizeNFC('hello world')).toBe('hello world');
      expect(normalizeNFC('1234!@#$')).toBe('1234!@#$');
    });

    it('normalizes Dutch decomposed diacritics into canonical NFC forms', () => {
      // 'e' + combining diaeresis (\u0308) -> 'ë' (\u00EB)
      const decomposedE = 'e\u0308';
      expect(decomposedE.length).toBe(2);
      const normalizedE = normalizeNFC(decomposedE);
      expect(normalizedE).toBe('ë');
      expect(normalizedE.length).toBe(1);

      // 'e' + combining acute (\u0301) -> 'é' (\u00E9)
      const decomposedAcute = 'e\u0301';
      expect(normalizeNFC(decomposedAcute)).toBe('é');

      // 'o' + combining diaeresis (\u0308) -> 'ö' (\u00F6)
      const decomposedO = 'o\u0308';
      expect(normalizeNFC(decomposedO)).toBe('ö');
    });

    it('leaves pre-composed Dutch words unchanged', () => {
      expect(normalizeNFC('geëerd')).toBe('geëerd');
      expect(normalizeNFC('beëindigen')).toBe('beëindigen');
      expect(normalizeNFC('coördinatie')).toBe('coördinatie');
    });

    it('normalizes Arabic characters canonically', () => {
      // Alif + combining madda above -> Alif with Madda (آ)
      const decomposedAlifMadda = '\u0627\u0653';
      expect(normalizeNFC(decomposedAlifMadda)).toBe('آ');
    });
  });

  describe('segmentGraphemes', () => {
    it('returns empty array for empty or falsy strings', () => {
      expect(segmentGraphemes('')).toEqual([]);
      expect(segmentGraphemes(null as unknown as string)).toEqual([]);
    });

    it('segments ASCII strings character by character', () => {
      expect(segmentGraphemes('cat')).toEqual(['c', 'a', 't']);
      expect(segmentGraphemes('hi !')).toEqual(['h', 'i', ' ', '!']);
    });

    it('correctly segments Dutch diacritics as single graphemes', () => {
      expect(segmentGraphemes('geëerd')).toEqual(['g', 'e', 'ë', 'e', 'r', 'd']);
      expect(segmentGraphemes('e\u0308')).toEqual(['ë']);
    });

    it('segments Arabic base letter with multiple combining marks as a SINGLE grapheme cluster', () => {
      // Ba (\u0628) + Shadda (\u0651) + Fatha (\u064E) = بَّ
      const baShaddaFatha = 'بَّ';
      const clusters = segmentGraphemes(baShaddaFatha, 'ar');
      expect(clusters).toEqual(['بَّ']);
      expect(clusters.length).toBe(1);
    });

    it('segments vocalized Arabic words into grapheme clusters', () => {
      // كَتَبَ -> [ 'كَ', 'تَ', 'بَ' ]
      const word1 = 'كَتَبَ';
      expect(segmentGraphemes(word1, 'ar')).toEqual(['كَ', 'تَ', 'بَ']);

      // مَرْحَبًا -> [ 'مَ', 'رْ', 'حَ', 'بً', 'ا' ]
      const word2 = 'مَرْحَبًا';
      expect(segmentGraphemes(word2, 'ar')).toEqual(['مَ', 'رْ', 'حَ', 'بً', 'ا']);
    });

    it('segments emojis and ZWJ sequences as single graphemes', () => {
      expect(segmentGraphemes('👨‍👩‍👧‍👦')).toEqual(['👨‍👩‍👧‍👦']);
      expect(segmentGraphemes('🇳🇱')).toEqual(['🇳🇱']);
      expect(segmentGraphemes('👍🏽')).toEqual(['👍🏽']);
    });

    it('segments CRLF line endings as a single grapheme cluster', () => {
      expect(segmentGraphemes('\r\n')).toEqual(['\r\n']);
    });

    it('segments mixed LTR and RTL text without dropping characters', () => {
      const mixed = 'KeyLingo لغة';
      const clusters = segmentGraphemes(mixed);
      expect(clusters.slice(0, 8)).toEqual(['K', 'e', 'y', 'L', 'i', 'n', 'g', 'o']);
      expect(clusters[8]).toBe(' ');
      expect(clusters.slice(9)).toEqual(['ل', 'غ', 'ة']);
    });
  });

  describe('stripArabicDiacritics', () => {
    it('returns empty string for empty input', () => {
      expect(stripArabicDiacritics('')).toBe('');
      expect(stripArabicDiacritics(null as unknown as string)).toBe('');
    });

    it('strips all 9 standard tashkeel marks from Arabic words', () => {
      expect(stripArabicDiacritics('كَتَبَ')).toBe('كتب');
      expect(stripArabicDiacritics('كِتَابٌ')).toBe('كتاب');
      expect(stripArabicDiacritics('مَرْحَبًا')).toBe('مرحبا');
      expect(stripArabicDiacritics('بَّ')).toBe('ب');
      expect(stripArabicDiacritics('اللّٰه')).toBe('الله'); // Dagger Alif stripped
    });

    it('preserves consonants, Hamza letters, and spaces', () => {
      expect(stripArabicDiacritics('أَهْلًا وَسَهْلًا')).toBe('أهلا وسهلا');
      expect(stripArabicDiacritics('قُرْآن')).toBe('قرآن');
    });

    it('leaves non-Arabic characters completely intact', () => {
      expect(stripArabicDiacritics('Hello 123! geëerd')).toBe('Hello 123! geëerd');
      expect(stripArabicDiacritics('ë, é, ö')).toBe('ë, é, ö');
    });
  });

  describe('compareGraphemes', () => {
    describe('strict mode (default)', () => {
      it('returns true for exact matches', () => {
        expect(compareGraphemes('a', 'a')).toBe(true);
        expect(compareGraphemes('ك', 'ك')).toBe(true);
        expect(compareGraphemes('كَ', 'كَ')).toBe(true);
      });

      it('returns true when inputs match via NFC composition', () => {
        expect(compareGraphemes('ë', 'e\u0308')).toBe(true);
        expect(compareGraphemes('e\u0301', 'é')).toBe(true);
      });

      it('returns false when Arabic tashkeel differs in strict mode', () => {
        expect(compareGraphemes('كَ', 'ك')).toBe(false);
        expect(compareGraphemes('كِ', 'كَ')).toBe(false);
        expect(compareGraphemes('بَّ', 'ب')).toBe(false);
      });

      it('returns false for mismatched Latin characters or cases', () => {
        expect(compareGraphemes('a', 'b')).toBe(false);
        expect(compareGraphemes('A', 'a')).toBe(false);
        expect(compareGraphemes('ë', 'e')).toBe(false);
      });
    });

    describe('lenient mode', () => {
      it('returns true when Arabic characters differ only by tashkeel', () => {
        expect(compareGraphemes('كَ', 'ك', 'lenient')).toBe(true);
        expect(compareGraphemes('كِ', 'ك', 'lenient')).toBe(true);
        expect(compareGraphemes('كِ', 'كَ', 'lenient')).toBe(true);
        expect(compareGraphemes('بَّ', 'ب', 'lenient')).toBe(true);
        expect(compareGraphemes('بَّ', 'بَ', 'lenient')).toBe(true);
        expect(compareGraphemes('كِتَابٌ', 'كتاب', 'lenient')).toBe(true);
      });

      it('returns false when base Arabic characters differ', () => {
        expect(compareGraphemes('كَ', 'ل', 'lenient')).toBe(false);
        expect(compareGraphemes('ب', 'ت', 'lenient')).toBe(false);
      });

      it('does NOT strip Latin diacritics in lenient mode', () => {
        expect(compareGraphemes('ë', 'e', 'lenient')).toBe(false);
        expect(compareGraphemes('é', 'e', 'lenient')).toBe(false);
        expect(compareGraphemes('ö', 'o', 'lenient')).toBe(false);
      });

      it('returns true for matching Latin diacritics even under NFD representation', () => {
        expect(compareGraphemes('ë', 'e\u0308', 'lenient')).toBe(true);
      });
    });
  });
});
