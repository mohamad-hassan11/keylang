/**
 * src/engine/typing-engine.ts
 *
 * KeyLingo Pure Typing Engine State Machine.
 * Pure TypeScript — Zero React/DOM dependencies.
 * Strictly immutable: All operations return frozen TypingSession instances.
 */

import {
  CharacterState,
  SessionStatus,
  TypingEngineInterface,
  TypingMetrics,
  TypingOptions,
  TypingSession,
} from '@/lib/types';
import { normalizeNFC, segmentGraphemes, compareGraphemes } from './text-processing';
import { calculateMetrics } from './metrics';

export const DEFAULT_OPTIONS: TypingOptions = Object.freeze({
  diacriticMatching: 'strict',
  layoutId: 'qwerty-us',
  language: 'en',
});

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initializes a new immutable typing session from target text.
 */
export function init(target: string, options?: TypingOptions): TypingSession {
  const safeTarget = typeof target === 'string' ? target : '';
  const normalizedTarget = normalizeNFC(safeTarget);
  const safeOptions: TypingOptions = options
    ? Object.freeze({ ...options })
    : DEFAULT_OPTIONS;

  const graphemes = segmentGraphemes(normalizedTarget, safeOptions.language);
  const length = graphemes.length;

  return Object.freeze({
    id: generateSessionId(),
    target: normalizedTarget,
    graphemes: Object.freeze([...graphemes]),
    currentIndex: 0,
    characterStates: Object.freeze(new Array(length).fill('pending')),
    status: 'idle',
    startTime: null,
    pausedDuration: 0,
    lastPauseTime: null,
    endTime: null,
    errors: Object.freeze({}),
    uncorrectedErrors: 0,
    totalKeystrokes: 0,
    options: safeOptions,
    previouslyIncorrect: Object.freeze(new Array(length).fill(false)),
  });
}

/**
 * Processes a single input character keystroke.
 * Accepts an optional deterministic `now` timestamp for testing.
 */
export function inputCharacter(
  session: TypingSession,
  char: string,
  now: number = Date.now()
): TypingSession {
  // Reject input if completed or paused
  if (session.status === 'completed' || session.status === 'paused') {
    return session;
  }

  // Reject input if cursor is already out of bounds
  if (session.currentIndex >= session.graphemes.length) {
    return session;
  }

  // Reject empty character input
  if (!char || char.length === 0) {
    return session;
  }

  // Start timer on first keystroke
  const isFirstKeystroke = session.status === 'idle';
  const startTime = isFirstKeystroke ? now : session.startTime;

  const targetGrapheme = session.graphemes[session.currentIndex];
  const diacriticMode = session.options?.diacriticMatching ?? 'strict';
  const isMatch = compareGraphemes(targetGrapheme, char, diacriticMode);

  const nextCharacterStates = [...session.characterStates];
  const nextPreviouslyIncorrect = session.previouslyIncorrect
    ? [...session.previouslyIncorrect]
    : new Array(session.graphemes.length).fill(false);
  const nextErrors = { ...session.errors };
  let nextUncorrectedErrors = session.uncorrectedErrors;

  if (isMatch) {
    if (nextPreviouslyIncorrect[session.currentIndex]) {
      nextCharacterStates[session.currentIndex] = 'corrected';
    } else {
      nextCharacterStates[session.currentIndex] = 'correct';
    }
  } else {
    nextCharacterStates[session.currentIndex] = 'incorrect';
    nextPreviouslyIncorrect[session.currentIndex] = true;
    nextUncorrectedErrors += 1;
    nextErrors[targetGrapheme] = (nextErrors[targetGrapheme] ?? 0) + 1;
  }

  const nextIndex = session.currentIndex + 1;
  const isCompleted = nextIndex === session.graphemes.length;
  const nextStatus: SessionStatus = isCompleted ? 'completed' : 'active';
  const endTime = isCompleted ? now : session.endTime;
  const nextTotalKeystrokes = session.totalKeystrokes + 1;

  return Object.freeze({
    ...session,
    currentIndex: nextIndex,
    characterStates: Object.freeze(nextCharacterStates),
    status: nextStatus,
    startTime,
    endTime,
    errors: Object.freeze(nextErrors),
    uncorrectedErrors: nextUncorrectedErrors,
    totalKeystrokes: nextTotalKeystrokes,
    previouslyIncorrect: Object.freeze(nextPreviouslyIncorrect),
  });
}

/**
 * Deletes the previous character and moves cursor backward.
 */
export function deleteCharacter(session: TypingSession): TypingSession {
  // Backspace is a no-op if session is completed, paused, idle, or cursor is at index 0
  if (
    session.status === 'completed' ||
    session.status === 'paused' ||
    session.status === 'idle' ||
    session.currentIndex === 0
  ) {
    return session;
  }

  const targetIndex = session.currentIndex - 1;
  const prevState = session.characterStates[targetIndex];
  const nextCharacterStates = [...session.characterStates];
  nextCharacterStates[targetIndex] = 'pending';

  let nextUncorrectedErrors = session.uncorrectedErrors;
  if (prevState === 'incorrect') {
    nextUncorrectedErrors = Math.max(0, session.uncorrectedErrors - 1);
  }

  return Object.freeze({
    ...session,
    currentIndex: targetIndex,
    characterStates: Object.freeze(nextCharacterStates),
    uncorrectedErrors: nextUncorrectedErrors,
  });
}

/**
 * Pauses an active typing session.
 */
export function pause(
  session: TypingSession,
  now: number = Date.now()
): TypingSession {
  if (session.status !== 'active') {
    return session;
  }

  return Object.freeze({
    ...session,
    status: 'paused',
    lastPauseTime: now,
  });
}

/**
 * Resumes a paused typing session and accumulates paused duration.
 */
export function resume(
  session: TypingSession,
  now: number = Date.now()
): TypingSession {
  if (session.status !== 'paused') {
    return session;
  }

  const addedPause =
    session.lastPauseTime !== null
      ? Math.max(0, now - session.lastPauseTime)
      : 0;

  return Object.freeze({
    ...session,
    status: 'active',
    pausedDuration: session.pausedDuration + addedPause,
    lastPauseTime: null,
  });
}

/**
 * Forces session completion and finalizes timing.
 */
export function complete(
  session: TypingSession,
  now: number = Date.now()
): TypingSession {
  if (session.status === 'completed') {
    return session;
  }

  let nextPausedDuration = session.pausedDuration;
  if (session.status === 'paused' && session.lastPauseTime !== null) {
    nextPausedDuration += Math.max(0, now - session.lastPauseTime);
  }

  return Object.freeze({
    ...session,
    status: 'completed',
    pausedDuration: nextPausedDuration,
    lastPauseTime: null,
    endTime: session.endTime ?? now,
  });
}

/**
 * Resets a typing session back to idle using the original target and options.
 */
export function restart(session: TypingSession): TypingSession {
  return init(session.target, session.options);
}

/**
 * Computes live or final typing metrics.
 */
export function getMetrics(
  session: TypingSession,
  now: number = Date.now()
): TypingMetrics {
  return calculateMetrics(session, now);
}

/**
 * Accesses read-only character states array.
 */
export function getCharacterStates(
  session: TypingSession
): readonly CharacterState[] {
  return session.characterStates;
}

/**
 * Accesses current cursor position index.
 */
export function getCurrentPosition(session: TypingSession): number {
  return session.currentIndex;
}

/**
 * TypingEngine singleton implementation of TypingEngineInterface.
 */
export const typingEngine: TypingEngineInterface = {
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
};

export const TypingEngine = typingEngine;
export default typingEngine;
