import React, { useState } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/ui/Tabs';

describe('Tabs Challenge & Stress Suite', () => {
  const threeTabs = [
    { id: 'tab-1', label: 'First Tab' },
    { id: 'tab-2', label: 'Second Tab' },
    { id: 'tab-3', label: 'Third Tab' },
  ];

  let originalDir: string;

  beforeEach(() => {
    originalDir = document.dir;
  });

  afterEach(() => {
    document.dir = originalDir;
    vi.restoreAllMocks();
  });

  describe('LTR Keyboard Navigation & Wrapping', () => {
    beforeEach(() => {
      document.dir = 'ltr';
    });

    it('ArrowRight navigates forward and wraps from last to first tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });
      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });
      const tab3 = screen.getByRole('tab', { name: 'Third Tab' });

      // tab-1 -> tab-2
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-2');

      // tab-2 -> tab-3
      fireEvent.keyDown(tab2, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');

      // tab-3 -> wraps to tab-1
      fireEvent.keyDown(tab3, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');
    });

    it('ArrowLeft navigates backward and wraps from first to last tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });
      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });
      const tab3 = screen.getByRole('tab', { name: 'Third Tab' });

      // tab-1 -> wraps to tab-3
      fireEvent.keyDown(tab1, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');

      // tab-3 -> tab-2
      fireEvent.keyDown(tab3, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-2');

      // tab-2 -> tab-1
      fireEvent.keyDown(tab2, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');
    });

    it('Home jumps to first tab and End jumps to last tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-2" onChange={handleChange} />);

      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });

      // Home from middle tab
      fireEvent.keyDown(tab2, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');

      // End from middle tab
      fireEvent.keyDown(tab2, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');
    });
  });

  describe('RTL Keyboard Navigation & Reversal', () => {
    beforeEach(() => {
      document.dir = 'rtl';
    });

    it('ArrowLeft navigates forward in RTL and wraps from last to first tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });
      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });
      const tab3 = screen.getByRole('tab', { name: 'Third Tab' });

      // In RTL: ArrowLeft goes forward (0 -> 1)
      fireEvent.keyDown(tab1, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-2');

      // In RTL: ArrowLeft goes forward (1 -> 2)
      fireEvent.keyDown(tab2, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');

      // In RTL: ArrowLeft wraps from last to first (2 -> 0)
      fireEvent.keyDown(tab3, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');
    });

    it('ArrowRight navigates backward in RTL and wraps from first to last tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });
      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });
      const tab3 = screen.getByRole('tab', { name: 'Third Tab' });

      // In RTL: ArrowRight goes backward (0 -> wraps to 2)
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');

      // In RTL: ArrowRight goes backward (2 -> 1)
      fireEvent.keyDown(tab3, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-2');

      // In RTL: ArrowRight goes backward (1 -> 0)
      fireEvent.keyDown(tab2, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');
    });

    it('Home and End jump correctly in RTL', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-2" onChange={handleChange} />);

      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });

      fireEvent.keyDown(tab2, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith('tab-1');

      fireEvent.keyDown(tab2, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith('tab-3');
    });
  });

  describe('Edge Cases & Resiliency', () => {
    it('handles single tab without errors or out-of-bounds indexing', () => {
      const singleTab = [{ id: 'only', label: 'Only Tab' }];
      const handleChange = vi.fn();
      render(<Tabs tabs={singleTab} activeTab="only" onChange={handleChange} />);

      const tab = screen.getByRole('tab', { name: 'Only Tab' });
      expect(tab).toHaveAttribute('aria-selected', 'true');

      fireEvent.keyDown(tab, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('only');

      fireEvent.keyDown(tab, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('only');

      fireEvent.keyDown(tab, { key: 'Home' });
      expect(handleChange).toHaveBeenCalledWith('only');

      fireEvent.keyDown(tab, { key: 'End' });
      expect(handleChange).toHaveBeenCalledWith('only');
    });

    it('renders empty tabs array without crashing', () => {
      const { container } = render(<Tabs tabs={[]} activeTab="" onChange={() => {}} />);
      const tablist = container.querySelector('[role="tablist"]');
      expect(tablist).toBeInTheDocument();
      expect(tablist?.children.length).toBe(0);
    });

    it('ignores non-navigation keys without triggering onChange', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={threeTabs} activeTab="tab-1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });

      fireEvent.keyDown(tab1, { key: 'ArrowUp' });
      fireEvent.keyDown(tab1, { key: 'ArrowDown' });
      fireEvent.keyDown(tab1, { key: 'Tab' });
      fireEvent.keyDown(tab1, { key: 'Enter' });
      fireEvent.keyDown(tab1, { key: 'Space' });
      fireEvent.keyDown(tab1, { key: 'Escape' });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('maintains proper ARIA tab and tablist wiring and tabIndex roving attributes', () => {
      const ControlledTabs = () => {
        const [active, setActive] = useState('tab-1');
        return <Tabs tabs={threeTabs} activeTab={active} onChange={setActive} />;
      };

      render(<ControlledTabs />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');

      const tab1 = screen.getByRole('tab', { name: 'First Tab' });
      const tab2 = screen.getByRole('tab', { name: 'Second Tab' });
      const tab3 = screen.getByRole('tab', { name: 'Third Tab' });

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab1).toHaveAttribute('tabIndex', '0');
      expect(tab1).toHaveAttribute('id', 'tab-tab-1');
      expect(tab1).toHaveAttribute('aria-controls', 'tabpanel-tab-1');

      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab2).toHaveAttribute('tabIndex', '-1');

      expect(tab3).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('tabIndex', '-1');

      // Click tab2 and verify attributes update
      fireEvent.click(tab2);
      expect(tab2).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('tabIndex', '0');
      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab1).toHaveAttribute('tabIndex', '-1');
    });
  });
});
