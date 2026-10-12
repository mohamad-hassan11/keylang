import { qwertyUsLayout } from './qwerty-us';
import { usInternationalLayout, US_INTERNATIONAL_DEAD_KEYS } from './us-international';
import { arabic101Layout } from './arabic-101';
import type { KeyboardLayout } from '@/lib/types';

export const KEYBOARD_LAYOUTS: Readonly<Record<string, KeyboardLayout>> = {
  'qwerty-us': qwertyUsLayout,
  'us-international': usInternationalLayout,
  'arabic-101': arabic101Layout,
};

export function getKeyboardLayout(id: string): KeyboardLayout {
  return KEYBOARD_LAYOUTS[id] ?? qwertyUsLayout;
}

export { qwertyUsLayout, usInternationalLayout, arabic101Layout, US_INTERNATIONAL_DEAD_KEYS };
