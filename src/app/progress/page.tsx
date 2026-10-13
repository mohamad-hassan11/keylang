'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { useProgress } from '@/hooks/useProgress';
import { getLocaleStrings } from '@/lib/locale';
import { TrendCharts, WeakKeysHeatmap } from '@/components/progress/ProgressCharts';
import {
  Zap,
  Target,
  Clock,
  AlertTriangle,
  Flame,
  Award,
  History,
  Play,
  RotateCcw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export default function ProgressPage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const { stats, progress, resetProgress } = useProgress();

  // Format total practice time into readable hours and minutes
  const formattedTime = useMemo(() => {
    const totalMinutes = Math.floor(stats.totalPracticeTimeMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0 && minutes === 0) {
      const seconds = Math.floor(stats.totalPracticeTimeMs / 1000);
      return `${seconds}s`;
    }
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  }, [stats.totalPracticeTimeMs]);

  // Sort weak keys by error count descending
  const sortedWeakKeys = useMemo(() => {
    return Object.entries(stats.perKeyErrors)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [stats.perKeyErrors]);

  const recentSessions = useMemo(() => {
    return (progress.sessionHistory || []).slice(0, 10);
  }, [progress.sessionHistory]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.progressTitle}</h1>
          <p className="text-muted-foreground mt-1">{strings.progressSubtitle}</p>
        </div>

        {stats.totalSessions > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetProgress}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Statistics</span>
          </Button>
        )}
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Speed (Net)</span>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.cumulativeNetWpm > 0 ? `${stats.cumulativeNetWpm} WPM` : '—'}
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Accuracy</span>
            <Target className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.totalSessions > 0 ? `${stats.cumulativeAccuracy}%` : '—'}
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Practice Time</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.totalPracticeTimeMs > 0 ? formattedTime : '0m'}
          </div>
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Current Streak</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
          </div>
        </Card>
      </div>

      {/* Performance Trends & Charts */}
      <TrendCharts sessions={recentSessions} />

      {/* Secondary Row: Lessons, Weak Keys, Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed Lessons */}
        <Card variant="default" padding="lg">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Guided Curriculum</CardTitle>
            </div>
            <CardDescription>
              {progress.completedLessons.length} lesson(s) completed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {progress.completedLessons.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 space-y-3">
                <p>No guided lessons completed yet.</p>
                <Link href="/guided">
                  <Button variant="outline" size="sm">Start Lesson 1</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {progress.completedLessons.map((lessonId) => (
                  <Badge key={lessonId} variant="accent" size="sm">
                    {lessonId}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weak Keys & Error Rates */}
        <Card variant="default" padding="lg">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">{strings.progressWeakKeys}</CardTitle>
            </div>
            <CardDescription>
              Most frequently missed keys across recent practice sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {sortedWeakKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No error patterns recorded yet. Keep typing to calibrate!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedWeakKeys.map(([key, count]) => (
                  <Badge
                    key={key}
                    variant={count >= 5 ? 'error' : 'warning'}
                    size="md"
                  >
                    Key &apos;{key === ' ' ? 'Space' : key}&apos; • {count} errors
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keyboard Error Heatmap */}
        <WeakKeysHeatmap perKeyErrors={stats.perKeyErrors} />
      </div>

      {/* Recent Activity History */}
      <Card variant="bordered" padding="lg">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Recent Session History</CardTitle>
          </div>
          <CardDescription>
            Last {recentSessions.length} typing sessions across guided, reflex, and vocabulary modes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recentSessions.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                No session history yet. Complete an exercise to see your timeline.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/guided">
                  <Button variant="outline" size="sm">Guided</Button>
                </Link>
                <Link href="/reflex">
                  <Button variant="outline" size="sm">Reflex</Button>
                </Link>
                <Link href="/vocabulary">
                  <Button variant="primary" size="sm">Vocabulary</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/60 overflow-x-auto">
              {recentSessions.map((item) => (
                <div
                  key={item.sessionId}
                  className="py-3 flex items-center justify-between text-sm gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" size="sm" className="uppercase font-mono text-xs">
                      {item.mode}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {item.language.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <span className="font-bold text-foreground">
                      {Math.round(item.netWpm)} WPM
                    </span>
                    <span
                      className={`font-semibold ${
                        item.accuracy >= 95
                          ? 'text-emerald-500'
                          : item.accuracy >= 85
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {item.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(item.durationMs / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
