'use client';

import React from 'react';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
}

export interface TabsProps {
  readonly tabs: readonly TabItem[];
  readonly activeTab: string;
  readonly onChange: (tabId: string) => void;
  readonly className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';
    let nextIndex = index;

    if ((!isRtl && e.key === 'ArrowRight') || (isRtl && e.key === 'ArrowLeft')) {
      nextIndex = (index + 1) % tabs.length;
    } else if ((!isRtl && e.key === 'ArrowLeft') || (isRtl && e.key === 'ArrowRight')) {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    onChange(tabs[nextIndex].id);
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={`flex items-center space-x-1 rtl:space-x-reverse p-1 rounded-xl bg-muted text-muted-foreground border border-border/40 ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-card text-foreground font-semibold shadow-xs'
                : 'hover:text-foreground hover:bg-card/50'
            }`}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
