'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { usePreferences } from '@/hooks/usePreferences';
import { useVocabulary } from '@/hooks/useVocabulary';
import { getLocaleStrings } from '@/lib/locale';
import {
  Bookmark,
  Trash2,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
} from 'lucide-react';
import type { LanguageCode, ReviewStatus } from '@/lib/types';

export default function MyVocabularyPage() {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const { words, removeWord, updateReviewStatus, clearVocabulary } = useVocabulary();

  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchSearch =
        search.trim() === '' ||
        w.text.toLowerCase().includes(search.toLowerCase()) ||
        w.translation.toLowerCase().includes(search.toLowerCase());

      const matchLang = selectedLang === 'all' || w.language === selectedLang;
      const matchStatus = selectedStatus === 'all' || w.reviewStatus === selectedStatus;

      return matchSearch && matchLang && matchStatus;
    });
  }, [words, search, selectedLang, selectedStatus]);

  const cycleStatus = (id: string, current: ReviewStatus) => {
    const next: Record<ReviewStatus, ReviewStatus> = {
      new: 'learning',
      learning: 'mastered',
      mastered: 'new',
    };
    updateReviewStatus(id, next[current] || 'new');
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'mastered':
        return (
          <Badge variant="accent" size="sm" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Mastered
          </Badge>
        );
      case 'learning':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="h-3 w-3 mr-1 inline" />
            Learning
          </Badge>
        );
      case 'new':
      default:
        return (
          <Badge variant="default" size="sm">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            New
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.myVocabTitle}</h1>
          <p className="text-muted-foreground mt-1">{strings.myVocabSubtitle}</p>
        </div>

        {words.length > 0 && (
          <div className="flex items-center gap-3">
            <Link href="/vocabulary">
              <Button variant="primary" size="md" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span>Practice Vocabulary</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card variant="default" padding="md" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder={strings.labelSearch}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select
            label="Filter by Language"
            value={selectedLang}
            onChange={setSelectedLang}
            options={[
              { value: 'all', label: 'All Languages' },
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية' },
            ]}
          />

          <Select
            label="Filter by Review Status"
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'new', label: 'New' },
              { value: 'learning', label: 'Learning' },
              { value: 'mastered', label: 'Mastered' },
            ]}
          />
        </div>
      </Card>

      {/* Empty State */}
      {words.length === 0 ? (
        <Card variant="bordered" padding="lg" className="text-center py-16 space-y-4">
          <Bookmark className="h-14 w-14 mx-auto text-muted-foreground/40" />
          <CardTitle className="text-2xl">{strings.myVocabEmpty}</CardTitle>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {strings.myVocabEmptyAction}
          </p>
          <div className="pt-2">
            <Link href="/vocabulary">
              <Button variant="primary" size="lg">{strings.actionStart}</Button>
            </Link>
          </div>
        </Card>
      ) : filteredWords.length === 0 ? (
        <Card variant="bordered" padding="lg" className="text-center py-12 space-y-3">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <CardTitle>No words match your filters</CardTitle>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search query, language, or status filter.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredWords.map((item) => (
            <Card
              key={item.id}
              variant="default"
              padding="md"
              className="flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" size="sm">
                      {item.language.toUpperCase()}
                    </Badge>
                    {item.cefrLevel && (
                      <Badge variant="accent" size="sm">
                        {item.cefrLevel}
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleStatus(item.id, item.reviewStatus)}
                    className="cursor-pointer"
                    title="Click to cycle status: New → Learning → Mastered"
                  >
                    {getStatusBadge(item.reviewStatus)}
                  </button>
                </div>

                <div>
                  <div
                    className="font-bold text-2xl text-foreground"
                    dir={item.language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {item.text}
                  </div>
                  <p
                    className="text-md text-primary font-medium mt-1"
                    dir={item.targetLanguage === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {item.translation}
                  </p>
                </div>

                {item.contextualNote && (
                  <p className="text-xs text-muted-foreground italic">
                    Note: {item.contextualNote}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>
                  Saved {new Date(item.savedAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWord(item.id)}
                  aria-label={strings.actionRemove}
                  className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
