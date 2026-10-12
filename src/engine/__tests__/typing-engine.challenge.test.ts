/**
 * src/engine/__tests__/typing-engine.challenge.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGE TEST SUITE
 * Milestone 2: Typing Engine, Unicode Pipeline, Metrics & Immutability Under Extreme Conditions.
 *
 * Challenger: Challenger M2-1 (teamwork_preview_challenger)
 */

import { describe, expect, it } from 'vitest';
import {
  init,
  inputCharacter,
  deleteCharacter,
  pause,
  resume,
  complete,
  restart,
  getMetrics,
  getCharacterStates,
  getCurrentPosition,
  typingEngine,
} from '../typing-engine';
import {
  normalizeNFC,
  segmentGraphemes,
  stripArabicDiacritics,
  compareGraphemes,
} from '../text-processing';
import {
  calculateAccuracy,
  calculateElapsedTimeMs,
  calculateGrossWpm,
  calculateMetrics,
  calculateNetWpm,
} from '../metrics';
import { TypingOptions, TypingSession } from '@/lib/types';

describe('Challenger M2-1: Adversarial Typing Engine & Unicode Stress Suite', () => {
  const defaultEnOptions: TypingOptions = {
    diacriticMatching: 'strict',
    layoutId: 'qwerty-us',
    language: 'en',
  };

  const dutchStrictOptions: TypingOptions = {
    diacriticMatching: 'strict',
    layoutId: 'us-international',
    language: 'nl',
  };

  const arabicStrictOptions: TypingOptions = {
    diacriticMatching: 'strict',
    layoutId: 'arabic-101',
    language: 'ar',
  };

  const arabicLenientOptions: TypingOptions = {
    diacriticMatching: 'lenient',
    layoutId: 'arabic-101',
    language: 'ar',
  };

  // ==========================================================================
  // 1. Deep Immutability & Modification Attack Vectors
  // ==========================================================================
  describe('1. Immutability & Object Freeze Defense', () => {
    it('1.1: prevents direct mutation of root session properties', () => {
      const session = init('KeyLingo', defaultEnOptions);

      expect(Object.isFrozen(session)).toBe(true);
      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.currentIndex = 5;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.status = 'completed';
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.startTime = 9999;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.pausedDuration = 500;
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.uncorrectedErrors = 10;
      }).toThrow(TypeError);
    });

    it('1.2: prevents mutation of graphemes and characterStates arrays', () => {
      const session = init('KeyLingo', defaultEnOptions);

      expect(Object.isFrozen(session.graphemes)).toBe(true);
      expect(Object.isFrozen(session.characterStates)).toBe(true);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.graphemes[0] = 'X';
      }).toThrow(TypeError);

      expect(() => {
        (session.graphemes as unknown as string[]).push('!');
      }).toThrow(TypeError);

      expect(() => {
        // @ts-expect-error - testing runtime mutation rejection
        session.characterStates[0] = 'correct';
      }).toThrow(TypeError);

      expect(() => {
        (session.characterStates as unknown as string[]).pop();
      }).toThrow(TypeError);
    });

    it('1.3: prevents mutation of errors map and previouslyIncorrect array', () => {
      const session = init('Test', defaultEnOptions);

      expect(Object.isFrozen(session.errors)).toBe(true);
      if (session.previouslyIncorrect) {
        expect(Object.isFrozen(session.previouslyIncorrect)).toBe(true);
        expect(() => {
          (session.previouslyIncorrect as unknown as boolean[])[0] = true;
        }).toThrow(TypeError);
      }

      expect(() => {
        (session.errors as unknown as Record<string, number>)['T'] = 5;
      }).toThrow(TypeError);
    });

    it('1.4: ensures state transitions return new instances without mutating prior state', () => {
      const s0 = init('cat', defaultEnOptions);
      const s1 = inputCharacter(s0, 'c', 1000);
      const s2 = inputCharacter(s1, 'x', 2000); // error
      const s3 = deleteCharacter(s2); // backspace
      const s4 = inputCharacter(s3, 'a', 3000); // corrected

      expect(s0).not.toBe(s1);
      expect(s1).not.toBe(s2);
      expect(s2).not.toBe(s3);
      expect(s3).not.toBe(s4);

      // Verify s0 remains pristine
      expect(s0.currentIndex).toBe(0);
      expect(s0.status).toBe('idle');
      expect(s0.characterStates[0]).toBe('pending');
      expect(s0.totalKeystrokes).toBe(0);

      // Verify s1 remains unaffected by s2 error
      expect(s1.currentIndex).toBe(1);
      expect(s1.characterStates[0]).toBe('correct');
      expect(s1.characterStates[1]).toBe('pending');
      expect(s1.uncorrectedErrors).toBe(0);

      // Verify s2 recorded error
      expect(s2.characterStates[1]).toBe('incorrect');
      expect(s2.uncorrectedErrors).toBe(1);

      // Verify s3 reverted to pending but recorded errors persist
      expect(s3.characterStates[1]).toBe('pending');
      expect(s3.uncorrectedErrors).toBe(0);
      expect(s3.errors['a']).toBe(1);

      // Verify s4 became 'corrected'
      expect(s4.characterStates[1]).toBe('corrected');
      expect(s4.uncorrectedErrors).toBe(0);

      // Verify each intermediate state is frozen
      [s0, s1, s2, s3, s4].forEach((s) => {
        expect(Object.isFrozen(s)).toBe(true);
        expect(Object.isFrozen(s.characterStates)).toBe(true);
        expect(Object.isFrozen(s.errors)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // 2. Unicode Orthography, Decomposition & Diacritic Stress Testing
  // ==========================================================================
  describe('2. Unicode Pipeline, Tashkeel & Decomposed Dead-Keys', () => {
    it('2.1: Dutch NFD dead-key input matches NFC target in strict mode', () => {
      // Decomposed ë ('e' + \u0308) vs precomposed 'ë' (\u00EB)
      const decomposedE = 'e\u0308';
      expect(decomposedE.length).toBe(2);

      const target = 'geëerd';
      const session = init(target, dutchStrictOptions);

      expect(session.graphemes).toEqual(['g', 'e', 'ë', 'e', 'r', 'd']);

      let state = inputCharacter(session, 'g', 100);
      state = inputCharacter(state, 'e', 200);
      // Pass decomposed input for the 3rd character
      state = inputCharacter(state, decomposedE, 300);

      expect(state.characterStates[2]).toBe('correct');
      expect(state.uncorrectedErrors).toBe(0);
    });

    it('2.2: Dutch accents are strictly required even in lenient mode (no Latin diacritic stripping)', () => {
      const target = 'beëindigen';
      // Even if diacriticMatching is set to lenient, Latin diacritics must NOT be stripped
      const session = init(target, {
        ...dutchStrictOptions,
        diacriticMatching: 'lenient',
      });

      let state = inputCharacter(session, 'b', 100);
      state = inputCharacter(state, 'e', 200);
      // Typing unaccented 'e' for target 'ë' must fail
      state = inputCharacter(state, 'e', 300);

      expect(state.characterStates[2]).toBe('incorrect');
      expect(state.uncorrectedErrors).toBe(1);
      expect(state.errors['ë']).toBe(1);
    });

    it('2.3: Arabic vocalized word with multiple combining marks per base letter', () => {
      // Ba + Shaddah (\u0651) + Kasra (\u0650) = بِّ
      const baShaddahKasra = '\u0628\u0651\u0650';
      const clusters = segmentGraphemes(baShaddahKasra, 'ar');
      expect(clusters.length).toBe(1);
      // Canonical NFC normalization sorts combining marks by Canonical Combining Class (Kasra 32 before Shaddah 33)
      expect(clusters[0]).toBe(normalizeNFC(baShaddahKasra));

      // Test canonical reordering tolerance in strict mode:
      // Inputting Kasra before Shaddah vs Shaddah before Kasra should match in strict mode
      expect(compareGraphemes('\u0628\u0651\u0650', '\u0628\u0650\u0651', 'strict')).toBe(true);

      const targetWord = `رَبِّ`; // Ra + Ba with Shaddah & Kasra
      const sessionStrict = init(targetWord, arabicStrictOptions);

      expect(sessionStrict.graphemes.length).toBe(2); // ['رَ', 'بِّ']

      // In strict mode, typing base letter without tashkeel fails
      let sStrict = inputCharacter(sessionStrict, 'ر', 100);
      expect(sStrict.characterStates[0]).toBe('incorrect');

      // In lenient mode, typing base letter without tashkeel succeeds
      const sessionLenient = init(targetWord, arabicLenientOptions);
      let sLenient = inputCharacter(sessionLenient, 'ر', 100); // Typed plain Ra
      expect(sLenient.characterStates[0]).toBe('correct');
      sLenient = inputCharacter(sLenient, 'ب', 200); // Typed plain Ba
      expect(sLenient.characterStates[1]).toBe('correct');
      expect(sLenient.status).toBe('completed');
      expect(sLenient.uncorrectedErrors).toBe(0);
    });

    it('2.4: Arabic lenient mode accepts different valid tashkeel variants', () => {
      // Target has Fatha: كَتَبَ
      const target = 'كَتَبَ';
      const sessionLenient = init(target, arabicLenientOptions);

      // User types Damma: كُ
      let s = inputCharacter(sessionLenient, 'كُ', 100);
      expect(s.characterStates[0]).toBe('correct');

      // User types plain Ta without vowel: ت
      s = inputCharacter(s, 'ت', 200);
      expect(s.characterStates[1]).toBe('correct');

      // User types wrong consonant: م
      s = inputCharacter(s, 'م', 300);
      expect(s.characterStates[2]).toBe('incorrect');
    });

    it('2.5: Arabic Tanwin, Dagger Alif, and Sukun handling', () => {
      // هٰذَا (superscript alif \u0670) + كِتَابٌ (dammatan \u064C)
      // Grapheme clusters: هٰ (1), ذَ (2), ا (3), ' ' (4), كِ (5), تَ (6), ا (7), بٌ (8) = 8 clusters
      const target = 'هٰذَا كِتَابٌ';
      const session = init(target, arabicLenientOptions);

      expect(session.graphemes.length).toBe(8);

      // Typing plain 'ه' matches 'هٰ' in lenient mode
      const s1 = inputCharacter(session, 'ه', 100);
      expect(s1.characterStates[0]).toBe('correct');
    });

    it('2.6: Mixed LTR and RTL bidirectional strings', () => {
      const bidiTarget = 'KeyLingo لغة 2026!';
      const session = init(bidiTarget, defaultEnOptions);

      const graphemes = session.graphemes;
      // Ensure all clusters are segmented in logical order
      expect(graphemes.join('')).toBe(bidiTarget);

      // Type every character correctly
      let state = session;
      for (let i = 0; i < graphemes.length; i++) {
        state = inputCharacter(state, graphemes[i], 1000 + i * 50);
      }

      expect(state.status).toBe('completed');
      expect(state.characterStates.every((st) => st === 'correct')).toBe(true);
      expect(state.uncorrectedErrors).toBe(0);
    });

    it('2.7: Complex emoji sequences (ZWJ family, flag sequences, skin tone modifiers)', () => {
      // 1. ZWJ Family: 👨‍👩‍👧‍👦 (Man + ZWJ + Woman + ZWJ + Girl + ZWJ + Boy)
      // 2. Flag: 🇳🇱 (Regional Indicator N + L)
      // 3. Modifier: 👍🏽 (Thumbs up + medium skin tone)
      const target = '🇳🇱 👨‍👩‍👧‍👦 👍🏽';
      const session = init(target, defaultEnOptions);

      expect(session.graphemes).toEqual(['🇳🇱', ' ', '👨‍👩‍👧‍👦', ' ', '👍🏽']);
      expect(session.graphemes.length).toBe(5);

      let state = session;
      for (const cluster of session.graphemes) {
        state = inputCharacter(state, cluster);
      }

      expect(state.status).toBe('completed');
      expect(state.characterStates).toEqual([
        'correct',
        'correct',
        'correct',
        'correct',
        'correct',
      ]);
    });

    it('2.8: Pathological combining sequences and isolated diacritics', () => {
      // Base 'a' with 5 combining marks: a + grave + acute + tilde + diaeresis + ring
      const superCombining = 'a\u0300\u0301\u0303\u0308\u030A';
      const clusters = segmentGraphemes(superCombining);
      expect(clusters.length).toBe(1);

      const session = init(superCombining, defaultEnOptions);
      expect(session.graphemes.length).toBe(1);

      // Inputting matching cluster succeeds
      const state = inputCharacter(session, superCombining);
      expect(state.characterStates[0]).toBe('correct');
      expect(state.status).toBe('completed');
    });
  });

  // ==========================================================================
  // 3. Extreme Time, Pause & Clock Anomaly Edge Cases
  // ==========================================================================
  describe('3. Extreme Time, Pauses & Clock Drift Edge Cases', () => {
    it('3.1: multiple consecutive pause calls do NOT overwrite initial lastPauseTime', () => {
      let session = init('Hello', defaultEnOptions);
      session = inputCharacter(session, 'H', 1000); // active at t=1000
      expect(session.status).toBe('active');

      const paused1 = pause(session, 3000); // paused at t=3000
      expect(paused1.status).toBe('paused');
      expect(paused1.lastPauseTime).toBe(3000);

      // Consecutive pause calls while already paused
      const paused2 = pause(paused1, 5000);
      expect(paused2).toBe(paused1); // must return identical session instance
      expect(paused2.lastPauseTime).toBe(3000); // lastPauseTime remains untouched

      // Resume at t=7000: pause delta is (7000 - 3000) = 4000ms
      const resumed = resume(paused2, 7000);
      expect(resumed.status).toBe('active');
      expect(resumed.pausedDuration).toBe(4000);

      // At t=8000: active elapsed = (8000 - 1000) - 4000 = 3000ms
      expect(calculateElapsedTimeMs(resumed, 8000)).toBe(3000);
    });

    it('3.2: multiple consecutive resume calls are idempotent no-ops', () => {
      let session = init('Hello', defaultEnOptions);
      session = inputCharacter(session, 'H', 1000);
      session = pause(session, 2000);
      const resumed1 = resume(session, 4000);
      expect(resumed1.status).toBe('active');

      const resumed2 = resume(resumed1, 6000);
      expect(resumed2).toBe(resumed1);
      expect(resumed2.pausedDuration).toBe(2000);
    });

    it('3.3: multiple alternating pause and resume cycles accumulate exactly', () => {
      // Start: t=10,000
      let session = init('KeyLingo', defaultEnOptions);
      session = inputCharacter(session, 'K', 10000);

      // Cycle 1: Pause at t=12,000, Resume at t=15,000 (3,000ms pause)
      session = pause(session, 12000);
      session = resume(session, 15000);
      expect(session.pausedDuration).toBe(3000);

      // Cycle 2: Pause at t=18,000, Resume at t=23,000 (5,000ms pause)
      session = pause(session, 18000);
      session = resume(session, 23000);
      expect(session.pausedDuration).toBe(8000);

      // Cycle 3: Pause at t=25,000, Resume at t=27,000 (2,000ms pause)
      session = pause(session, 25000);
      session = resume(session, 27000);
      expect(session.pausedDuration).toBe(10000);

      // Active check at t=30,000:
      // Total wall clock: 30,000 - 10,000 = 20,000ms.
      // Total paused: 10,000ms.
      // Net active elapsed: 10,000ms.
      const elapsed = calculateElapsedTimeMs(session, 30000);
      expect(elapsed).toBe(10000);
    });

    it('3.4: completing a session while in paused state freezes active time at pause point', () => {
      let session = init('Test', defaultEnOptions);
      session = inputCharacter(session, 'T', 1000); // start at t=1000
      session = pause(session, 3000); // paused at t=3000 (active time was 2000ms)

      // Complete session 1 hour later (t=3,603,000) while still paused
      const completedSession = complete(session, 3603000);

      expect(completedSession.status).toBe('completed');
      expect(completedSession.lastPauseTime).toBeNull();
      // Paused duration must include the ongoing pause (3603000 - 3000 = 3600000)
      expect(completedSession.pausedDuration).toBe(3600000);

      // Elapsed active time must remain strictly 2,000ms
      const metrics = getMetrics(completedSession, 3603000);
      expect(metrics.elapsedTimeMs).toBe(2000);
    });

    it('3.5: zero elapsed time (keystrokes within same ms) yields 0 WPM without NaN or Infinity', () => {
      let session = init('Fast', defaultEnOptions);
      const t0 = 5000;
      session = inputCharacter(session, 'F', t0);
      session = inputCharacter(session, 'a', t0);
      session = inputCharacter(session, 's', t0);
      session = inputCharacter(session, 't', t0);

      expect(session.status).toBe('completed');
      expect(session.startTime).toBe(t0);
      expect(session.endTime).toBe(t0);

      const metrics = getMetrics(session, t0);
      expect(metrics.elapsedTimeMs).toBe(0);
      expect(metrics.grossWpm).toBe(0);
      expect(metrics.netWpm).toBe(0);
      expect(metrics.accuracy).toBe(100.0);
      expect(Number.isFinite(metrics.grossWpm)).toBe(true);
      expect(Number.isFinite(metrics.netWpm)).toBe(true);
    });

    it('3.6: negative time delta (system clock stepped backward) is safely clamped to 0', () => {
      let session = init('Clock', defaultEnOptions);
      session = inputCharacter(session, 'C', 10000); // started at t=10000

      // Now query metrics with now = 5000 (clock stepped back by 5s)
      const metrics = getMetrics(session, 5000);
      expect(metrics.elapsedTimeMs).toBe(0);
      expect(metrics.grossWpm).toBe(0);
      expect(metrics.netWpm).toBe(0);

      // Now pause and resume with clock backwards
      session = pause(session, 12000);
      const resumed = resume(session, 8000); // clock jumped back
      expect(resumed.pausedDuration).toBe(0); // clamped to Math.max(0, ...)
    });

    it('3.7: completing an idle session does not crash and yields valid metrics', () => {
      const session = init('Idle', defaultEnOptions);
      const completed = complete(session, 5000);

      expect(completed.status).toBe('completed');
      const metrics = getMetrics(completed, 5000);
      expect(metrics.elapsedTimeMs).toBe(0);
      expect(metrics.grossWpm).toBe(0);
      expect(metrics.netWpm).toBe(0);
      expect(metrics.accuracy).toBe(100.0);
    });
  });

  // ==========================================================================
  // 4. High-Volume Rapid Typing Stress Testing (1,000 Keystrokes)
  // ==========================================================================
  describe('4. High-Volume Simulated Keystroke Stress (1,000 Keystrokes)', () => {
    it('4.1: simulates 1,000 rapid sequential keystrokes on long multilingual text', () => {
      // Construct a 1,000-character target containing English, Dutch, and Arabic words
      const phrase = 'KeyLingo coördinatie لغة عربي ';
      const repeatCount = Math.ceil(1000 / phrase.length);
      const fullTarget = phrase.repeat(repeatCount).slice(0, 1000);

      const session = init(fullTarget, defaultEnOptions);
      const targetGraphemes = session.graphemes;
      const count = targetGraphemes.length;
      expect(count).toBeGreaterThanOrEqual(950);

      const startTime = 100000;
      let state = session;

      const benchmarkStart = performance.now();

      // Tight loop: type all characters with simulated 50ms interval (20 keystrokes/sec)
      for (let i = 0; i < count; i++) {
        const timestamp = startTime + i * 50;
        state = inputCharacter(state, targetGraphemes[i], timestamp);
      }

      const benchmarkDurationMs = performance.now() - benchmarkStart;

      // Ensure execution is extremely fast (under 150ms for 1,000 functional state transitions)
      expect(benchmarkDurationMs).toBeLessThan(150);

      expect(state.status).toBe('completed');
      expect(state.currentIndex).toBe(count);
      expect(state.totalKeystrokes).toBe(count);
      expect(state.uncorrectedErrors).toBe(0);
      expect(state.characterStates.every((s) => s === 'correct')).toBe(true);

      const metrics = getMetrics(state);
      expect(metrics.accuracy).toBe(100.0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.grossWpm).toBeGreaterThan(0);
      expect(metrics.netWpm).toBe(metrics.grossWpm);
    });

    it('4.2: rapid error-correction churn (500 error-backspace cycles = 1,000 operations)', () => {
      const target = 'KeyLingo';
      let state = init(target, defaultEnOptions);

      const benchmarkStart = performance.now();

      // In a tight loop, type a wrong character, then press backspace 500 times
      for (let i = 0; i < 500; i++) {
        state = inputCharacter(state, 'z', 1000 + i * 20); // error
        expect(state.currentIndex).toBe(1);
        expect(state.uncorrectedErrors).toBe(1);

        state = deleteCharacter(state); // backspace
        expect(state.currentIndex).toBe(0);
        expect(state.uncorrectedErrors).toBe(0);
      }

      const benchmarkDurationMs = performance.now() - benchmarkStart;
      expect(benchmarkDurationMs).toBeLessThan(150);

      // Now complete the word 'KeyLingo' correctly
      const graphemes = ['K', 'e', 'y', 'L', 'i', 'n', 'g', 'o'];
      for (let i = 0; i < graphemes.length; i++) {
        state = inputCharacter(state, graphemes[i], 20000 + i * 100);
      }

      expect(state.status).toBe('completed');
      expect(state.currentIndex).toBe(8);
      // Total keystrokes: 500 wrong inputs + 8 correct inputs = 508 keystrokes
      expect(state.totalKeystrokes).toBe(508);
      // Cumulative errors recorded against 'K': 500
      expect(state.errors['K']).toBe(500);
      expect(state.uncorrectedErrors).toBe(0);

      // Character states: 'K' was previously incorrect so it must be 'corrected'
      expect(state.characterStates[0]).toBe('corrected');
      for (let i = 1; i < 8; i++) {
        expect(state.characterStates[i]).toBe('correct');
      }

      // Accuracy formula: (508 - 500) / 508 * 100 = 8 / 508 * 100 ≈ 1.57%
      const metrics = getMetrics(state);
      expect(metrics.accuracy).toBeCloseTo((8 / 508) * 100, 2);
      expect(metrics.errorCount).toBe(500);
      expect(metrics.uncorrectedErrors).toBe(0);
    });

    it('4.3: backspace boundary hammering (1,000 consecutive backspaces at index 0)', () => {
      let state = init('Word', defaultEnOptions);

      for (let i = 0; i < 1000; i++) {
        state = deleteCharacter(state);
      }

      expect(state.currentIndex).toBe(0);
      expect(state.uncorrectedErrors).toBe(0);
      expect(state.totalKeystrokes).toBe(0);
      expect(state.characterStates).toEqual(['pending', 'pending', 'pending', 'pending']);
    });

    it('4.4: post-completion hammering (1,000 keystrokes after session completion)', () => {
      let state = init('A', defaultEnOptions);
      state = inputCharacter(state, 'A', 1000);
      expect(state.status).toBe('completed');
      expect(state.totalKeystrokes).toBe(1);

      const completedSnapshot = state;

      // Hammer with 1,000 input attempts
      for (let i = 0; i < 1000; i++) {
        state = inputCharacter(state, 'B', 2000 + i);
      }

      expect(state).toBe(completedSnapshot);
      expect(state.totalKeystrokes).toBe(1);
      expect(state.currentIndex).toBe(1);
    });
  });

  // ==========================================================================
  // 5. Character State Lifecycle & Backspace Reversal Precision
  // ==========================================================================
  describe('5. Character State Lifecycle & Backspace Reversal Precision', () => {
    it('5.1: complex state sequence: pending -> correct -> backspace -> incorrect -> backspace -> corrected', () => {
      const session = init('abc', defaultEnOptions);

      // 1. Correct
      let s = inputCharacter(session, 'a');
      expect(s.characterStates[0]).toBe('correct');
      expect(s.currentIndex).toBe(1);

      // 2. Backspace
      s = deleteCharacter(s);
      expect(s.characterStates[0]).toBe('pending');
      expect(s.currentIndex).toBe(0);

      // 3. Incorrect
      s = inputCharacter(s, 'z');
      expect(s.characterStates[0]).toBe('incorrect');
      expect(s.currentIndex).toBe(1);
      expect(s.uncorrectedErrors).toBe(1);

      // 4. Backspace
      s = deleteCharacter(s);
      expect(s.characterStates[0]).toBe('pending');
      expect(s.currentIndex).toBe(0);
      expect(s.uncorrectedErrors).toBe(0);

      // 5. Corrected
      s = inputCharacter(s, 'a');
      expect(s.characterStates[0]).toBe('corrected');
      expect(s.currentIndex).toBe(1);
      expect(s.uncorrectedErrors).toBe(0);
    });

    it('5.2: restarting a finished session returns pure initial state with identical options', () => {
      let session = init('restart-test', dutchStrictOptions);
      session = inputCharacter(session, 'x', 1000); // error
      session = complete(session, 2000);

      const restarted = restart(session);

      expect(restarted.status).toBe('idle');
      expect(restarted.currentIndex).toBe(0);
      expect(restarted.totalKeystrokes).toBe(0);
      expect(restarted.uncorrectedErrors).toBe(0);
      expect(restarted.errors).toEqual({});
      expect(restarted.startTime).toBeNull();
      expect(restarted.endTime).toBeNull();
      expect(restarted.characterStates.every((st) => st === 'pending')).toBe(true);
      expect(restarted.options).toEqual(dutchStrictOptions);
    });

    it('5.3: singleton typingEngine object adheres to TypingEngineInterface contract', () => {
      expect(typeof typingEngine.init).toBe('function');
      expect(typeof typingEngine.inputCharacter).toBe('function');
      expect(typeof typingEngine.deleteCharacter).toBe('function');
      expect(typeof typingEngine.pause).toBe('function');
      expect(typeof typingEngine.resume).toBe('function');
      expect(typeof typingEngine.complete).toBe('function');
      expect(typeof typingEngine.restart).toBe('function');
      expect(typeof typingEngine.getMetrics).toBe('function');
      expect(typeof typingEngine.getCharacterStates).toBe('function');
      expect(typeof typingEngine.getCurrentPosition).toBe('function');

      const s = typingEngine.init('test');
      expect(typingEngine.getCurrentPosition(s)).toBe(0);
      expect(typingEngine.getCharacterStates(s)).toEqual(['pending', 'pending', 'pending', 'pending']);
    });
  });

  // ==========================================================================
  // 6. Pathological Inputs, Concurrency & Locale Resilience
  // ==========================================================================
  describe('6. Pathological Inputs, Concurrency & Locale Resilience', () => {
    it('6.1: zero-length target behaves safely across all operations', () => {
      let emptySession = init('', defaultEnOptions);

      expect(emptySession.graphemes).toEqual([]);
      expect(emptySession.characterStates).toEqual([]);
      expect(emptySession.status).toBe('idle');

      // Attempt input
      const afterInput = inputCharacter(emptySession, 'a');
      expect(afterInput).toBe(emptySession); // no-op

      // Attempt delete
      const afterDelete = deleteCharacter(emptySession);
      expect(afterDelete).toBe(emptySession);

      // Attempt pause/resume
      expect(pause(emptySession)).toBe(emptySession);
      expect(resume(emptySession)).toBe(emptySession);

      // Metrics
      const metrics = getMetrics(emptySession);
      expect(metrics.grossWpm).toBe(0);
      expect(metrics.netWpm).toBe(0);
      expect(metrics.accuracy).toBe(100.0);
    });

    it('6.2: empty string input to inputCharacter is an explicit no-op', () => {
      const session = init('Hello', defaultEnOptions);
      const res = inputCharacter(session, '');
      expect(res).toBe(session);
      expect(res.currentIndex).toBe(0);
      expect(res.totalKeystrokes).toBe(0);
    });

    it('6.3: CRLF line break segmented as single atomic cluster', () => {
      const crlfSession = init('A\r\nB', defaultEnOptions);
      expect(crlfSession.graphemes).toEqual(['A', '\r\n', 'B']);

      let s = inputCharacter(crlfSession, 'A');
      expect(s.characterStates[0]).toBe('correct');

      // Inputting matching atomic CRLF
      s = inputCharacter(s, '\r\n');
      expect(s.characterStates[1]).toBe('correct');

      s = inputCharacter(s, 'B');
      expect(s.characterStates[2]).toBe('correct');
      expect(s.status).toBe('completed');
    });

    it('6.4: concurrent interleaved sessions execute with zero cross-talk', () => {
      // Simulate two completely separate typing sessions stepped concurrently
      let sessionA = init('Alpha', defaultEnOptions);
      let sessionB = init('Beta', dutchStrictOptions);

      // Interleave steps
      sessionA = inputCharacter(sessionA, 'A', 1000);
      sessionB = inputCharacter(sessionB, 'B', 1000);

      sessionA = inputCharacter(sessionA, 'l', 1100);
      sessionB = inputCharacter(sessionB, 'x', 1100); // error in session B only

      expect(sessionA.uncorrectedErrors).toBe(0);
      expect(sessionA.errors).toEqual({});
      expect(sessionB.uncorrectedErrors).toBe(1);
      expect(sessionB.errors['e']).toBe(1);

      sessionA = pause(sessionA, 1200);
      expect(sessionA.status).toBe('paused');
      expect(sessionB.status).toBe('active'); // session B must not be paused!

      sessionB = inputCharacter(sessionB, 't', 1300);
      expect(sessionB.currentIndex).toBe(3);

      sessionA = resume(sessionA, 1400);
      expect(sessionA.status).toBe('active');
    });

    it('6.5: segmentGraphemes handles undefined/invalid locales gracefully without throwing', () => {
      expect(() => segmentGraphemes('test', undefined)).not.toThrow();
      expect(() => segmentGraphemes('test', 'und')).not.toThrow();
      expect(segmentGraphemes('abc', undefined)).toEqual(['a', 'b', 'c']);
    });

    it('6.6: stripArabicDiacritics strictly preserves all non-Arabic diacritics', () => {
      // German umlauts, French accents, Spanish tildes, Vietnamese tones
      const nonArabic = 'äöü éèê ñ ệ';
      expect(stripArabicDiacritics(nonArabic)).toBe(nonArabic);

      // Only tashkeel string returns empty
      const onlyTashkeel = '\u064E\u064F\u0650\u0651\u0652\u064B\u064C\u064D\u0670';
      expect(stripArabicDiacritics(onlyTashkeel)).toBe('');
    });
  });

  // ==========================================================================
  // 7. Extreme Metrics & Calculation Boundary Stress
  // ==========================================================================
  describe('7. Metrics Boundary & Clamping Precision', () => {
    it('7.1: Net WPM is strictly floored at 0 when uncorrected error penalty exceeds Gross WPM', () => {
      // 5 characters typed in 1 minute = Gross WPM = 1.0.
      // But 5 uncorrected errors = Penalty = 5.0.
      // Net WPM = 1.0 - 5.0 = -4.0 -> Must be floored at 0.0.
      const net = calculateNetWpm(1.0, 5, 60000);
      expect(net).toBe(0.0);
    });

    it('7.2: accuracy clamps strictly to 0.0% even when errorCount equals or exceeds totalKeystrokes', () => {
      expect(calculateAccuracy(0, 100)).toBe(0.0);
      // Even if negative correct characters hypothetically passed
      expect(calculateAccuracy(-10, 100)).toBe(0.0);
    });

    it('7.3: accuracy clamps strictly to 100.0% max', () => {
      expect(calculateAccuracy(150, 100)).toBe(100.0);
    });
  });
});
