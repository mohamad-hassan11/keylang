import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgress } from '../useProgress';
import { qwertyUsLessons } from '@/content/lessons/qwerty-us';
import type { CompletionCriteria, TypingMetrics } from '@/lib/types';
import type { LessonEvaluationResult } from '@/generators/guided-curriculum';

describe('useProgress Hook Subsystem', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useProgress());
    act(() => {
      result.current.resetProgress();
    });
  });

  const passingMetrics: TypingMetrics = {
    grossWpm: 25,
    netWpm: 22,
    accuracy: 95,
    elapsedTimeMs: 20000,
    errorCount: 1,
    uncorrectedErrors: 0,
    perKeyErrors: { f: 1 },
  };

  const failingMetrics: TypingMetrics = {
    grossWpm: 12,
    netWpm: 10,
    accuracy: 80,
    elapsedTimeMs: 25000,
    errorCount: 5,
    uncorrectedErrors: 2,
    perKeyErrors: { d: 3, k: 2 },
  };

  const criteria: CompletionCriteria = {
    minAccuracy: 0.90,
    minWpm: 15,
  };

  it('initializes with default empty progress and stats', () => {
    const { result } = renderHook(() => useProgress());
    expect(result.current.progress.completedLessons).toEqual([]);
    expect(result.current.stats.totalSessions).toBe(0);
    expect(result.current.isLessonUnlocked('qwerty-1', qwertyUsLessons)).toBe(true);
    expect(result.current.isLessonUnlocked('qwerty-2', qwertyUsLessons)).toBe(false);
  });

  it('records successful lesson attempt, unlocks next lesson, and updates metrics', () => {
    const { result } = renderHook(() => useProgress());

    let evalResult: LessonEvaluationResult | undefined;
    act(() => {
      evalResult = result.current.recordLessonAttempt('qwerty-1', passingMetrics, criteria);
    });

    expect(evalResult?.passed).toBe(true);
    expect(result.current.progress.completedLessons).toContain('qwerty-1');

    const lesson1Progress = result.current.getLessonProgress('qwerty-1');
    expect(lesson1Progress?.completed).toBe(true);
    expect(lesson1Progress?.attempts).toBe(1);
    expect(lesson1Progress?.bestAccuracy).toBe(95);
    expect(lesson1Progress?.bestWpm).toBe(22);

    // Lesson 2 is now unlocked!
    expect(result.current.isLessonUnlocked('qwerty-2', qwertyUsLessons)).toBe(true);

    // Stats updated
    expect(result.current.stats.totalSessions).toBe(1);
    expect(result.current.stats.perKeyErrors.f).toBe(1);
  });

  it('records failed lesson attempt without unlocking next lesson', () => {
    const { result } = renderHook(() => useProgress());

    let evalResult: LessonEvaluationResult | undefined;
    act(() => {
      evalResult = result.current.recordLessonAttempt('qwerty-1', failingMetrics, criteria);
    });

    expect(evalResult?.passed).toBe(false);
    expect(result.current.progress.completedLessons).not.toContain('qwerty-1');

    const lesson1Progress = result.current.getLessonProgress('qwerty-1');
    expect(lesson1Progress?.completed).toBe(false);
    expect(lesson1Progress?.attempts).toBe(1);
    expect(lesson1Progress?.bestAccuracy).toBe(80);

    // Lesson 2 remains locked!
    expect(result.current.isLessonUnlocked('qwerty-2', qwertyUsLessons)).toBe(false);
  });

  it('resets progress and cumulative stats via resetProgress', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.recordLessonAttempt('qwerty-1', passingMetrics, criteria);
    });
    expect(result.current.progress.completedLessons.length).toBe(1);

    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.progress.completedLessons).toEqual([]);
    expect(result.current.stats.totalSessions).toBe(0);
  });
});
