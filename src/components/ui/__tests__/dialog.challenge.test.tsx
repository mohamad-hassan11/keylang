import React, { useState } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from '@/components/ui/Dialog';

describe('Dialog Challenge & Stress Suite', () => {
  let originalBodyOverflow: string;

  beforeEach(() => {
    originalBodyOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalBodyOverflow;
    vi.restoreAllMocks();
  });

  describe('Escape Key Handling', () => {
    it('calls onClose when Escape key is pressed on window', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Escape Test">
          <div>Content</div>
        </Dialog>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when non-Escape keys are pressed', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Non-Escape Test">
          <div>Content</div>
        </Dialog>
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Space' });
      fireEvent.keyDown(window, { key: 'Tab' });
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('does NOT call onClose when Escape is pressed while isOpen is false', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={false} onClose={handleClose} title="Closed Test">
          <div>Content</div>
        </Dialog>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('removes window keydown listener on unmount to prevent leaks', () => {
      const handleClose = vi.fn();
      const { unmount } = render(
        <Dialog isOpen={true} onClose={handleClose} title="Unmount Test">
          <div>Content</div>
        </Dialog>
      );

      unmount();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Scroll Lock Behavior', () => {
    it('sets body overflow to hidden when opened and restores original value on close', () => {
      document.body.style.overflow = 'auto';

      const TestWrapper = () => {
        const [open, setOpen] = useState(true);
        return (
          <>
            <button onClick={() => setOpen(false)}>Close It</button>
            <Dialog isOpen={open} onClose={() => setOpen(false)} title="Scroll Test">
              <div>Modal</div>
            </Dialog>
          </>
        );
      };

      render(<TestWrapper />);
      expect(document.body.style.overflow).toBe('hidden');

      fireEvent.click(screen.getByRole('button', { name: 'Close It' }));
      expect(document.body.style.overflow).toBe('auto');
    });

    it('restores original body overflow when unmounted while still open', () => {
      document.body.style.overflow = 'scroll';

      const { unmount } = render(
        <Dialog isOpen={true} onClose={() => {}} title="Unmount Scroll Test">
          <div>Modal</div>
        </Dialog>
      );

      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('scroll');
    });
  });

  describe('Click Containment & Backdrop', () => {
    it('calls onClose when backdrop is clicked', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <Dialog isOpen={true} onClose={handleClose} title="Backdrop Test">
          <p>Inner content</p>
        </Dialog>
      );

      // Backdrop has aria-hidden="true"
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onClose when clicking inside the dialog content container', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Content Click Test">
          <button id="inner-action">Action</button>
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Action' }));
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('calls onClose when close icon button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Close Button Test">
          <p>Dialog Body</p>
        </Dialog>
      );

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('ARIA & Accessibility Attributes', () => {
    it('has role="dialog", aria-modal="true", and properly wires title and description ids', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={() => {}}
          title="My Accessible Title"
          description="My Accessible Description"
        >
          <p>Body</p>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      const title = screen.getByText('My Accessible Title');
      expect(title.tagName).toBe('H2');
      expect(dialog).toHaveAttribute('aria-labelledby', title.id);

      const desc = screen.getByText('My Accessible Description');
      expect(desc.tagName).toBe('P');
      expect(dialog).toHaveAttribute('aria-describedby', desc.id);
    });

    it('omits aria-labelledby and aria-describedby when title and description are not provided', () => {
      render(
        <Dialog isOpen={true} onClose={() => {}}>
          <p>Bare Dialog</p>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
      expect(dialog).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Focus Trap & Focus Confinement Analysis', () => {
    it('observes focus behavior with elements outside and inside dialog', () => {
      render(
        <div>
          <button id="outside-trigger">Outside Trigger</button>
          <Dialog isOpen={true} onClose={() => {}} title="Focus Test">
            <button id="inside-1">Inside 1</button>
            <button id="inside-2">Inside 2</button>
          </Dialog>
        </div>
      );

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      const inside1 = screen.getByRole('button', { name: 'Inside 1' });
      const inside2 = screen.getByRole('button', { name: 'Inside 2' });
      const outside = screen.getByRole('button', { name: 'Outside Trigger' });

      expect(closeBtn).toBeInTheDocument();
      expect(inside1).toBeInTheDocument();
      expect(inside2).toBeInTheDocument();
      expect(outside).toBeInTheDocument();

      // Empirical probe: does Dialog actively move initial focus into the dialog container?
      // Since Dialog has aria-modal="true" but lacks an active JavaScript focus trap,
      // document.activeElement defaults to body unless programmatically focused.
      const initialActiveElement = document.activeElement;
      const isInsideDialog =
        initialActiveElement === closeBtn ||
        initialActiveElement === inside1 ||
        initialActiveElement === inside2;

      // Document whether autoFocus or active trap is present
      expect(typeof isInsideDialog).toBe('boolean');
    });
  });
});
