'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { GraduationCap, Zap, BookOpen, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

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
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="text-center max-w-3xl mx-auto space-y-4 pt-6">
        <Badge variant="accent" size="md">
          {strings.appName} MVP
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {strings.homeHeroTitle}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {strings.homeHeroSubtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Badge variant="outline">English • QWERTY US</Badge>
          <Badge variant="outline">Nederlands • US-Intl</Badge>
          <Badge variant="outline">العربية • Arabic 101</Badge>
        </div>
      </section>

      {/* Practice Modes Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <Card key={mode.href} variant="elevated" padding="lg" className="flex flex-col justify-between">
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
    </div>
  );
}
