import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/lib/constants';
import type { UserPreferences } from '@/lib/types';
import {
  isVersionedEnvelope,
  LocalStoragePersistence,
} from '@/services/persistence';

/**
 * Mock Storage implementation simulating browser localStorage in Node test runner.
 */
class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('LocalStoragePersistence', () => {
  let mockStorage: MockStorage;
  let persistence: LocalStoragePersistence;

  beforeEach(() => {
    mockStorage = new MockStorage();
    persistence = new LocalStoragePersistence(mockStorage);
  });

  describe('Basic CRUD Operations', () => {
    it('saves and loads data wrapped in a versioned envelope', () => {
      const preferencesData: Partial<UserPreferences> = {
        interfaceLanguage: 'nl',
        theme: 'dark',
      };

      persistence.save(STORAGE_KEYS.PREFERENCES, preferencesData);

      // Verify raw storage content includes _version envelope
      const rawStored = mockStorage.getItem(STORAGE_KEYS.PREFERENCES);
      expect(rawStored).not.toBeNull();
      const parsed = JSON.parse(rawStored!);
      expect(parsed._version).toBe(1);
      expect(parsed.data).toEqual(preferencesData);

      // Verify load returns unpacked data
      const loaded = persistence.load<Partial<UserPreferences>>(
        STORAGE_KEYS.PREFERENCES
      );
      expect(loaded).toEqual(preferencesData);
    });

    it('returns null when loading a non-existent key', () => {
      const result = persistence.load(STORAGE_KEYS.STATS);
      expect(result).toBeNull();
    });

    it('clears stored item and subsequent load returns null', () => {
      persistence.save(STORAGE_KEYS.PROGRESS, { completedLessons: ['lesson-1'] });
      expect(persistence.load(STORAGE_KEYS.PROGRESS)).not.toBeNull();

      persistence.clear(STORAGE_KEYS.PROGRESS);
      expect(persistence.load(STORAGE_KEYS.PROGRESS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.PROGRESS)).toBeNull();
    });

    it('verifies envelope format helper isVersionedEnvelope', () => {
      expect(isVersionedEnvelope({ _version: 1, data: {} })).toBe(true);
      expect(isVersionedEnvelope({ _version: '1', data: {} })).toBe(false);
      expect(isVersionedEnvelope({ data: {} })).toBe(false);
      expect(isVersionedEnvelope(null)).toBe(false);
      expect(isVersionedEnvelope('string')).toBe(false);
    });
  });

  describe('Schema Migrations', () => {
    it('executes a single-step migration when stored version is behind', () => {
      // Store older version 0 data in mockStorage
      const legacyData = { lang: 'en', darkMode: true };
      mockStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ _version: 0, data: legacyData })
      );

      // Register migration from version 0 to version 1
      persistence.registerMigration<{ lang: string; darkMode: boolean }, Partial<UserPreferences>>(
        STORAGE_KEYS.PREFERENCES,
        0,
        (old) => ({
          interfaceLanguage: old.lang === 'en' ? 'en' : 'nl',
          theme: old.darkMode ? 'dark' : 'light',
        })
      );

      const result = persistence.load<Partial<UserPreferences>>(
        STORAGE_KEYS.PREFERENCES
      );

      expect(result).toEqual({
        interfaceLanguage: 'en',
        theme: 'dark',
      });

      // Verify upgraded envelope is persisted back to storage
      const rawUpdated = mockStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const parsedUpdated = JSON.parse(rawUpdated!);
      expect(parsedUpdated._version).toBe(1);
      expect(parsedUpdated.data).toEqual(result);
    });

    it('executes multi-step sequential migrations (v0 -> v1 -> v2)', () => {
      // Simulate target schema version 2
      const customPersistence = new LocalStoragePersistence(mockStorage, {
        [STORAGE_KEYS.PREFERENCES]: {
          0: (old: unknown) => ({ ...(old as Record<string, unknown>), step1: true }),
          1: (old: unknown) => ({ ...(old as Record<string, unknown>), step2: true, finalized: true }),
        },
      });

      mockStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ _version: 0, data: { base: 'initial' } })
      );

      const result = customPersistence.load<Record<string, unknown>>(
        STORAGE_KEYS.PREFERENCES
      );

      expect(result).toBeDefined();
      expect(result?.step1).toBe(true);
    });

    it('handles legacy unversioned raw data using v0 migration', () => {
      mockStorage.setItem(
        STORAGE_KEYS.VOCABULARY,
        JSON.stringify([{ word: 'test' }])
      );

      persistence.registerMigration<unknown[], { words: unknown[] }>(
        STORAGE_KEYS.VOCABULARY,
        0,
        (legacyArray) => ({ words: legacyArray })
      );

      const loaded = persistence.load<{ words: Array<{ word: string }> }>(STORAGE_KEYS.VOCABULARY);
      expect(loaded).toEqual({ words: [{ word: 'test' }] });
    });

    it('aborts safely when a required migration step is missing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStorage.setItem(
        STORAGE_KEYS.STATS,
        JSON.stringify({ _version: 0, data: { totalSessions: 5 } })
      );

      // No migration registered for v0
      const loaded = persistence.load(STORAGE_KEYS.STATS);
      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed JSON without crashing and returns null', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockStorage.setItem(STORAGE_KEYS.PREFERENCES, '{"bad_json: missing closing bracket');
      const result = persistence.load(STORAGE_KEYS.PREFERENCES);

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('handles empty string in storage returning null', () => {
      mockStorage.setItem(STORAGE_KEYS.STATS, '   ');
      const result = persistence.load(STORAGE_KEYS.STATS);
      expect(result).toBeNull();
    });

    it('handles QuotaExceededError on save gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const failingStorage = new MockStorage();
      failingStorage.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      const failingPersistence = new LocalStoragePersistence(failingStorage);
      expect(() => {
        failingPersistence.save(STORAGE_KEYS.PREFERENCES, { theme: 'light' });
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('guards against SSR execution where storage is null', () => {
      const ssrPersistence = new LocalStoragePersistence(null);

      expect(ssrPersistence.load(STORAGE_KEYS.PREFERENCES)).toBeNull();
      expect(() => ssrPersistence.save(STORAGE_KEYS.PREFERENCES, {})).not.toThrow();
      expect(() => ssrPersistence.clear(STORAGE_KEYS.PREFERENCES)).not.toThrow();
      expect(ssrPersistence.exportAll()).toContain('"items": {}');
      expect(ssrPersistence.importAll('{}')).toBe(false);
      expect(ssrPersistence.getVersion(STORAGE_KEYS.PREFERENCES)).toBe(1);
    });
  });

  describe('Export & Import', () => {
    it('exports all stored keys and imports them into a clean storage instance', () => {
      persistence.save(STORAGE_KEYS.PREFERENCES, { theme: 'dark', interfaceLanguage: 'ar' });
      persistence.save(STORAGE_KEYS.PROGRESS, { completedLessons: ['lesson-1', 'lesson-2'] });

      const exportedJson = persistence.exportAll();
      expect(exportedJson).toContain('keylingo');
      expect(exportedJson).toContain('keylingo-preferences');
      expect(exportedJson).toContain('keylingo-progress');

      // Clear storage
      persistence.clear(STORAGE_KEYS.PREFERENCES);
      persistence.clear(STORAGE_KEYS.PROGRESS);
      expect(persistence.load(STORAGE_KEYS.PREFERENCES)).toBeNull();

      // Import back
      const importSuccess = persistence.importAll(exportedJson);
      expect(importSuccess).toBe(true);

      const restoredPrefs = persistence.load<Partial<UserPreferences>>(STORAGE_KEYS.PREFERENCES);
      expect(restoredPrefs?.theme).toBe('dark');
      expect(restoredPrefs?.interfaceLanguage).toBe('ar');

      const restoredProgress = persistence.load<{ completedLessons: string[] }>(STORAGE_KEYS.PROGRESS);
      expect(restoredProgress?.completedLessons).toEqual(['lesson-1', 'lesson-2']);
    });

    it('rejects invalid or non-object JSON during import', () => {
      expect(persistence.importAll('bad json')).toBe(false);
      expect(persistence.importAll('')).toBe(false);
      expect(persistence.importAll('123')).toBe(false);
    });
  });

  describe('Version Retrieval', () => {
    it('returns the envelope schema version of stored items', () => {
      persistence.save(STORAGE_KEYS.PREFERENCES, { theme: 'light' });
      expect(persistence.getVersion(STORAGE_KEYS.PREFERENCES)).toBe(1);
    });

    it('returns default schema version when key does not exist', () => {
      expect(persistence.getVersion(STORAGE_KEYS.STATS)).toBe(1);
    });
  });
});
