import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { TypingInput } from '../TypingInput';
import { TypingDisplay } from '../TypingDisplay';
import { useTypingSession } from '@/hooks/useTypingSession';

describe('TypingInput Adversarial & Stress Challenge Suite', () => {
  describe('1. Anti-Paste & Anti-Drop Protection', () => {
    it('rejects React synthetic paste event with multi-character text and asserts defaultPrevented', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      const pasteEvent = createEvent.paste(textarea, {
        clipboardData: {
          getData: () => 'malicious_clipboard_text_123',
        },
      });

      fireEvent(textarea, pasteEvent);

      expect(pasteEvent.defaultPrevented).toBe(true);
      expect(onInputChar).not.toHaveBeenCalled();
      expect(onDeleteChar).not.toHaveBeenCalled();
      expect(textarea.value).toBe('');
    });

    it('rejects native DOM paste event dispatched on textarea and asserts defaultPrevented', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      const nativePaste = new Event('paste', { bubbles: true, cancelable: true });
      const dispatched = textarea.dispatchEvent(nativePaste);

      expect(dispatched).toBe(false); // cancelled via preventDefault
      expect(nativePaste.defaultPrevented).toBe(true);
      expect(onInputChar).not.toHaveBeenCalled();
      expect(textarea.value).toBe('');
    });

    it('blocks beforeinput event for inputType "insertFromPaste" (native and synthetic)', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Native DOM beforeinput
      const nativeBeforeInputPaste = new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        data: 'paste payload',
        bubbles: true,
        cancelable: true,
      });

      const allowed = textarea.dispatchEvent(nativeBeforeInputPaste);
      expect(allowed).toBe(false);
      expect(nativeBeforeInputPaste.defaultPrevented).toBe(true);
      expect(onInputChar).not.toHaveBeenCalled();

      // React synthetic beforeinput via fireEvent
      const syntheticBeforeInput = new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        bubbles: true,
        cancelable: true,
      });
      fireEvent(textarea, syntheticBeforeInput);
      expect(syntheticBeforeInput.defaultPrevented).toBe(true);
      expect(onInputChar).not.toHaveBeenCalled();
    });

    it('blocks beforeinput event for inputType "insertFromDrop" and native drop events', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Native drop
      const nativeDrop = new Event('drop', { bubbles: true, cancelable: true });
      const dropAllowed = textarea.dispatchEvent(nativeDrop);
      expect(dropAllowed).toBe(false);
      expect(nativeDrop.defaultPrevented).toBe(true);

      // Native beforeinput insertFromDrop
      const nativeBeforeInputDrop = new InputEvent('beforeinput', {
        inputType: 'insertFromDrop',
        data: 'dragged text',
        bubbles: true,
        cancelable: true,
      });
      const beforeInputAllowed = textarea.dispatchEvent(nativeBeforeInputDrop);
      expect(beforeInputAllowed).toBe(false);
      expect(nativeBeforeInputDrop.defaultPrevented).toBe(true);

      // Testing-Library createEvent drop
      const syntheticDrop = createEvent.drop(textarea, {
        dataTransfer: { getData: () => 'dragged text' },
      });
      fireEvent(textarea, syntheticDrop);
      expect(syntheticDrop.defaultPrevented).toBe(true);
      expect(onInputChar).not.toHaveBeenCalled();
    });

    it('blocks paste attempts containing multi-byte Unicode, Dutch diacritics, and Arabic strings', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      const maliciousPayloads = [
        'Geïnspireerd door België',
        'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        '🚀🎉⌨️✨🔥',
        '\u0000\u0007\u001B[31mExploit\u001B[0m',
      ];

      for (const payload of maliciousPayloads) {
        const pasteEvt = new Event('paste', { bubbles: true, cancelable: true });
        textarea.dispatchEvent(pasteEvt);
        expect(pasteEvt.defaultPrevented).toBe(true);

        const beforeInput = new InputEvent('beforeinput', {
          inputType: 'insertFromPaste',
          data: payload,
          bubbles: true,
          cancelable: true,
        });
        textarea.dispatchEvent(beforeInput);
        expect(beforeInput.defaultPrevented).toBe(true);
      }

      expect(onInputChar).not.toHaveBeenCalled();
      expect(textarea.value).toBe('');
    });

    it('preserves anti-paste blocking when session is paused or disabled', () => {
      const onInputChar = vi.fn();
      const { rerender } = render(
        <TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} isPaused={true} />
      );
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      const pasteEvt1 = new Event('paste', { bubbles: true, cancelable: true });
      textarea.dispatchEvent(pasteEvt1);
      expect(pasteEvt1.defaultPrevented).toBe(true);

      rerender(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} disabled={true} />);
      const pasteEvt2 = new Event('paste', { bubbles: true, cancelable: true });
      textarea.dispatchEvent(pasteEvt2);
      expect(pasteEvt2.defaultPrevented).toBe(true);

      expect(onInputChar).not.toHaveBeenCalled();
    });
  });

  describe('2. IME & Composition Stress Testing', () => {
    it('handles multi-stage dead key combination: acute accent ("\'" then "e" -> "é")', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // 1. Dead key "'" pressed -> triggers composition
      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: "'" });

      // 2. Browser fires intermediate keydown/input while composing
      fireEvent.keyDown(textarea, { key: 'Dead' });
      fireEvent.input(textarea, { target: { value: "'" } });
      expect(onInputChar).not.toHaveBeenCalled();

      // 3. User types "e" -> composition updates to combined "é"
      fireEvent.compositionUpdate(textarea, { data: 'é' });
      expect(onInputChar).not.toHaveBeenCalled();

      // 4. Composition commits with "é"
      fireEvent.compositionEnd(textarea, { data: 'é' });
      expect(onInputChar).toHaveBeenCalledTimes(1);
      expect(onInputChar).toHaveBeenCalledWith('é');
      expect(textarea.value).toBe('');
    });

    it('handles multi-stage dead key combination: diaeresis/trema (\'"\' then "u" -> "ü")', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: '"' });
      fireEvent.compositionUpdate(textarea, { data: 'ü' });
      fireEvent.compositionEnd(textarea, { data: 'ü' });

      expect(onInputChar).toHaveBeenCalledTimes(1);
      expect(onInputChar).toHaveBeenCalledWith('ü');
      expect(textarea.value).toBe('');
    });

    it('handles dead key sequence followed by Space to emit standalone symbol', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Dead key ~ then Space -> ~
      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: '~' });
      fireEvent.compositionEnd(textarea, { data: '~' });

      expect(onInputChar).toHaveBeenCalledTimes(1);
      expect(onInputChar).toHaveBeenCalledWith('~');
    });

    it('handles multi-keystroke CJK IME composition emitting sequential graphemes ("日本")', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: 'に' });
      fireEvent.compositionUpdate(textarea, { data: 'にほ' });
      fireEvent.compositionUpdate(textarea, { data: 'にほん' });
      fireEvent.compositionUpdate(textarea, { data: '日本' });

      // End composition with multi-character kanji "日本"
      fireEvent.compositionEnd(textarea, { data: '日本' });

      expect(onInputChar).toHaveBeenCalledTimes(2);
      expect(onInputChar).toHaveBeenNthCalledWith(1, '日');
      expect(onInputChar).toHaveBeenNthCalledWith(2, '本');
      expect(textarea.value).toBe('');
    });

    it('handles Arabic IME composition with compound tashkeel as single grapheme cluster ("بَّ")', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} direction="rtl" />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Base beh + shadda + fatha
      const arabicCluster = 'بَّ';
      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: 'ب' });
      fireEvent.compositionUpdate(textarea, { data: 'بّ' });
      fireEvent.compositionUpdate(textarea, { data: arabicCluster });
      fireEvent.compositionEnd(textarea, { data: arabicCluster });

      // Must be emitted as a single grapheme cluster
      expect(onInputChar).toHaveBeenCalledTimes(1);
      expect(onInputChar).toHaveBeenCalledWith(arabicCluster);
      expect(textarea.value).toBe('');
    });

    it('handles mid-composition cancellation (Esc / abort with empty data) safely', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Start composition and abandon it
      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: 'xyz' });
      fireEvent.compositionEnd(textarea, { data: '' }); // cancelled with empty data

      expect(onInputChar).not.toHaveBeenCalled();
      expect(onDeleteChar).not.toHaveBeenCalled();
      expect(textarea.value).toBe('');

      // Verify normal typing resumes cleanly immediately after cancellation
      fireEvent.input(textarea, { target: { value: 'a' } });
      expect(onInputChar).toHaveBeenCalledTimes(1);
      expect(onInputChar).toHaveBeenCalledWith('a');
    });

    it('suppresses Backspace deletion during active composition', () => {
      const onInputChar = vi.fn();
      const onDeleteChar = vi.fn();

      render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: 'ko' });

      // User presses Backspace to delete a phoneme in the IME candidate buffer
      fireEvent.keyDown(textarea, { key: 'Backspace' });
      expect(onDeleteChar).not.toHaveBeenCalled(); // Must NOT delete target session characters!

      // Now user completes composition
      fireEvent.compositionEnd(textarea, { data: 'k' });
      expect(onInputChar).toHaveBeenCalledWith('k');
      expect(onDeleteChar).not.toHaveBeenCalled();
    });

    it('ignores input events with inputType "insertCompositionText" to prevent double insertion', () => {
      const onInputChar = vi.fn();
      render(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      fireEvent(
        textarea,
        new InputEvent('input', {
          inputType: 'insertCompositionText',
          data: 'a',
          bubbles: true,
        })
      );

      expect(onInputChar).not.toHaveBeenCalled();
    });

    it('suppresses compositionend emissions when session is paused or disabled mid-composition', () => {
      const onInputChar = vi.fn();
      const { rerender } = render(
        <TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} />
      );
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

      // Start composing while active
      fireEvent.compositionStart(textarea);
      fireEvent.compositionUpdate(textarea, { data: 'é' });

      // Pause session while composing
      rerender(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} isPaused={true} />);

      // Composition finishes while paused
      fireEvent.compositionEnd(textarea, { data: 'é' });
      expect(onInputChar).not.toHaveBeenCalled();

      // Start composing, then disable
      rerender(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} disabled={false} />);
      fireEvent.compositionStart(textarea);
      rerender(<TypingInput onInputChar={onInputChar} onDeleteChar={vi.fn()} disabled={true} />);
      fireEvent.compositionEnd(textarea, { data: 'ö' });
      expect(onInputChar).not.toHaveBeenCalled();
    });
  });

  describe('3. Lifecycle & Event Listener Cleanup', () => {
    it('properly removes native beforeinput, paste, and drop listeners upon unmount', () => {
      const removeSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'removeEventListener');

      const { unmount } = render(
        <TypingInput onInputChar={vi.fn()} onDeleteChar={vi.fn()} />
      );

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('beforeinput', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('paste', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('drop', expect.any(Function));

      removeSpy.mockRestore();
    });

    it('focuses textarea automatically when autoFocus is true and neither disabled nor paused', () => {
      const focusSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'focus');

      const { rerender } = render(
        <TypingInput onInputChar={vi.fn()} onDeleteChar={vi.fn()} autoFocus={true} />
      );
      expect(focusSpy).toHaveBeenCalled();

      focusSpy.mockClear();
      rerender(
        <TypingInput
          onInputChar={vi.fn()}
          onDeleteChar={vi.fn()}
          autoFocus={true}
          isPaused={true}
        />
      );
      expect(focusSpy).not.toHaveBeenCalled();

      focusSpy.mockRestore();
    });
  });

  describe('4. Integrated Pipeline Verification (TypingInput + useTypingSession + TypingDisplay)', () => {
    function PipelineHarness({ targetText }: { targetText: string }) {
      const { session, handleInputChar, handleDeleteChar } = useTypingSession(targetText);
      return (
        <div>
          <TypingDisplay
            targetGraphemes={session.graphemes}
            characterStates={session.characterStates}
            currentIndex={session.currentIndex}
          />
          <TypingInput onInputChar={handleInputChar} onDeleteChar={handleDeleteChar} />
          <div data-testid="session-status">{session.status}</div>
          <div data-testid="current-index">{session.currentIndex}</div>
          <div data-testid="uncorrected-errors">{session.uncorrectedErrors}</div>
        </div>
      );
    }

    it('verifies anti-paste protection prevents session progression in live pipeline', () => {
      render(<PipelineHarness targetText="cat" />);
      const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;
      const indexDisplay = screen.getByTestId('current-index');
      const statusDisplay = screen.getByTestId('session-status');

      expect(indexDisplay.textContent).toBe('0');
      expect(statusDisplay.textContent).toBe('idle');

      // 1. Type first character 'c' legitimately
      fireEvent.input(textarea, { target: { value: 'c' } });
      expect(indexDisplay.textContent).toBe('1');
      expect(statusDisplay.textContent).toBe('active');

      // 2. Attempt clipboard paste of 'at'
      const pasteEvt = createEvent.paste(textarea, {
        clipboardData: { getData: () => 'at' },
      });
      fireEvent(textarea, pasteEvt);

      // Session must NOT progress
      expect(pasteEvt.defaultPrevented).toBe(true);
      expect(indexDisplay.textContent).toBe('1');
      expect(statusDisplay.textContent).toBe('active');

      // 3. Attempt drag and drop insertion
      const dropEvt = createEvent.drop(textarea, {
        dataTransfer: { getData: () => 'at' },
      });
      fireEvent(textarea, dropEvt);

      // Session must NOT progress
      expect(dropEvt.defaultPrevented).toBe(true);
      expect(indexDisplay.textContent).toBe('1');

      // 4. Backspace to index 0, then rapid backspace 5 times
      fireEvent.keyDown(textarea, { key: 'Backspace' });
      expect(indexDisplay.textContent).toBe('0');

      for (let i = 0; i < 5; i++) {
        fireEvent.keyDown(textarea, { key: 'Backspace' });
      }
      expect(indexDisplay.textContent).toBe('0');

      // 5. Complete typing legitimate sequence
      fireEvent.input(textarea, { target: { value: 'c' } });
      fireEvent.input(textarea, { target: { value: 'a' } });
      fireEvent.input(textarea, { target: { value: 't' } });

      expect(indexDisplay.textContent).toBe('3');
      expect(statusDisplay.textContent).toBe('completed');
    });
  });
});

