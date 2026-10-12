import type {
  CEFRLevel,
  ContentCategory,
  Direction,
  LanguageCode,
  StorageKey,
  UserPreferences,
  UserProgress,
  UserStats,
  UserVocabulary,
} from './types';

// ============================================================================
// 1. Application Metadata
// ============================================================================

export const APP_METADATA = {
  NAME: 'KeyLingo',
  BACKUP_IDENTIFIER: 'keylingo',
  CURRENT_BACKUP_VERSION: 1,
} as const;

// ============================================================================
// 2. Storage Keys & Schema Versions
// ============================================================================

export const STORAGE_KEYS = {
  PREFERENCES: 'keylingo-preferences',
  PROGRESS: 'keylingo-progress',
  STATS: 'keylingo-stats',
  VOCABULARY: 'keylingo-vocabulary',
} as const;

export const ALL_STORAGE_KEYS: readonly StorageKey[] = [
  STORAGE_KEYS.PREFERENCES,
  STORAGE_KEYS.PROGRESS,
  STORAGE_KEYS.STATS,
  STORAGE_KEYS.VOCABULARY,
] as const;

export const CURRENT_SCHEMA_VERSIONS: Readonly<Record<StorageKey, number>> = {
  [STORAGE_KEYS.PREFERENCES]: 1,
  [STORAGE_KEYS.PROGRESS]: 1,
  [STORAGE_KEYS.STATS]: 1,
  [STORAGE_KEYS.VOCABULARY]: 1,
} as const;

// ============================================================================
// 3. Defaults for Persistence Models
// ============================================================================

export const DEFAULT_PREFERENCES: Readonly<UserPreferences> = {
  interfaceLanguage: 'en',
  practiceLanguage: 'en',
  translationLanguage: 'nl',
  keyboardLayout: 'qwerty-us',
  theme: 'light',
  cefrLevel: 'A1',
  contentCategory: 'Everyday',
  diacriticMatching: 'lenient',
} as const;

export const DEFAULT_PROGRESS: Readonly<UserProgress> = {
  completedLessons: [],
  lessons: {},
  sessionHistory: [],
} as const;

export const DEFAULT_STATS: Readonly<UserStats> = {
  cumulativeGrossWpm: 0,
  cumulativeNetWpm: 0,
  cumulativeAccuracy: 100,
  totalSessions: 0,
  totalPracticeTimeMs: 0,
  perKeyErrors: {},
  streakDays: 0,
} as const;

export const DEFAULT_VOCABULARY: Readonly<UserVocabulary> = {
  words: [],
} as const;

// ============================================================================
// 4. Language & Layout Metadata
// ============================================================================

export interface LanguageMetadata {
  readonly code: LanguageCode;
  readonly name: string;
  readonly nativeName: string;
  readonly direction: Direction;
  readonly defaultLayout: string;
}

export const SUPPORTED_LANGUAGES: Readonly<Record<LanguageCode, LanguageMetadata>> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    defaultLayout: 'qwerty-us',
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    direction: 'ltr',
    defaultLayout: 'us-international',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    defaultLayout: 'arabic-101',
  },
} as const;

export interface LayoutMetadata {
  readonly id: string;
  readonly name: string;
  readonly language: LanguageCode;
  readonly direction: Direction;
}

export const SUPPORTED_LAYOUTS: readonly LayoutMetadata[] = [
  {
    id: 'qwerty-us',
    name: 'US QWERTY',
    language: 'en',
    direction: 'ltr',
  },
  {
    id: 'us-international',
    name: 'US-International (Dutch)',
    language: 'nl',
    direction: 'ltr',
  },
  {
    id: 'arabic-101',
    name: 'Arabic 101',
    language: 'ar',
    direction: 'rtl',
  },
] as const;

// ============================================================================
// 5. Filter Dimensions
// ============================================================================

export const CEFR_LEVELS: readonly CEFRLevel[] = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'C2',
] as const;

export const CONTENT_CATEGORIES: readonly ContentCategory[] = [
  'Everyday',
  'Formal',
  'Casual',
  'Workplace',
  'Technology',
  'Storytelling',
  'Academic',
] as const;

// ============================================================================
// 6. Metrics & Performance Constants
// ============================================================================

export const METRICS_CONSTANTS = {
  STANDARD_WORD_LENGTH: 5,
  MAX_INPUT_LATENCY_MS: 16,
} as const;
