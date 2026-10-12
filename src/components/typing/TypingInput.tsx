'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Direction } from '@/lib/types';
import { segmentGraphemes } from '@/engine/text-processing';

export interface TypingInputProps {
  readonly onInputChar: (char: string) => void;
  readonly onDeleteChar: () => void;
  readonly disabled?: boolean;
  readonly isPaused?: boolean;
  readonly autoFocus?: boolean;
  readonly direction?: Direction;
  readonly className?: string;
  readonly 'aria-label'?: string;
}

export const TypingInput = forwardRef<HTMLTextAreaElement, TypingInputProps>(
  (
    {
      onInputChar,
      onDeleteChar,
      disabled = false,
      isPaused = false,
      autoFocus = true,
      direction = 'ltr',
      className = '',
      'aria-label': ariaLabel = 'Typing input',
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const isComposingRef = useRef<boolean>(false);

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Initial and dynamic autofocus
    useEffect(() => {
      if (autoFocus && !disabled && !isPaused && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus, disabled, isPaused]);

    // Native interception for bulletproof anti-paste & drag/drop blocking
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;

      const handleNativeBeforeInput = (e: InputEvent) => {
        if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
          e.preventDefault();
        }
      };

      const handleNativePaste = (e: Event) => {
        e.preventDefault();
      };

      const handleNativeDrop = (e: Event) => {
        e.preventDefault();
      };

      el.addEventListener('beforeinput', handleNativeBeforeInput);
      el.addEventListener('paste', handleNativePaste);
      el.addEventListener('drop', handleNativeDrop);

      return () => {
        el.removeEventListener('beforeinput', handleNativeBeforeInput);
        el.removeEventListener('paste', handleNativePaste);
        el.removeEventListener('drop', handleNativeDrop);
      };
    }, []);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
    };

    const handleBeforeInput = (
      e: React.FormEvent<HTMLTextAreaElement> & { nativeEvent?: InputEvent }
    ) => {
      const nativeEvent = e.nativeEvent as InputEvent | undefined;
      if (
        nativeEvent &&
        (nativeEvent.inputType === 'insertFromPaste' || nativeEvent.inputType === 'insertFromDrop')
      ) {
        e.preventDefault();
      }
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionUpdate = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      const data = e.data;
      if (data && !disabled && !isPaused) {
        const graphemes = segmentGraphemes(data);
        for (const g of graphemes) {
          onInputChar(g);
        }
      }
      if (textareaRef.current) {
        textareaRef.current.value = '';
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (!disabled && !isPaused) {
          onDeleteChar();
        }
        if (textareaRef.current) {
          textareaRef.current.value = '';
        }
      }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current) return;

      const nativeEvent = (e as unknown as { nativeEvent?: InputEvent }).nativeEvent;
      const inputType =
        nativeEvent?.inputType ??
        (e as unknown as { inputType?: string }).inputType;

      if (inputType === 'insertCompositionText') return;

      if (inputType === 'deleteContentBackward') {
        if (!disabled && !isPaused) {
          onDeleteChar();
        }
        e.currentTarget.value = '';
        return;
      }

      const val = e.currentTarget.value;
      if (val && !disabled && !isPaused) {
        const graphemes = segmentGraphemes(val);
        for (const g of graphemes) {
          onInputChar(g);
        }
      }
      e.currentTarget.value = '';
    };

    return (
      <textarea
        ref={textareaRef}
        dir={direction}
        disabled={disabled}
        aria-label={ariaLabel}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onBeforeInput={handleBeforeInput}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className={`absolute inset-0 w-full h-full opacity-0 pointer-events-auto resize-none cursor-default overflow-hidden z-0 ${className}`}
      />
    );
  }
);

TypingInput.displayName = 'TypingInput';
