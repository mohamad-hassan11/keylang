import type { KeyboardLayout } from '@/lib/types';

export interface DeadKeyMapping {
  readonly deadKey: string;
  readonly deadCode: string;
  readonly requiresShift: boolean;
  readonly baseChar: string;
  readonly baseCode: string;
}

export const US_INTERNATIONAL_DEAD_KEYS: Readonly<Record<string, DeadKeyMapping>> = {
  'ë': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'e', baseCode: 'KeyE' },
  'Ë': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'E', baseCode: 'KeyE' },
  'é': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'e', baseCode: 'KeyE' },
  'É': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'E', baseCode: 'KeyE' },
  'è': { deadKey: '`', deadCode: 'Backquote', requiresShift: false, baseChar: 'e', baseCode: 'KeyE' },
  'È': { deadKey: '`', deadCode: 'Backquote', requiresShift: false, baseChar: 'E', baseCode: 'KeyE' },
  'ö': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'o', baseCode: 'KeyO' },
  'Ö': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'O', baseCode: 'KeyO' },
  'ü': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'u', baseCode: 'KeyU' },
  'Ü': { deadKey: '"', deadCode: 'Quote', requiresShift: true, baseChar: 'U', baseCode: 'KeyU' },
  'á': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'a', baseCode: 'KeyA' },
  'Á': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'A', baseCode: 'KeyA' },
  'ó': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'o', baseCode: 'KeyO' },
  'Ó': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'O', baseCode: 'KeyO' },
  'í': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'i', baseCode: 'KeyI' },
  'Í': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'I', baseCode: 'KeyI' },
  'ú': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'u', baseCode: 'KeyU' },
  'Ú': { deadKey: "'", deadCode: 'Quote', requiresShift: false, baseChar: 'U', baseCode: 'KeyU' },
  'â': { deadKey: '^', deadCode: 'Digit6', requiresShift: true, baseChar: 'a', baseCode: 'KeyA' },
  'ê': { deadKey: '^', deadCode: 'Digit6', requiresShift: true, baseChar: 'e', baseCode: 'KeyE' },
  'î': { deadKey: '^', deadCode: 'Digit6', requiresShift: true, baseChar: 'i', baseCode: 'KeyI' },
  'ô': { deadKey: '^', deadCode: 'Digit6', requiresShift: true, baseChar: 'o', baseCode: 'KeyO' },
  'û': { deadKey: '^', deadCode: 'Digit6', requiresShift: true, baseChar: 'u', baseCode: 'KeyU' },
  'ñ': { deadKey: '~', deadCode: 'Backquote', requiresShift: true, baseChar: 'n', baseCode: 'KeyN' },
  'Ñ': { deadKey: '~', deadCode: 'Backquote', requiresShift: true, baseChar: 'N', baseCode: 'KeyN' },
};

export const usInternationalLayout: KeyboardLayout = {
  id: 'us-international',
  name: 'US-International (Dutch)',
  language: 'nl',
  direction: 'ltr',
  rows: [
    // Row 0: Number Row (15.0u)
    {
      keys: [
        { code: 'Backquote', primary: '`', shift: '~', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit1', primary: '1', shift: '!', altGr: '¡', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit2', primary: '2', shift: '@', altGr: '²', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit3', primary: '3', shift: '#', altGr: '³', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit4', primary: '4', shift: '$', altGr: '¤', shiftAltGr: '£', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit5', primary: '5', shift: '%', altGr: '€', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit6', primary: '6', shift: '^', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit7', primary: '7', shift: '&', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit8', primary: '8', shift: '*', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit9', primary: '9', shift: '(', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit0', primary: '0', shift: ')', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Minus', primary: '-', shift: '_', altGr: '¥', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Equal', primary: '=', shift: '+', altGr: '×', shiftAltGr: '÷', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backspace', primary: 'Backspace', finger: 'pinky', hand: 'right', homeRow: false, width: 2.0 },
      ],
    },
    // Row 1: Upper Row (15.0u)
    {
      keys: [
        { code: 'Tab', primary: 'Tab', finger: 'pinky', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'KeyQ', primary: 'q', shift: 'Q', altGr: 'ä', shiftAltGr: 'Ä', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyW', primary: 'w', shift: 'W', altGr: 'å', shiftAltGr: 'Å', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyE', primary: 'e', shift: 'E', altGr: 'é', shiftAltGr: 'É', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyR', primary: 'r', shift: 'R', altGr: '®', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyT', primary: 't', shift: 'T', altGr: 'þ', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyY', primary: 'y', shift: 'Y', altGr: 'ü', shiftAltGr: 'Ü', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyU', primary: 'u', shift: 'U', altGr: 'ú', shiftAltGr: 'Ú', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyI', primary: 'i', shift: 'I', altGr: 'í', shiftAltGr: 'Í', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyO', primary: 'o', shift: 'O', altGr: 'ó', shiftAltGr: 'Ó', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyP', primary: 'p', shift: 'P', altGr: 'ö', shiftAltGr: 'Ö', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketLeft', primary: '[', shift: '{', altGr: '«', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketRight', primary: ']', shift: '}', altGr: '»', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backslash', primary: '\\', shift: '|', altGr: '¬', finger: 'pinky', hand: 'right', homeRow: false, width: 1.5 },
      ],
    },
    // Row 2: Home Row (15.0u)
    {
      keys: [
        { code: 'CapsLock', primary: 'Caps', finger: 'pinky', hand: 'left', homeRow: false, width: 1.75 },
        { code: 'KeyA', primary: 'a', shift: 'A', altGr: 'á', shiftAltGr: 'Á', finger: 'pinky', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyS', primary: 's', shift: 'S', altGr: 'ß', shiftAltGr: '§', finger: 'ring', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyD', primary: 'd', shift: 'D', altGr: 'ð', shiftAltGr: 'Ð', finger: 'middle', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyF', primary: 'f', shift: 'F', finger: 'index', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyG', primary: 'g', shift: 'G', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyH', primary: 'h', shift: 'H', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyJ', primary: 'j', shift: 'J', finger: 'index', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'KeyK', primary: 'k', shift: 'K', finger: 'middle', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'KeyL', primary: 'l', shift: 'L', altGr: 'ø', shiftAltGr: 'Ø', finger: 'ring', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Semicolon', primary: ';', shift: ':', altGr: '¶', finger: 'pinky', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Quote', primary: "'", shift: '"', altGr: '´', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Enter', primary: 'Enter', finger: 'pinky', hand: 'right', homeRow: false, width: 2.25 },
      ],
    },
    // Row 3: Bottom Row (15.0u)
    {
      keys: [
        { code: 'ShiftLeft', primary: 'Shift', finger: 'pinky', hand: 'left', homeRow: false, width: 2.25 },
        { code: 'KeyZ', primary: 'z', shift: 'Z', altGr: 'æ', shiftAltGr: 'Æ', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyX', primary: 'x', shift: 'X', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyC', primary: 'c', shift: 'C', altGr: '©', shiftAltGr: '¢', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyV', primary: 'v', shift: 'V', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyB', primary: 'b', shift: 'B', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyN', primary: 'n', shift: 'N', altGr: 'ñ', shiftAltGr: 'Ñ', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyM', primary: 'm', shift: 'M', altGr: 'µ', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Comma', primary: ',', shift: '<', altGr: 'ç', shiftAltGr: 'Ç', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Period', primary: '.', shift: '>', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Slash', primary: '/', shift: '?', altGr: '¿', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'ShiftRight', primary: 'Shift', finger: 'pinky', hand: 'right', homeRow: false, width: 2.75 },
      ],
    },
    // Row 4: Space Row (15.0u)
    {
      keys: [
        { code: 'ControlLeft', primary: 'Ctrl', finger: 'pinky', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'AltLeft', primary: 'Alt', finger: 'thumb', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'Space', primary: ' ', shift: ' ', finger: 'thumb', hand: 'right', homeRow: false, width: 9.0 },
        { code: 'AltRight', primary: 'AltGr', finger: 'thumb', hand: 'right', homeRow: false, width: 1.5 },
        { code: 'ControlRight', primary: 'Ctrl', finger: 'pinky', hand: 'right', homeRow: false, width: 1.5 },
      ],
    },
  ],
};
