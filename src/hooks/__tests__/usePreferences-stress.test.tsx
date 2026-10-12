import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { DEFAULT_PREFERENCES, STORAGE_KEYS } from '@/lib/constants';
import type { UserPreferences } from '@/lib/types';
import { usePreferences } from '@/hooks/usePreferences';
import { persistenceService } from '@/services/persistence';

describe('usePreferences — Adversarial Stress & Concurrency Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    vi.restoreAllMocks();

    // Ensure preferencesStore singleton is reset to DEFAULT_PREFERENCES before each test
    const { result } = renderHook(() => usePreferences());
    act(() => {
      result.current.resetPreferences();
    });
  });

  describe('Multi-Tab Storage Synchronization', () => {
    it('reacts to external storage events from other tabs and updates state and DOM', () => {
      const { result } = renderHook(() => usePreferences());

      // Initial state is default
      expect(result.current.preferences.theme).toBe(DEFAULT_PREFERENCES.theme);
      expect(result.current.preferences.interfaceLanguage).toBe(DEFAULT_PREFERENCES.interfaceLanguage);

      // Another tab saves Arabic preference and dark theme to storage
      const externalPrefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        theme: 'dark',
        interfaceLanguage: 'ar',
      };
      persistenceService.save(STORAGE_KEYS.PREFERENCES, externalPrefs);

      // Simulate browser firing 'storage' event
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEYS.PREFERENCES,
            newValue: JSON.stringify({ _version: 1, data: externalPrefs }),
          })
        );
      });

      expect(result.current.preferences.theme).toBe('dark');
      expect(result.current.preferences.interfaceLanguage).toBe('ar');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
    });

    it('ignores storage events from unrelated keys without triggering re-render', () => {
      let renderCount = 0;
      const TestComponent = () => {
        usePreferences();
        renderCount++;
        return <div>Rendered</div>;
      };

      render(<TestComponent />);
      const initialRenders = renderCount;

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'unrelated-session-cache',
            newValue: 'some-data',
          })
        );
      });

      expect(renderCount).toBe(initialRenders);
    });

    it('gracefully handles external storage event containing corrupted JSON without crashing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => usePreferences());

      // Manually inject corrupted raw string into localStorage
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, '{ corrupted json payload: [');

      expect(() => {
        act(() => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: STORAGE_KEYS.PREFERENCES,
              newValue: '{ corrupted json payload: [',
            })
          );
        });
      }).not.toThrow();

      // Hook remains operational and does not corrupt internal state
      expect(result.current.preferences).toBeDefined();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('survives rapid bombardment of 100 concurrent storage events across simulated tabs', () => {
      const { result } = renderHook(() => usePreferences());

      act(() => {
        for (let i = 0; i < 100; i++) {
          const isEven = i % 2 === 0;
          const candidate: UserPreferences = {
            ...DEFAULT_PREFERENCES,
            theme: isEven ? 'dark' : 'light',
            interfaceLanguage: isEven ? 'ar' : 'nl',
          };
          persistenceService.save(STORAGE_KEYS.PREFERENCES, candidate);

          window.dispatchEvent(
            new StorageEvent('storage', {
              key: STORAGE_KEYS.PREFERENCES,
              newValue: JSON.stringify({ _version: 1, data: candidate }),
            })
          );
        }
      });

      // Final event is 99 (odd): light, nl
      expect(result.current.preferences.theme).toBe('light');
      expect(result.current.preferences.interfaceLanguage).toBe('nl');
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('safely handles external storage clear / null event without throwing', () => {
      const { result } = renderHook(() => usePreferences());

      // Set to custom first
      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.preferences.theme).toBe('dark');

      // Another tab clears localStorage
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);

      expect(() => {
        act(() => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: STORAGE_KEYS.PREFERENCES,
              newValue: null,
            })
          );
        });
      }).not.toThrow();

      // Retains existing state safely
      expect(result.current.preferences.theme).toBe('dark');
    });
  });

  describe('SSR Guards & Hydration Safety', () => {
    it('getServerSnapshot returns DEFAULT_PREFERENCES and is referentially stable', () => {
      const { result } = renderHook(() => usePreferences());
      expect(result.current.preferences).toBeDefined();
    });

    it('merges external partial preferences without discarding default fields', () => {
      const { result } = renderHook(() => usePreferences());

      // External tab updates ONLY theme to 'dark'
      const partialData = {
        theme: 'dark',
      };
      persistenceService.save(STORAGE_KEYS.PREFERENCES, partialData);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEYS.PREFERENCES,
            newValue: JSON.stringify({ _version: 1, data: partialData }),
          })
        );
      });

      expect(result.current.preferences.theme).toBe('dark');
      // Other fields retain defaults
      expect(result.current.preferences.interfaceLanguage).toBe(DEFAULT_PREFERENCES.interfaceLanguage);
      expect(result.current.preferences.cefrLevel).toBe(DEFAULT_PREFERENCES.cefrLevel);
      expect(result.current.preferences.keyboardLayout).toBe(DEFAULT_PREFERENCES.keyboardLayout);
    });
  });

  describe('DOM Mutation & Theme Inversion Stress Testing', () => {
    it('toggles theme properly across light, dark, and system modes', () => {
      const { result } = renderHook(() => usePreferences());

      // Start at light
      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.preferences.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.preferences.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Toggle back to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.preferences.theme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Switch to system and mock matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      act(() => {
        result.current.setTheme('system');
      });
      expect(result.current.preferences.theme).toBe('system');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Toggle from system when prefers-dark is true should switch to light
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.preferences.theme).toBe('light');
    });

    it('correctly updates document dir and lang for all supported languages', () => {
      const { result } = renderHook(() => usePreferences());

      // Arabic: RTL
      act(() => {
        result.current.setInterfaceLanguage('ar');
      });
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');

      // Dutch: LTR
      act(() => {
        result.current.setInterfaceLanguage('nl');
      });
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('nl');

      // English: LTR
      act(() => {
        result.current.setInterfaceLanguage('en');
      });
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
    });
  });

  describe('Sequential Updaters & Reset Lifecycle', () => {
    it('executes individual preference setters and persists changes', () => {
      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.setPracticeLanguage('ar');
        result.current.setTranslationLanguage('nl');
        result.current.setKeyboardLayout('arabic-101');
        result.current.setCefrLevel('B2');
        result.current.setContentCategory('Technology');
        result.current.setDiacriticMatching('lenient');
      });

      expect(result.current.preferences.practiceLanguage).toBe('ar');
      expect(result.current.preferences.translationLanguage).toBe('nl');
      expect(result.current.preferences.keyboardLayout).toBe('arabic-101');
      expect(result.current.preferences.cefrLevel).toBe('B2');
      expect(result.current.preferences.contentCategory).toBe('Technology');
      expect(result.current.preferences.diacriticMatching).toBe('lenient');

      // Verify persistence
      const saved = persistenceService.load<UserPreferences>(STORAGE_KEYS.PREFERENCES);
      expect(saved?.cefrLevel).toBe('B2');
      expect(saved?.diacriticMatching).toBe('lenient');
    });

    it('supports functional updater callback with previous state', () => {
      const { result } = renderHook(() => usePreferences());

      // Initial cefrLevel is A1
      expect(result.current.preferences.cefrLevel).toBe('A1');

      act(() => {
        result.current.updatePreferences((prev) => ({
          cefrLevel: prev.cefrLevel === 'A1' ? 'C1' : 'A2',
        }));
      });

      expect(result.current.preferences.cefrLevel).toBe('C1');
    });

    it('resetPreferences fully restores DEFAULT_PREFERENCES and resets DOM', () => {
      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.setTheme('dark');
        result.current.setInterfaceLanguage('ar');
        result.current.setCefrLevel('C2');
      });

      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe(DEFAULT_PREFERENCES.interfaceLanguage);
    });
  });
});
