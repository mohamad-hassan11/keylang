'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings, getDirection } from '@/lib/locale';
import { LanguageCode } from '@/lib/types';
import {
  Home,
  GraduationCap,
  Zap,
  BookOpen,
  Bookmark,
  BarChart2,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Globe,
} from 'lucide-react';

export interface AppShellProps {
  readonly children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { preferences, updatePreference, toggleTheme } = usePreferences();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const lang = preferences.interfaceLanguage || 'en';
  const strings = getLocaleStrings(lang);
  const dir = getDirection(lang);

  const navItems = [
    { href: '/', label: strings.navHome, icon: Home },
    { href: '/guided', label: strings.navGuided, icon: GraduationCap },
    { href: '/reflex', label: strings.navReflex, icon: Zap },
    { href: '/vocabulary', label: strings.navVocabulary, icon: BookOpen },
    { href: '/my-vocabulary', label: strings.navMyVocabulary, icon: Bookmark },
    { href: '/progress', label: strings.navProgress, icon: BarChart2 },
    { href: '/settings', label: strings.navSettings, icon: Settings },
  ];

  const handleLanguageChange = (newLang: string) => {
    updatePreference('interfaceLanguage', newLang as LanguageCode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" dir={dir}>
      {/* Header Landmark */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-xs">
                K
              </span>
              <span>{strings.appName}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 rtl:space-x-reverse">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Header Controls (Theme, Language, Mobile Hamburger) */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative inline-flex items-center">
              <Globe className="h-4 w-4 text-muted-foreground pointer-events-none absolute start-2.5" />
              <select
                aria-label="Interface Language"
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="appearance-none h-9 ps-8 pe-6 text-xs rounded-lg border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer hover:bg-accent/50"
              >
                <option value="en">English (EN)</option>
                <option value="nl">Nederlands (NL)</option>
                <option value="ar">العربية (AR)</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 pt-2 pb-4 space-y-1">
            <nav aria-label="Mobile Navigation" className="flex flex-col space-y-1">
              {navItems.map((item) => {
                const active = isLinkActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Landmark */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer Landmark */}
      <footer className="border-t border-border py-6 bg-card text-muted-foreground text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {strings.appName}. {strings.appTagline}.</p>
          <div className="flex items-center gap-4">
            <span>Offline-First</span>
            <span>•</span>
            <span>EN • NL • AR</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
