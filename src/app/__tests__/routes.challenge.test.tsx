import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '@/app/page';
import GuidedPage from '@/app/guided/page';
import LessonPracticePage from '@/app/guided/[lessonId]/page';
import ReflexPage from '@/app/reflex/page';
import VocabularyPage from '@/app/vocabulary/page';
import MyVocabularyPage from '@/app/my-vocabulary/page';
import ProgressPage from '@/app/progress/page';
import SettingsPage from '@/app/settings/page';
import { persistenceService } from '@/services/persistence';

vi.mock('next/navigation', () => ({
  useParams: () => ({ lessonId: '1' }),
  usePathname: () => '/',
}));

describe('Route Rendering Challenge & Stress Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('HomePage (/)', () => {
    it('renders hero banner and all 3 practice mode cards', () => {
      render(<HomePage />);
      expect(screen.getByText('KeyLingo')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Check practice mode links
      const links = screen.getAllByRole('link');
      const hrefs = links.map((l) => l.getAttribute('href'));
      expect(hrefs).toContain('/guided');
      expect(hrefs).toContain('/reflex');
      expect(hrefs).toContain('/vocabulary');
    });
  });

  describe('GuidedPage (/guided)', () => {
    it('renders layout tabs and curriculum preview lessons', () => {
      render(<GuidedPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(2);

      // Verify lessons render
      expect(screen.getByText(/Home Row Fundamentals/i)).toBeInTheDocument();
      expect(screen.getByText(/Top Row Vowels/i)).toBeInTheDocument();

      // Check start/restart buttons on unlocked lessons
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('switches active layout tab when tab is clicked', () => {
      render(<GuidedPage />);
      const arabicTab = screen.getByRole('tab', { name: /Arabic 101/i });
      fireEvent.click(arabicTab);
      expect(arabicTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('LessonPracticePage (/guided/[lessonId])', () => {
    it('renders lesson session with dynamic route parameter', () => {
      render(<LessonPracticePage />);
      expect(screen.getByText('Lesson 1 Practice Session')).toBeInTheDocument();
      expect(screen.getByText(/Target keys/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Guided Lessons/i })).toHaveAttribute(
        'href',
        '/guided'
      );
    });
  });

  describe('ReflexPage (/reflex)', () => {
    it('renders configurator controls and updates selectors', () => {
      render(<ReflexPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      const difficultySelect = screen.getByLabelText(/Difficulty/i);
      expect(difficultySelect).toBeInTheDocument();
      fireEvent.change(difficultySelect, { target: { value: 'hard' } });
      expect(difficultySelect).toHaveValue('hard');

      const lengthSelect = screen.getByLabelText(/Length/i);
      fireEvent.change(lengthSelect, { target: { value: 'long' } });
      expect(lengthSelect).toHaveValue('long');

      const layoutSelect = screen.getByLabelText(/Keyboard Layout/i);
      fireEvent.change(layoutSelect, { target: { value: 'arabic-101' } });
      expect(layoutSelect).toHaveValue('arabic-101');
    });
  });

  describe('VocabularyPage (/vocabulary)', () => {
    it('renders 4 filter selectors and vocabulary chips', () => {
      render(<VocabularyPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      expect(screen.getByLabelText(/Practice Language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Translation Language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/CEFR Level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();

      // Vocabulary chips should render (at least one word from default filters - English A1 Everyday)
      expect(screen.getByText('apple')).toBeInTheDocument();
    });
  });

  describe('MyVocabularyPage (/my-vocabulary)', () => {
    it('renders search filter and empty state initially', () => {
      render(<MyVocabularyPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Initially shows empty state
      expect(screen.getByText(/No saved words yet/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

      // Filter selectors should be present
      expect(screen.getByLabelText(/Filter by Language/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Filter by Review Status/i)).toBeInTheDocument();
    });
  });

  describe('ProgressPage (/progress)', () => {
    it('renders metric cards with empty state and weak keys section', () => {
      render(<ProgressPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Empty state shows — for metrics (at least one)
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
      expect(screen.getByText('0m')).toBeInTheDocument();
      expect(screen.getByText('0 days')).toBeInTheDocument();

      // Weak keys section shows empty message
      expect(screen.getByText(/No error patterns recorded yet/i)).toBeInTheDocument();
    });
  });

  describe('SettingsPage (/settings)', () => {
    it('renders settings selects and handles reset modal workflow', () => {
      const clearSpy = vi.spyOn(persistenceService, 'clear');

      render(<SettingsPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Reset modal starts closed
      expect(screen.queryByText('Reset All Local Data?')).not.toBeInTheDocument();

      // Click Reset All
      const resetBtn = screen.getByRole('button', { name: /Reset All Data/i });
      fireEvent.click(resetBtn);

      // Modal is now open
      expect(screen.getByText('Reset All Local Data?')).toBeInTheDocument();

      // Cancel closes dialog without clearing
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);
      expect(screen.queryByText('Reset All Local Data?')).not.toBeInTheDocument();
      expect(clearSpy).not.toHaveBeenCalled();

      // Open again and confirm
      fireEvent.click(resetBtn);
      const confirmBtn = screen.getByRole('button', { name: /^Confirm$/i });
      fireEvent.click(confirmBtn);

      expect(clearSpy).toHaveBeenCalled();
      expect(screen.getByText('All data reset to defaults.')).toBeInTheDocument();
    });

    it('triggers exportAll on export click', () => {
      const exportSpy = vi.spyOn(persistenceService, 'exportAll').mockReturnValue('{"_version":1}');
      // Mock createObjectURL & revokeObjectURL
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      window.URL.revokeObjectURL = vi.fn();

      render(<SettingsPage />);
      const exportBtn = screen.getByRole('button', { name: /Export/i });
      fireEvent.click(exportBtn);

      expect(exportSpy).toHaveBeenCalled();
      expect(screen.getByText('Backup exported successfully.')).toBeInTheDocument();
    });
  });
});
