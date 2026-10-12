import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypingSession } from '../useTypingSession';
import type { TypingMetrics } from '@/lib/types';

describe('useTypingSession Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('T1: initializes session in idle state with 0 elapsed time and initial target', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    expect(result.current.session.status).toBe('idle');
    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.target).toBe('cat');
    expect(result.current.session.graphemes).toEqual(['c', 'a', 't']);
    expect(result.current.metrics.elapsedTimeMs).toBe(0);
    expect(result.current.metrics.accuracy).toBe(100);
  });

  it('T2: activates session on first keystroke and updates character state', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInputChar('c');
    });

    expect(result.current.session.status).toBe('active');
    expect(result.current.session.currentIndex).toBe(1);
    expect(result.current.session.characterStates[0]).toBe('correct');
    expect(result.current.session.totalKeystrokes).toBe(1);
  });

  it('T3: handles character deletion and state reversion', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInputChar('x'); // error
    });
    expect(result.current.session.currentIndex).toBe(1);
    expect(result.current.session.characterStates[0]).toBe('incorrect');
    expect(result.current.session.uncorrectedErrors).toBe(1);

    act(() => {
      result.current.handleDeleteChar(); // backspace
    });
    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.characterStates[0]).toBe('pending');
    expect(result.current.session.uncorrectedErrors).toBe(0);
  });

  it('T4: pauses and resumes active session correctly', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInputChar('c');
    });
    expect(result.current.session.status).toBe('active');

    act(() => {
      result.current.pauseSession();
    });
    expect(result.current.session.status).toBe('paused');

    act(() => {
      result.current.resumeSession();
    });
    expect(result.current.session.status).toBe('active');
  });

  it('T5: triggers onComplete callback upon completing the target text', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTypingSession('hi', { onComplete })
    );

    act(() => {
      result.current.handleInputChar('h');
    });
    expect(result.current.session.status).toBe('active');
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      result.current.handleInputChar('i');
    });
    expect(result.current.session.status).toBe('completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
    const finalMetrics = onComplete.mock.calls[0][0] as TypingMetrics;
    expect(finalMetrics.accuracy).toBe(100);
  });

  it('T6: rejects input and deletion when session is completed or paused', () => {
    const { result } = renderHook(() => useTypingSession('a'));

    act(() => {
      result.current.handleInputChar('a'); // completed
    });
    expect(result.current.session.status).toBe('completed');

    act(() => {
      result.current.handleInputChar('b');
      result.current.handleDeleteChar();
    });
    expect(result.current.session.currentIndex).toBe(1);
    expect(result.current.session.status).toBe('completed');
  });

  it('T7: restarts session back to idle state with same target', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInputChar('c');
      result.current.handleInputChar('a');
    });
    expect(result.current.session.currentIndex).toBe(2);

    act(() => {
      result.current.restartSession();
    });
    expect(result.current.session.status).toBe('idle');
    expect(result.current.session.currentIndex).toBe(0);
    expect(result.current.session.characterStates.every((s) => s === 'pending')).toBe(true);
  });

  it('T8: resets session with new target text', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.resetWithText('dog');
    });
    expect(result.current.session.target).toBe('dog');
    expect(result.current.session.graphemes).toEqual(['d', 'o', 'g']);
    expect(result.current.session.status).toBe('idle');
    expect(result.current.session.currentIndex).toBe(0);
  });

  it('T9: updates live metrics on timer interval during active session', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInputChar('c');
    });
    expect(result.current.session.status).toBe('active');

    // Advance fake timer by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.metrics.elapsedTimeMs).toBeGreaterThanOrEqual(400);
  });

  it('T10: supports ergonomic aliases (handleInput, handleDelete, handlePause, handleResume, handleRestart)', () => {
    const { result } = renderHook(() => useTypingSession('cat'));

    act(() => {
      result.current.handleInput('c');
    });
    expect(result.current.session.currentIndex).toBe(1);

    act(() => {
      result.current.handleDelete();
    });
    expect(result.current.session.currentIndex).toBe(0);

    act(() => {
      result.current.handleInput('c');
      result.current.handlePause();
    });
    expect(result.current.session.status).toBe('paused');

    act(() => {
      result.current.handleResume();
    });
    expect(result.current.session.status).toBe('active');

    act(() => {
      result.current.handleRestart();
    });
    expect(result.current.session.status).toBe('idle');
  });
});
