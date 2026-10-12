'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { getLocaleStrings } from '@/lib/locale';
import { getLessonsByLayout } from '@/content/lessons';
import { calculateCurriculumStats } from '@/generators/guided-curriculum';
import { Lock, Play, CheckCircle2 } from 'lucide-react';

export default function GuidedPage() {
  const { preferences } = usePreferences();
  const { progress, isLessonUnlocked, getLessonProgress } = useProgress();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const [selectedLayout, setSelectedLayout] = useState('qwerty-us');

  const layoutTabs = [
    { id: 'qwerty-us', label: 'QWERTY US (English & Dutch)' },
    { id: 'arabic-101', label: 'Arabic 101 (العربية)' },
  ];

  const currentLessons = getLessonsByLayout(selectedLayout);
  const stats = calculateCurriculumStats(currentLessons, progress);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.guidedTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.guidedSubtitle}</p>
      </div>

      {/* Curriculum Progress Summary Bar */}
      <Card variant="bordered" padding="md" className="bg-card/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs uppercase font-semibold text-muted-foreground">Completed</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.completedLessonsCount} / {stats.totalLessons}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-muted-foreground">Progress</div>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {stats.progressPercentage}%
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-muted-foreground">Avg Speed</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.averageNetWpm} <span className="text-xs font-normal text-muted-foreground">WPM</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold text-muted-foreground">Avg Accuracy</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              {stats.averageAccuracy}%
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs tabs={layoutTabs} activeTab={selectedLayout} onChange={setSelectedLayout} />
        <Badge variant="accent">{currentLessons.length} Lessons Available</Badge>
      </div>

      {/* Lesson Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentLessons.map((lesson) => {
          const unlocked = isLessonUnlocked(lesson.id, currentLessons);
          const lessonProgress = getLessonProgress(lesson.id);
          const completed = lessonProgress?.completed ?? false;

          const reqAcc =
            lesson.completionCriteria.minAccuracy <= 1
              ? Math.round(lesson.completionCriteria.minAccuracy * 100)
              : lesson.completionCriteria.minAccuracy;
          const reqWpm = lesson.completionCriteria.minWpm;

          const lang = preferences.interfaceLanguage || 'en';
          const title = lesson.title[lang] ?? lesson.title.en;
          const description = lesson.description[lang] ?? lesson.description.en;

          return (
            <Card
              key={lesson.id}
              variant="default"
              padding="md"
              className={`flex flex-col justify-between transition-all ${
                completed ? 'border-success/40' : unlocked ? 'border-border' : 'opacity-70 bg-card/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={completed ? 'success' : unlocked ? 'default' : 'outline'}>
                    {completed ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {strings.statusCompleted}
                      </span>
                    ) : unlocked ? (
                      strings.statusUnlocked
                    ) : (
                      strings.statusLocked
                    )}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    Keys: {lesson.newKeys.length > 0 ? lesson.newKeys.join(' ') : 'All'}
                  </span>
                </div>

                <CardTitle className="text-base">
                  {strings.guidedLesson} {lesson.order}: {title}
                </CardTitle>
                <CardDescription className="mt-1 line-clamp-2">
                  {description}
                </CardDescription>

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {strings.guidedTargetAccuracy}: <strong className="text-foreground">{reqAcc}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {strings.guidedTargetWpm}: <strong className="text-foreground">{reqWpm} WPM</strong>
                  </span>
                  {completed && lessonProgress && (
                    <>
                      <span>•</span>
                      <span className="text-success font-medium">
                        Best: {lessonProgress.bestWpm} WPM ({lessonProgress.bestAccuracy}%)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-auto">
                {unlocked ? (
                  <Link href={`/guided/${lesson.id}`} className="block w-full">
                    <Button
                      variant={completed ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>{completed ? strings.actionRestart : strings.actionStart}</span>
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled className="w-full flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>{strings.statusLocked}</span>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
