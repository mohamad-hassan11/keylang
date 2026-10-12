'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  TypingEngineInterface,
  TypingMetrics,
  TypingOptions,
  TypingSession,
} from '@/lib/types';
import { typingEngine as defaultTypingEngine } from '@/engine/typing-engine';

export interface UseTypingSessionOptions extends Partial<TypingOptions> {
  readonly engine?: TypingEngineInterface;
  readonly onComplete?: (metrics: TypingMetrics) => void;
}

export interface UseTypingSessionReturn {
  readonly session: TypingSession;
  readonly metrics: TypingMetrics;
  readonly handleInputChar: (char: string) => void;
  readonly handleDeleteChar: () => void;
  readonly pauseSession: () => void;
  readonly resumeSession: () => void;
  readonly restartSession: () => void;
  readonly resetWithText: (newTarget: string, newOptions?: Partial<TypingOptions>) => void;
  // Ergonomic convenience aliases
  readonly handleInput: (char: string) => void;
  readonly handleDelete: () => void;
  readonly handlePause: () => void;
  readonly handleResume: () => void;
  readonly handleRestart: () => void;
}

export function useTypingSession(
  targetText: string,
  options?: UseTypingSessionOptions,
  onCompleteCallback?: (metrics: TypingMetrics) => void
): UseTypingSessionReturn {
  const engine = options?.engine ?? defaultTypingEngine;
  const onComplete = options?.onComplete ?? onCompleteCallback;

  const resolvedOptions: TypingOptions = useMemo(
    () => ({
      diacriticMatching: options?.diacriticMatching ?? 'strict',
      layoutId: options?.layoutId ?? 'qwerty-us',
      language: options?.language ?? 'en',
    }),
    [options?.diacriticMatching, options?.layoutId, options?.language]
  );

  const [session, setSession] = useState<TypingSession>(() =>
    engine.init(targetText, resolvedOptions)
  );

  const [metrics, setMetrics] = useState<TypingMetrics>(() => engine.getMetrics(session));

  // Reset when targetText or resolvedOptions change externally
  useEffect(() => {
    const initialSession = engine.init(targetText, resolvedOptions);
    setSession(initialSession);
    setMetrics(engine.getMetrics(initialSession));
  }, [targetText, resolvedOptions, engine]);

  // Live timer interval: ticks every 100ms during active status
  useEffect(() => {
    if (session.status !== 'active') return;

    const timerId = setInterval(() => {
      setMetrics(engine.getMetrics(session));
    }, 100);

    return () => clearInterval(timerId);
  }, [session, engine]);

  const handleInputChar = useCallback(
    (char: string) => {
      setSession((prevSession) => {
        if (prevSession.status === 'completed' || prevSession.status === 'paused') {
          return prevSession;
        }

        const nextSession = engine.inputCharacter(prevSession, char);
        const nextMetrics = engine.getMetrics(nextSession);
        setMetrics(nextMetrics);

        if (nextSession.status === 'completed') {
          onComplete?.(nextMetrics);
        }

        return nextSession;
      });
    },
    [engine, onComplete]
  );

  const handleDeleteChar = useCallback(() => {
    setSession((prevSession) => {
      if (prevSession.status === 'completed' || prevSession.status === 'paused') {
        return prevSession;
      }

      const nextSession = engine.deleteCharacter(prevSession);
      const nextMetrics = engine.getMetrics(nextSession);
      setMetrics(nextMetrics);
      return nextSession;
    });
  }, [engine]);

  const pauseSession = useCallback(() => {
    setSession((prevSession) => {
      if (prevSession.status !== 'active') {
        return prevSession;
      }

      const nextSession = engine.pause(prevSession);
      const nextMetrics = engine.getMetrics(nextSession);
      setMetrics(nextMetrics);
      return nextSession;
    });
  }, [engine]);

  const resumeSession = useCallback(() => {
    setSession((prevSession) => {
      if (prevSession.status !== 'paused') {
        return prevSession;
      }

      const nextSession = engine.resume(prevSession);
      const nextMetrics = engine.getMetrics(nextSession);
      setMetrics(nextMetrics);
      return nextSession;
    });
  }, [engine]);

  const restartSession = useCallback(() => {
    setSession((prevSession) => {
      const nextSession = engine.restart(prevSession);
      const nextMetrics = engine.getMetrics(nextSession);
      setMetrics(nextMetrics);
      return nextSession;
    });
  }, [engine]);

  const resetWithText = useCallback(
    (newTarget: string, newOptions?: Partial<TypingOptions>) => {
      const merged: TypingOptions = {
        ...resolvedOptions,
        ...newOptions,
      };
      const newSession = engine.init(newTarget, merged);
      setSession(newSession);
      setMetrics(engine.getMetrics(newSession));
    },
    [engine, resolvedOptions]
  );

  return {
    session,
    metrics,
    handleInputChar,
    handleDeleteChar,
    pauseSession,
    resumeSession,
    restartSession,
    resetWithText,
    // Aliases
    handleInput: handleInputChar,
    handleDelete: handleDeleteChar,
    handlePause: pauseSession,
    handleResume: resumeSession,
    handleRestart: restartSession,
  };
}
