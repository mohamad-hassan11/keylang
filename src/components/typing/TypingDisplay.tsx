'use client';

import React, { useMemo } from 'react';
import type { CharacterState, Direction } from '@/lib/types';

export interface TypingDisplayProps {
  readonly targetGraphemes: readonly string[];
  readonly characterStates: readonly CharacterState[];
  readonly currentIndex: number;
  readonly direction?: Direction;
  readonly onWordClick?: (wordIndex: number, word: string) => void;
  readonly onContainerClick?: () => void;
  readonly className?: string;
}

interface GraphemeItem {
  readonly char: string;
  readonly index: number;
  readonly state: CharacterState;
  readonly isCurrent: boolean;
}

interface DisplayToken {
  readonly type: 'word' | 'delimiter';
  readonly wordIndex?: number;
  readonly wordText?: string;
  readonly graphemes: readonly GraphemeItem[];
}

function getCharacterClasses(
  state: CharacterState,
  isCurrent: boolean,
  isWhitespace: boolean
): string {
  const base = 'inline-block transition-colors relative';

  if (isCurrent) {
    return `${base} bg-primary/25 text-foreground border-b-2 border-primary rounded-xs animate-pulse font-medium ${
      isWhitespace ? 'min-w-[0.55em]' : ''
    }`;
  }

  switch (state) {
    case 'correct':
      return `${base} text-emerald-600 dark:text-emerald-400 font-medium`;
    case 'incorrect':
      return `${base} text-rose-600 dark:text-rose-400 bg-rose-500/15 underline decoration-rose-500 decoration-wavy`;
    case 'corrected':
      return `${base} text-amber-600 dark:text-amber-400 font-medium`;
    case 'pending':
    default:
      return `${base} text-muted-foreground/60`;
  }
}

export const TypingDisplay: React.FC<TypingDisplayProps> = ({
  targetGraphemes,
  characterStates,
  currentIndex,
  direction = 'ltr',
  onWordClick,
  onContainerClick,
  className = '',
}) => {
  // Tokenize target graphemes into words and delimiters
  const tokens = useMemo<DisplayToken[]>(() => {
    const result: DisplayToken[] = [];
    let currentWordGraphemes: GraphemeItem[] = [];
    let wordCounter = 0;

    for (let i = 0; i < targetGraphemes.length; i++) {
      const char = targetGraphemes[i];
      const state = characterStates[i] ?? 'pending';
      const isCurrent = i === currentIndex;
      const isWhitespace = /\s/.test(char);

      const item: GraphemeItem = { char, index: i, state, isCurrent };

      if (isWhitespace) {
        if (currentWordGraphemes.length > 0) {
          result.push({
            type: 'word',
            wordIndex: wordCounter++,
            wordText: currentWordGraphemes.map((g) => g.char).join(''),
            graphemes: currentWordGraphemes,
          });
          currentWordGraphemes = [];
        }
        result.push({
          type: 'delimiter',
          graphemes: [item],
        });
      } else {
        currentWordGraphemes.push(item);
      }
    }

    if (currentWordGraphemes.length > 0) {
      result.push({
        type: 'word',
        wordIndex: wordCounter++,
        wordText: currentWordGraphemes.map((g) => g.char).join(''),
        graphemes: currentWordGraphemes,
      });
    }

    return result;
  }, [targetGraphemes, characterStates, currentIndex]);

  return (
    <div
      role="region"
      aria-label="Typing practice text"
      dir={direction}
      onClick={onContainerClick}
      className={`relative font-mono text-xl sm:text-2xl leading-relaxed p-6 rounded-2xl bg-card text-card-foreground border border-border select-none whitespace-pre-wrap ${className}`}
    >
      {tokens.map((token, tIdx) => {
        if (token.type === 'delimiter') {
          return token.graphemes.map((g) => (
            <span
              key={g.index}
              data-index={g.index}
              className={getCharacterClasses(g.state, g.isCurrent, true)}
            >
              {g.char === ' ' ? '\u00A0' : g.char}
            </span>
          ));
        }

        const wordSpans = token.graphemes.map((g) => (
          <span
            key={g.index}
            data-index={g.index}
            className={getCharacterClasses(g.state, g.isCurrent, false)}
          >
            {g.char}
          </span>
        ));

        if (onWordClick && token.wordText) {
          return (
            <span
              key={tIdx}
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(token.wordIndex!, token.wordText!);
              }}
              title={`Look up "${token.wordText}"`}
              className="inline-block cursor-pointer hover:bg-muted/40 hover:underline hover:decoration-primary/60 rounded px-0.5 transition-colors z-10 relative"
            >
              {wordSpans}
            </span>
          );
        }

        return (
          <span key={tIdx} className="inline-block">
            {wordSpans}
          </span>
        );
      })}
    </div>
  );
};
