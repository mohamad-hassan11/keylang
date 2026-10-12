import { describe, expect, it } from 'vitest';
import {
  evaluateLessonCompletion,
  isLessonUnlocked,
  getNextLessonId,
  getPreviousLessonId,
  validateCumulativeKeyPool,
  calculateCurriculumStats,
} from '../guided-curriculum';
import { qwertyUsLessons } from '@/content/lessons/qwerty-us';
import { arabic101Lessons } from '@/content/lessons/arabic-101';
import type { Lesson, TypingMetrics, UserProgress } from '@/lib/types';

describe('Guided Curriculum Progression Engine', () => {
  const baseMetrics: TypingMetrics = {
    grossWpm: 25,
    netWpm: 20,
    accuracy: 95,
    elapsedTimeMs: 30000,
    errorCount: 2,
    uncorrectedErrors: 1,
    perKeyErrors: { e: 2 },
  };

  describe('1. Gating Evaluation (evaluateLessonCompletion)', () => {
    it('passes when metrics meet or exceed criteria (fractional accuracy)', () => {
      const res = evaluateLessonCompletion(
        { minAccuracy: 0.9, minWpm: 15 },
        baseMetrics
      );
      expect(res.passed).toBe(true);
      expect(res.accuracyPassed).toBe(true);
      expect(res.wpmPassed).toBe(true);
      expect(res.requiredAccuracy).toBe(90);
      expect(res.requiredWpm).toBe(15);
    });

    it('passes when criteria uses percentage representation (90 instead of 0.9)', () => {
      const res = evaluateLessonCompletion(
        { minAccuracy: 90, minWpm: 15 },
        baseMetrics
      );
      expect(res.passed).toBe(true);
      expect(res.requiredAccuracy).toBe(90);
    });

    it('fails when accuracy is below minimum threshold', () => {
      const lowAccMetrics: TypingMetrics = { ...baseMetrics, accuracy: 88 };
      const res = evaluateLessonCompletion(
        { minAccuracy: 0.9, minWpm: 15 },
        lowAccMetrics
      );
      expect(res.passed).toBe(false);
      expect(res.accuracyPassed).toBe(false);
      expect(res.wpmPassed).toBe(true);
    });

    it('fails when net WPM is below minimum threshold', () => {
      const lowWpmMetrics: TypingMetrics = { ...baseMetrics, netWpm: 12 };
      const res = evaluateLessonCompletion(
        { minAccuracy: 0.9, minWpm: 15 },
        lowWpmMetrics
      );
      expect(res.passed).toBe(false);
      expect(res.accuracyPassed).toBe(true);
      expect(res.wpmPassed).toBe(false);
    });

    it('penalizes net WPM when gross WPM is high but uncorrected errors are high', () => {
      // Net WPM = 10, below min 15
      const penalizedMetrics: TypingMetrics = {
        ...baseMetrics,
        grossWpm: 40,
        netWpm: 10,
        accuracy: 92,
      };
      const res = evaluateLessonCompletion(
        { minAccuracy: 0.9, minWpm: 15 },
        penalizedMetrics
      );
      expect(res.passed).toBe(false);
      expect(res.wpmPassed).toBe(false);
    });
  });

  describe('2. Lesson Unlocking Logic (isLessonUnlocked)', () => {
    const emptyProgress: UserProgress = {
      completedLessons: [],
      lessons: {},
      sessionHistory: [],
    };

    it('always unlocks the first lesson (order 1)', () => {
      expect(isLessonUnlocked('qwerty-1', qwertyUsLessons, emptyProgress)).toBe(true);
      expect(isLessonUnlocked('arabic-1', arabic101Lessons, emptyProgress)).toBe(true);
    });

    it('locks second lesson when first lesson is not completed', () => {
      expect(isLessonUnlocked('qwerty-2', qwertyUsLessons, emptyProgress)).toBe(false);
    });

    it('unlocks second lesson when first lesson is completed in progress', () => {
      const progressWithL1: UserProgress = {
        ...emptyProgress,
        completedLessons: ['qwerty-1'],
        lessons: {
          'qwerty-1': {
            completed: true,
            bestAccuracy: 95,
            bestWpm: 22,
            attempts: 1,
            lastAttemptDate: new Date().toISOString(),
            scores: [],
          },
        },
      };

      expect(isLessonUnlocked('qwerty-2', qwertyUsLessons, progressWithL1)).toBe(true);
      // Third lesson remains locked
      expect(isLessonUnlocked('qwerty-3', qwertyUsLessons, progressWithL1)).toBe(false);
    });

    it('keeps completed lesson unlocked even if retried with failing score', () => {
      const progress: UserProgress = {
        ...emptyProgress,
        completedLessons: ['qwerty-1', 'qwerty-2'],
      };

      expect(isLessonUnlocked('qwerty-2', qwertyUsLessons, progress)).toBe(true);
      expect(isLessonUnlocked('qwerty-3', qwertyUsLessons, progress)).toBe(true);
    });
  });

  describe('3. Lesson Navigation Helpers', () => {
    it('returns next lesson ID correctly', () => {
      expect(getNextLessonId('qwerty-1', qwertyUsLessons)).toBe('qwerty-2');
      expect(getNextLessonId('qwerty-14', qwertyUsLessons)).toBeNull();
    });

    it('returns previous lesson ID correctly', () => {
      expect(getPreviousLessonId('qwerty-2', qwertyUsLessons)).toBe('qwerty-1');
      expect(getPreviousLessonId('qwerty-1', qwertyUsLessons)).toBeNull();
    });
  });

  describe('4. Cumulative Key Pool Validation', () => {
    it('verifies that all 14 QWERTY lessons strictly satisfy cumulative key pools', () => {
      qwertyUsLessons.forEach((lesson) => {
        const result = validateCumulativeKeyPool(lesson);
        expect(result.valid, `Lesson ${lesson.id} contains invalid chars: ${result.invalidChars.join(', ')}`).toBe(true);
        expect(result.invalidChars).toEqual([]);
      });
    });

    it('verifies that all 14 Arabic lessons strictly satisfy cumulative key pools', () => {
      arabic101Lessons.forEach((lesson) => {
        const result = validateCumulativeKeyPool(lesson);
        expect(result.valid, `Lesson ${lesson.id} contains invalid chars: ${result.invalidChars.join(', ')}`).toBe(true);
        expect(result.invalidChars).toEqual([]);
      });
    });

    it('detects untaught characters in a lesson', () => {
      const corruptedLesson: Lesson = {
        ...qwertyUsLessons[0],
        exercises: [{ type: 'words', content: 'fdjk z' }], // 'z' is not taught in lesson 1
      };
      const result = validateCumulativeKeyPool(corruptedLesson);
      expect(result.valid).toBe(false);
      expect(result.invalidChars).toContain('z');
    });
  });

  describe('5. Curriculum Statistics Calculation', () => {
    it('calculates zeroed stats for empty progress', () => {
      const stats = calculateCurriculumStats(qwertyUsLessons, {
        completedLessons: [],
        lessons: {},
        sessionHistory: [],
      });
      expect(stats.totalLessons).toBe(14);
      expect(stats.completedLessonsCount).toBe(0);
      expect(stats.progressPercentage).toBe(0);
      expect(stats.averageAccuracy).toBe(0);
      expect(stats.averageNetWpm).toBe(0);
    });

    it('calculates running averages and percentage for partially completed curriculum', () => {
      const progress: UserProgress = {
        completedLessons: ['qwerty-1', 'qwerty-2'],
        lessons: {
          'qwerty-1': {
            completed: true,
            bestAccuracy: 90,
            bestWpm: 20,
            attempts: 1,
            lastAttemptDate: new Date().toISOString(),
            scores: [],
          },
          'qwerty-2': {
            completed: true,
            bestAccuracy: 100,
            bestWpm: 30,
            attempts: 2,
            lastAttemptDate: new Date().toISOString(),
            scores: [],
          },
        },
        sessionHistory: [],
      };

      const stats = calculateCurriculumStats(qwertyUsLessons, progress);
      expect(stats.totalLessons).toBe(14);
      expect(stats.completedLessonsCount).toBe(2);
      expect(stats.progressPercentage).toBe(14); // 2/14 * 100 = 14%
      expect(stats.averageAccuracy).toBe(95); // (90 + 100) / 2
      expect(stats.averageNetWpm).toBe(25); // (20 + 30) / 2
    });
  });
});
