'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_PREFERENCES, STORAGE_KEYS } from '@/lib/constants';
import type {
  CEFRLevel,
  ContentCategory,
  DiacriticMode,
  LanguageCode,
  Theme,
  UserPreferences,
} from '@/lib/types';
import { persistenceService } from '@/services/persistence';

/**
 * Apply theme to document element
 */
function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Apply language and direction to document element
 */
function applyLocaleToDocument(lang: LanguageCode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * In-memory state store with cross-component reactivity, multi-tab sync,
 * and deterministic SSR hydration.
 */
class PreferencesStore {
  private currentPreferences: UserPreferences;
  private readonly listeners: Set<() => void> = new Set();
  private isClientInitialized = false;

  constructor() {
    this.currentPreferences = DEFAULT_PREFERENCES;
  }

  private initClient(): void {
    if (this.isClientInitialized || typeof window === 'undefined') {
      return;
    }
    this.isClientInitialized = true;

    // Load persisted preferences
    const stored = persistenceService.load<UserPreferences>(
      STORAGE_KEYS.PREFERENCES
    );
    if (stored) {
      this.currentPreferences = { ...DEFAULT_PREFERENCES, ...stored };
      applyThemeToDocument(this.currentPreferences.theme);
      applyLocaleToDocument(this.currentPreferences.interfaceLanguage);
    }

    // Synchronize across browser tabs
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.PREFERENCES) {
        const updated = persistenceService.load<UserPreferences>(
          STORAGE_KEYS.PREFERENCES
        );
        if (updated) {
          this.currentPreferences = { ...DEFAULT_PREFERENCES, ...updated };
          applyThemeToDocument(this.currentPreferences.theme);
          applyLocaleToDocument(this.currentPreferences.interfaceLanguage);
          this.notify();
        }
      }
    });
  }

  public getSnapshot = (): UserPreferences => {
    this.initClient();
    return this.currentPreferences;
  };

  public getServerSnapshot = (): UserPreferences => {
    return DEFAULT_PREFERENCES;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.initClient();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public setPreferences = (
    updater:
      | Partial<UserPreferences>
      | ((prev: UserPreferences) => Partial<UserPreferences>)
  ): void => {
    this.initClient();
    const update =
      typeof updater === 'function' ? updater(this.currentPreferences) : updater;

    const nextPreferences: UserPreferences = {
      ...this.currentPreferences,
      ...update,
    };

    this.currentPreferences = nextPreferences;
    persistenceService.save(STORAGE_KEYS.PREFERENCES, nextPreferences);

    if (update.theme !== undefined) {
      applyThemeToDocument(nextPreferences.theme);
    }
    if (update.interfaceLanguage !== undefined) {
      applyLocaleToDocument(nextPreferences.interfaceLanguage);
    }

    this.notify();
  };

  public reset = (): void => {
    this.currentPreferences = DEFAULT_PREFERENCES;
    persistenceService.save(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
    applyThemeToDocument(DEFAULT_PREFERENCES.theme);
    applyLocaleToDocument(DEFAULT_PREFERENCES.interfaceLanguage);
    this.notify();
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const preferencesStore = new PreferencesStore();

export interface UsePreferencesReturn {
  readonly preferences: UserPreferences;
  readonly updatePreferences: (
    updater:
      | Partial<UserPreferences>
      | ((prev: UserPreferences) => Partial<UserPreferences>)
  ) => void;
  readonly updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  readonly toggleTheme: () => void;
  readonly setInterfaceLanguage: (lang: LanguageCode) => void;
  readonly setPracticeLanguage: (lang: LanguageCode) => void;
  readonly setTranslationLanguage: (lang: LanguageCode) => void;
  readonly setKeyboardLayout: (layoutId: string) => void;
  readonly setTheme: (theme: Theme) => void;
  readonly setCefrLevel: (level: CEFRLevel) => void;
  readonly setContentCategory: (category: ContentCategory) => void;
  readonly setDiacriticMatching: (mode: DiacriticMode) => void;
  readonly resetPreferences: () => void;
}

export function usePreferences(): UsePreferencesReturn {
  const preferences = useSyncExternalStore(
    preferencesStore.subscribe,
    preferencesStore.getSnapshot,
    preferencesStore.getServerSnapshot
  );

  const updatePreferences = useCallback(
    (
      updater:
        | Partial<UserPreferences>
        | ((prev: UserPreferences) => Partial<UserPreferences>)
    ) => {
      preferencesStore.setPreferences(updater);
    },
    []
  );

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      preferencesStore.setPreferences({ [key]: value });
    },
    []
  );

  const toggleTheme = useCallback(() => {
    const current = preferencesStore.getSnapshot().theme;
    let next: Theme;
    if (current === 'light') {
      next = 'dark';
    } else if (current === 'dark') {
      next = 'light';
    } else {
      // If system, invert current media query
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      next = prefersDark ? 'light' : 'dark';
    }
    preferencesStore.setPreferences({ theme: next });
  }, []);

  const setInterfaceLanguage = useCallback((interfaceLanguage: LanguageCode) => {
    preferencesStore.setPreferences({ interfaceLanguage });
  }, []);

  const setPracticeLanguage = useCallback((practiceLanguage: LanguageCode) => {
    preferencesStore.setPreferences({ practiceLanguage });
  }, []);

  const setTranslationLanguage = useCallback((translationLanguage: LanguageCode) => {
    preferencesStore.setPreferences({ translationLanguage });
  }, []);

  const setKeyboardLayout = useCallback((keyboardLayout: string) => {
    preferencesStore.setPreferences({ keyboardLayout });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    preferencesStore.setPreferences({ theme });
  }, []);

  const setCefrLevel = useCallback((cefrLevel: CEFRLevel) => {
    preferencesStore.setPreferences({ cefrLevel });
  }, []);

  const setContentCategory = useCallback((contentCategory: ContentCategory) => {
    preferencesStore.setPreferences({ contentCategory });
  }, []);

  const setDiacriticMatching = useCallback((diacriticMatching: DiacriticMode) => {
    preferencesStore.setPreferences({ diacriticMatching });
  }, []);

  const resetPreferences = useCallback(() => {
    preferencesStore.reset();
  }, []);

  return {
    preferences,
    updatePreferences,
    updatePreference,
    toggleTheme,
    setInterfaceLanguage,
    setPracticeLanguage,
    setTranslationLanguage,
    setKeyboardLayout,
    setTheme,
    setCefrLevel,
    setContentCategory,
    setDiacriticMatching,
    resetPreferences,
  };
}
