'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { useVocabulary } from '@/hooks/useVocabulary';
import { getLocaleStrings } from '@/lib/locale';
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
} from 'lucide-react';

export default function HomePage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const { stats, progress } = useProgress();
  const { words } = useVocabulary();

  const modes = [
    {
      title: strings.homeGuidedTitle,
      description: strings.homeGuidedDesc,
      href: '/guided',
      icon: GraduationCap,
      badge: 'Curriculum',
      btnText: strings.actionStart,
    },
    {
      title: strings.homeReflexTitle,
      description: strings.homeReflexDesc,
      href: '/reflex',
      icon: Zap,
      badge: 'Muscle Memory',
      btnText: strings.actionStart,
    },
    {
      title: strings.homeVocabTitle,
      description: strings.homeVocabDesc,
      href: '/vocabulary',
      icon: BookOpen,
      badge: 'Vocabulary',
      btnText: strings.actionStart,
    },
  ];

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Speed</div>
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
    </div>
  );
}
