'use client';

import React, { useMemo, memo } from 'react';
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
    return `${base} bg-primary/25 text-foreground border-b-2 border-primary rounded-xs animate-pulse-soft font-medium ${
      isWhitespace ? 'min-w-[0.55em]' : ''
    }`;
  }

  switch (state) {
    case 'correct':
      return `${base} text-emerald-600 dark:text-emerald-400 font-medium animate-character-correct`;
    case 'incorrect':
      return `${base} text-rose-600 dark:text-rose-400 bg-rose-500/15 underline decoration-rose-500 decoration-wavy animate-character-incorrect`;
    case 'corrected':
      return `${base} text-amber-600 dark:text-amber-400 font-medium`;
    case 'pending':
    default:
      return `${base} text-muted-foreground/60`;
  }
}

function CharacterSpan({ char, index, state, isCurrent, isWhitespace }: {
  char: string;
  index: number;
  state: CharacterState;
  isCurrent: boolean;
  isWhitespace: boolean;
}) {
  return (
    <span
      key={index}
      data-index={index}
      className={getCharacterClasses(state, isCurrent, isWhitespace)}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
}

function WordToken({ graphemes, wordIndex, wordText, currentIndex, onWordClick }: {
  graphemes: readonly GraphemeItem[];
  wordIndex: number;
  wordText: string;
  currentIndex: number;
  onWordClick?: (wordIndex: number, word: string) => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onWordClick) {
      e.preventDefault();
      onWordClick(wordIndex, wordText);
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onWordClick?.(wordIndex, wordText);
      }}
      onKeyDown={handleKeyDown}
      title={`Look up "${wordText}"`}
      className="inline-block cursor-pointer hover:bg-muted/40 hover:underline hover:decoration-primary/60 rounded px-0.5 transition-colors z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {graphemes.map((g) => (
        <CharacterSpan
          key={g.index}
          char={g.char}
          index={g.index}
          state={g.state}
          isCurrent={g.index === currentIndex}
          isWhitespace={false}
        />
      ))}
    </span>
  );
}

function DelimiterToken({ graphemes, currentIndex }: {
  graphemes: readonly GraphemeItem[];
  currentIndex: number;
}) {
  return (
    <>
      {graphemes.map((g) => (
        <CharacterSpan
          key={g.index}
          char={g.char}
          index={g.index}
          state={g.state}
          isCurrent={g.index === currentIndex}
          isWhitespace={true}
        />
      ))}
    </>
  );
}

// Tokenize target graphemes into words and delimiters (stable - only depends on targetGraphemes)
function tokenizeGraphemes(targetGraphemes: readonly string[], characterStates: readonly CharacterState[]): DisplayToken[] {
  const result: DisplayToken[] = [];
  let currentWordGraphemes: GraphemeItem[] = [];
  let wordCounter = 0;

  for (let i = 0; i < targetGraphemes.length; i++) {
    const char = targetGraphemes[i];
    const state = characterStates[i] ?? 'pending';
    const isWhitespace = /\s/.test(char);

    const item: GraphemeItem = { char, index: i, state };

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
}

const TypingDisplay = memo(function TypingDisplay({
  targetGraphemes,
  characterStates,
  currentIndex,
  direction = 'ltr',
  onWordClick,
  onContainerClick,
  className = '',
}: TypingDisplayProps) {
  // Tokenize only when target text or states change (not on currentIndex change)
  const tokens = useMemo<DisplayToken[]>(
    () => tokenizeGraphemes(targetGraphemes, characterStates),
    [targetGraphemes, characterStates]
  );

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
          return <DelimiterToken key={tIdx} graphemes={token.graphemes} currentIndex={currentIndex} />;
        }

        if (onWordClick && token.wordText) {
          return (
            <WordToken
              key={tIdx}
              graphemes={token.graphemes}
              wordIndex={token.wordIndex!}
              wordText={token.wordText!}
              currentIndex={currentIndex}
              onWordClick={onWordClick}
            />
          );
        }

        return (
          <span key={tIdx} className="inline-block">
            {token.graphemes.map((g) => (
              <CharacterSpan
                key={g.index}
                char={g.char}
                index={g.index}
                state={g.state}
                isCurrent={g.index === currentIndex}
                isWhitespace={false}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
});

export { TypingDisplay };
