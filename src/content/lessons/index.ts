import type { Lesson } from '@/lib/types';
import { qwertyUsLessons } from './qwerty-us';
import { arabic101Lessons } from './arabic-101';

export const allLessonsByLayout: Readonly<Record<string, readonly Lesson[]>> = {
  'qwerty-us': qwertyUsLessons,
  'arabic-101': arabic101Lessons,
};

export function getLessonsByLayout(layoutId: string): readonly Lesson[] {
  return allLessonsByLayout[layoutId] ?? qwertyUsLessons;
}

export function getLessonById(lessonId: string): Lesson | undefined {
  // Direct ID match (e.g. 'qwerty-1', 'arabic-2')
  for (const lessons of Object.values(allLessonsByLayout)) {
    const found = lessons.find((l) => l.id === lessonId);
    if (found) return found;
  }

  // Fallback: match by integer order (e.g. '1' -> order 1 in QWERTY)
  for (const lessons of Object.values(allLessonsByLayout)) {
    const byOrder = lessons.find((l) => String(l.order) === lessonId);
    if (byOrder) return byOrder;
  }

  return undefined;
}

export { qwertyUsLessons, arabic101Lessons };
