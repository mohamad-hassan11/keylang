import type {
  CompletionCriteria,
  Lesson,
  TypingMetrics,
  UserProgress,
} from '@/lib/types';

export interface LessonEvaluationResult {
  readonly passed: boolean;
  readonly accuracyPassed: boolean;
  readonly wpmPassed: boolean;
  readonly requiredAccuracy: number;
  readonly requiredWpm: number;
  readonly actualAccuracy: number;
  readonly actualWpm: number;
}

/**
 * Pure function evaluating whether typing metrics fulfill lesson criteria.
 * Tolerates criteria.minAccuracy formatted as fraction (0.90) or percentage (90).
 */
export function evaluateLessonCompletion(
  criteria: CompletionCriteria,
  metrics: TypingMetrics
): LessonEvaluationResult {
  const requiredAccuracy =
    criteria.minAccuracy <= 1 ? criteria.minAccuracy * 100 : criteria.minAccuracy;
  const requiredWpm = criteria.minWpm;

  const actualAccuracy = metrics.accuracy;
  const actualWpm = metrics.netWpm;

  const accuracyPassed = actualAccuracy >= requiredAccuracy;
  const wpmPassed = actualWpm >= requiredWpm;
  const passed = accuracyPassed && wpmPassed;

  return {
    passed,
    accuracyPassed,
    wpmPassed,
    requiredAccuracy,
    requiredWpm,
    actualAccuracy,
    actualWpm,
  };
}

/**
 * Determines whether a given lesson is unlocked in user progress.
 * Lesson 1 (index 0) is always unlocked. Lesson N is unlocked if Lesson N-1 is completed.
 */
export function isLessonUnlocked(
  lessonId: string,
  lessons: readonly Lesson[],
  userProgress: UserProgress
): boolean {
  if (!lessons || lessons.length === 0) return false;

  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return false;

  if (index === 0) return true;

  if (
    userProgress.completedLessons.includes(lessonId) ||
    Boolean(userProgress.lessons[lessonId]?.completed)
  ) {
    return true;
  }

  const prevLesson = lessons[index - 1];
  return (
    userProgress.completedLessons.includes(prevLesson.id) ||
    Boolean(userProgress.lessons[prevLesson.id]?.completed)
  );
}

export function getNextLessonId(
  currentLessonId: string,
  lessons: readonly Lesson[]
): string | null {
  const index = lessons.findIndex((l) => l.id === currentLessonId);
  if (index === -1 || index >= lessons.length - 1) return null;
  return lessons[index + 1].id;
}

export function getPreviousLessonId(
  currentLessonId: string,
  lessons: readonly Lesson[]
): string | null {
  const index = lessons.findIndex((l) => l.id === currentLessonId);
  if (index <= 0) return null;
  return lessons[index - 1].id;
}

/**
 * Verifies that all characters in a lesson's exercise content belong strictly
 * to the cumulative allowed pool (newKeys + previousKeys + whitespace).
 */
export function validateCumulativeKeyPool(lesson: Lesson): {
  readonly valid: boolean;
  readonly invalidChars: readonly string[];
} {
  const allowed = new Set<string>([
    ...lesson.newKeys,
    ...lesson.previousKeys,
    ' ',
    '\n',
    '\t',
  ]);

  const invalid = new Set<string>();
  for (const exercise of lesson.exercises) {
    for (const char of exercise.content) {
      if (!allowed.has(char)) {
        invalid.add(char);
      }
    }
  }

  return {
    valid: invalid.size === 0,
    invalidChars: Array.from(invalid),
  };
}

export interface CurriculumStats {
  readonly totalLessons: number;
  readonly completedLessonsCount: number;
  readonly progressPercentage: number;
  readonly averageAccuracy: number;
  readonly averageNetWpm: number;
}

export function calculateCurriculumStats(
  lessons: readonly Lesson[],
  userProgress: UserProgress
): CurriculumStats {
  if (lessons.length === 0) {
    return {
      totalLessons: 0,
      completedLessonsCount: 0,
      progressPercentage: 0,
      averageAccuracy: 0,
      averageNetWpm: 0,
    };
  }

  const completedInCurriculum = lessons.filter(
    (l) =>
      userProgress.completedLessons.includes(l.id) ||
      Boolean(userProgress.lessons[l.id]?.completed)
  );

  let totalAcc = 0;
  let totalWpm = 0;
  let scoreCount = 0;

  for (const l of completedInCurriculum) {
    const progress = userProgress.lessons[l.id];
    if (progress && progress.bestAccuracy > 0) {
      totalAcc += progress.bestAccuracy;
      totalWpm += progress.bestWpm;
      scoreCount++;
    }
  }

  return {
    totalLessons: lessons.length,
    completedLessonsCount: completedInCurriculum.length,
    progressPercentage: Math.round(
      (completedInCurriculum.length / lessons.length) * 100
    ),
    averageAccuracy: scoreCount > 0 ? Number((totalAcc / scoreCount).toFixed(1)) : 0,
    averageNetWpm: scoreCount > 0 ? Math.round(totalWpm / scoreCount) : 0,
  };
}
