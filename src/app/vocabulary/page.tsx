'use client';

import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { Play, RotateCcw, Pause, BookOpen, Info, Sparkles } from 'lucide-react';
import { useTypingSession } from '@/hooks/useTypingSession';
import { TypingInput } from '@/components/typing/TypingInput';
import { TypingDisplay } from '@/components/typing/TypingDisplay';
import { MetricsBar } from '@/components/typing/MetricsBar';
import { ResultsCard } from '@/components/typing/ResultsCard';
import { VirtualKeyboard } from '@/components/keyboard/VirtualKeyboard';
import { WordChip } from '@/components/vocabulary/WordChip';
import { TranslationPanel } from '@/components/vocabulary/TranslationPanel';
import { MobileRestriction } from '@/components/layout/MobileRestriction';
import { useIsMobile } from '@/hooks/useDeviceType';
import { getVocabulary } from '@/content/vocabulary';
import { offlineTranslationProvider } from '@/services/translation';
import { persistenceService } from '@/services/persistence';
import { STORAGE_KEYS, DEFAULT_STATS, DEFAULT_PROGRESS } from '@/lib/constants';
import type {
  CEFRLevel,
  ContentCategory,
  LanguageCode,
  SessionHistoryItem,
  TranslationResult,
  TypingMetrics,
  UserProgress,
  UserStats,
} from '@/lib/types';

export default function VocabularyPage() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <MobileRestriction />;
  }
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

  // Filter configurations
  const [practiceLang, setPracticeLang] = useState<LanguageCode>(
    preferences.practiceLanguage || 'en'
  );
  const [transLang, setTransLang] = useState<LanguageCode>(
    preferences.translationLanguage || 'nl'
  );
  const [cefr, setCefr] = useState<CEFRLevel>(preferences.cefrLevel || 'A1');
  const [category, setCategory] = useState<ContentCategory>(
    preferences.contentCategory || 'Everyday'
  );
  const [wordCount, setWordCount] = useState<number>(10);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Translation Panel state
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupResult, setLookupResult] = useState<TranslationResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Keyboard layout based on target practice language
  const layout = useMemo(() => {
    if (practiceLang === 'ar') return 'arabic-101';
    if (practiceLang === 'nl') return 'us-international';
    return 'qwerty-us';
  }, [practiceLang]);

  // Load vocabulary entries for exercise
  const vocabEntries = useMemo(() => {
    const list = getVocabulary(practiceLang, {
      cefrLevel: cefr,
      category,
    });
    // Shuffle deterministically based on refreshKey
    const shuffled = [...list].sort((a, b) => {
      const hashA = (a.id.charCodeAt(a.id.length - 1) + refreshKey * 7) % 13;
      const hashB = (b.id.charCodeAt(b.id.length - 1) + refreshKey * 7) % 13;
      return hashA - hashB;
    });
    return shuffled.slice(0, wordCount);
  }, [practiceLang, cefr, category, wordCount, refreshKey]);

  // Join vocabulary into typing target text
  const targetText = useMemo(() => {
    if (vocabEntries.length === 0) return 'Practice vocabulary typing';
    return vocabEntries.map((e) => e.text).join(' ');
  }, [vocabEntries]);

  // Handle session completion and save history
  const handleSessionComplete = useCallback(
    (finalMetrics: TypingMetrics) => {
      const nowIso = new Date().toISOString();

      // Record session history
      const prevProgress =
        persistenceService.load<UserProgress>(STORAGE_KEYS.PROGRESS) ?? DEFAULT_PROGRESS;
      const sessionItem: SessionHistoryItem = {
        sessionId: `vocab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: nowIso,
        mode: 'vocabulary',
        language: practiceLang,
        grossWpm: finalMetrics.grossWpm,
        netWpm: finalMetrics.netWpm,
        accuracy: finalMetrics.accuracy,
        durationMs: finalMetrics.elapsedTimeMs,
      };

      persistenceService.save(STORAGE_KEYS.PROGRESS, {
        ...prevProgress,
        sessionHistory: [sessionItem, ...prevProgress.sessionHistory].slice(0, 500),
      });

      // Cumulative user stats update
      const prevStats =
        persistenceService.load<UserStats>(STORAGE_KEYS.STATS) ?? DEFAULT_STATS;
      const totalSessions = prevStats.totalSessions + 1;
      const mergedErrors: Record<string, number> = { ...prevStats.perKeyErrors };
      for (const [key, count] of Object.entries(finalMetrics.perKeyErrors)) {
        mergedErrors[key] = (mergedErrors[key] ?? 0) + count;
      }

      persistenceService.save(STORAGE_KEYS.STATS, {
        ...prevStats,
        cumulativeGrossWpm: Math.round(
          (prevStats.cumulativeGrossWpm * prevStats.totalSessions + finalMetrics.grossWpm) /
            totalSessions
        ),
        cumulativeNetWpm: Math.round(
          (prevStats.cumulativeNetWpm * prevStats.totalSessions + finalMetrics.netWpm) /
            totalSessions
        ),
        cumulativeAccuracy: Math.round(
          (prevStats.cumulativeAccuracy * prevStats.totalSessions + finalMetrics.accuracy) /
            totalSessions
        ),
        totalSessions,
        totalPracticeTimeMs: prevStats.totalPracticeTimeMs + finalMetrics.elapsedTimeMs,
        perKeyErrors: mergedErrors,
        lastPracticeDate: nowIso,
      });
    },
    [practiceLang]
  );

  const {
    session,
    metrics,
    handleInputChar,
    handleDeleteChar,
    pauseSession,
    resumeSession,
    restartSession,
  } = useTypingSession(
    targetText,
    {
      layoutId: layout,
      language: practiceLang,
      diacriticMatching: practiceLang === 'ar' ? 'lenient' : 'strict',
    },
    handleSessionComplete
  );

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Word lookup handler: pauses timer without penalty
  const handleWordLookup = async (word: string) => {
    pauseSession();
    setLookupWord(word);
    setIsLookupOpen(true);
    setIsLookupLoading(true);

    try {
      const result = await offlineTranslationProvider.translate(
        word,
        practiceLang,
        transLang
      );
      setLookupResult(result);
    } catch {
      setLookupResult(null);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const handleCloseLookup = () => {
    setIsLookupOpen(false);
    resumeSession();
    // Re-focus typing input immediately after panel closes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const currentTargetChar = session.graphemes[session.currentIndex] ?? undefined;
  const isRtl = practiceLang === 'ar';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.vocabTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.vocabSubtitle}</p>
      </div>

      {/* 6-Dimension Filters Card */}
      <Card variant="default" padding="lg">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Vocabulary Practice Dimensions</CardTitle>
            <CardDescription>
              Filter target vocabulary by language, level, and category.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Shuffle Words</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <Select
            label={strings.vocabPracticeLang}
            value={practiceLang}
            onChange={(v) => setPracticeLang(v as LanguageCode)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية' },
            ]}
          />
          <Select
            label={strings.vocabTransLang}
            value={transLang}
            onChange={(v) => setTransLang(v as LanguageCode)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية' },
            ]}
          />
          <Select
            label={strings.labelLevel}
            value={cefr}
            onChange={(v) => setCefr(v as CEFRLevel)}
            options={[
              { value: 'A1', label: 'A1 — Beginner' },
              { value: 'A2', label: 'A2 — Elementary' },
              { value: 'B1', label: 'B1 — Intermediate' },
              { value: 'B2', label: 'B2 — Upper Int.' },
            ]}
          />
          <Select
            label={strings.labelCategory}
            value={category}
            onChange={(v) => setCategory(v as ContentCategory)}
            options={[
              { value: 'Everyday', label: 'Everyday Life' },
              { value: 'Formal', label: 'Formal & Polite' },
              { value: 'Technology', label: 'Technology' },
              { value: 'Workplace', label: 'Workplace' },
            ]}
          />
          <Select
            label="Word Count"
            value={String(wordCount)}
            onChange={(v) => setWordCount(Number(v))}
            options={[
              { value: '5', label: '5 Words (Quick)' },
              { value: '10', label: '10 Words (Standard)' },
              { value: '15', label: '15 Words (Challenge)' },
              { value: '25', label: '25 Words (Marathon)' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Vocabulary Interactive Preview Chips */}
      <Card variant="bordered" padding="md" className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Curated Word Chips ({vocabEntries.length} words)
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Info className="h-3.5 w-3.5" />
            Click any word below or during typing to view translation
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {vocabEntries.map((entry) => (
            <WordChip
              key={entry.id}
              word={entry.text}
              language={practiceLang}
              onClick={handleWordLookup}
            />
          ))}
        </div>
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

      {/* Hidden Textarea Input */}
      <TypingInput
        ref={inputRef}
        disabled={session.status === 'completed'}
        isPaused={session.status === 'paused'}
        direction={isRtl ? 'rtl' : 'ltr'}
        onInputChar={handleInputChar}
        onDeleteChar={handleDeleteChar}
      />

      {/* Character Display Area */}
      {session.status === 'completed' ? (
        <ResultsCard
          metrics={metrics}
          onRestart={() => {
            restartSession();
            setTimeout(focusInput, 50);
          }}
          onNext={() => {
            setRefreshKey((k) => k + 1);
            restartSession();
            setTimeout(focusInput, 50);
          }}
        />
      ) : (
        <div className="space-y-4">
          <TypingDisplay
            targetGraphemes={session.graphemes}
            characterStates={session.characterStates}
            currentIndex={session.currentIndex}
            direction={isRtl ? 'rtl' : 'ltr'}
            onContainerClick={focusInput}
            onWordClick={(_idx, word) => handleWordLookup(word)}
            className="min-h-[160px] cursor-text"
          />

          {/* Session Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {session.status === 'active' && (
                <Button variant="outline" size="sm" onClick={pauseSession} className="flex items-center gap-1.5">
                  <Pause className="h-4 w-4" />
                  <span>Pause</span>
                </Button>
              )}
              {session.status === 'paused' && (
                <Button variant="primary" size="sm" onClick={resumeSession} className="flex items-center gap-1.5">
                  <Play className="h-4 w-4" />
                  <span>Resume</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={restartSession} className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" />
                <span>Restart</span>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Badge variant="outline" size="sm">
                Layout: {layout}
              </Badge>
              <span>Click text or press any key to focus</span>
            </div>
          </div>
        </div>
      )}

      {/* Virtual Keyboard */}
      <Card variant="bordered" padding="lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-md">Virtual Keyboard & Hand Guide</CardTitle>
          <CardDescription>
            Highlighted key shows physical placement and target character.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <VirtualKeyboard
            layoutId={layout}
            targetChar={currentTargetChar}
            showHandGuide={true}
          />
        </CardContent>
      </Card>

      {/* Translation Slide-in Panel */}
      <TranslationPanel
        isOpen={isLookupOpen}
        word={lookupWord}
        fromLanguage={practiceLang}
        toLanguage={transLang}
        translationResult={lookupResult}
        isLoading={isLookupLoading}
        onClose={handleCloseLookup}
      />
    </div>
  );
}
