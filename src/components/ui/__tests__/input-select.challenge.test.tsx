import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

describe('Input & Select Challenge & Stress Suite', () => {
  describe('Input Component', () => {
    it('handles disabled state correctly', () => {
      const handleChange = vi.fn();
      render(
        <Input
          label="Disabled Field"
          disabled={true}
          value="Cannot edit"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Disabled Field');
      expect(input).toBeDisabled();
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:opacity-50');

      fireEvent.change(input, { target: { value: 'Attempted change' } });
      // In jsdom/HTML, fireEvent on disabled element does not dispatch change
      // or element retains disabled state
      expect(input).toBeDisabled();
    });

    it('wires aria-invalid and aria-describedby when error is present', () => {
      render(
        <Input
          label="Email Address"
          error="A valid email is required"
          helperText="We will never share your email"
        />
      );

      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-invalid', 'true');

      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const errorEl = document.getElementById(describedBy!);
      expect(errorEl).toBeInTheDocument();
      expect(errorEl?.textContent).toBe('A valid email is required');

      // Helper text should NOT be rendered when error is active
      expect(screen.queryByText('We will never share your email')).not.toBeInTheDocument();
    });

    it('wires aria-describedby to helper text when no error is present', () => {
      render(
        <Input
          label="Username"
          helperText="Between 3 and 20 characters"
        />
      );

      const input = screen.getByLabelText('Username');
      expect(input).toHaveAttribute('aria-invalid', 'false');

      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const helperEl = document.getElementById(describedBy!);
      expect(helperEl).toBeInTheDocument();
      expect(helperEl?.textContent).toBe('Between 3 and 20 characters');
    });

    it('omits aria-describedby when neither error nor helperText is provided', () => {
      render(<Input label="Plain Input" />);

      const input = screen.getByLabelText('Plain Input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('respects explicit custom id and correctly associates label, error, and helper', () => {
      render(
        <Input
          id="custom-input-id"
          label="Custom Field"
          error="Custom error message"
        />
      );

      const input = screen.getByLabelText('Custom Field');
      expect(input).toHaveAttribute('id', 'custom-input-id');
      expect(input).toHaveAttribute('aria-describedby', 'custom-input-id-error');

      const label = screen.getByText('Custom Field');
      expect(label).toHaveAttribute('for', 'custom-input-id');

      const errorEl = document.getElementById('custom-input-id-error');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl?.textContent).toBe('Custom error message');
    });

    it('handles empty string value and placeholder correctly', () => {
      const ControlledInput = () => {
        const [val, setVal] = useState('');
        return (
          <Input
            label="Empty Test"
            placeholder="Type something..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        );
      };

      render(<ControlledInput />);
      const input = screen.getByPlaceholderText('Type something...');
      expect(input).toHaveValue('');

      fireEvent.change(input, { target: { value: 'New text' } });
      expect(input).toHaveValue('New text');

      fireEvent.change(input, { target: { value: '' } });
      expect(input).toHaveValue('');
    });
  });

  describe('Select Component', () => {
    const sampleOptions = [
      { value: '', label: '-- Choose an option --' },
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2 (Disabled)', disabled: true },
      { value: 'opt3', label: 'Option 3' },
    ];

    it('handles disabled select and disabled options correctly', () => {
      render(
        <Select
          label="Disabled Dropdown"
          disabled={true}
          value="opt1"
          onChange={() => {}}
          options={sampleOptions}
        />
      );

      const select = screen.getByLabelText('Disabled Dropdown');
      expect(select).toBeDisabled();
      expect(select.className).toContain('disabled:cursor-not-allowed');

      const disabledOption = screen.getByRole('option', { name: 'Option 2 (Disabled)' });
      expect(disabledOption).toBeDisabled();
    });

    it('wires aria-invalid and aria-describedby when error is present on Select', () => {
      render(
        <Select
          label="Pick Category"
          error="Selection is required"
          value=""
          onChange={() => {}}
          options={sampleOptions}
        />
      );

      const select = screen.getByLabelText('Pick Category');
      expect(select).toHaveAttribute('aria-invalid', 'true');

      const describedBy = select.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const errorEl = document.getElementById(describedBy!);
      expect(errorEl).toBeInTheDocument();
      expect(errorEl?.textContent).toBe('Selection is required');
    });

    it('omits aria-describedby on Select when no error is present', () => {
      render(
        <Select
          label="Language Select"
          value="opt1"
          onChange={() => {}}
          options={sampleOptions}
        />
      );

      const select = screen.getByLabelText('Language Select');
      expect(select).toHaveAttribute('aria-invalid', 'false');
      expect(select).not.toHaveAttribute('aria-describedby');
    });

    it('respects explicit custom id and matches label htmlFor', () => {
      render(
        <Select
          id="custom-select-id"
          label="Explicit ID Select"
          value="opt1"
          onChange={() => {}}
          options={sampleOptions}
        />
      );

      const select = screen.getByLabelText('Explicit ID Select');
      expect(select).toHaveAttribute('id', 'custom-select-id');

      const label = screen.getByText('Explicit ID Select');
      expect(label).toHaveAttribute('for', 'custom-select-id');
    });

    it('handles empty string value as selection and dispatches onChange', () => {
      const handleChange = vi.fn();
      render(
        <Select
          label="Choose"
          value=""
          onChange={handleChange}
          options={sampleOptions}
        />
      );

      const select = screen.getByLabelText('Choose');
      expect(select).toHaveValue('');

      fireEvent.change(select, { target: { value: 'opt3' } });
      expect(handleChange).toHaveBeenCalledWith('opt3');
    });

    it('handles empty options array gracefully without crash', () => {
      render(
        <Select
          label="No Options"
          value=""
          onChange={() => {}}
          options={[]}
        />
      );

      const select = screen.getByLabelText('No Options');
      expect(select).toBeInTheDocument();
      expect(select.children.length).toBe(0);
    });
  });
});
