import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('AppShell Challenge & Stress Suite', () => {
  let initialHtmlDir: string;
  let initialHtmlLang: string;

  beforeEach(() => {
    mockPathname = '/';
    initialHtmlDir = document.documentElement.dir;
    initialHtmlLang = document.documentElement.lang;
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.dir = initialHtmlDir;
    document.documentElement.lang = initialHtmlLang;
    vi.restoreAllMocks();
  });

  describe('Route Switching & Active Link Highlighting', () => {
    it('highlights Home as active when pathname is "/"', () => {
      mockPathname = '/';
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const nav = screen.getByLabelText('Main Navigation');
      const homeLink = nav.querySelector('a[href="/"]');
      const guidedLink = nav.querySelector('a[href="/guided"]');

      expect(homeLink?.className).toContain('bg-primary/10');
      expect(homeLink?.className).toContain('text-primary');
      expect(guidedLink?.className).not.toContain('bg-primary/10');
    });

    it('highlights Guided as active when pathname is "/guided"', () => {
      mockPathname = '/guided';
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const nav = screen.getByLabelText('Main Navigation');
      const homeLink = nav.querySelector('a[href="/"]');
      const guidedLink = nav.querySelector('a[href="/guided"]');

      expect(guidedLink?.className).toContain('bg-primary/10');
      expect(homeLink?.className).not.toContain('bg-primary/10');
    });

    it('highlights Guided as active for nested route "/guided/1"', () => {
      mockPathname = '/guided/1';
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const nav = screen.getByLabelText('Main Navigation');
      const guidedLink = nav.querySelector('a[href="/guided"]');
      expect(guidedLink?.className).toContain('bg-primary/10');
    });

    it('highlights settings when pathname is "/settings"', () => {
      mockPathname = '/settings';
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const nav = screen.getByLabelText('Main Navigation');
      const settingsLink = nav.querySelector('a[href="/settings"]');
      expect(settingsLink?.className).toContain('bg-primary/10');
    });
  });

  describe('Mobile Navigation Drawer', () => {
    it('starts closed with aria-expanded="false"', () => {
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const hamburger = screen.getByRole('button', { name: 'Toggle Mobile Menu' });
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByLabelText('Mobile Navigation')).not.toBeInTheDocument();
    });

    it('opens drawer on hamburger click and closes on second click', () => {
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const hamburger = screen.getByRole('button', { name: 'Toggle Mobile Menu' });

      // Click to open
      fireEvent.click(hamburger);
      expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByLabelText('Mobile Navigation')).toBeInTheDocument();

      // Click to close
      fireEvent.click(hamburger);
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByLabelText('Mobile Navigation')).not.toBeInTheDocument();
    });

    it('closes mobile drawer automatically when a navigation link is clicked', () => {
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const hamburger = screen.getByRole('button', { name: 'Toggle Mobile Menu' });
      fireEvent.click(hamburger);

      const mobileNav = screen.getByLabelText('Mobile Navigation');
      const reflexLink = mobileNav.querySelector('a[href="/reflex"]');
      expect(reflexLink).toBeInTheDocument();

      fireEvent.click(reflexLink!);
      expect(screen.queryByLabelText('Mobile Navigation')).not.toBeInTheDocument();
      expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Language Switch & RTL Document Effects', () => {
    it('sets dir="rtl" on documentElement and root container when Arabic is chosen', () => {
      render(
        <AppShell>
          <div data-testid="content">Page Content</div>
        </AppShell>
      );

      const langSelect = screen.getByLabelText('Interface Language');
      fireEvent.change(langSelect, { target: { value: 'ar' } });

      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');

      const content = screen.getByTestId('content');
      const rootContainer = content.closest('[dir]');
      expect(rootContainer).toHaveAttribute('dir', 'rtl');
    });

    it('sets dir="ltr" and lang="nl" when Dutch is chosen', () => {
      render(
        <AppShell>
          <div data-testid="content">Page Content</div>
        </AppShell>
      );

      const langSelect = screen.getByLabelText('Interface Language');
      fireEvent.change(langSelect, { target: { value: 'nl' } });

      expect(document.documentElement.lang).toBe('nl');
      expect(document.documentElement.dir).toBe('ltr');

      const content = screen.getByTestId('content');
      const rootContainer = content.closest('[dir]');
      expect(rootContainer).toHaveAttribute('dir', 'ltr');
    });

    it('sets dir="ltr" and lang="en" when English is chosen', () => {
      render(
        <AppShell>
          <div data-testid="content">Page Content</div>
        </AppShell>
      );

      const langSelect = screen.getByLabelText('Interface Language');
      fireEvent.change(langSelect, { target: { value: 'en' } });

      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  describe('Theme Toggle', () => {
    it('toggles theme when theme button is clicked', () => {
      render(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const themeBtn = screen.getByRole('button', { name: 'Toggle Theme' });
      expect(themeBtn).toBeInTheDocument();

      fireEvent.click(themeBtn);
      // usePreferences toggles between dark/light and updates .dark class on documentElement
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      fireEvent.click(themeBtn);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
