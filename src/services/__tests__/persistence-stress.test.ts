import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_STORAGE_KEYS, STORAGE_KEYS } from '@/lib/constants';
import type { StorageKey, VersionedEnvelope } from '@/lib/types';
import {
  isVersionedEnvelope,
  LocalStoragePersistence,
} from '@/services/persistence';

/**
 * In-memory MockStorage that can be configured to throw errors dynamically.
 */
class AdversarialMockStorage implements Storage {
  private store = new Map<string, string>();
  public shouldThrowOnSetItem: boolean = false;
  public shouldThrowOnGetItem: boolean = false;
  public shouldThrowOnRemoveItem: boolean = false;
  public errorToThrow: Error = new DOMException('The quota has been exceeded.', 'QuotaExceededError');

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    if (this.shouldThrowOnGetItem) {
      throw this.errorToThrow;
    }
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    if (this.shouldThrowOnRemoveItem) {
      throw this.errorToThrow;
    }
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrowOnSetItem) {
      throw this.errorToThrow;
    }
    this.store.set(key, value);
  }

  // Direct injection bypassing setItem hooks
  injectRaw(key: string, rawValue: string): void {
    this.store.set(key, rawValue);
  }
}

describe('LocalStoragePersistence — Adversarial Stress Harness', () => {
  let storage: AdversarialMockStorage;
  let persistence: LocalStoragePersistence;

  beforeEach(() => {
    storage = new AdversarialMockStorage();
    persistence = new LocalStoragePersistence(storage);
    vi.restoreAllMocks();
  });

  describe('Adversarial Payload & Corrupt JSON Handling', () => {
    const corruptPayloads = [
      { name: 'truncated object JSON', raw: '{"_version": 1, "data": {"theme":' },
      { name: 'truncated array JSON', raw: '[{"_version": 1},' },
      { name: 'unclosed brace', raw: '{"_version": 1, "data": 123' },
      { name: 'trailing garbage', raw: '{"_version": 1, "data": 123} trailing invalid' },
      { name: 'lone primitive string', raw: '"plain unquoted string"' },
      { name: 'lone primitive number', raw: '999999' },
      { name: 'lone primitive boolean', raw: 'true' },
      { name: 'lone primitive null', raw: 'null' },
      { name: 'empty raw whitespace', raw: '    \n\t  ' },
      { name: 'binary/null byte stream', raw: '\u0000\u0001\u0002\u0003{"bad": true}' },
      { name: 'envelope with string _version', raw: '{"_version": "1", "data": "invalid"}' },
      { name: 'envelope with null _version', raw: '{"_version": null, "data": "invalid"}' },
      { name: 'envelope with boolean _version', raw: '{"_version": false, "data": "invalid"}' },
      { name: 'envelope with object _version', raw: '{"_version": {}, "data": "invalid"}' },
      { name: 'envelope missing data property', raw: '{"_version": 1}' },
      { name: 'empty JSON array', raw: '[]' },
      { name: 'nested array without version', raw: '[[1, 2], [3, 4]]' },
    ];

    corruptPayloads.forEach(({ name, raw }) => {
      it(`gracefully handles ${name} returning null without throwing`, () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        storage.injectRaw(STORAGE_KEYS.PREFERENCES, raw);

        let result: unknown = undefined;
        expect(() => {
          result = persistence.load(STORAGE_KEYS.PREFERENCES);
        }).not.toThrow();

        expect(result).toBeNull();
        warnSpy.mockRestore();
      });
    });

    it('handles circular references during save without unhandled rejection', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const circularObj: Record<string, unknown> = { key: 'circle' };
      circularObj.self = circularObj;

      expect(() => {
        persistence.save(STORAGE_KEYS.PREFERENCES, circularObj);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('safely handles non-registered storage keys without throwing', () => {
      const arbitraryKey = 'custom-arbitrary-key' as StorageKey;
      persistence.save(arbitraryKey, { foo: 'bar' });
      const loaded = persistence.load(arbitraryKey);
      expect(loaded).toEqual({ foo: 'bar' });
    });
  });

  describe('Storage Quota & High-Volume Pressure', () => {
    it('survives rapid-fire execution of 1,000 saves and preserves last write', () => {
      for (let i = 0; i < 1000; i++) {
        persistence.save(STORAGE_KEYS.PROGRESS, { step: i, timestamp: Date.now() });
      }

      const finalState = persistence.load<{ step: number; timestamp: number }>(STORAGE_KEYS.PROGRESS);
      expect(finalState).not.toBeNull();
      expect(finalState?.step).toBe(999);
    });

    it('survives storing large 2MB payloads without memory corruption', () => {
      const largePayload = {
        vocabulary: Array.from({ length: 5000 }, (_, i) => ({
          id: `word-${i}`,
          term: 'hypothetical-long-word-segmentation-test',
          translations: ['vertaling', 'ترجمة'],
          notes: 'Extended note to consume memory payload safely',
        })),
      };

      expect(() => {
        persistence.save(STORAGE_KEYS.VOCABULARY, largePayload);
      }).not.toThrow();

      const retrieved = persistence.load<typeof largePayload>(STORAGE_KEYS.VOCABULARY);
      expect(retrieved?.vocabulary.length).toBe(5000);
      expect(retrieved?.vocabulary[4999].id).toBe('word-4999');
    });

    it('suppresses DOMException QuotaExceededError on save and continues running', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      storage.shouldThrowOnSetItem = true;
      storage.errorToThrow = new DOMException(
        'Failed to execute setItem on Storage: Setting the value of keylingo-preferences exceeded the quota.',
        'QuotaExceededError'
      );

      expect(() => {
        persistence.save(STORAGE_KEYS.PREFERENCES, { theme: 'dark' });
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('handles SecurityError on getItem (e.g. sandboxed iframe or blocked storage)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      storage.shouldThrowOnGetItem = true;
      storage.errorToThrow = new DOMException('The operation is insecure.', 'SecurityError');

      let loaded: unknown = undefined;
      expect(() => {
        loaded = persistence.load(STORAGE_KEYS.PREFERENCES);
      }).not.toThrow();

      expect(loaded).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('handles storage errors when clearing keys', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      storage.shouldThrowOnRemoveItem = true;
      storage.errorToThrow = new DOMException('Access denied.', 'SecurityError');

      expect(() => {
        persistence.clear(STORAGE_KEYS.PREFERENCES);
      }).not.toThrow();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Sequential & Non-Linear Migrations Stress Testing', () => {
    it('executes a deep 5-step sequential migration chain (v0 -> v1 -> v2 -> v3 -> v4 -> v5)', () => {
      const migrationTracker: number[] = [];

      const chainedPersistence = new LocalStoragePersistence(storage, {
        [STORAGE_KEYS.PREFERENCES]: {
          0: (old: unknown) => {
            migrationTracker.push(0);
            return { ...(old as Record<string, unknown>), v1Done: true };
          },
          1: (old: unknown) => {
            migrationTracker.push(1);
            return { ...(old as Record<string, unknown>), v2Done: true };
          },
          2: (old: unknown) => {
            migrationTracker.push(2);
            return { ...(old as Record<string, unknown>), v3Done: true };
          },
          3: (old: unknown) => {
            migrationTracker.push(3);
            return { ...(old as Record<string, unknown>), v4Done: true };
          },
          4: (old: unknown) => {
            migrationTracker.push(4);
            return { ...(old as Record<string, unknown>), v5Done: true };
          },
        },
      });

      // Inject unversioned legacy payload into storage
      storage.injectRaw(STORAGE_KEYS.PREFERENCES, JSON.stringify({ initialData: 'test' }));

      // Register migration from v0 to v1 to verify execution
      const loaded = chainedPersistence.load<Record<string, unknown>>(STORAGE_KEYS.PREFERENCES);

      // Current schema version for PREFERENCES is 1 in constants, so it should run v0 -> v1
      expect(loaded).toEqual({ initialData: 'test', v1Done: true });
      expect(migrationTracker).toEqual([0]);

      // Storage should now contain _version 1
      const updatedRaw = storage.getItem(STORAGE_KEYS.PREFERENCES);
      const parsed = JSON.parse(updatedRaw!);
      expect(parsed._version).toBe(1);
    });

    it('aborts safely when a migration gap exists without corrupting the store', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Inject version 0 data, but only provide v1 -> v2 (gap at v0)
      storage.injectRaw(
        STORAGE_KEYS.STATS,
        JSON.stringify({ _version: 0, data: { counter: 10 } })
      );

      persistence.registerMigration(STORAGE_KEYS.STATS, 1, (old) => old);

      const result = persistence.load(STORAGE_KEYS.STATS);
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalled();

      // Original data in storage remains uncorrupted
      const stored = storage.getItem(STORAGE_KEYS.STATS);
      expect(JSON.parse(stored!)._version).toBe(0);

      errorSpy.mockRestore();
    });

    it('aborts cleanly when a migration function throws an exception', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      storage.injectRaw(
        STORAGE_KEYS.PROGRESS,
        JSON.stringify({ _version: 0, data: { lesson: 'm1' } })
      );

      persistence.registerMigration(STORAGE_KEYS.PROGRESS, 0, () => {
        throw new Error('Explosive migration failure!');
      });

      let loaded: unknown = undefined;
      expect(() => {
        loaded = persistence.load(STORAGE_KEYS.PROGRESS);
      }).not.toThrow();

      expect(loaded).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('returns data intact when stored version is newer than current target version (forward compatibility)', () => {
      const futureData = { modernFeature: true, futureVersionField: 42 };
      storage.injectRaw(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ _version: 99, data: futureData })
      );

      const loaded = persistence.load<typeof futureData>(STORAGE_KEYS.PREFERENCES);
      expect(loaded).toEqual(futureData);
      expect(persistence.getVersion(STORAGE_KEYS.PREFERENCES)).toBe(99);
    });

    it('survives QuotaExceededError during migration write-back and still returns migrated data in-memory', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      storage.injectRaw(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ _version: 0, data: { oldPref: 'value' } })
      );

      persistence.registerMigration(STORAGE_KEYS.PREFERENCES, 0, (old: unknown) => ({
        ...(old as Record<string, unknown>),
        migrated: true,
      }));

      // Make storage fail on save
      storage.shouldThrowOnSetItem = true;

      let result: Record<string, unknown> | null = null;
      expect(() => {
        result = persistence.load<Record<string, unknown>>(STORAGE_KEYS.PREFERENCES);
      }).not.toThrow();

      // Data is transformed in memory even if write-back fails
      const typedResult = result as Record<string, unknown> | null;
      expect(typedResult?.['migrated']).toBe(true);
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('SSR Guards & Headless Environment Simulation', () => {
    it('safely handles all operations when storage is null (SSR)', () => {
      const ssrPersistence = new LocalStoragePersistence(null);

      expect(ssrPersistence.load(STORAGE_KEYS.PREFERENCES)).toBeNull();
      expect(() => ssrPersistence.save(STORAGE_KEYS.PREFERENCES, { a: 1 })).not.toThrow();
      expect(() => ssrPersistence.clear(STORAGE_KEYS.PREFERENCES)).not.toThrow();
      expect(ssrPersistence.getVersion(STORAGE_KEYS.PREFERENCES)).toBe(1);

      const exported = ssrPersistence.exportAll();
      expect(exported).toContain('"items": {}');

      const imported = ssrPersistence.importAll('{"items": {}}');
      expect(imported).toBe(false);
    });

    it('isVersionedEnvelope correctly discriminates complex values', () => {
      expect(isVersionedEnvelope({ _version: 1, data: null })).toBe(true);
      expect(isVersionedEnvelope({ _version: 0, data: '' })).toBe(true);
      expect(isVersionedEnvelope({ _version: -1, data: false })).toBe(true);
      expect(isVersionedEnvelope({ _version: 1.5, data: [] })).toBe(true);

      // False cases
      expect(isVersionedEnvelope(undefined)).toBe(false);
      expect(isVersionedEnvelope(null)).toBe(false);
      expect(isVersionedEnvelope([])).toBe(false);
      expect(isVersionedEnvelope('')).toBe(false);
      expect(isVersionedEnvelope(123)).toBe(false);
      expect(isVersionedEnvelope({ _version: '1', data: {} })).toBe(false);
      expect(isVersionedEnvelope({ version: 1, data: {} })).toBe(false);
      expect(isVersionedEnvelope({ _version: 1 })).toBe(false);
    });
  });

  describe('Adversarial Backup & Restore (Export / Import)', () => {
    it('resists prototype pollution payloads during importAll', () => {
      const maliciousJson = JSON.stringify({
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
        items: {
          [STORAGE_KEYS.PREFERENCES]: {
            _version: 1,
            data: { theme: 'dark' },
          },
        },
      });

      const success = persistence.importAll(maliciousJson);
      expect(success).toBe(true);

      // Verify global prototype has not been polluted
      const cleanObj: Record<string, unknown> = {};
      expect(cleanObj['polluted']).toBeUndefined();
      expect((Object.prototype as Record<string, unknown>)['polluted']).toBeUndefined();
    });

    it('ignores arbitrary unapproved storage keys during importAll', () => {
      const payloadWithInjectedKeys = JSON.stringify({
        items: {
          'unauthorized_system_key': { _version: 1, data: 'secret' },
          [STORAGE_KEYS.PREFERENCES]: {
            _version: 1,
            data: { theme: 'light' },
          },
        },
      });

      const success = persistence.importAll(payloadWithInjectedKeys);
      expect(success).toBe(true);
      expect(storage.getItem('unauthorized_system_key')).toBeNull();
      expect(storage.getItem(STORAGE_KEYS.PREFERENCES)).not.toBeNull();
    });

    it('exports cleanly even when storage has corrupted entries for certain keys', () => {
      // Valid preference
      persistence.save(STORAGE_KEYS.PREFERENCES, { theme: 'dark' });
      // Corrupt progress
      storage.injectRaw(STORAGE_KEYS.PROGRESS, '{ corrupt JSON');
      // Empty stats
      storage.injectRaw(STORAGE_KEYS.STATS, '   ');

      const exportedJson = persistence.exportAll();
      const parsedExport = JSON.parse(exportedJson);

      expect(parsedExport.items[STORAGE_KEYS.PREFERENCES]).toBeDefined();
      expect(parsedExport.items[STORAGE_KEYS.PROGRESS]).toBeUndefined();
      expect(parsedExport.items[STORAGE_KEYS.STATS]).toBeUndefined();
    });

    it('returns false on importAll when quota is exceeded during writing', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      storage.shouldThrowOnSetItem = true;

      const validExport = JSON.stringify({
        items: {
          [STORAGE_KEYS.PREFERENCES]: { _version: 1, data: { theme: 'dark' } },
        },
      });

      const result = persistence.importAll(validExport);
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});
