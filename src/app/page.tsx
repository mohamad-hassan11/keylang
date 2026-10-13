'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { useVocabulary } from '@/hooks/useVocabulary';
import { getLocaleStrings } from '@/lib/locale';
import type { SessionHistoryItem } from '@/lib/types';
import {
  GraduationCap,
  Zap,
  BookOpen,
  ArrowRight,
  Bookmark,
  Target,
  Flame,
  Clock,
  Sparkles,
  History,
  TrendingUp,
  BarChart3,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const { stats, progress } = useProgress();
  const { words } = useVocabulary();

  const recentSessions = useMemo(() => {
    return (progress.sessionHistory || []).slice(0, 3);
  }, [progress.sessionHistory]);

  const modes = [
    {
      title: strings.homeGuidedTitle,
      description: strings.homeGuidedDesc,
      href: '/guided',
      icon: GraduationCap,
      badge: 'Curriculum',
      btnText: strings.actionStart,
      stats: {
        lessons: progress.completedLessons.length,
        label: 'lessons done',
      },
    },
    {
      title: strings.homeReflexTitle,
      description: strings.homeReflexDesc,
      href: '/reflex',
      icon: Zap,
      badge: 'Muscle Memory',
      btnText: strings.actionStart,
      stats: {
        sessions: progress.sessionHistory?.filter((s) => s.mode === 'reflex').length ?? 0,
        label: 'drills completed',
      },
    },
    {
      title: strings.homeVocabTitle,
      description: strings.homeVocabDesc,
      href: '/vocabulary',
      icon: BookOpen,
      badge: 'Vocabulary',
      btnText: strings.actionStart,
      stats: {
        words: words.length,
        label: 'saved words',
      },
    },
  ];

  const formatTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0 && minutes === 0) {
      return `${Math.floor(ms / 1000)}s`;
    }
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <Badge variant="accent" size="md">
          {strings.appName}
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {strings.homeHeroTitle}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {strings.homeHeroSubtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Badge variant="outline">English • QWERTY US</Badge>
          <Badge variant="outline">Nederlands • US-Intl</Badge>
          <Badge variant="outline">العربية • Arabic 101</Badge>
        </div>
      </section>

      {/* Quick Stats Banner if user has practice activity */}
      {stats.totalSessions > 0 && (
        <Card variant="bordered" padding="md" className="bg-primary/5 border-primary/20">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Speed (Net)</div>
              <div className="text-xl font-bold text-foreground mt-0.5">
                {stats.cumulativeNetWpm} WPM
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Accuracy</div>
              <div className="text-xl font-bold text-foreground mt-0.5">
                {stats.cumulativeAccuracy}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Practice Time</div>
              <div className="text-xl font-bold text-amber-500 mt-0.5 flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(stats.totalPracticeTimeMs)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Streak</div>
              <div className="text-xl font-bold text-rose-500 mt-0.5 flex items-center justify-center gap-1">
                <Flame className="h-4 w-4" />
                <span>{stats.streakDays}d</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Saved Words</div>
              <div className="text-xl font-bold text-primary mt-0.5">
                {words.length}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {recentSessions.length > 0 && (
        <Card variant="bordered" padding="lg" className="space-y-4">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <Link href="/progress" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentSessions.map((session) => (
                <div key={session.sessionId} className="py-3 flex items-center justify-between text-sm gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" size="sm" className="uppercase font-mono text-xs shrink-0">
                      {session.mode}
                    </Badge>
                    <span className="font-semibold text-foreground shrink-0">
                      {session.language.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(session.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs sm:text-sm shrink-0">
                    <span className="font-bold text-foreground">
                      {Math.round(session.netWpm)} WPM
                    </span>
                    <span
                      className={`font-semibold ${
                        session.accuracy >= 95
                          ? 'text-emerald-500'
                          : session.accuracy >= 85
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {session.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(session.durationMs / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Practice Modes Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card
              key={mode.href}
              variant="elevated"
              padding="lg"
              className="flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <Badge variant="default">{mode.badge}</Badge>
                </div>
                <CardHeader className="p-0 pb-3">
                  <CardTitle>{mode.title}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                {mode.stats && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-semibold text-foreground">
                      {mode.stats.lessons ?? mode.stats.sessions ?? mode.stats.words}
                    </span>
                    <span>{mode.stats.label}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-0 pt-6">
                <Link href={mode.href} className="w-full">
                  <Button variant="primary" className="w-full justify-between">
                    <span>{mode.btnText}</span>
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Secondary Fast Navigation */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/my-vocabulary" className="block">
          <Card
            variant="default"
            padding="md"
            className="flex items-center justify-between hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/20 text-accent-foreground">
                <Bookmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">My Vocabulary Deck</div>
                <div className="text-xs text-muted-foreground">
                  {words.length} saved word{words.length === 1 ? '' : 's'} for review
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
          </Card>
        </Link>

        <Link href="/progress" className="block">
          <Card
            variant="default"
            padding="md"
            className="flex items-center justify-between hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Detailed Progress</div>
                <div className="text-xs text-muted-foreground">
                  {progress.completedLessons.length} lessons completed • Error heatmaps
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
          </Card>
        </Link>
      </section>

      {/* Empty State CTA */}
      {stats.totalSessions === 0 && (
        <Card variant="bordered" padding="lg" className="text-center py-12 space-y-4 bg-muted/30">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Ready to start typing?</span>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose a practice mode above to begin. Your progress will be tracked automatically and saved locally.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/guided">
              <Button variant="primary" size="lg" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Guided Lessons
              </Button>
            </Link>
            <Link href="/reflex">
              <Button variant="outline" size="lg" className="gap-2">
                <Zap className="h-4 w-4" />
                Reflex Drills
              </Button>
            </Link>
            <Link href="/vocabulary">
              <Button variant="secondary" size="lg" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Vocabulary
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
