'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useVocabulary } from '@/hooks/useVocabulary';
import type { LanguageCode, TranslationResult } from '@/lib/types';
import {
  X,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  BookOpen,
  Volume2,
} from 'lucide-react';

export interface TranslationPanelProps {
  readonly isOpen: boolean;
  readonly word: string;
  readonly fromLanguage: LanguageCode;
  readonly toLanguage: LanguageCode;
  readonly translationResult: TranslationResult | null;
  readonly isLoading?: boolean;
  readonly onClose: () => void;
}

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  nl: 'Nederlands',
  ar: 'العربية',
};

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  isOpen,
  word,
  fromLanguage,
  toLanguage,
  translationResult,
  isLoading = false,
  onClose,
}) => {
  const { isWordSaved, saveWord, removeWord, words } = useVocabulary();
  const saved = isWordSaved(word, fromLanguage);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleSave = () => {
    if (saved) {
      const existing = words.find(
        (w) => w.text.toLowerCase() === word.trim().toLowerCase() && w.language === fromLanguage
      );
      if (existing) {
        removeWord(existing.id);
      }
    } else {
      saveWord({
        text: word,
        language: fromLanguage,
        translation: translationResult?.translation || word,
        targetLanguage: toLanguage,
        contextualNote: translationResult?.contextualNote,
        cefrLevel: translationResult?.cefrLevel,
        partOfSpeech: translationResult?.partOfSpeech,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      {/* Click outside backdrop to dismiss */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in drawer container */}
      <aside
        role="dialog"
        aria-label={`Translation for ${word}`}
        aria-modal="true"
        className="relative z-10 w-full max-w-md h-full bg-card text-card-foreground shadow-2xl border-l border-border flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Word Lookup</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close translation panel"
            className="rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">Looking up definition...</p>
            </div>
          ) : (
            <>
              {/* Target Word Card */}
              <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" size="sm">
                    {LANGUAGE_LABELS[fromLanguage]}
                  </Badge>
                  {translationResult?.cefrLevel && (
                    <Badge variant="accent" size="sm">
                      {translationResult.cefrLevel}
                    </Badge>
                  )}
                </div>

                <div
                  className="text-3xl font-extrabold tracking-tight text-foreground"
                  dir={fromLanguage === 'ar' ? 'rtl' : 'ltr'}
                >
                  {word}
                </div>

                {translationResult?.partOfSpeech && (
                  <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
                    {translationResult.partOfSpeech}
                  </span>
                )}
              </div>

              {/* Translation Result */}
              {translationResult?.found ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="text-xs font-semibold uppercase text-primary tracking-wider">
                      Translation ({LANGUAGE_LABELS[toLanguage]})
                    </div>
                    <div
                      className="text-2xl font-bold text-foreground"
                      dir={toLanguage === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {translationResult.translation}
                    </div>

                    {translationResult.contextualNote && (
                      <p className="text-sm text-muted-foreground pt-1">
                        <span className="font-medium text-foreground">Note: </span>
                        {translationResult.contextualNote}
                      </p>
                    )}
                  </div>

                  {translationResult.example && (
                    <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                      <div className="text-xs font-semibold text-muted-foreground uppercase">
                        Example Usage
                      </div>
                      <p
                        className="text-sm italic text-foreground"
                        dir={fromLanguage === 'ar' ? 'rtl' : 'ltr'}
                      >
                        "{translationResult.example}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Curated translation not found in offline dictionary.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can look up the complete definition and etymology on external dictionaries.
                  </p>
                </div>
              )}

              {/* External Dictionary Link */}
              {translationResult?.externalDictionaryUrl && (
                <a
                  href={translationResult.externalDictionaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground group"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Wiktionary Entry
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/80 bg-card/60 backdrop-blur-xs flex items-center justify-between gap-3">
          <Button
            variant={saved ? 'outline' : 'primary'}
            onClick={handleToggleSave}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <BookmarkCheck className="h-4 w-4 text-emerald-500" />
                <span>Saved to Vocabulary</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Save to My Vocabulary</span>
              </>
            )}
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </aside>
    </div>
  );
};
