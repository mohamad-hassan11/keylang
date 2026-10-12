'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  DEFAULT_PROGRESS,
  DEFAULT_STATS,
  STORAGE_KEYS,
} from '@/lib/constants';
import type {
  CompletionCriteria,
  LanguageCode,
  Lesson,
  LessonProgress,
  LessonScore,
  SessionHistoryItem,
  TypingMetrics,
  UserProgress,
  UserStats,
} from '@/lib/types';
import { persistenceService } from '@/services/persistence';
import {
  evaluateLessonCompletion,
  isLessonUnlocked as checkLessonUnlocked,
  type LessonEvaluationResult,
} from '@/generators/guided-curriculum';

class ProgressStore {
  private currentProgress: UserProgress = DEFAULT_PROGRESS;
  private currentStats: UserStats = DEFAULT_STATS;
  private readonly listeners: Set<() => void> = new Set();
  private isClientInitialized = false;

  private initClient(): void {
    if (this.isClientInitialized || typeof window === 'undefined') return;
    this.isClientInitialized = true;

    const storedProgress = persistenceService.load<UserProgress>(STORAGE_KEYS.PROGRESS);
    if (storedProgress) {
      this.currentProgress = {
        ...DEFAULT_PROGRESS,
        ...storedProgress,
        lessons: storedProgress.lessons || {},
        completedLessons: storedProgress.completedLessons || [],
        sessionHistory: storedProgress.sessionHistory || [],
      };
    }

    const storedStats = persistenceService.load<UserStats>(STORAGE_KEYS.STATS);
    if (storedStats) {
      this.currentStats = {
        ...DEFAULT_STATS,
        ...storedStats,
        perKeyErrors: storedStats.perKeyErrors || {},
      };
    }

    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.PROGRESS) {
        const updated = persistenceService.load<UserProgress>(STORAGE_KEYS.PROGRESS);
        if (updated) {
          this.currentProgress = { ...DEFAULT_PROGRESS, ...updated };
          this.notify();
        }
      } else if (e.key === STORAGE_KEYS.STATS) {
        const updated = persistenceService.load<UserStats>(STORAGE_KEYS.STATS);
        if (updated) {
          this.currentStats = { ...DEFAULT_STATS, ...updated };
          this.notify();
        }
      }
    });
  }

  public getProgressSnapshot = (): UserProgress => {
    this.initClient();
    return this.currentProgress;
  };

  public getStatsSnapshot = (): UserStats => {
    this.initClient();
    return this.currentStats;
  };

  public getServerProgressSnapshot = (): UserProgress => DEFAULT_PROGRESS;
  public getServerStatsSnapshot = (): UserStats => DEFAULT_STATS;

  public subscribe = (listener: () => void): (() => void) => {
    this.initClient();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public recordLessonAttempt = (
    lessonId: string,
    metrics: TypingMetrics,
    criteria: CompletionCriteria,
    layoutId?: string,
    language?: LanguageCode
  ): LessonEvaluationResult => {
    this.initClient();
    const evaluation = evaluateLessonCompletion(criteria, metrics);
    const nowIso = new Date().toISOString();

    const prevLessonProgress = this.currentProgress.lessons[lessonId];
    const prevAttempts = prevLessonProgress?.attempts ?? 0;
    const prevScores = prevLessonProgress?.scores ?? [];

    const newScore: LessonScore = {
      wpm: metrics.netWpm,
      accuracy: metrics.accuracy,
      completedAt: nowIso,
      passed: evaluation.passed,
    };

    const isNowCompleted = (prevLessonProgress?.completed ?? false) || evaluation.passed;
    const bestAccuracy = Math.max(prevLessonProgress?.bestAccuracy ?? 0, metrics.accuracy);
    const bestWpm = Math.max(prevLessonProgress?.bestWpm ?? 0, metrics.netWpm);

    const updatedLessonProgress: LessonProgress = {
      completed: isNowCompleted,
      bestAccuracy,
      bestWpm,
      attempts: prevAttempts + 1,
      lastAttemptDate: nowIso,
      scores: [...prevScores, newScore],
    };

    const completedSet = new Set(this.currentProgress.completedLessons);
    if (evaluation.passed) {
      completedSet.add(lessonId);
    }

    const sessionItem: SessionHistoryItem = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: nowIso,
      mode: 'guided',
      language: language ?? 'en',
      grossWpm: metrics.grossWpm,
      netWpm: metrics.netWpm,
      accuracy: metrics.accuracy,
      durationMs: metrics.elapsedTimeMs,
    };

    const nextProgress: UserProgress = {
      ...this.currentProgress,
      completedLessons: Array.from(completedSet),
      lessons: {
        ...this.currentProgress.lessons,
        [lessonId]: updatedLessonProgress,
      },
      sessionHistory: [sessionItem, ...this.currentProgress.sessionHistory].slice(0, 500),
    };

    // Cumulative stats
    const totalSessions = this.currentStats.totalSessions + 1;
    const totalPracticeTimeMs = this.currentStats.totalPracticeTimeMs + metrics.elapsedTimeMs;
    const cumulativeGrossWpm =
      (this.currentStats.cumulativeGrossWpm * this.currentStats.totalSessions + metrics.grossWpm) /
      totalSessions;
    const cumulativeNetWpm =
      (this.currentStats.cumulativeNetWpm * this.currentStats.totalSessions + metrics.netWpm) /
      totalSessions;
    const cumulativeAccuracy =
      (this.currentStats.cumulativeAccuracy * this.currentStats.totalSessions + metrics.accuracy) /
      totalSessions;

    const mergedErrors: Record<string, number> = { ...this.currentStats.perKeyErrors };
    for (const [key, count] of Object.entries(metrics.perKeyErrors)) {
      mergedErrors[key] = (mergedErrors[key] ?? 0) + count;
    }

    const today = nowIso.slice(0, 10);
    let streakDays = this.currentStats.streakDays;
    const lastDate = this.currentStats.lastPracticeDate?.slice(0, 10);
    if (!lastDate) {
      streakDays = 1;
    } else if (lastDate === today) {
      // already practiced today
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streakDays = lastDate === yesterday ? streakDays + 1 : 1;
    }

    const nextStats: UserStats = {
      cumulativeGrossWpm: Number(cumulativeGrossWpm.toFixed(1)),
      cumulativeNetWpm: Number(cumulativeNetWpm.toFixed(1)),
      cumulativeAccuracy: Number(cumulativeAccuracy.toFixed(1)),
      totalSessions,
      totalPracticeTimeMs,
      perKeyErrors: mergedErrors,
      streakDays,
      lastPracticeDate: nowIso,
    };

    this.currentProgress = nextProgress;
    this.currentStats = nextStats;

    persistenceService.save(STORAGE_KEYS.PROGRESS, nextProgress);
    persistenceService.save(STORAGE_KEYS.STATS, nextStats);

    this.notify();
    return evaluation;
  };

  public reset = (): void => {
    this.currentProgress = DEFAULT_PROGRESS;
    this.currentStats = DEFAULT_STATS;
    persistenceService.save(STORAGE_KEYS.PROGRESS, DEFAULT_PROGRESS);
    persistenceService.save(STORAGE_KEYS.STATS, DEFAULT_STATS);
    this.notify();
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const progressStore = new ProgressStore();

export interface UseProgressReturn {
  readonly progress: UserProgress;
  readonly stats: UserStats;
  readonly recordLessonAttempt: (
    lessonId: string,
    metrics: TypingMetrics,
    criteria: CompletionCriteria,
    layoutId?: string,
    language?: LanguageCode
  ) => LessonEvaluationResult;
  readonly isLessonUnlocked: (lessonId: string, lessons: readonly Lesson[]) => boolean;
  readonly getLessonProgress: (lessonId: string) => LessonProgress | undefined;
  readonly resetProgress: () => void;
}

export function useProgress(): UseProgressReturn {
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getProgressSnapshot,
    progressStore.getServerProgressSnapshot
  );

  const stats = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getStatsSnapshot,
    progressStore.getServerStatsSnapshot
  );

  const recordLessonAttempt = useCallback(
    (
      lessonId: string,
      metrics: TypingMetrics,
      criteria: CompletionCriteria,
      layoutId?: string,
      language?: LanguageCode
    ) => {
      return progressStore.recordLessonAttempt(
        lessonId,
        metrics,
        criteria,
        layoutId,
        language
      );
    },
    []
  );

  const isLessonUnlocked = useCallback(
    (lessonId: string, lessons: readonly Lesson[]) => {
      return checkLessonUnlocked(lessonId, lessons, progress);
    },
    [progress]
  );

  const getLessonProgress = useCallback(
    (lessonId: string) => progress.lessons[lessonId],
    [progress]
  );

  const resetProgress = useCallback(() => {
    progressStore.reset();
  }, []);

  return {
    progress,
    stats,
    recordLessonAttempt,
    isLessonUnlocked,
    getLessonProgress,
    resetProgress,
  };
}
