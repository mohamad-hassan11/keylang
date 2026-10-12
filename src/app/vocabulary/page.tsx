'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { Info } from 'lucide-react';

export default function VocabularyPage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

  const [practiceLang, setPracticeLang] = useState('nl');
  const [transLang, setTransLang] = useState('en');
  const [cefr, setCefr] = useState('A1');
  const [category, setCategory] = useState('Everyday');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.vocabTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.vocabSubtitle}</p>
      </div>

      {/* 6-Dimension Filters Card */}
      <Card variant="default" padding="lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">Vocabulary Practice Dimensions</CardTitle>
          <CardDescription>Filter exercise content by target language, CEFR level, and topic.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label={strings.vocabPracticeLang}
            value={practiceLang}
            onChange={setPracticeLang}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية' },
            ]}
          />
          <Select
            label={strings.vocabTransLang}
            value={transLang}
            onChange={setTransLang}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية' },
            ]}
          />
          <Select
            label={strings.labelLevel}
            value={cefr}
            onChange={setCefr}
            options={[
              { value: 'A1', label: 'A1 — Beginner' },
              { value: 'A2', label: 'A2 — Elementary' },
              { value: 'B1', label: 'B1 — Intermediate' },
              { value: 'B2', label: 'B2 — Upper Intermediate' },
            ]}
          />
          <Select
            label={strings.labelCategory}
            value={category}
            onChange={setCategory}
            options={[
              { value: 'Everyday', label: 'Everyday Life' },
              { value: 'Formal', label: 'Formal' },
              { value: 'Casual', label: 'Casual' },
              { value: 'Workplace', label: 'Workplace' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Typing Display Shell with Word Chips */}
      <Card variant="bordered" padding="lg" className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>{strings.vocabLookupPauseNotice}</span>
        </div>

        <div className="p-6 rounded-xl bg-muted/60 border border-border text-xl font-medium leading-relaxed text-foreground">
          De snelle bruine vos springt over de luie hond.
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="primary">{strings.actionStart}</Button>
        </div>
      </Card>
    </div>
  );
}
