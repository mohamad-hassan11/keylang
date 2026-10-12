'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { Bookmark, Trash2 } from 'lucide-react';

export default function MyVocabularyPage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const [search, setSearch] = useState('');

  // Sample saved words placeholder
  const savedWords = [
    { id: '1', word: 'kat', translation: 'cat', lang: 'nl', level: 'A1', category: 'Everyday' },
    { id: '2', word: 'hond', translation: 'dog', lang: 'nl', level: 'A1', category: 'Everyday' },
  ];

  const filteredWords = savedWords.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.myVocabTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.myVocabSubtitle}</p>
      </div>

      <div className="max-w-md">
        <Input
          placeholder={strings.labelSearch}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredWords.length === 0 ? (
        <Card variant="bordered" padding="lg" className="text-center py-12 space-y-4">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <CardTitle>{strings.myVocabEmpty}</CardTitle>
          <p className="text-muted-foreground text-sm">{strings.myVocabEmptyAction}</p>
          <Link href="/vocabulary">
            <Button variant="primary">{strings.actionStart}</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredWords.map((item) => (
            <Card key={item.id} variant="default" padding="md" className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-foreground">{item.word}</span>
                  <Badge variant="accent" size="sm">{item.level}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.translation}</p>
              </div>
              <Button variant="ghost" size="sm" aria-label={strings.actionRemove}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
