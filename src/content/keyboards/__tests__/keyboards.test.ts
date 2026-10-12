import { describe, expect, it } from 'vitest';
import {
  KEYBOARD_LAYOUTS,
  getKeyboardLayout,
  qwertyUsLayout,
  usInternationalLayout,
  arabic101Layout,
  US_INTERNATIONAL_DEAD_KEYS,
} from '../index';
import type { KeyboardLayout } from '@/lib/types';

describe('Keyboard Layouts Subsystem', () => {
  const layouts: [string, KeyboardLayout][] = [
    ['QWERTY (US)', qwertyUsLayout],
    ['US-International', usInternationalLayout],
    ['Arabic 101', arabic101Layout],
  ];

  describe('1. Geometric ANSI Row Width Conservation (15.0u)', () => {
    layouts.forEach(([name, layout]) => {
      it(`${name} has exactly 5 rows with 15.0u width per row`, () => {
        expect(layout.rows.length).toBe(5);
        layout.rows.forEach((row, rowIndex) => {
          const totalWidth = row.keys.reduce((sum, key) => sum + (key.width ?? 1.0), 0);
          expect(totalWidth).toBeCloseTo(15.0, 5);
        });
      });
    });
  });

  describe('2. QWERTY US Layout Specifications', () => {
    it('has 8 home-row keys on row 2', () => {
      const homeRow = qwertyUsLayout.rows[2];
      const homeKeys = homeRow.keys.filter((k) => k.homeRow);
      expect(homeKeys.length).toBe(8);

      const homeCodes = homeKeys.map((k) => k.code);
      expect(homeCodes).toEqual([
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyF',
        'KeyJ',
        'KeyK',
        'KeyL',
        'Semicolon',
      ]);
    });

    it('correctly maps shift characters for numbers and punctuation', () => {
      const row0 = qwertyUsLayout.rows[0];
      const findKey = (code: string) => row0.keys.find((k) => k.code === code);

      expect(findKey('Digit1')?.shift).toBe('!');
      expect(findKey('Digit2')?.shift).toBe('@');
      expect(findKey('Minus')?.shift).toBe('_');
      expect(findKey('Equal')?.shift).toBe('+');
    });

    it('identifies tactile guide keys KeyF and KeyJ with index fingers', () => {
      const row2 = qwertyUsLayout.rows[2];
      const keyF = row2.keys.find((k) => k.code === 'KeyF');
      const keyJ = row2.keys.find((k) => k.code === 'KeyJ');

      expect(keyF).toBeDefined();
      expect(keyF?.finger).toBe('index');
      expect(keyF?.hand).toBe('left');
      expect(keyF?.homeRow).toBe(true);

      expect(keyJ).toBeDefined();
      expect(keyJ?.finger).toBe('index');
      expect(keyJ?.hand).toBe('right');
      expect(keyJ?.homeRow).toBe(true);
    });
  });

  describe('3. US-International Layout Specifications', () => {
    it('contains Dutch AltGr mappings for vowels and currency', () => {
      const row0 = usInternationalLayout.rows[0];
      const row1 = usInternationalLayout.rows[1];
      const row2 = usInternationalLayout.rows[2];

      const key5 = row0.keys.find((k) => k.code === 'Digit5');
      expect(key5?.altGr).toBe('€');

      const keyE = row1.keys.find((k) => k.code === 'KeyE');
      expect(keyE?.altGr).toBe('é');
      expect(keyE?.shiftAltGr).toBe('É');

      const keyA = row2.keys.find((k) => k.code === 'KeyA');
      expect(keyA?.altGr).toBe('á');
      expect(keyA?.shiftAltGr).toBe('Á');

      const keyP = row1.keys.find((k) => k.code === 'KeyP');
      expect(keyP?.altGr).toBe('ö');
      expect(keyP?.shiftAltGr).toBe('Ö');
    });

    it('maps dead keys for accents and diaereses', () => {
      expect(US_INTERNATIONAL_DEAD_KEYS['ë']).toEqual({
        deadKey: '"',
        deadCode: 'Quote',
        requiresShift: true,
        baseChar: 'e',
        baseCode: 'KeyE',
      });
      expect(US_INTERNATIONAL_DEAD_KEYS['é']).toEqual({
        deadKey: "'",
        deadCode: 'Quote',
        requiresShift: false,
        baseChar: 'e',
        baseCode: 'KeyE',
      });
    });
  });

  describe('4. Arabic 101 Layout Specifications', () => {
    it('is pinned to direction ltr for physical keyboard frame', () => {
      expect(arabic101Layout.direction).toBe('ltr');
    });

    it('contains 8 Arabic home row keys and tactile nubs on KeyF (ب) and KeyJ (ت)', () => {
      const row2 = arabic101Layout.rows[2];
      const homeKeys = row2.keys.filter((k) => k.homeRow);
      expect(homeKeys.length).toBe(8);

      const keyF = row2.keys.find((k) => k.code === 'KeyF');
      expect(keyF?.primary).toBe('ب');
      expect(keyF?.finger).toBe('index');
      expect(keyF?.hand).toBe('left');

      const keyJ = row2.keys.find((k) => k.code === 'KeyJ');
      expect(keyJ?.primary).toBe('ت');
      expect(keyJ?.finger).toBe('index');
      expect(keyJ?.hand).toBe('right');
    });

    it('maps Tashkeel diacritics to Shift keys', () => {
      const row1 = arabic101Layout.rows[1];
      const keyQ = row1.keys.find((k) => k.code === 'KeyQ'); // Fathah
      const keyW = row1.keys.find((k) => k.code === 'KeyW'); // Fathatan
      const keyE = row1.keys.find((k) => k.code === 'KeyE'); // Dammah

      expect(keyQ?.shift).toBe('\u064E');
      expect(keyW?.shift).toBe('\u064B');
      expect(keyE?.shift).toBe('\u064F');
    });
  });

  describe('5. Layout Registry & Lookup', () => {
    it('returns requested layout by ID', () => {
      expect(getKeyboardLayout('qwerty-us').id).toBe('qwerty-us');
      expect(getKeyboardLayout('us-international').id).toBe('us-international');
      expect(getKeyboardLayout('arabic-101').id).toBe('arabic-101');
    });

    it('falls back to qwerty-us for unknown ID', () => {
      expect(getKeyboardLayout('unknown-layout').id).toBe('qwerty-us');
    });
  });
});
