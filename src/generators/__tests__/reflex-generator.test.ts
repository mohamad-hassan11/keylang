import { describe, expect, it } from 'vitest';
import {
  createMulberry32,
  generateReflexExercise,
  getLayoutCharacterPool,
  getPhysicalNeighbors,
  REFLEX_LENGTH_TARGETS,
} from '../reflex-generator';
import { qwertyUsLayout } from '@/content/keyboards/qwerty-us';
import { arabic101Layout } from '@/content/keyboards/arabic-101';
import type { ReflexConfig } from '@/lib/types';

describe('Reflex Generator & Mulberry32 PRNG', () => {
  describe('1. Mulberry32 PRNG Algorithm Determinism & Test Vectors', () => {
    it('produces identical float sequences given seed = 42', () => {
      const prng1 = createMulberry32(42);
      const prng2 = createMulberry32(42);

      const seq1 = [prng1(), prng1(), prng1(), prng1()];
      const seq2 = [prng2(), prng2(), prng2(), prng2()];

      expect(seq1).toEqual(seq2);
      expect(seq1[0]).toBeCloseTo(0.60110375, 5);
      expect(seq1[1]).toBeCloseTo(0.44829055, 5);
      expect(seq1[2]).toBeCloseTo(0.85246579, 5);
      expect(seq1[3]).toBeCloseTo(0.66973404, 5);
    });

    it('handles seed = 0 deterministically', () => {
      const prng = createMulberry32(0);
      const val1 = prng();
      const val2 = prng();
      expect(val1).toBeCloseTo(0.2664292, 5);
      expect(val2).toBeCloseTo(0.0003297, 5);
    });

    it('coerces negative seeds into valid 32-bit unsigned integers without NaN', () => {
      const prng = createMulberry32(-42);
      for (let i = 0; i < 100; i++) {
        const val = prng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
        expect(Number.isNaN(val)).toBe(false);
      }
    });

    it('generates distinct sequences for different seeds', () => {
      const prngA = createMulberry32(100);
      const prngB = createMulberry32(101);
      expect(prngA()).not.toEqual(prngB());
    });
  });

  describe('2. generateReflexExercise Determinism Guarantee', () => {
    it('produces character-for-character identical output given identical config', () => {
      const config: ReflexConfig = {
        seed: 12345,
        length: 'medium',
        difficulty: 'medium',
        layoutId: 'qwerty-us',
      };

      const out1 = generateReflexExercise(config);
      const out2 = generateReflexExercise(config);
      expect(out1).toBe(out2);
    });

    it('produces different output when seed changes', () => {
      const out1 = generateReflexExercise({
        seed: 12345,
        length: 'medium',
        difficulty: 'medium',
        layoutId: 'qwerty-us',
      });
      const out2 = generateReflexExercise({
        seed: 54321,
        length: 'medium',
        difficulty: 'medium',
        layoutId: 'qwerty-us',
      });
      expect(out1).not.toBe(out2);
    });
  });

  describe('3. Length Mapping', () => {
    it('generates short exercise targeting ~50 characters', () => {
      const out = generateReflexExercise({
        seed: 777,
        length: 'short',
        difficulty: 'easy',
        layoutId: 'qwerty-us',
      });
      expect(out.length).toBeGreaterThanOrEqual(40);
      expect(out.length).toBeLessThanOrEqual(65);
      expect(out).not.toMatch(/^\s|\s$/);
    });

    it('generates medium exercise targeting ~150 characters', () => {
      const out = generateReflexExercise({
        seed: 777,
        length: 'medium',
        difficulty: 'medium',
        layoutId: 'qwerty-us',
      });
      expect(out.length).toBeGreaterThanOrEqual(135);
      expect(out.length).toBeLessThanOrEqual(175);
    });

    it('generates long exercise targeting ~300 characters', () => {
      const out = generateReflexExercise({
        seed: 777,
        length: 'long',
        difficulty: 'hard',
        layoutId: 'qwerty-us',
      });
      expect(out.length).toBeGreaterThanOrEqual(275);
      expect(out.length).toBeLessThanOrEqual(340);
    });
  });

  describe('4. Difficulty Scaling & Character Restrictions', () => {
    it('restricts easy mode exclusively to home-row characters', () => {
      const out = generateReflexExercise({
        seed: 999,
        length: 'long',
        difficulty: 'easy',
        layoutId: 'qwerty-us',
      });
      const homeRowAllowed = new Set(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", ' ']);
      for (const char of out) {
        expect(homeRowAllowed.has(char)).toBe(true);
      }
    });

    it('restricts medium mode to base alphabetic characters (no numbers/uppercase)', () => {
      const out = generateReflexExercise({
        seed: 999,
        length: 'long',
        difficulty: 'medium',
        layoutId: 'qwerty-us',
      });
      expect(out).toMatch(/^[a-z ]+$/);
      expect(out).not.toMatch(/[0-9]/);
      expect(out).not.toMatch(/[A-Z]/);
    });

    it('introduces numbers and capital letters in hard mode', () => {
      const out = generateReflexExercise({
        seed: 42,
        length: 'long',
        difficulty: 'hard',
        layoutId: 'qwerty-us',
      });
      expect(/[0-9A-Z]/.test(out)).toBe(true);
    });

    it('introduces symbols and punctuation in extreme mode', () => {
      const out = generateReflexExercise({
        seed: 42,
        length: 'long',
        difficulty: 'extreme',
        layoutId: 'qwerty-us',
      });
      expect(/[()[\];!.,]/.test(out)).toBe(true);
    });
  });

  describe('5. Physical Key Adjacency Detection', () => {
    it('detects correct physical neighbors for KeyF on QWERTY layout', () => {
      const neighborsMap = getPhysicalNeighbors(qwertyUsLayout);
      const fNeighbors = neighborsMap.get('f') ?? [];

      expect(fNeighbors).toContain('d');
      expect(fNeighbors).toContain('g');
      expect(fNeighbors).toContain('r');
      expect(fNeighbors).toContain('t');
      expect(fNeighbors).toContain('v');
      expect(fNeighbors).toContain('c');
      expect(fNeighbors).not.toContain('f'); // cannot be neighbor of itself
      expect(fNeighbors).not.toContain('p'); // opposite side of keyboard
    });
  });

  describe('6. Adaptive Error Weighting', () => {
    it('substantially increases the frequency of user weak keys', () => {
      const configBaseline: ReflexConfig = {
        seed: 1234,
        length: 'long',
        difficulty: 'easy',
        layoutId: 'qwerty-us',
      };
      const baseOut = generateReflexExercise(configBaseline);
      const countKBase = (baseOut.match(/k/g) || []).length;

      const configAdaptive: ReflexConfig = {
        seed: 1234,
        length: 'long',
        difficulty: 'easy',
        layoutId: 'qwerty-us',
        adaptiveData: { k: 50 },
      };
      const adaptOut = generateReflexExercise(configAdaptive);
      const countKAdapt = (adaptOut.match(/k/g) || []).length;

      expect(countKAdapt).toBeGreaterThan(countKBase * 2);
    });

    it('never emits out-of-pool keys even if error count is high', () => {
      const config: ReflexConfig = {
        seed: 1234,
        length: 'medium',
        difficulty: 'easy', // home row only
        layoutId: 'qwerty-us',
        adaptiveData: { z: 100, '9': 100, '!': 100 },
      };
      const out = generateReflexExercise(config);
      expect(out).not.toContain('z');
      expect(out).not.toContain('9');
      expect(out).not.toContain('!');
    });
  });

  describe('7. Multilingual Layout Support', () => {
    it('generates Arabic characters only when layout is arabic-101', () => {
      const out = generateReflexExercise({
        seed: 321,
        length: 'medium',
        difficulty: 'easy',
        layoutId: 'arabic-101',
      });
      expect(out).not.toMatch(/[a-zA-Z]/);
      expect(out).toMatch(/[\u0600-\u06FF]/);
    });
  });
});
