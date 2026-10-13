'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_VOCABULARY, STORAGE_KEYS } from '@/lib/constants';
import type {
  CEFRLevel,
  LanguageCode,
  PartOfSpeech,
  ReviewStatus,
  SavedWord,
  UserVocabulary,
} from '@/lib/types';
import { persistenceService } from '@/services/persistence';

class VocabularyStore {
  private currentVocabulary: UserVocabulary = DEFAULT_VOCABULARY;
  private readonly listeners: Set<() => void> = new Set();
  private isClientInitialized = false;

  private initClient(): void {
    if (this.isClientInitialized || typeof window === 'undefined') return;
    this.isClientInitialized = true;

    const stored = persistenceService.load<UserVocabulary>(STORAGE_KEYS.VOCABULARY);
    if (stored) {
      this.currentVocabulary = {
        words: stored.words || [],
      };
    }

    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.VOCABULARY) {
        const updated = persistenceService.load<UserVocabulary>(STORAGE_KEYS.VOCABULARY);
        if (updated) {
          this.currentVocabulary = { words: updated.words || [] };
          this.notify();
        }
      }
    });
  }

  public getSnapshot = (): UserVocabulary => {
    this.initClient();
    return this.currentVocabulary;
  };

  public getServerSnapshot = (): UserVocabulary => DEFAULT_VOCABULARY;

  public subscribe = (listener: () => void): (() => void) => {
    this.initClient();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public saveWord = (params: {
    text: string;
    language: LanguageCode;
    translation: string;
    targetLanguage: LanguageCode;
    entryId?: string;
    contextualNote?: string;
    cefrLevel?: CEFRLevel;
    partOfSpeech?: PartOfSpeech;
  }): SavedWord => {
    this.initClient();
    const cleanText = params.text.trim();
    const existing = this.currentVocabulary.words.find(
      (w) => w.text.toLowerCase() === cleanText.toLowerCase() && w.language === params.language
    );

    if (existing) {
      return existing;
    }

    const newWord: SavedWord = {
      id: `word_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      entryId: params.entryId ?? `custom_${Date.now()}`,
      text: cleanText,
      language: params.language,
      translation: params.translation.trim(),
      targetLanguage: params.targetLanguage,
      contextualNote: params.contextualNote,
      cefrLevel: params.cefrLevel,
      partOfSpeech: params.partOfSpeech,
      savedAt: new Date().toISOString(),
      reviewStatus: 'new',
    };

    const next: UserVocabulary = {
      words: [newWord, ...this.currentVocabulary.words],
    };

    this.currentVocabulary = next;
    persistenceService.save(STORAGE_KEYS.VOCABULARY, next);
    this.notify();
    return newWord;
  };

  public removeWord = (wordId: string): void => {
    this.initClient();
    const next: UserVocabulary = {
      words: this.currentVocabulary.words.filter((w) => w.id !== wordId),
    };
    this.currentVocabulary = next;
    persistenceService.save(STORAGE_KEYS.VOCABULARY, next);
    this.notify();
  };

  public updateReviewStatus = (wordId: string, status: ReviewStatus): void => {
    this.initClient();
    const next: UserVocabulary = {
      words: this.currentVocabulary.words.map((w) =>
        w.id === wordId ? { ...w, reviewStatus: status } : w
      ),
    };
    this.currentVocabulary = next;
    persistenceService.save(STORAGE_KEYS.VOCABULARY, next);
    this.notify();
  };

  public isWordSaved = (text: string, language: LanguageCode): boolean => {
    this.initClient();
    const cleanText = text.trim().toLowerCase();
    return this.currentVocabulary.words.some(
      (w) => w.text.toLowerCase() === cleanText && w.language === language
    );
  };

  public clear = (): void => {
    this.currentVocabulary = DEFAULT_VOCABULARY;
    persistenceService.save(STORAGE_KEYS.VOCABULARY, DEFAULT_VOCABULARY);
    this.notify();
  };

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const vocabularyStore = new VocabularyStore();

export interface UseVocabularyReturn {
  readonly vocabulary: UserVocabulary;
  readonly words: readonly SavedWord[];
  readonly saveWord: (params: {
    text: string;
    language: LanguageCode;
    translation: string;
    targetLanguage: LanguageCode;
    entryId?: string;
    contextualNote?: string;
    cefrLevel?: CEFRLevel;
    partOfSpeech?: PartOfSpeech;
  }) => SavedWord;
  readonly removeWord: (wordId: string) => void;
  readonly updateReviewStatus: (wordId: string, status: ReviewStatus) => void;
  readonly isWordSaved: (text: string, language: LanguageCode) => boolean;
  readonly clearVocabulary: () => void;
}

export function useVocabulary(): UseVocabularyReturn {
  const vocabulary = useSyncExternalStore(
    vocabularyStore.subscribe,
    vocabularyStore.getSnapshot,
    vocabularyStore.getServerSnapshot
  );

  const saveWord = useCallback((params: Parameters<VocabularyStore['saveWord']>[0]) => {
    return vocabularyStore.saveWord(params);
  }, []);

  const removeWord = useCallback((wordId: string) => {
    vocabularyStore.removeWord(wordId);
  }, []);

  const updateReviewStatus = useCallback((wordId: string, status: ReviewStatus) => {
    vocabularyStore.updateReviewStatus(wordId, status);
  }, []);

  const isWordSaved = useCallback((text: string, language: LanguageCode) => {
    return vocabularyStore.isWordSaved(text, language);
  }, []);

  const clearVocabulary = useCallback(() => {
    vocabularyStore.clear();
  }, []);

  return {
    vocabulary,
    words: vocabulary.words,
    saveWord,
    removeWord,
    updateReviewStatus,
    isWordSaved,
    clearVocabulary,
  };
}
