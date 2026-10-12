import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypingSession } from '../useTypingSession';
import type { TypingOptions } from '@/lib/types';

describe('useTypingSession Adversarial & Stress Challenge Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('1. Rapid Backspacing & Boundary Oscillations at Index 0', () => {
    it('survives backspace hammering at index 0 during idle state without underflow or state corruption', () => {
      const { result } = renderHook(() => useTypingSession('test'));

      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.status).toBe('idle');

      // Hammer backspace 100 times at index 0
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.handleDeleteChar();
        }
      });

      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.status).toBe('idle');
      expect(result.current.session.uncorrectedErrors).toBe(0);
      expect(result.current.session.totalKeystrokes).toBe(0);
      expect(result.current.session.characterStates).toEqual([
        'pending',
        'pending',
        'pending',
        'pending',
      ]);
    });

    it('survives backspace hammering at index 0 after activating session', () => {
      const { result } = renderHook(() => useTypingSession('test'));

      // 1. Activate session with an incorrect keystroke
      act(() => {
        result.current.handleInputChar('x');
      });
      expect(result.current.session.currentIndex).toBe(1);
      expect(result.current.session.status).toBe('active');
      expect(result.current.session.uncorrectedErrors).toBe(1);

      // 2. Backspace once to return to index 0
      act(() => {
        result.current.handleDeleteChar();
      });
      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.uncorrectedErrors).toBe(0);
      expect(result.current.session.characterStates[0]).toBe('pending');

      // 3. Hammer backspace 50 more times at index 0
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.handleDeleteChar();
        }
      });

      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.status).toBe('active');
      expect(result.current.session.uncorrectedErrors).toBe(0);
      expect(result.current.session.characterStates[0]).toBe('pending');
    });

    it('handles rapid bouncing oscillation between index 0 and 1 (50 cycles) tracking cumulative errors and transitions to "corrected"', () => {
      const { result } = renderHook(() => useTypingSession('swift'));

      // Oscillate 50 times: input wrong char 'z' at index 0, then delete
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.handleInputChar('z');
        });
        expect(result.current.session.currentIndex).toBe(1);
        expect(result.current.session.uncorrectedErrors).toBe(1);
        expect(result.current.session.characterStates[0]).toBe('incorrect');

        act(() => {
          result.current.handleDeleteChar();
        });
        expect(result.current.session.currentIndex).toBe(0);
        expect(result.current.session.uncorrectedErrors).toBe(0);
        expect(result.current.session.characterStates[0]).toBe('pending');
      }

      // Check cumulative metrics: 's' failed 50 times
      expect(result.current.session.errors['s']).toBe(50);
      expect(result.current.session.totalKeystrokes).toBe(50);

      // Now type the correct character 's'
      act(() => {
        result.current.handleInputChar('s');
      });

      expect(result.current.session.currentIndex).toBe(1);
      // Because index 0 failed previously, its state must transition to 'corrected'
      expect(result.current.session.characterStates[0]).toBe('corrected');
      expect(result.current.session.uncorrectedErrors).toBe(0);
    });

    it('handles excessive backspacing on multi-character session without over-deletion', () => {
      const { result } = renderHook(() => useTypingSession('keyboard'));

      // Type 4 correct characters
      act(() => {
        result.current.handleInputChar('k');
        result.current.handleInputChar('e');
        result.current.handleInputChar('y');
        result.current.handleInputChar('b');
      });
      expect(result.current.session.currentIndex).toBe(4);

      // Delete 10 times (more than typed count)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.handleDeleteChar();
        }
      });

      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.characterStates.every((s) => s === 'pending')).toBe(true);
      expect(result.current.session.uncorrectedErrors).toBe(0);
    });

    it('handles rapid backspacing across complex Arabic grapheme clusters with tashkeel', () => {
      // "بَّتَّ" has 2 grapheme clusters
      const { result } = renderHook(() =>
        useTypingSession('بَّتَّ', { language: 'ar', diacriticMatching: 'strict' })
      );

      expect(result.current.session.graphemes).toEqual(['بَّ', 'تَّ']);
      expect(result.current.session.graphemes.length).toBe(2);

      // Input first cluster
      act(() => {
        result.current.handleInputChar('بَّ');
      });
      expect(result.current.session.currentIndex).toBe(1);
      expect(result.current.session.characterStates[0]).toBe('correct');

      // Delete back to index 0
      act(() => {
        result.current.handleDeleteChar();
      });
      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.characterStates[0]).toBe('pending');

      // Input both clusters to completion
      act(() => {
        result.current.handleInputChar('بَّ');
        result.current.handleInputChar('تَّ');
      });
      expect(result.current.session.status).toBe('completed');
      expect(result.current.session.currentIndex).toBe(2);

      // Backspace on completed session must be safely rejected
      act(() => {
        result.current.handleDeleteChar();
      });
      expect(result.current.session.status).toBe('completed');
      expect(result.current.session.currentIndex).toBe(2);
    });
  });

  describe('2. Unmount Safety & Timer Resource Management', () => {
    it('cancels active interval timer immediately on hook unmount to avoid memory leaks', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const { result, unmount } = renderHook(() => useTypingSession('hello'));

      // Start session to start interval timer
      act(() => {
        result.current.handleInputChar('h');
      });
      expect(result.current.session.status).toBe('active');

      // Unmount while session is active
      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      // Advance timers by 10 seconds post-unmount — must not throw or update unmounted component
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(10000);
        });
      }).not.toThrow();

      clearIntervalSpy.mockRestore();
    });

    it('survives rapid mount-input-unmount thrashing (30 cycles) without dangling timers', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      let clearCallsBefore = clearIntervalSpy.mock.calls.length;

      for (let i = 0; i < 30; i++) {
        const { result, unmount } = renderHook(() => useTypingSession(`thrash-${i}`));

        act(() => {
          result.current.handleInputChar('t');
        });

        // Fast forward slightly
        act(() => {
          vi.advanceTimersByTime(50);
        });

        unmount();
      }

      // Assert that cleanup occurred for all created sessions
      const clearCallsAfter = clearIntervalSpy.mock.calls.length;
      expect(clearCallsAfter - clearCallsBefore).toBeGreaterThanOrEqual(30);

      // Fast forward by 60 seconds; no orphan timer callbacks should trigger
      act(() => {
        vi.advanceTimersByTime(60000);
      });

      clearIntervalSpy.mockRestore();
    });

    it('unmounts cleanly during paused state', () => {
      const { result, unmount } = renderHook(() => useTypingSession('pause-test'));

      act(() => {
        result.current.handleInputChar('p');
      });
      expect(result.current.session.status).toBe('active');

      act(() => {
        result.current.pauseSession();
      });
      expect(result.current.session.status).toBe('paused');

      expect(() => unmount()).not.toThrow();

      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });

    it('unmounts cleanly after session completion', () => {
      const onComplete = vi.fn();
      const { result, unmount } = renderHook(() =>
        useTypingSession('ok', { onComplete })
      );

      act(() => {
        result.current.handleInputChar('o');
        result.current.handleInputChar('k');
      });
      expect(result.current.session.status).toBe('completed');
      expect(onComplete).toHaveBeenCalledTimes(1);

      expect(() => unmount()).not.toThrow();

      act(() => {
        vi.advanceTimersByTime(5000);
      });
    });

    it('resets cleanly when targetText changes mid-session without leaking old timers', () => {
      const { result, rerender } = renderHook(
        ({ text, opts }: { text: string; opts?: Partial<TypingOptions> }) =>
          useTypingSession(text, opts),
        {
          initialProps: { text: 'first' },
        }
      );

      act(() => {
        result.current.handleInputChar('f');
      });
      expect(result.current.session.status).toBe('active');
      expect(result.current.session.currentIndex).toBe(1);

      // Change targetText dynamically
      rerender({ text: 'second' });

      expect(result.current.session.target).toBe('second');
      expect(result.current.session.currentIndex).toBe(0);
      expect(result.current.session.status).toBe('idle');
      expect(result.current.metrics.elapsedTimeMs).toBe(0);

      // Typing in new session starts fresh timer cleanly
      act(() => {
        result.current.handleInputChar('s');
      });
      expect(result.current.session.status).toBe('active');
      expect(result.current.session.currentIndex).toBe(1);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.metrics.elapsedTimeMs).toBeGreaterThanOrEqual(400);
    });
  });
});
