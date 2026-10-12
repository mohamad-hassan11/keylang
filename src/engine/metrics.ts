/**
 * src/engine/metrics.ts
 *
 * Pure typing speed, accuracy, and error tracking engine for KeyLingo.
 * UI-independent, zero DOM/React dependencies.
 */

import { PerKeyErrorMap, TypingMetrics, TypingSession } from '@/lib/types';

/**
 * Computes active elapsed time in milliseconds, subtracting pause durations
 * and handling ongoing paused state cleanly.
 *
 * @param session Current typing session
 * @param now Current epoch timestamp (defaults to Date.now())
 */
export function calculateElapsedTimeMs(
  session: TypingSession,
  now: number = Date.now()
): number {
  if (session.startTime === null) {
    return 0;
  }

  const currentTimestamp = session.endTime ?? now;
  let totalPaused = session.pausedDuration;

  // If the session is currently paused, freeze active time at pause start
  if (session.status === 'paused' && session.lastPauseTime !== null) {
    totalPaused += Math.max(0, currentTimestamp - session.lastPauseTime);
  }

  const rawElapsed = currentTimestamp - session.startTime - totalPaused;
  return Math.max(0, rawElapsed);
}

/**
 * Calculates Gross Words Per Minute (Gross WPM).
 * 1 standard word = 5 characters typed.
 * Formula: ((totalCharacters / 5) / elapsedMinutes)
 *
 * @param totalCharacters Total keystrokes/characters entered
 * @param elapsedMs Active elapsed time in milliseconds
 */
export function calculateGrossWpm(totalCharacters: number, elapsedMs: number): number {
  const elapsedMinutes = elapsedMs / 60000;
  if (elapsedMinutes <= 0 || totalCharacters <= 0) {
    return 0;
  }
  return (totalCharacters / 5) / elapsedMinutes;
}

/**
 * Calculates Net Words Per Minute (Net WPM).
 * Formula: max(0, Gross WPM - (uncorrectedErrors / elapsedMinutes))
 *
 * @param grossWpm Gross WPM numeric value
 * @param uncorrectedErrors Count of uncorrected errors
 * @param elapsedMs Active elapsed time in milliseconds
 */
export function calculateNetWpm(
  grossWpm: number,
  uncorrectedErrors: number,
  elapsedMs: number
): number {
  const elapsedMinutes = elapsedMs / 60000;
  if (elapsedMinutes <= 0) {
    return 0;
  }
  const penalty = uncorrectedErrors / elapsedMinutes;
  return Math.max(0, grossWpm - penalty);
}

/**
 * Calculates typing accuracy percentage (0.0% to 100.0%).
 * Defaults to 100.0% if no characters have been typed yet.
 *
 * @param correctCharacters Total correct keystrokes
 * @param totalCharacters Total keystrokes typed
 */
export function calculateAccuracy(
  correctCharacters: number,
  totalCharacters: number
): number {
  if (totalCharacters <= 0) {
    return 100.0;
  }
  const rawAccuracy = (correctCharacters / totalCharacters) * 100;
  return Math.max(0, Math.min(100.0, rawAccuracy));
}

/**
 * Sums all recorded key errors in a PerKeyErrorMap.
 */
export function getTotalErrors(errors: PerKeyErrorMap): number {
  return Object.values(errors).reduce((sum, count) => sum + count, 0);
}

/**
 * Immutably updates the per-key error map by recording a mistake against
 * the expected target grapheme.
 *
 * @param currentErrors Existing error map
 * @param expectedGrapheme Target grapheme that was missed
 */
export function recordKeyError(
  currentErrors: PerKeyErrorMap,
  expectedGrapheme: string
): PerKeyErrorMap {
  const count = currentErrors[expectedGrapheme] ?? 0;
  return {
    ...currentErrors,
    [expectedGrapheme]: count + 1,
  };
}

/**
 * Computes all typing metrics for a given TypingSession.
 *
 * @param session Current typing session state
 * @param now Optional override for current epoch timestamp
 */
export function calculateMetrics(
  session: TypingSession,
  now: number = Date.now()
): TypingMetrics {
  const elapsedTimeMs = calculateElapsedTimeMs(session, now);
  const errorCount = getTotalErrors(session.errors);
  const correctCharacters = Math.max(0, session.totalKeystrokes - errorCount);

  const grossWpm = calculateGrossWpm(session.totalKeystrokes, elapsedTimeMs);
  const netWpm = calculateNetWpm(grossWpm, session.uncorrectedErrors, elapsedTimeMs);
  const accuracy = calculateAccuracy(correctCharacters, session.totalKeystrokes);

  return {
    grossWpm,
    netWpm,
    accuracy,
    elapsedTimeMs,
    errorCount,
    uncorrectedErrors: session.uncorrectedErrors,
    perKeyErrors: session.errors,
  };
}
