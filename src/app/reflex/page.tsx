'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { getLocaleStrings } from '@/lib/locale';
import { Play, RotateCcw, Pause, Dices } from 'lucide-react';
import { useTypingSession } from '@/hooks/useTypingSession';
import { TypingInput } from '@/components/typing/TypingInput';
import { TypingDisplay } from '@/components/typing/TypingDisplay';
import { MetricsBar } from '@/components/typing/MetricsBar';
import { ResultsCard } from '@/components/typing/ResultsCard';
import { VirtualKeyboard } from '@/components/keyboard/VirtualKeyboard';
import { generateReflexExercise } from '@/generators/reflex-generator';
import { persistenceService } from '@/services/persistence';
import { STORAGE_KEYS, DEFAULT_STATS } from '@/lib/constants';
import type {
  LanguageCode,
  ReflexDifficulty,
  ReflexLength,
  TypingMetrics,
  UserStats,
} from '@/lib/types';

export default function ReflexPage() {
  const { preferences } = usePreferences();
  const { stats } = useProgress();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

  // Configurator state
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 900000) + 100000);
  const [difficulty, setDifficulty] = useState<ReflexDifficulty>('medium');
  const [length, setLength] = useState<ReflexLength>('medium');
  const [layout, setLayout] = useState<string>(preferences.keyboardLayout || 'qwerty-us');
  const [adaptive, setAdaptive] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync layout from preferences on initial load
  useEffect(() => {
    if (preferences.keyboardLayout) {
      setLayout(preferences.keyboardLayout);
    }
  }, [preferences.keyboardLayout]);

  // Use reactive stats from useProgress hook (cross-tab sync, real-time updates)
  const adaptiveData = adaptive ? stats.perKeyErrors : undefined;

  // Pure deterministic drill text generation
  const drillText = useMemo(() => {
    return generateReflexExercise({
      seed,
      length,
      difficulty,
      layoutId: layout,
      adaptiveData,
    });
  }, [seed, length, difficulty, layout, adaptiveData]);

  const language: LanguageCode =
    layout === 'arabic-101' ? 'ar' : layout === 'us-international' ? 'nl' : 'en';

  const handleSessionComplete = (finalMetrics: TypingMetrics) => {
    // Record error key metrics into persistent UserStats via useProgress
    const prevStats = persistenceService.load<UserStats>(STORAGE_KEYS.STATS) ?? DEFAULT_STATS;
    const updatedPerKeyErrors = { ...prevStats.perKeyErrors };
    for (const [key, count] of Object.entries(finalMetrics.perKeyErrors)) {
      updatedPerKeyErrors[key] = (updatedPerKeyErrors[key] ?? 0) + count;
    }

    const updatedStats: UserStats = {
      ...prevStats,
      cumulativeGrossWpm: Math.round(
        ((prevStats.cumulativeGrossWpm * prevStats.totalSessions) + finalMetrics.grossWpm) /
          (prevStats.totalSessions + 1)
      ),
      cumulativeNetWpm: Math.round(
        ((prevStats.cumulativeNetWpm * prevStats.totalSessions) + finalMetrics.netWpm) /
          (prevStats.totalSessions + 1)
      ),
      cumulativeAccuracy: Math.round(
        ((prevStats.cumulativeAccuracy * prevStats.totalSessions) + finalMetrics.accuracy) /
          (prevStats.totalSessions + 1)
      ),
      totalSessions: prevStats.totalSessions + 1,
      totalPracticeTimeMs: prevStats.totalPracticeTimeMs + finalMetrics.elapsedTimeMs,
      perKeyErrors: updatedPerKeyErrors,
      lastPracticeDate: new Date().toISOString(),
    };
    persistenceService.save(STORAGE_KEYS.STATS, updatedStats);
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
    drillText,
    {
      layoutId: layout,
      language,
      diacriticMatching: language === 'ar' ? 'lenient' : 'strict',
    },
    handleSessionComplete
  );

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const rollNewSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  const currentTargetChar = session.graphemes[session.currentIndex] ?? undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.reflexTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.reflexSubtitle}</p>
      </div>

      {/* Drill Configurator */}
      <Card variant="default" padding="lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">Exercise Configuration</CardTitle>
          <CardDescription>
            Configure drill difficulty, length, keyboard layout, and seed number.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={strings.reflexDifficulty}
              value={difficulty}
              onChange={(v) => setDifficulty(v as ReflexDifficulty)}
              options={[
                { value: 'easy', label: 'Easy (Home Row)' },
                { value: 'medium', label: 'Medium (Adjacent & Alternating)' },
                { value: 'hard', label: 'Hard (Numbers & Shift Challenges)' },
                { value: 'extreme', label: 'Extreme (Full Layout Symbols)' },
              ]}
            />
            <Select
              label={strings.reflexLength}
              value={length}
              onChange={(v) => setLength(v as ReflexLength)}
              options={[
                { value: 'short', label: 'Short (~50 chars)' },
                { value: 'medium', label: 'Medium (~150 chars)' },
                { value: 'long', label: 'Long (~300 chars)' },
              ]}
            />
            <Select
              label={strings.labelKeyboardLayout}
              value={layout}
              onChange={setLayout}
              options={[
                { value: 'qwerty-us', label: 'QWERTY US' },
                { value: 'us-international', label: 'US-International (Dutch)' },
                { value: 'arabic-101', label: 'Arabic 101' },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-border">
            <div className="w-48">
              <Input
                label={strings.reflexSeed}
                type="number"
                value={seed}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) setSeed(val);
                }}
              />
            </div>
            <Button variant="secondary" onClick={rollNewSeed} className="flex items-center gap-2">
              <Dices className="h-4 w-4" />
              <span>Randomize Seed</span>
            </Button>

            <label className="flex items-center gap-2 cursor-pointer pb-2 ms-auto">
              <input
                type="checkbox"
                checked={adaptive}
                onChange={(e) => setAdaptive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-foreground">
                {strings.reflexAdaptive}
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics HUD */}
      <MetricsBar
        grossWpm={metrics.grossWpm}
        netWpm={metrics.netWpm}
        accuracy={metrics.accuracy}
        elapsedTimeMs={metrics.elapsedTimeMs}
        status={session.status}
        uncorrectedErrors={metrics.uncorrectedErrors}
      />

      {/* Practice Arena or Results View */}
      {session.status === 'completed' ? (
        <ResultsCard
          metrics={metrics}
          title="Reflex Drill Complete!"
          description={`Completed ${difficulty} drill (Seed: ${seed}) with ${metrics.accuracy.toFixed(1)}% accuracy.`}
          onRestart={() => {
            restartSession();
            focusInput();
          }}
          onNext={() => {
            rollNewSeed();
            focusInput();
          }}
        />
      ) : (
        <Card variant="bordered" padding="lg" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="accent">Difficulty: {difficulty}</Badge>
              <Badge variant="outline">Layout: {layout}</Badge>
              {adaptive && <Badge variant="warning">Adaptive Mode</Badge>}
            </div>
            <span className="text-xs text-muted-foreground font-mono">Seed: {seed}</span>
          </div>

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

          {/* Interactive Controls */}
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
            <Button variant="outline" onClick={rollNewSeed}>
              <Dices className="h-4 w-4" />
              <span>New Drill</span>
            </Button>
          </div>

          {/* Virtual Keyboard (Hardware strictly LTR) */}
          <div className="pt-4 border-t border-border" dir="ltr">
            <VirtualKeyboard
              layoutId={layout}
              targetChar={currentTargetChar}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
