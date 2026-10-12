'use client';

import React, { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { useTypingSession } from '@/hooks/useTypingSession';
import { getLocaleStrings } from '@/lib/locale';
import { getLessonById, qwertyUsLessons, allLessonsByLayout } from '@/content/lessons';
import { getNextLessonId, type LessonEvaluationResult } from '@/generators/guided-curriculum';
import { TypingInput } from '@/components/typing/TypingInput';
import { TypingDisplay } from '@/components/typing/TypingDisplay';
import { MetricsBar } from '@/components/typing/MetricsBar';
import { ResultsCard } from '@/components/typing/ResultsCard';
import { VirtualKeyboard } from '@/components/keyboard/VirtualKeyboard';
import { ArrowLeft, RotateCcw, Play, Pause, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { LanguageCode, TypingMetrics } from '@/lib/types';

export default function LessonPracticePage() {
  const params = useParams();
  const rawId = (params?.lessonId as string) || '1';

  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const { recordLessonAttempt } = useProgress();

  const lesson = useMemo(() => {
    return getLessonById(rawId) ?? qwertyUsLessons[0];
  }, [rawId]);

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<LessonEvaluationResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentExercise = lesson.exercises[activeExerciseIndex] ?? lesson.exercises[0];
  const totalExercises = lesson.exercises.length;

  const language: LanguageCode = lesson.layoutId === 'arabic-101' ? 'ar' : 'en';

  const handleSessionComplete = (finalMetrics: TypingMetrics) => {
    // If there are more exercises in the lesson, advance or evaluate on final
    if (activeExerciseIndex < totalExercises - 1) {
      setActiveExerciseIndex((prev) => prev + 1);
    } else {
      // Completed all exercises for this lesson
      const evalRes = recordLessonAttempt(
        lesson.id,
        finalMetrics,
        lesson.completionCriteria,
        lesson.layoutId,
        language
      );
      setEvaluationResult(evalRes);
    }
  };

  const {
    session,
    metrics,
    handleInputChar,
    handleDeleteChar,
    pauseSession,
    resumeSession,
    restartSession,
  } = useTypingSession(
    currentExercise.content,
    {
      layoutId: lesson.layoutId,
      language,
      diacriticMatching: language === 'ar' ? 'lenient' : 'strict',
    },
    handleSessionComplete
  );

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const currentTargetChar = session.graphemes[session.currentIndex] ?? undefined;

  // Next lesson navigation
  const curriculumLessons = allLessonsByLayout[lesson.layoutId] ?? qwertyUsLessons;
  const nextLessonId = getNextLessonId(lesson.id, curriculumLessons);

  const handleRestartFullLesson = () => {
    setActiveExerciseIndex(0);
    setEvaluationResult(null);
    restartSession();
    focusInput();
  };

  const isFinalCompleted = session.status === 'completed' && activeExerciseIndex === totalExercises - 1;

  const reqAcc =
    lesson.completionCriteria.minAccuracy <= 1
      ? Math.round(lesson.completionCriteria.minAccuracy * 100)
      : lesson.completionCriteria.minAccuracy;
  const reqWpm = lesson.completionCriteria.minWpm;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/guided"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          <span>Back to Guided Lessons</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Exercise {activeExerciseIndex + 1} of {totalExercises} ({currentExercise.type})
          </Badge>
          <Badge variant="accent">Lesson {lesson.order}</Badge>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center space-y-1">
        <CardTitle className="text-2xl">Lesson {lesson.order} Practice Session</CardTitle>
        <p className="text-muted-foreground">
          Home Row Focus: Target keys{' '}
          <span className="font-mono font-bold text-foreground">
            {lesson.newKeys.length > 0 ? lesson.newKeys.join(' ') : 'mastery'}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Requirement: {reqAcc}% Accuracy • {reqWpm} Net WPM
        </p>
      </div>

      {/* Live Metrics HUD */}
      <MetricsBar
        grossWpm={metrics.grossWpm}
        netWpm={metrics.netWpm}
        accuracy={metrics.accuracy}
        elapsedTimeMs={metrics.elapsedTimeMs}
        status={session.status}
        uncorrectedErrors={metrics.uncorrectedErrors}
      />

      {/* Practice View Container */}
      {isFinalCompleted && evaluationResult ? (
        <ResultsCard
          metrics={metrics}
          title={evaluationResult.passed ? 'Lesson Passed!' : 'Lesson Requirement Unmet'}
          description={
            evaluationResult.passed
              ? `Congratulations! You fulfilled the criteria (${reqAcc}% acc, ${reqWpm} WPM).`
              : `You achieved ${metrics.accuracy.toFixed(1)}% acc (${reqAcc}% required) and ${metrics.netWpm} WPM (${reqWpm} required).`
          }
          onRestart={handleRestartFullLesson}
          onNext={
            evaluationResult.passed && nextLessonId
              ? () => {
                  if (typeof window !== 'undefined') {
                    window.location.href = `/guided/${nextLessonId}`;
                  }
                }
              : undefined
          }
        />
      ) : (
        <Card variant="bordered" padding="lg" className="space-y-6">
          {/* Typing Display with Click-to-Focus */}
          <div className="relative cursor-text" onClick={focusInput}>
            <TypingDisplay
              targetGraphemes={session.graphemes}
              characterStates={session.characterStates}
              currentIndex={session.currentIndex}
              direction={language === 'ar' ? 'rtl' : 'ltr'}
              onContainerClick={focusInput}
            />
            <TypingInput
              ref={inputRef}
              onInputChar={handleInputChar}
              onDeleteChar={handleDeleteChar}
              isPaused={session.status === 'paused'}
              direction={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Action Controls */}
          <div className="flex justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                restartSession();
                focusInput();
              }}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{strings.actionRestart}</span>
            </Button>

            {session.status === 'active' ? (
              <Button variant="outline" onClick={pauseSession}>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </Button>
            ) : session.status === 'paused' ? (
              <Button
                variant="primary"
                onClick={() => {
                  resumeSession();
                  focusInput();
                }}
              >
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </Button>
            ) : (
              <Button variant="primary" onClick={focusInput}>
                <Play className="h-4 w-4" />
                <span>{strings.actionStart}</span>
              </Button>
            )}

            {session.status === 'completed' && activeExerciseIndex < totalExercises - 1 && (
              <Button
                variant="primary"
                onClick={() => {
                  setActiveExerciseIndex((prev) => prev + 1);
                  focusInput();
                }}
              >
                <span>Next Exercise</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Virtual Keyboard (Hardware strictly LTR) */}
          <div className="pt-4 border-t border-border" dir="ltr">
            <VirtualKeyboard
              layoutId={lesson.layoutId}
              targetChar={currentTargetChar}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
