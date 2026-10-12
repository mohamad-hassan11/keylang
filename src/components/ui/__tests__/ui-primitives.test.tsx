import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders children and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('displays loading spinner and is disabled when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('applies variant and size styles properly', () => {
      render(
        <Button variant="danger" size="lg">
          Delete
        </Button>
      );
      const button = screen.getByRole('button', { name: /delete/i });
      expect(button.className).toContain('bg-destructive');
      expect(button.className).toContain('h-12');
    });
  });

  describe('Card', () => {
    it('renders all compound card sections', () => {
      render(
        <Card variant="elevated" padding="lg">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Content Area</CardContent>
          <CardFooter>Footer Action</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Content Area')).toBeInTheDocument();
      expect(screen.getByText('Footer Action')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with correct variant classes', () => {
      render(<Badge variant="success">Completed</Badge>);
      const badge = screen.getByText('Completed');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-emerald-500/15');
    });
  });

  describe('Input', () => {
    it('renders label, input, and helper text', () => {
      render(<Input label="Username" helperText="Enter your unique name" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByText('Enter your unique name')).toBeInTheDocument();
    });

    it('renders error message and sets aria-invalid', () => {
      render(<Input label="Email" error="Invalid email address" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    it('renders select with options and handles change', () => {
      const handleChange = vi.fn();
      const options = [
        { value: 'en', label: 'English' },
        { value: 'nl', label: 'Nederlands' },
      ];
      render(
        <Select
          label="Language"
          value="en"
          onChange={handleChange}
          options={options}
        />
      );

      const select = screen.getByLabelText('Language');
      expect(select).toHaveValue('en');
      fireEvent.change(select, { target: { value: 'nl' } });
      expect(handleChange).toHaveBeenCalledWith('nl');
    });
  });

  describe('Dialog', () => {
    it('renders when isOpen is true and dismisses on Escape key', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Dialog isOpen={false} onClose={handleClose} title="Modal Title">
          Modal Body
        </Dialog>
      );

      expect(screen.queryByText('Modal Title')).not.toBeInTheDocument();

      rerender(
        <Dialog isOpen={true} onClose={handleClose} title="Modal Title">
          Modal Body
        </Dialog>
      );

      expect(screen.getByText('Modal Title')).toBeInTheDocument();
      expect(screen.getByText('Modal Body')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tabs', () => {
    it('renders tabs and handles tab selection and keyboard arrow keys', () => {
      const handleChange = vi.fn();
      const tabs = [
        { id: 'tab1', label: 'Tab One' },
        { id: 'tab2', label: 'Tab Two' },
        { id: 'tab3', label: 'Tab Three' },
      ];

      render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleChange} />);

      const tab1 = screen.getByRole('tab', { name: 'Tab One' });
      expect(tab1).toHaveAttribute('aria-selected', 'true');

      const tab2 = screen.getByRole('tab', { name: 'Tab Two' });
      fireEvent.click(tab2);
      expect(handleChange).toHaveBeenCalledWith('tab2');

      // Test arrow navigation
      fireEvent.keyDown(tab1, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Tooltip', () => {
    it('shows tooltip content on mouse enter and hides on mouse leave', async () => {
      vi.useFakeTimers();

      const { container } = render(
        <Tooltip content="Helpful information" delayMs={100}>
          <button type="button">Hover over me</button>
        </Tooltip>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful information');

      fireEvent.mouseLeave(wrapper);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      vi.useRealTimers();
    });
  });
});
