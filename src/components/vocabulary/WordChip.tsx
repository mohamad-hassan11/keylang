'use client';

import React from 'react';
import type { LanguageCode } from '@/lib/types';

export interface WordChipProps {
  readonly word: string;
  readonly language?: LanguageCode;
  readonly onClick?: (word: string) => void;
  readonly className?: string;
  readonly active?: boolean;
}

export const WordChip: React.FC<WordChipProps> = ({
  word,
  language,
  onClick,
  className = '',
  active = false,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick?.(word)}
      title={`Look up translation for "${word}"`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
        active
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/70 hover:bg-muted text-foreground border border-border/60 hover:border-primary/50'
      } ${className}`}
    >
      <span>{word}</span>
    </button>
  );
};
