'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { Zap, Target, Clock, AlertTriangle } from 'lucide-react';

export default function ProgressPage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

  const stats = [
    { label: strings.progressTopSpeed, value: '45 WPM', icon: Zap },
    { label: strings.progressAvgAccuracy, value: '96.5%', icon: Target },
    { label: strings.progressTotalTime, value: '1h 24m', icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.progressTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.progressSubtitle}</p>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="elevated" padding="md">
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-extrabold text-foreground">{stat.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Weak Keys & Error Rates */}
      <Card variant="default" padding="lg">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>{strings.progressWeakKeys}</CardTitle>
          </div>
          <CardDescription>Most frequently missed keys across recent sessions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-wrap gap-3">
          <Badge variant="error" size="md">Key 'p' • 12 errors</Badge>
          <Badge variant="error" size="md">Key 'b' • 9 errors</Badge>
          <Badge variant="warning" size="md">Key 'q' • 6 errors</Badge>
          <Badge variant="warning" size="md">Key 'x' • 4 errors</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
