import {
  ALL_STORAGE_KEYS,
  APP_METADATA,
  CURRENT_SCHEMA_VERSIONS,
} from '@/lib/constants';
import type {
  MigrationFn,
  PersistenceService,
  StorageKey,
  VersionedEnvelope,
} from '@/lib/types';

/**
 * Type guard verifying whether a value conforms to the VersionedEnvelope structure.
 */
export function isVersionedEnvelope(
  value: unknown
): value is VersionedEnvelope<unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate._version === 'number' && 'data' in candidate;
}

/**
 * Safely accesses localStorage in browser contexts, returning null during SSR
 * or if storage access is blocked by security policies.
 */
function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Suppress security or permissions error
  }
  return null;
}

/**
 * LocalStoragePersistence provides a versioned, migration-aware, SSR-safe
 * implementation of PersistenceService.
 */
export class LocalStoragePersistence implements PersistenceService {
  private readonly storage: Storage | null;
  private readonly migrationRegistry: Map<
    StorageKey,
    Map<number, MigrationFn<unknown, unknown>>
  >;

  constructor(
    customStorage?: Storage | null,
    customMigrations?: Partial<
      Record<StorageKey, Record<number, MigrationFn<unknown, unknown>>>
    >
  ) {
    this.storage = customStorage !== undefined ? customStorage : getSafeLocalStorage();
    this.migrationRegistry = new Map();

    // Initialize registry keys
    for (const key of ALL_STORAGE_KEYS) {
      this.migrationRegistry.set(key, new Map());
    }

    if (customMigrations) {
      this.registerMigrations(customMigrations);
    }
  }

  /**
   * Registers migration functions for schema evolution.
   * A migration registered at version `v` transforms data from version `v` to `v + 1`.
   */
  public registerMigration<TInput = unknown, TOutput = unknown>(
    key: StorageKey,
    fromVersion: number,
    migrationFn: MigrationFn<TInput, TOutput>
  ): void {
    let keyMap = this.migrationRegistry.get(key);
    if (!keyMap) {
      keyMap = new Map();
      this.migrationRegistry.set(key, keyMap);
    }
    keyMap.set(fromVersion, migrationFn as MigrationFn<unknown, unknown>);
  }

  private registerMigrations(
    migrations: Partial<
      Record<StorageKey, Record<number, MigrationFn<unknown, unknown>>>
    >
  ): void {
    for (const [keyStr, steps] of Object.entries(migrations)) {
      const key = keyStr as StorageKey;
      if (steps) {
        for (const [vStr, fn] of Object.entries(steps)) {
          const fromVersion = Number(vStr);
          this.registerMigration(key, fromVersion, fn);
        }
      }
    }
  }

  public load<T>(key: StorageKey): T | null {
    if (!this.storage) {
      return null;
    }

    let raw: string | null = null;
    try {
      raw = this.storage.getItem(key);
    } catch (error) {
      console.warn(`[Persistence] Failed to read key "${key}" from storage:`, error);
      return null;
    }

    if (raw === null || raw.trim() === '') {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn(
        `[Persistence] Malformed JSON found in key "${key}". Resetting or returning null:`,
        error
      );
      return null;
    }

    // Handle legacy unversioned data or envelope validation
    let envelope: VersionedEnvelope<unknown>;
    if (isVersionedEnvelope(parsed)) {
      envelope = parsed;
    } else {
      const keyMigrations = this.migrationRegistry.get(key);
      if (keyMigrations && keyMigrations.has(0)) {
        envelope = { _version: 0, data: parsed };
      } else {
        console.warn(
          `[Persistence] Unversioned or corrupt envelope found for key "${key}".`
        );
        return null;
      }
    }

    const targetVersion = CURRENT_SCHEMA_VERSIONS[key] ?? 1;
    let currentVersion = envelope._version;
    let currentData = envelope.data;

    // Apply sequential migrations if stored version is older than target version
    if (currentVersion < targetVersion) {
      const keyMigrations = this.migrationRegistry.get(key);

      while (currentVersion < targetVersion) {
        const migration = keyMigrations?.get(currentVersion);
        if (!migration) {
          console.error(
            `[Persistence] Missing migration from version ${currentVersion} to ${currentVersion + 1} for key "${key}". Aborting load.`
          );
          return null;
        }

        try {
          currentData = migration(currentData);
          currentVersion += 1;
        } catch (migrationError) {
          console.error(
            `[Persistence] Migration from version ${currentVersion} failed for key "${key}":`,
            migrationError
          );
          return null;
        }
      }

      // Automatically persist migrated data back to storage at latest schema version
      this.save(key, currentData as T);
    }

    return currentData as T;
  }

  public save<T>(key: StorageKey, data: T): void {
    if (!this.storage) {
      return;
    }

    const version = CURRENT_SCHEMA_VERSIONS[key] ?? 1;
    const envelope: VersionedEnvelope<T> = {
      _version: version,
      data,
    };

    try {
      const serialized = JSON.stringify(envelope);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error(
        `[Persistence] Failed to save key "${key}" to localStorage:`,
        error
      );
    }
  }

  public clear(key: StorageKey): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(
        `[Persistence] Failed to remove key "${key}" from localStorage:`,
        error
      );
    }
  }

  public exportAll(): string {
    const items: Partial<Record<StorageKey, VersionedEnvelope<unknown>>> = {};

    if (this.storage) {
      for (const key of ALL_STORAGE_KEYS) {
        try {
          const raw = this.storage.getItem(key);
          if (raw !== null && raw.trim() !== '') {
            const parsed = JSON.parse(raw);
            if (isVersionedEnvelope(parsed)) {
              items[key] = parsed;
            }
          }
        } catch {
          // Ignore corrupt items during export
        }
      }
    }

    const payload = {
      app: APP_METADATA.BACKUP_IDENTIFIER,
      version: APP_METADATA.CURRENT_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      items,
    };

    return JSON.stringify(payload, null, 2);
  }

  public importAll(json: string): boolean {
    if (!this.storage || !json || typeof json !== 'string') {
      return false;
    }

    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') {
        return false;
      }

      const itemsSource: Record<string, unknown> =
        'items' in parsed && parsed.items && typeof parsed.items === 'object'
          ? (parsed.items as Record<string, unknown>)
          : (parsed as Record<string, unknown>);

      let importedAny = false;

      for (const key of ALL_STORAGE_KEYS) {
        if (key in itemsSource) {
          const item = itemsSource[key];
          if (isVersionedEnvelope(item)) {
            // Write to storage and trigger load() to apply any necessary migrations
            this.storage.setItem(key, JSON.stringify(item));
            this.load(key);
            importedAny = true;
          } else if (item !== undefined && item !== null) {
            // Wrap plain unversioned payload
            this.save(key, item);
            importedAny = true;
          }
        }
      }

      return importedAny;
    } catch (error) {
      console.error('[Persistence] Import failed:', error);
      return false;
    }
  }

  public getVersion(key: StorageKey): number {
    if (!this.storage) {
      return CURRENT_SCHEMA_VERSIONS[key] ?? 1;
    }

    try {
      const raw = this.storage.getItem(key);
      if (raw !== null && raw.trim() !== '') {
        const parsed = JSON.parse(raw);
        if (isVersionedEnvelope(parsed)) {
          return parsed._version;
        }
      }
    } catch {
      // Fallback
    }

    return CURRENT_SCHEMA_VERSIONS[key] ?? 1;
  }
}

/**
 * Singleton instance of LocalStoragePersistence for production use.
 */
export const persistenceService: PersistenceService = new LocalStoragePersistence();
