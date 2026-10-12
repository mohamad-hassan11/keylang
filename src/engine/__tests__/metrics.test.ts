import { describe, expect, it } from 'vitest';
import { TypingSession } from '@/lib/types';
import {
  calculateAccuracy,
  calculateElapsedTimeMs,
  calculateGrossWpm,
  calculateMetrics,
  calculateNetWpm,
  getTotalErrors,
  recordKeyError,
} from '../metrics';

// Helper to construct mock TypingSession objects
function createMockSession(overrides: Partial<TypingSession> = {}): TypingSession {
  return {
    id: 'test-session',
    target: 'test',
    graphemes: ['t', 'e', 's', 't'],
    currentIndex: 4,
    characterStates: ['correct', 'correct', 'correct', 'correct'],
    status: 'completed',
    startTime: 0,
    pausedDuration: 0,
    lastPauseTime: null,
    endTime: 10000,
    errors: {},
    uncorrectedErrors: 0,
    totalKeystrokes: 4,
    options: {
      diacriticMatching: 'strict',
      layoutId: 'qwerty-us',
      language: 'en',
    },
    previouslyIncorrect: [false, false, false, false],
    ...overrides,
  };
}

describe('metrics module', () => {
  describe('calculateElapsedTimeMs', () => {
    it('returns 0 for unstarted sessions (startTime === null)', () => {
      const session = createMockSession({ startTime: null, endTime: null, status: 'idle' });
      expect(calculateElapsedTimeMs(session, 15000)).toBe(0);
    });

    it('calculates active elapsed time using now when endTime is null', () => {
      const session = createMockSession({ startTime: 1000, endTime: null, status: 'active' });
      expect(calculateElapsedTimeMs(session, 5000)).toBe(4000);
    });

    it('calculates elapsed time using endTime for completed sessions', () => {
      const session = createMockSession({ startTime: 1000, endTime: 7000, status: 'completed' });
      expect(calculateElapsedTimeMs(session, 20000)).toBe(6000);
    });

    it('deducts accumulated pausedDuration', () => {
      const session = createMockSession({
        startTime: 0,
        endTime: 40000,
        pausedDuration: 10000,
        status: 'completed',
      });
      expect(calculateElapsedTimeMs(session)).toBe(30000);
    });

    it('freezes timer during active pause (status === "paused" and lastPauseTime != null)', () => {
      const session = createMockSession({
        startTime: 1000,
        endTime: null,
        status: 'paused',
        lastPauseTime: 5000,
        pausedDuration: 1000,
      });
      // At now = 8000, pause delta is (8000 - 5000) = 3000. Total paused = 4000.
      // Elapsed = 8000 - 1000 - 4000 = 3000. Exactly frozen at lastPauseTime!
      expect(calculateElapsedTimeMs(session, 8000)).toBe(3000);
    });

    it('guards against clock drift / negative raw elapsed', () => {
      const session = createMockSession({ startTime: 5000, endTime: 1000, status: 'completed' });
      expect(calculateElapsedTimeMs(session)).toBe(0);
    });
  });

  describe('calculateGrossWpm', () => {
    it('returns 0 when elapsed time is 0 or negative', () => {
      expect(calculateGrossWpm(25, 0)).toBe(0);
      expect(calculateGrossWpm(25, -100)).toBe(0);
    });

    it('returns 0 when totalCharacters is 0 or negative', () => {
      expect(calculateGrossWpm(0, 15000)).toBe(0);
      expect(calculateGrossWpm(-5, 15000)).toBe(0);
    });

    it('calculates standard Gross WPM', () => {
      // 25 chars in 15s (0.25 min) -> 20.0
      expect(calculateGrossWpm(25, 15000)).toBe(20.0);
      // 50 chars in 30s (0.5 min) -> 20.0
      expect(calculateGrossWpm(50, 30000)).toBe(20.0);
      // 4 chars in 6s (0.1 min) -> 8.0
      expect(calculateGrossWpm(4, 6000)).toBe(8.0);
    });
  });

  describe('calculateNetWpm', () => {
    it('returns 0 when elapsed time is 0 or negative', () => {
      expect(calculateNetWpm(20, 0, 0)).toBe(0);
      expect(calculateNetWpm(20, 0, -500)).toBe(0);
    });

    it('returns Gross WPM when uncorrected errors is 0', () => {
      expect(calculateNetWpm(20.0, 0, 15000)).toBe(20.0);
      expect(calculateNetWpm(8.0, 0, 6000)).toBe(8.0);
    });

    it('deducts uncorrected errors penalty', () => {
      // 50 gross, 2 errors in 60s (1.0 min) -> 50 - 2 = 48.0
      expect(calculateNetWpm(50.0, 2, 60000)).toBe(48.0);
    });

    it('floors Net WPM at 0 when penalty exceeds Gross WPM', () => {
      // Gross 8.0, 1 error in 6s (0.1 min) -> Penalty 10.0 -> Raw -2.0 -> Floored 0.0
      expect(calculateNetWpm(8.0, 1, 6000)).toBe(0.0);
      // Gross 20.0, 18 errors in 12s (0.2 min) -> Penalty 90.0 -> Raw -70.0 -> Floored 0.0
      expect(calculateNetWpm(20.0, 18, 12000)).toBe(0.0);
    });
  });

  describe('calculateAccuracy', () => {
    it('defaults to 100.0% when total characters is 0 or negative', () => {
      expect(calculateAccuracy(0, 0)).toBe(100.0);
      expect(calculateAccuracy(0, -1)).toBe(100.0);
    });

    it('calculates accurate percentages', () => {
      expect(calculateAccuracy(25, 25)).toBe(100.0);
      expect(calculateAccuracy(3, 4)).toBe(75.0);
      expect(calculateAccuracy(2, 20)).toBe(10.0);
    });

    it('clamps values between 0.0% and 100.0%', () => {
      expect(calculateAccuracy(-2, 10)).toBe(0.0);
      expect(calculateAccuracy(15, 10)).toBe(100.0);
    });
  });

  describe('Per-Key Error Aggregation', () => {
    it('immutably records miss against expected grapheme', () => {
      const initial = {};
      const updated1 = recordKeyError(initial, 'a');
      expect(updated1).toEqual({ a: 1 });
      expect(initial).toEqual({}); // immutability verified

      const updated2 = recordKeyError(updated1, 'a');
      expect(updated2).toEqual({ a: 2 });

      const updated3 = recordKeyError(updated2, 'b');
      expect(updated3).toEqual({ a: 2, b: 1 });
    });

    it('works with Unicode and Arabic graphemes', () => {
      const map = recordKeyError({}, 'ك');
      expect(map).toEqual({ ك: 1 });
      const map2 = recordKeyError(map, 'ë');
      expect(map2).toEqual({ ك: 1, ë: 1 });
    });

    it('sums total errors correctly via getTotalErrors', () => {
      expect(getTotalErrors({})).toBe(0);
      expect(getTotalErrors({ a: 2, b: 3, c: 1 })).toBe(6);
    });
  });

  describe('Documented Test Vectors V1–V6 Verification', () => {
    it('Vector V1: Perfect Typing (ASCII)', () => {
      // 25 chars typed, 25 correct, 0 errors, elapsed time = 15,000 ms (0.25 min), 0 pauses
      const session = createMockSession({
        startTime: 0,
        endTime: 15000,
        pausedDuration: 0,
        totalKeystrokes: 25,
        errors: {},
        uncorrectedErrors: 0,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(20.0);
      expect(metrics.netWpm).toBe(20.0);
      expect(metrics.accuracy).toBe(100.0);
      expect(metrics.uncorrectedErrors).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.elapsedTimeMs).toBe(15000);
    });

    it('Vector V2: Corrected Error (Backspace used)', () => {
      // Target: "cat". Typed: 'c' (ok), 'x' (err), [backspace], 'a' (ok), 't' (ok).
      // Total typed: 4 chars. Correct typed: 3. Uncorrected errors: 0. Elapsed = 6,000 ms (0.1 min)
      const session = createMockSession({
        startTime: 0,
        endTime: 6000,
        pausedDuration: 0,
        totalKeystrokes: 4,
        errors: { a: 1 }, // Missed 'a' when 'x' was typed
        uncorrectedErrors: 0,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(8.0);
      expect(metrics.netWpm).toBe(8.0);
      expect(metrics.accuracy).toBe(75.0);
      expect(metrics.uncorrectedErrors).toBe(0);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.perKeyErrors).toEqual({ a: 1 });
      expect(metrics.elapsedTimeMs).toBe(6000);
    });

    it('Vector V3: Uncorrected Error at End', () => {
      // Target: "test". Typed: 't' (ok), 'e' (ok), 's' (ok), 'x' (err).
      // Total typed: 4 chars. Correct: 3. Uncorrected errors: 1. Elapsed = 6,000 ms (0.1 min)
      const session = createMockSession({
        startTime: 0,
        endTime: 6000,
        pausedDuration: 0,
        totalKeystrokes: 4,
        errors: { t: 1 }, // Missed final 't' when 'x' was typed
        uncorrectedErrors: 1,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(8.0);
      expect(metrics.netWpm).toBe(0.0); // Floored from -2.0
      expect(metrics.accuracy).toBe(75.0);
      expect(metrics.uncorrectedErrors).toBe(1);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.perKeyErrors).toEqual({ t: 1 });
      expect(metrics.elapsedTimeMs).toBe(6000);
    });

    it('Vector V4: Typing with Pause', () => {
      // 50 chars typed, all correct, total clock time = 40s, paused time = 10s, net elapsed = 30s (0.5 min)
      const session = createMockSession({
        startTime: 0,
        endTime: 40000,
        pausedDuration: 10000,
        totalKeystrokes: 50,
        errors: {},
        uncorrectedErrors: 0,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(20.0);
      expect(metrics.netWpm).toBe(20.0);
      expect(metrics.accuracy).toBe(100.0);
      expect(metrics.uncorrectedErrors).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.elapsedTimeMs).toBe(30000);
    });

    it('Vector V5: Extreme Error Rate', () => {
      // 20 chars typed, 2 correct, 18 uncorrected errors, elapsed = 12s (0.2 min)
      // Gross WPM = (20/5)/0.2 = 20. Penalty = 18/0.2 = 90. Floored Net = 0.
      const session = createMockSession({
        startTime: 0,
        endTime: 12000,
        pausedDuration: 0,
        totalKeystrokes: 20,
        errors: { a: 18 },
        uncorrectedErrors: 18,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(20.0);
      expect(metrics.netWpm).toBe(0.0);
      expect(metrics.accuracy).toBe(10.0);
      expect(metrics.uncorrectedErrors).toBe(18);
      expect(metrics.errorCount).toBe(18);
      expect(metrics.elapsedTimeMs).toBe(12000);
    });

    it('Vector V6: Unstarted Session', () => {
      // 0 chars typed, elapsed = 0 ms -> Gross WPM: 0.0, Net WPM: 0.0, Accuracy: 100.0%, Uncorrected Errors: 0
      const session = createMockSession({
        startTime: null,
        endTime: null,
        status: 'idle',
        pausedDuration: 0,
        totalKeystrokes: 0,
        errors: {},
        uncorrectedErrors: 0,
      });

      const metrics = calculateMetrics(session);
      expect(metrics.grossWpm).toBe(0.0);
      expect(metrics.netWpm).toBe(0.0);
      expect(metrics.accuracy).toBe(100.0);
      expect(metrics.uncorrectedErrors).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.elapsedTimeMs).toBe(0);
    });
  });
});
