/**
 * KeyLingo Master Domain Types
 * Strict TypeScript rules: strict mode compliant, no `any`, readonly immutable structures.
 */

// ============================================================================
// 1. Language, Locale & Presentation Types
// ============================================================================

export type LanguageCode = 'en' | 'nl' | 'ar';

export type Direction = 'ltr' | 'rtl';

export type Theme = 'light' | 'dark' | 'system';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentCategory =
  | 'Everyday'
  | 'Formal'
  | 'Casual'
  | 'Workplace'
  | 'Technology'
  | 'Storytelling'
  | 'Academic';

// ============================================================================
// 2. Typing Engine & Text Processing Types
// ============================================================================

export type CharacterState = 'pending' | 'correct' | 'incorrect' | 'corrected';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export type DiacriticMode = 'strict' | 'lenient';

export type PerKeyErrorMap = Readonly<Record<string, number>>;

export interface TypingOptions {
  readonly diacriticMatching: DiacriticMode;
  readonly layoutId: string;
  readonly language: LanguageCode;
}

export interface TypingSession {
  readonly id: string;
  readonly target: string;
  readonly graphemes: readonly string[];
  readonly currentIndex: number;
  readonly characterStates: readonly CharacterState[];
  readonly status: SessionStatus;
  readonly startTime: number | null;
  readonly pausedDuration: number;
  readonly lastPauseTime: number | null;
  readonly endTime: number | null;
  readonly errors: PerKeyErrorMap;
  readonly uncorrectedErrors: number;
  readonly totalKeystrokes: number;
  readonly options: TypingOptions;
  readonly previouslyIncorrect?: readonly boolean[];
}

export interface TypingMetrics {
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly accuracy: number;
  readonly elapsedTimeMs: number;
  readonly errorCount: number;
  readonly uncorrectedErrors: number;
  readonly perKeyErrors: PerKeyErrorMap;
}

export interface TypingEngineInterface {
  init(target: string, options?: TypingOptions): TypingSession;
  inputCharacter(session: TypingSession, char: string, now?: number): TypingSession;
  deleteCharacter(session: TypingSession): TypingSession;
  pause(session: TypingSession, now?: number): TypingSession;
  resume(session: TypingSession, now?: number): TypingSession;
  complete(session: TypingSession, now?: number): TypingSession;
  restart(session: TypingSession): TypingSession;
  getMetrics(session: TypingSession, now?: number): TypingMetrics;
  getCharacterStates(session: TypingSession): readonly CharacterState[];
  getCurrentPosition(session: TypingSession): number;
}

// ============================================================================
// 3. Keyboard Layout Types
// ============================================================================

export type KeyboardLayoutId = 'qwerty-us' | 'us-international' | 'arabic-101';

export type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

export type Hand = 'left' | 'right';

export interface KeyDefinition {
  readonly code: string;            // Physical event code (e.g. "KeyA")
  readonly primary: string;         // Unmodified output
  readonly shift?: string;          // Shift output
  readonly altGr?: string;          // AltGr output
  readonly shiftAltGr?: string;     // Shift+AltGr output
  readonly finger: Finger;
  readonly hand: Hand;
  readonly homeRow: boolean;
  readonly width?: number;          // Relative width multiplier (1 = standard)
}

export interface KeyRow {
  readonly keys: readonly KeyDefinition[];
}

export interface KeyboardLayout {
  readonly id: string;
  readonly name: string;
  readonly language: LanguageCode;
  readonly direction: Direction;
  readonly rows: readonly KeyRow[];
}

// ============================================================================
// 4. Guided Curriculum Types
// ============================================================================

export type ExerciseType = 'letters' | 'words' | 'sentences';

export interface LessonExercise {
  readonly type: ExerciseType;
  readonly content: string;
}

export interface CompletionCriteria {
  readonly minAccuracy: number;     // e.g. 0.95 (95%)
  readonly minWpm: number;          // e.g. 15
}

export interface Lesson {
  readonly id: string;
  readonly order: number;
  readonly title: Readonly<Record<LanguageCode, string>>;
  readonly description: Readonly<Record<LanguageCode, string>>;
  readonly layoutId: string;
  readonly newKeys: readonly string[];
  readonly previousKeys: readonly string[];
  readonly exercises: readonly LessonExercise[];
  readonly completionCriteria: CompletionCriteria;
}

// ============================================================================
// 5. Reflex Generator Types
// ============================================================================

export type ReflexLength = 'short' | 'medium' | 'long';

export type ReflexDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface ReflexConfig {
  readonly seed: number;
  readonly length: ReflexLength;
  readonly difficulty: ReflexDifficulty;
  readonly layoutId: string;
  readonly adaptiveData?: PerKeyErrorMap;
}

// ============================================================================
// 6. Vocabulary & Translation Types
// ============================================================================

export type VocabularyType = 'word' | 'phrase' | 'sentence';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'other';

export interface Translation {
  readonly text: string;
  readonly contextualNote?: string;
  readonly example?: string;
}

export interface ArabicMetadata {
  readonly dialect: 'msa' | string;
  readonly withDiacritics?: string;
}

export interface VocabularyEntry {
  readonly id: string;
  readonly language: LanguageCode;
  readonly text: string;
  readonly type: VocabularyType;
  readonly partOfSpeech?: PartOfSpeech;
  readonly cefrLevel: CEFRLevel;
  readonly category: ContentCategory;
  readonly translations: Readonly<Partial<Record<LanguageCode, Translation>>>;
  readonly arabicMeta?: ArabicMetadata;
}

export type TranslationSource = 'curated' | 'api' | 'cache';

export interface TranslationResult {
  readonly found: boolean;
  readonly translation?: string;
  readonly partOfSpeech?: PartOfSpeech;
  readonly contextualNote?: string;
  readonly example?: string;
  readonly cefrLevel?: CEFRLevel;
  readonly source: TranslationSource;
  readonly externalDictionaryUrl?: string;
}

export interface TranslationProvider {
  translate(
    text: string,
    from: LanguageCode,
    to: LanguageCode
  ): Promise<TranslationResult>;

  translateSentence(
    text: string,
    from: LanguageCode,
    to: LanguageCode
  ): Promise<TranslationResult>;
}

// ============================================================================
// 7. Persistence & User State Models
// ============================================================================

export type StorageKey =
  | 'keylingo-preferences'
  | 'keylingo-progress'
  | 'keylingo-stats'
  | 'keylingo-vocabulary';

export interface VersionedEnvelope<T> {
  readonly _version: number;
  readonly data: T;
}

export interface UserPreferences {
  readonly interfaceLanguage: LanguageCode;
  readonly practiceLanguage: LanguageCode;
  readonly translationLanguage: LanguageCode;
  readonly keyboardLayout: string;
  readonly theme: Theme;
  readonly cefrLevel: CEFRLevel;
  readonly contentCategory: ContentCategory;
  readonly diacriticMatching: DiacriticMode;
}

export interface LessonScore {
  readonly wpm: number;
  readonly accuracy: number;
  readonly completedAt: string;
  readonly passed: boolean;
}

export interface LessonProgress {
  readonly completed: boolean;
  readonly bestAccuracy: number;
  readonly bestWpm: number;
  readonly attempts: number;
  readonly lastAttemptDate: string;
  readonly scores: readonly LessonScore[];
}

export interface SessionHistoryItem {
  readonly sessionId: string;
  readonly timestamp: string;
  readonly mode: 'guided' | 'reflex' | 'vocabulary';
  readonly language: LanguageCode;
  readonly grossWpm: number;
  readonly netWpm: number;
  readonly accuracy: number;
  readonly durationMs: number;
}

export interface UserProgress {
  readonly completedLessons: readonly string[];
  readonly lessons: Readonly<Record<string, LessonProgress>>;
  readonly sessionHistory: readonly SessionHistoryItem[];
}

export interface UserStats {
  readonly cumulativeGrossWpm: number;
  readonly cumulativeNetWpm: number;
  readonly cumulativeAccuracy: number;
  readonly totalSessions: number;
  readonly totalPracticeTimeMs: number;
  readonly perKeyErrors: PerKeyErrorMap;
  readonly streakDays: number;
  readonly lastPracticeDate?: string;
}

export type ReviewStatus = 'new' | 'learning' | 'mastered';

export interface SavedWord {
  readonly id: string;
  readonly entryId: string;
  readonly text: string;
  readonly language: LanguageCode;
  readonly translation: string;
  readonly targetLanguage: LanguageCode;
  readonly contextualNote?: string;
  readonly cefrLevel?: CEFRLevel;
  readonly partOfSpeech?: PartOfSpeech;
  readonly savedAt: string;
  readonly reviewStatus: ReviewStatus;
}

export interface UserVocabulary {
  readonly words: readonly SavedWord[];
}

export interface PersistenceService {
  load<T>(key: StorageKey): T | null;
  save<T>(key: StorageKey, data: T): void;
  clear(key: StorageKey): void;
  exportAll(): string;
  importAll(json: string): boolean;
  getVersion(key: StorageKey): number;
}

export type MigrationFn<TInput = unknown, TOutput = unknown> = (
  data: TInput
) => TOutput;
