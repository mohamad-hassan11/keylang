import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TypingInput } from '../TypingInput';
import { TypingDisplay } from '../TypingDisplay';
import { MetricsBar, formatElapsedTime } from '../MetricsBar';
import { ResultsCard } from '../ResultsCard';
import type { CharacterState, TypingMetrics } from '@/lib/types';

describe('TypingInput Component', () => {
  it('renders a hidden textarea with proper accessibility and configuration', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(
      <TypingInput
        onInputChar={onInputChar}
        onDeleteChar={onDeleteChar}
        aria-label="Typing input"
      />
    );

    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;
    expect(textarea).toBeDefined();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.getAttribute('autocapitalize')).toBe('none');
    expect(textarea.getAttribute('autocomplete')).toBe('off');
    expect(textarea.getAttribute('spellcheck')).toBe('false');
  });

  it('dispatches input characters and clears textarea value', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    fireEvent.input(textarea, { target: { value: 'a' } });
    expect(onInputChar).toHaveBeenCalledWith('a');
    expect(textarea.value).toBe('');
  });

  it('dispatches backspace on Backspace keydown', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    fireEvent.keyDown(textarea, { key: 'Backspace' });
    expect(onDeleteChar).toHaveBeenCalledTimes(1);
  });

  it('blocks paste event via preventDefault and does not emit characters', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    const pasteEvent = new Event('paste', { cancelable: true });
    textarea.dispatchEvent(pasteEvent);
    expect(pasteEvent.defaultPrevented).toBe(true);
    expect(onInputChar).not.toHaveBeenCalled();
  });

  it('blocks beforeinput event for paste and drop', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    const beforeInputPaste = new InputEvent('beforeinput', {
      inputType: 'insertFromPaste',
      cancelable: true,
    });
    textarea.dispatchEvent(beforeInputPaste);
    expect(beforeInputPaste.defaultPrevented).toBe(true);

    const beforeInputDrop = new InputEvent('beforeinput', {
      inputType: 'insertFromDrop',
      cancelable: true,
    });
    textarea.dispatchEvent(beforeInputDrop);
    expect(beforeInputDrop.defaultPrevented).toBe(true);
  });

  it('buffers IME / dead keys during composition and emits resolved character on compositionend', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    fireEvent.compositionStart(textarea);
    fireEvent.compositionUpdate(textarea, { data: "'" });
    // Regular input while composing should be ignored
    fireEvent.input(textarea, { target: { value: "'" } });
    expect(onInputChar).not.toHaveBeenCalled();

    // End composition with resolved 'é'
    fireEvent.compositionEnd(textarea, { data: 'é' });
    expect(onInputChar).toHaveBeenCalledWith('é');
    expect(textarea.value).toBe('');
  });

  it('handles deleteContentBackward input event as backspace', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    render(<TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    fireEvent(
      textarea,
      new InputEvent('input', {
        inputType: 'deleteContentBackward',
        bubbles: true,
      })
    );
    expect(onDeleteChar).toHaveBeenCalledTimes(1);
  });

  it('guards against input when disabled or paused', () => {
    const onInputChar = vi.fn();
    const onDeleteChar = vi.fn();

    const { rerender } = render(
      <TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} disabled={true} />
    );
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;

    fireEvent.input(textarea, { target: { value: 'a' } });
    fireEvent.keyDown(textarea, { key: 'Backspace' });
    expect(onInputChar).not.toHaveBeenCalled();
    expect(onDeleteChar).not.toHaveBeenCalled();

    rerender(
      <TypingInput onInputChar={onInputChar} onDeleteChar={onDeleteChar} isPaused={true} />
    );
    fireEvent.input(textarea, { target: { value: 'b' } });
    fireEvent.keyDown(textarea, { key: 'Backspace' });
    expect(onInputChar).not.toHaveBeenCalled();
    expect(onDeleteChar).not.toHaveBeenCalled();
  });

  it('respects RTL text direction', () => {
    render(<TypingInput onInputChar={vi.fn()} onDeleteChar={vi.fn()} direction="rtl" />);
    const textarea = screen.getByLabelText('Typing input') as HTMLTextAreaElement;
    expect(textarea.getAttribute('dir')).toBe('rtl');
  });
});

describe('TypingDisplay Component', () => {
  it('renders target graphemes with word tokens and correct initial pending states', () => {
    const graphemes = ['c', 'a', 't', ' ', 'd', 'o', 'g'];
    const states: CharacterState[] = ['pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending'];

    render(
      <TypingDisplay
        targetGraphemes={graphemes}
        characterStates={states}
        currentIndex={0}
      />
    );

    const region = screen.getByRole('region', { name: 'Typing practice text' });
    expect(region).toBeDefined();
    expect(region.textContent).toContain('cat');
    expect(region.textContent).toContain('dog');
  });

  it('applies distinct visual styles for current, correct, incorrect, and corrected states', () => {
    const graphemes = ['c', 'a', 't'];
    const states: CharacterState[] = ['correct', 'incorrect', 'corrected'];

    const { container } = render(
      <TypingDisplay
        targetGraphemes={graphemes}
        characterStates={states}
        currentIndex={1}
      />
    );

    // Current caret at index 1
    const currentChar = container.querySelector('[data-index="1"]');
    expect(currentChar?.className).toContain('border-primary');
    expect(currentChar?.className).toContain('animate-pulse');

    // Index 0 correct
    const correctChar = container.querySelector('[data-index="0"]');
    expect(correctChar?.className).toContain('text-emerald-600');

    // Index 2 corrected
    const correctedChar = container.querySelector('[data-index="2"]');
    expect(correctedChar?.className).toContain('text-amber-600');
  });

  it('invokes onWordClick when word token is clicked', () => {
    const graphemes = ['c', 'a', 't', ' ', 'd', 'o', 'g'];
    const states: CharacterState[] = ['correct', 'correct', 'correct', 'pending', 'pending', 'pending', 'pending'];
    const onWordClick = vi.fn();

    render(
      <TypingDisplay
        targetGraphemes={graphemes}
        characterStates={states}
        currentIndex={3}
        onWordClick={onWordClick}
      />
    );

    const wordButton = screen.getByRole('button', { name: 'cat' });
    fireEvent.click(wordButton);
    expect(onWordClick).toHaveBeenCalledWith(0, 'cat');
  });

  it('supports RTL direction for Arabic text', () => {
    const graphemes = ['ك', 'ت', 'ب'];
    const states: CharacterState[] = ['pending', 'pending', 'pending'];

    render(
      <TypingDisplay
        targetGraphemes={graphemes}
        characterStates={states}
        currentIndex={0}
        direction="rtl"
      />
    );

    const region = screen.getByRole('region', { name: 'Typing practice text' });
    expect(region.getAttribute('dir')).toBe('rtl');
  });
});

describe('MetricsBar Component', () => {
  it('formats elapsed time correctly across seconds, minutes, and hours', () => {
    expect(formatElapsedTime(0)).toBe('00:00');
    expect(formatElapsedTime(5000)).toBe('00:05');
    expect(formatElapsedTime(65000)).toBe('01:05');
    expect(formatElapsedTime(3665000)).toBe('01:01:05');
  });

  it('renders all metrics HUD items and status badge correctly', () => {
    const { container } = render(
      <MetricsBar
        grossWpm={45}
        netWpm={42}
        accuracy={98.5}
        elapsedTimeMs={65000}
        status="active"
        uncorrectedErrors={1}
      />
    );

    expect(container.textContent).toMatch(/42/); // Net WPM
    expect(container.textContent).toMatch(/45/); // Gross WPM
    expect(container.textContent).toMatch(/98\.5%/); // Accuracy
    expect(container.textContent).toMatch(/01:05/); // Time
    expect(container.textContent).toMatch(/Typing/); // Active status
    expect(container.textContent).toMatch(/1 uncorrected/);
  });
});

describe('ResultsCard Component', () => {
  const mockMetrics: TypingMetrics = {
    grossWpm: 50.2,
    netWpm: 46.8,
    accuracy: 95.5,
    elapsedTimeMs: 45000,
    errorCount: 2,
    uncorrectedErrors: 0,
    perKeyErrors: { e: 2, t: 1 },
  };

  it('renders performance summary, weak keys, and action buttons', async () => {
    const onRestart = vi.fn();
    const onNext = vi.fn();

    const { container } = render(
      <ResultsCard
        metrics={mockMetrics}
        onRestart={onRestart}
        onNext={onNext}
      />
    );

    // Wait for animated numbers to complete (max 800ms duration + buffer)
    await vi.waitFor(
      () => {
        expect(container.textContent).toMatch(/47/); // Net WPM rounded
      },
      { timeout: 2000 }
    );

    await vi.waitFor(
      () => {
        expect(container.textContent).toMatch(/95\.5%/);
      },
      { timeout: 2000 }
    );

    await vi.waitFor(
      () => {
        expect(container.textContent).toMatch(/00:45/);
      },
      { timeout: 2000 }
    );

    expect(container.textContent).toMatch(/'e': 2 errors/);
    expect(container.textContent).toMatch(/'t': 1 error/);

    const restartBtn = screen.getByRole('button', { name: /restart/i });
    fireEvent.click(restartBtn);
    expect(onRestart).toHaveBeenCalledTimes(1);

    const nextBtn = screen.getByRole('button', { name: /next lesson/i });
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders flawless badge when perKeyErrors is empty', () => {
    const flawlessMetrics: TypingMetrics = {
      ...mockMetrics,
      errorCount: 0,
      perKeyErrors: {},
    };

    render(
      <ResultsCard
        metrics={flawlessMetrics}
        onRestart={vi.fn()}
      />
    );

    expect(screen.getByText('Flawless! Zero errors recorded')).toBeDefined();
  });

  it('triggers onNext or onRestart when Enter key is pressed', () => {
    const onRestart = vi.fn();
    const onNext = vi.fn();

    const { rerender } = render(
      <ResultsCard metrics={mockMetrics} onRestart={onRestart} onNext={onNext} />
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onNext).toHaveBeenCalledTimes(1);

    rerender(
      <ResultsCard metrics={mockMetrics} onRestart={onRestart} />
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
