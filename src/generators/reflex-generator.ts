import type {
  Finger,
  Hand,
  KeyboardLayout,
  KeyDefinition,
  PerKeyErrorMap,
  ReflexConfig,
  ReflexDifficulty,
  ReflexLength,
} from '@/lib/types';
import { getKeyboardLayout } from '@/content/keyboards';

// ============================================================================
// 1. Mulberry32 32-bit PRNG
// ============================================================================

export type PRNG = () => number;

/**
 * Creates a deterministic 32-bit PRNG function based on the Mulberry32 algorithm.
 * Guarantees identical floating-point sequence in [0, 1) across all environments.
 */
export function createMulberry32(seed: number): PRNG {
  let s = (seed >>> 0);
  return function next(): number {
    let t = (s += 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(prng: PRNG, min: number, max: number): number {
  return Math.floor(prng() * (max - min + 1)) + min;
}

export function randomChoice<T>(prng: PRNG, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return items[Math.floor(prng() * items.length)];
}

export function weightedChoice<T>(
  prng: PRNG,
  items: readonly { readonly value: T; readonly weight: number }[]
): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty weighted array');
  }
  let totalWeight = 0;
  for (let i = 0; i < items.length; i++) {
    totalWeight += items[i].weight;
  }
  let threshold = prng() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    threshold -= items[i].weight;
    if (threshold <= 0) {
      return items[i].value;
    }
  }
  return items[items.length - 1].value;
}

// ============================================================================
// 2. Length Constants & Physical Layout Adjacency
// ============================================================================

export const REFLEX_LENGTH_TARGETS: Readonly<Record<ReflexLength, number>> = {
  short: 50,
  medium: 150,
  long: 300,
} as const;

interface PhysicalKeyInfo {
  readonly definition: KeyDefinition;
  readonly centerX: number;
  readonly centerY: number;
}

const NON_PRINTABLE_CODES = new Set([
  'Backspace',
  'Tab',
  'CapsLock',
  'Enter',
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'ContextMenu',
  'Space',
]);

/**
 * Computes physical key center coordinates and constructs an adjacency map
 * based on physical proximity on the keyboard.
 */
export function getPhysicalNeighbors(
  layout: KeyboardLayout
): ReadonlyMap<string, readonly string[]> {
  const keyInfoMap: PhysicalKeyInfo[] = [];

  layout.rows.forEach((row, rowIndex) => {
    let currentX = 0;
    row.keys.forEach((key) => {
      const width = key.width ?? 1.0;
      const centerX = currentX + width / 2;
      const centerY = rowIndex;

      if (!NON_PRINTABLE_CODES.has(key.code) && key.primary && key.primary.length === 1) {
        keyInfoMap.push({ definition: key, centerX, centerY });
      }
      currentX += width;
    });
  });

  const neighborsMap = new Map<string, string[]>();

  for (let i = 0; i < keyInfoMap.length; i++) {
    const k1 = keyInfoMap[i];
    const neighbors: string[] = [];

    for (let j = 0; j < keyInfoMap.length; j++) {
      if (i === j) continue;
      const k2 = keyInfoMap[j];

      const rowDiff = Math.abs(k1.centerY - k2.centerY);
      const colDiff = Math.abs(k1.centerX - k2.centerX);

      // Within 1 row vertically and 1.35 key widths horizontally
      if (rowDiff <= 1 && colDiff <= 1.35) {
        neighbors.push(k2.definition.primary);
      }
    }

    neighborsMap.set(k1.definition.primary, neighbors);
  }

  return neighborsMap;
}

export function resolveLayout(layoutId: string, customLayout?: KeyboardLayout): KeyboardLayout {
  if (customLayout) return customLayout;
  return getKeyboardLayout(layoutId);
}

// ============================================================================
// 3. Character Pool & Pattern Extraction
// ============================================================================

export function getLayoutCharacterPool(
  layout: KeyboardLayout,
  difficulty: ReflexDifficulty
): string[] {
  const homeKeys: string[] = [];
  const letterKeys: string[] = [];
  const numberKeys: string[] = [];
  const shiftLetters: string[] = [];
  const symbolKeys: string[] = [];

  const isArabic = layout.language === 'ar';

  layout.rows.forEach((row) => {
    row.keys.forEach((k) => {
      if (NON_PRINTABLE_CODES.has(k.code)) return;
      const p = k.primary;
      const s = k.shift;

      if (!p) return;

      if (k.homeRow) {
        homeKeys.push(p);
      }

      if (isArabic) {
        if (/[\u0621-\u064A]/.test(p)) {
          letterKeys.push(p);
        } else if (/[0-9\u0660-\u0669]/.test(p)) {
          numberKeys.push(p);
        } else {
          symbolKeys.push(p);
        }
        if (s) {
          if (/[\u0621-\u064A]/.test(s)) {
            shiftLetters.push(s);
          } else {
            symbolKeys.push(s);
          }
        }
      } else {
        if (/[a-zA-Z]/.test(p)) {
          letterKeys.push(p);
        } else if (/[0-9]/.test(p)) {
          numberKeys.push(p);
        } else {
          symbolKeys.push(p);
        }
        if (s) {
          if (/[A-Z]/.test(s)) {
            shiftLetters.push(s);
          } else {
            symbolKeys.push(s);
          }
        }
      }
    });
  });

  const unique = (arr: string[]) => Array.from(new Set(arr));

  switch (difficulty) {
    case 'easy':
      return unique(homeKeys);
    case 'medium':
      return unique(letterKeys);
    case 'hard':
      return unique([...letterKeys, ...numberKeys, ...shiftLetters]);
    case 'extreme':
    default:
      return unique([...letterKeys, ...numberKeys, ...shiftLetters, ...symbolKeys]);
  }
}

// ============================================================================
// 4. Main Generator Algorithm
// ============================================================================

export function generateReflexExercise(
  config: ReflexConfig,
  customLayout?: KeyboardLayout
): string {
  const prng = createMulberry32(config.seed);
  const layout = resolveLayout(config.layoutId, customLayout);
  const activePool = getLayoutCharacterPool(layout, config.difficulty);

  if (activePool.length === 0) {
    return 'asdf jkl;';
  }

  const neighborsMap = getPhysicalNeighbors(layout);

  // Group active characters by hand
  const leftHandChars: string[] = [];
  const rightHandChars: string[] = [];

  layout.rows.forEach((row) => {
    row.keys.forEach((key) => {
      if (key.primary && activePool.includes(key.primary)) {
        if (key.hand === 'left') {
          leftHandChars.push(key.primary);
        } else {
          rightHandChars.push(key.primary);
        }
      }
    });
  });

  // Calculate adaptive weights for pool characters
  const weightedPool = activePool.map((char) => {
    const errorCount = config.adaptiveData?.[char] ?? 0;
    const boost = Math.min(errorCount * 2.0, 20.0);
    return {
      value: char,
      weight: 1.0 + boost,
    };
  });

  const pickCandidate = (): string => weightedChoice(prng, weightedPool);

  const targetLength = REFLEX_LENGTH_TARGETS[config.length] ?? 50;
  const tokens: string[] = [];
  let currentChars = 0;

  while (currentChars < targetLength) {
    const remaining = targetLength - currentChars - (tokens.length > 0 ? 1 : 0);
    const tokenLen = Math.min(
      Math.max(randomInt(prng, 3, 5), 2),
      remaining > 6 ? 6 : Math.max(remaining, 2)
    );

    let token = '';

    // Decide token pattern based on difficulty
    if (config.difficulty === 'easy') {
      // Home-row roll or repetitions
      for (let i = 0; i < tokenLen; i++) {
        token += pickCandidate();
      }
    } else if (config.difficulty === 'medium') {
      const patternMode = prng();
      if (patternMode < 0.5 && neighborsMap.size > 0) {
        // Adjacent-key roll
        let current = pickCandidate();
        token += current;
        for (let i = 1; i < tokenLen; i++) {
          const neighbors = (neighborsMap.get(current) ?? []).filter((n) =>
            activePool.includes(n)
          );
          if (neighbors.length > 0) {
            current = randomChoice(prng, neighbors);
          } else {
            current = pickCandidate();
          }
          token += current;
        }
      } else if (leftHandChars.length > 0 && rightHandChars.length > 0) {
        // Alternating-hand pattern
        let useLeft = prng() < 0.5;
        for (let i = 0; i < tokenLen; i++) {
          const pool = useLeft ? leftHandChars : rightHandChars;
          token += randomChoice(prng, pool);
          useLeft = !useLeft;
        }
      } else {
        for (let i = 0; i < tokenLen; i++) {
          token += pickCandidate();
        }
      }
    } else if (config.difficulty === 'hard') {
      const patternMode = prng();
      if (patternMode < 0.35) {
        // Repeated character pattern (e.g., 'ffjj', 'kkee')
        const char1 = pickCandidate();
        const char2 = pickCandidate();
        token = `${char1}${char1}${char2}${char2}`.slice(0, tokenLen);
      } else {
        // Shifted capital or number mix
        let base = '';
        for (let i = 0; i < tokenLen; i++) {
          base += pickCandidate();
        }
        token = base;
      }
    } else {
      // Extreme: symbols and punctuation wrapped tokens
      const patternMode = prng();
      let inner = '';
      for (let i = 0; i < Math.max(2, tokenLen - 2); i++) {
        inner += pickCandidate();
      }
      if (patternMode < 0.25) {
        token = `(${inner})`;
      } else if (patternMode < 0.5) {
        token = `[${inner}]`;
      } else if (patternMode < 0.75) {
        token = `${inner};`;
      } else {
        token = `${inner}!`;
      }
      if (token.length > tokenLen) {
        token = token.slice(0, tokenLen);
      }
    }

    tokens.push(token);
    currentChars += token.length + (tokens.length > 1 ? 1 : 0);
  }

  return tokens.join(' ').trim();
}
