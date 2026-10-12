import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyCap } from '../KeyCap';
import { HandGuide } from '../HandGuide';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { qwertyUsLayout } from '@/content/keyboards/qwerty-us';
import { arabic101Layout } from '@/content/keyboards/arabic-101';
import type { KeyDefinition } from '@/lib/types';

describe('Virtual Keyboard UI Components', () => {
  describe('1. KeyCap Primitive', () => {
    const keyF: KeyDefinition = {
      code: 'KeyF',
      primary: 'f',
      shift: 'F',
      finger: 'index',
      hand: 'left',
      homeRow: true,
      width: 1.0,
    };

    const keySpace: KeyDefinition = {
      code: 'Space',
      primary: ' ',
      shift: ' ',
      finger: 'thumb',
      hand: 'right',
      homeRow: false,
      width: 9.0,
    };

    it('renders key with primary character and shift indicator', () => {
      render(<KeyCap definition={keyF} />);
      expect(screen.getByText('f')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('renders tactile nub on KeyF and KeyJ', () => {
      const { container } = render(<KeyCap definition={keyF} />);
      const nub = container.querySelector('span[aria-hidden="true"]');
      expect(nub).toBeInTheDocument();
    });

    it('does not render tactile nub on other keys like Space', () => {
      const { container } = render(<KeyCap definition={keySpace} />);
      const nub = container.querySelector('span[aria-hidden="true"]');
      expect(nub).not.toBeInTheDocument();
    });

    it('reflects active visual states in data-state attribute', () => {
      const { rerender, container } = render(<KeyCap definition={keyF} state="idle" />);
      let btn = container.querySelector('[data-code="KeyF"]');
      expect(btn).toHaveAttribute('data-state', 'idle');

      rerender(<KeyCap definition={keyF} isTarget={true} />);
      btn = container.querySelector('[data-code="KeyF"]');
      expect(btn).toHaveAttribute('data-state', 'target');

      rerender(<KeyCap definition={keyF} isPressed={true} />);
      btn = container.querySelector('[data-code="KeyF"]');
      expect(btn).toHaveAttribute('data-state', 'pressed');

      rerender(<KeyCap definition={keyF} isModifierTarget={true} />);
      btn = container.querySelector('[data-code="KeyF"]');
      expect(btn).toHaveAttribute('data-state', 'modifier-target');
    });

    it('applies proportional flex width', () => {
      const { container } = render(<KeyCap definition={keySpace} />);
      const btn = container.querySelector('[data-code="Space"]');
      expect(btn).toHaveStyle({ flexGrow: '9' });
    });
  });

  describe('2. HandGuide Component', () => {
    it('renders left and right hands with anatomical fingers', () => {
      render(<HandGuide />);
      expect(screen.getByText('Left Hand')).toBeInTheDocument();
      expect(screen.getByText('Right Hand')).toBeInTheDocument();
    });

    it('illuminates active finger and active hand', () => {
      const { container } = render(<HandGuide activeHand="left" activeFinger="index" />);
      const leftHand = container.querySelector('[data-hand="left"]');
      expect(leftHand).toHaveAttribute('data-active', 'true');

      const indexFinger = leftHand?.querySelector('[data-finger="index"]');
      expect(indexFinger).toHaveAttribute('data-active', 'true');

      const rightHand = container.querySelector('[data-hand="right"]');
      expect(rightHand).toHaveAttribute('data-active', 'false');
    });

    it('displays neutral state when active finger is null', () => {
      const { container } = render(<HandGuide activeHand={null} activeFinger={null} />);
      const leftHand = container.querySelector('[data-hand="left"]');
      expect(leftHand).toHaveAttribute('data-active', 'false');
      const rightHand = container.querySelector('[data-hand="right"]');
      expect(rightHand).toHaveAttribute('data-active', 'false');
    });
  });

  describe('3. VirtualKeyboard Subsystem Integration', () => {
    it('pins container to dir="ltr" even for Arabic layout', () => {
      const { container } = render(<VirtualKeyboard layout={arabic101Layout} />);
      const kb = container.querySelector('[role="region"]');
      expect(kb).toHaveAttribute('dir', 'ltr');
    });

    it('highlights target key for lowercase letter', () => {
      const { container } = render(<VirtualKeyboard layout={qwertyUsLayout} targetChar="a" />);
      const keyA = container.querySelector('[data-code="KeyA"]');
      expect(keyA).toHaveAttribute('data-state', 'target');
    });

    it('highlights target key and opposite-hand Shift for uppercase letter (Left hand key)', () => {
      // 'A' is left hand -> requires Right Shift
      const { container } = render(<VirtualKeyboard layout={qwertyUsLayout} targetChar="A" />);
      const keyA = container.querySelector('[data-code="KeyA"]');
      expect(keyA).toHaveAttribute('data-state', 'target');

      const shiftRight = container.querySelector('[data-code="ShiftRight"]');
      expect(shiftRight).toHaveAttribute('data-state', 'modifier-target');
    });

    it('highlights target key and opposite-hand Shift for uppercase letter (Right hand key)', () => {
      // 'J' is right hand -> requires Left Shift
      const { container } = render(<VirtualKeyboard layout={qwertyUsLayout} targetChar="J" />);
      const keyJ = container.querySelector('[data-code="KeyJ"]');
      expect(keyJ).toHaveAttribute('data-state', 'target');

      const shiftLeft = container.querySelector('[data-code="ShiftLeft"]');
      expect(shiftLeft).toHaveAttribute('data-state', 'modifier-target');
    });

    it('highlights live pressed keys', () => {
      const { container } = render(
        <VirtualKeyboard layout={qwertyUsLayout} pressedKeyCodes={['Space', 'KeyF']} />
      );
      const spaceKey = container.querySelector('[data-code="Space"]');
      const keyF = container.querySelector('[data-code="KeyF"]');

      expect(spaceKey).toHaveAttribute('data-state', 'pressed');
      expect(keyF).toHaveAttribute('data-state', 'pressed');
    });

    it('renders HandGuide HUD by default', () => {
      render(<VirtualKeyboard layout={qwertyUsLayout} targetChar="f" />);
      expect(screen.getByText('Left Hand')).toBeInTheDocument();
      expect(screen.getByText('Right Hand')).toBeInTheDocument();
    });
  });
});
