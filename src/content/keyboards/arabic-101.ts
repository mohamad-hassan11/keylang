import type { KeyboardLayout } from '@/lib/types';

export const arabic101Layout: KeyboardLayout = {
  id: 'arabic-101',
  name: 'Arabic (101)',
  language: 'ar',
  direction: 'ltr', // Physical keyboard frame is strictly LTR
  rows: [
    // Row 0: Number Row (15.0u)
    {
      keys: [
        { code: 'Backquote', primary: 'ذ', shift: '\u0651', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 }, // Shaddah
        { code: 'Digit1', primary: '1', shift: '!', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit2', primary: '2', shift: '@', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit3', primary: '3', shift: '#', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit4', primary: '4', shift: '$', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit5', primary: '5', shift: '%', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit6', primary: '6', shift: '^', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit7', primary: '7', shift: '&', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit8', primary: '8', shift: '*', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit9', primary: '9', shift: ')', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit0', primary: '0', shift: '(', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Minus', primary: '-', shift: '_', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Equal', primary: '=', shift: '+', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backspace', primary: 'Backspace', finger: 'pinky', hand: 'right', homeRow: false, width: 2.0 },
      ],
    },
    // Row 1: Upper Row (15.0u)
    {
      keys: [
        { code: 'Tab', primary: 'Tab', finger: 'pinky', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'KeyQ', primary: 'ض', shift: '\u064E', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 }, // Fathah
        { code: 'KeyW', primary: 'ص', shift: '\u064B', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },  // Fathatan
        { code: 'KeyE', primary: 'ث', shift: '\u064F', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },// Dammah
        { code: 'KeyR', primary: 'ق', shift: '\u064C', finger: 'index', hand: 'left', homeRow: false, width: 1.0 }, // Dammatan
        { code: 'KeyT', primary: 'ف', shift: 'لإ', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyY', primary: 'غ', shift: 'إ', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyU', primary: 'ع', shift: '‘', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyI', primary: 'ه', shift: '÷', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyO', primary: 'خ', shift: '×', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyP', primary: 'ح', shift: '؛', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketLeft', primary: 'ج', shift: '<', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketRight', primary: 'د', shift: '>', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backslash', primary: '\\', shift: '|', finger: 'pinky', hand: 'right', homeRow: false, width: 1.5 },
      ],
    },
    // Row 2: Home Row (15.0u)
    {
      keys: [
        { code: 'CapsLock', primary: 'Caps', finger: 'pinky', hand: 'left', homeRow: false, width: 1.75 },
        { code: 'KeyA', primary: 'ش', shift: '\u0650', finger: 'pinky', hand: 'left', homeRow: true, width: 1.0 }, // Kasrah
        { code: 'KeyS', primary: 'س', shift: '\u064D', finger: 'ring', hand: 'left', homeRow: true, width: 1.0 },  // Kasratan
        { code: 'KeyD', primary: 'ي', shift: ']', finger: 'middle', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyF', primary: 'ب', shift: '[', finger: 'index', hand: 'left', homeRow: true, width: 1.0 }, // Tactile nub
        { code: 'KeyG', primary: 'ل', shift: 'لأ', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyH', primary: 'ا', shift: 'أ', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyJ', primary: 'ت', shift: '\u0640', finger: 'index', hand: 'right', homeRow: true, width: 1.0 }, // Tactile nub / Tatweel
        { code: 'KeyK', primary: 'ن', shift: '،', finger: 'middle', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'KeyL', primary: 'م', shift: '/', finger: 'ring', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Semicolon', primary: 'ك', shift: ':', finger: 'pinky', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Quote', primary: 'ط', shift: '"', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Enter', primary: 'Enter', finger: 'pinky', hand: 'right', homeRow: false, width: 2.25 },
      ],
    },
    // Row 3: Bottom Row (15.0u)
    {
      keys: [
        { code: 'ShiftLeft', primary: 'Shift', finger: 'pinky', hand: 'left', homeRow: false, width: 2.25 },
        { code: 'KeyZ', primary: 'ئ', shift: '~', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyX', primary: 'ء', shift: '\u0652', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 }, // Sukun
        { code: 'KeyC', primary: 'ؤ', shift: '}', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyV', primary: 'ر', shift: '{', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyB', primary: 'لا', shift: 'لآ', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyN', primary: 'ى', shift: 'آ', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyM', primary: 'ة', shift: "'", finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Comma', primary: 'و', shift: ',', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Period', primary: 'ز', shift: '.', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Slash', primary: 'ظ', shift: '؟', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'ShiftRight', primary: 'Shift', finger: 'pinky', hand: 'right', homeRow: false, width: 2.75 },
      ],
    },
    // Row 4: Space Row (15.0u)
    {
      keys: [
        { code: 'ControlLeft', primary: 'Ctrl', finger: 'pinky', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'AltLeft', primary: 'Alt', finger: 'thumb', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'Space', primary: ' ', shift: ' ', finger: 'thumb', hand: 'right', homeRow: false, width: 9.0 },
        { code: 'AltRight', primary: 'Alt', finger: 'thumb', hand: 'right', homeRow: false, width: 1.5 },
        { code: 'ControlRight', primary: 'Ctrl', finger: 'pinky', hand: 'right', homeRow: false, width: 1.5 },
      ],
    },
  ],
};
