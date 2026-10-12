import type { KeyboardLayout } from '@/lib/types';

export const qwertyUsLayout: KeyboardLayout = {
  id: 'qwerty-us',
  name: 'QWERTY (US)',
  language: 'en',
  direction: 'ltr',
  rows: [
    // Row 0: Number Row (15.0u)
    {
      keys: [
        { code: 'Backquote', primary: '`', shift: '~', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit1', primary: '1', shift: '!', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit2', primary: '2', shift: '@', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit3', primary: '3', shift: '#', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit4', primary: '4', shift: '$', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit5', primary: '5', shift: '%', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'Digit6', primary: '6', shift: '^', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit7', primary: '7', shift: '&', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit8', primary: '8', shift: '*', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit9', primary: '9', shift: '(', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Digit0', primary: '0', shift: ')', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Minus', primary: '-', shift: '_', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Equal', primary: '=', shift: '+', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backspace', primary: 'Backspace', finger: 'pinky', hand: 'right', homeRow: false, width: 2.0 },
      ],
    },
    // Row 1: Upper Row (15.0u)
    {
      keys: [
        { code: 'Tab', primary: 'Tab', finger: 'pinky', hand: 'left', homeRow: false, width: 1.5 },
        { code: 'KeyQ', primary: 'q', shift: 'Q', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyW', primary: 'w', shift: 'W', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyE', primary: 'e', shift: 'E', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyR', primary: 'r', shift: 'R', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyT', primary: 't', shift: 'T', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyY', primary: 'y', shift: 'Y', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyU', primary: 'u', shift: 'U', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyI', primary: 'i', shift: 'I', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyO', primary: 'o', shift: 'O', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyP', primary: 'p', shift: 'P', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketLeft', primary: '[', shift: '{', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'BracketRight', primary: ']', shift: '}', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Backslash', primary: '\\', shift: '|', finger: 'pinky', hand: 'right', homeRow: false, width: 1.5 },
      ],
    },
    // Row 2: Home Row (15.0u)
    {
      keys: [
        { code: 'CapsLock', primary: 'Caps', finger: 'pinky', hand: 'left', homeRow: false, width: 1.75 },
        { code: 'KeyA', primary: 'a', shift: 'A', finger: 'pinky', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyS', primary: 's', shift: 'S', finger: 'ring', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyD', primary: 'd', shift: 'D', finger: 'middle', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyF', primary: 'f', shift: 'F', finger: 'index', hand: 'left', homeRow: true, width: 1.0 },
        { code: 'KeyG', primary: 'g', shift: 'G', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyH', primary: 'h', shift: 'H', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyJ', primary: 'j', shift: 'J', finger: 'index', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'KeyK', primary: 'k', shift: 'K', finger: 'middle', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'KeyL', primary: 'l', shift: 'L', finger: 'ring', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Semicolon', primary: ';', shift: ':', finger: 'pinky', hand: 'right', homeRow: true, width: 1.0 },
        { code: 'Quote', primary: "'", shift: '"', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Enter', primary: 'Enter', finger: 'pinky', hand: 'right', homeRow: false, width: 2.25 },
      ],
    },
    // Row 3: Bottom Row (15.0u)
    {
      keys: [
        { code: 'ShiftLeft', primary: 'Shift', finger: 'pinky', hand: 'left', homeRow: false, width: 2.25 },
        { code: 'KeyZ', primary: 'z', shift: 'Z', finger: 'pinky', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyX', primary: 'x', shift: 'X', finger: 'ring', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyC', primary: 'c', shift: 'C', finger: 'middle', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyV', primary: 'v', shift: 'V', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyB', primary: 'b', shift: 'B', finger: 'index', hand: 'left', homeRow: false, width: 1.0 },
        { code: 'KeyN', primary: 'n', shift: 'N', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'KeyM', primary: 'm', shift: 'M', finger: 'index', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Comma', primary: ',', shift: '<', finger: 'middle', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Period', primary: '.', shift: '>', finger: 'ring', hand: 'right', homeRow: false, width: 1.0 },
        { code: 'Slash', primary: '/', shift: '?', finger: 'pinky', hand: 'right', homeRow: false, width: 1.0 },
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
