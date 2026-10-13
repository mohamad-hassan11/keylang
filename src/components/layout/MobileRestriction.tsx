'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { Smartphone, Monitor, Keyboard, BarChart2, Bookmark, Settings } from 'lucide-react';

interface MobileRestrictionProps {
  readonly title?: string;
  readonly description?: string;
  readonly showNavigation?: boolean;
}

export function MobileRestriction({
  title,
  description,
  showNavigation = true,
}: MobileRestrictionProps) {
  const { preferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card variant="bordered" padding="lg" className="max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Smartphone className="h-10 w-10 text-amber-500" />
            <Monitor className="h-10 w-10 text-primary" />
            <Keyboard className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {title || 'Keyboard Practice Requires Desktop'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {description ||
                'KeyLingo typing practice requires a physical keyboard. Please use a desktop or laptop computer for the best experience.'}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
          <h3 className="font-semibold text-foreground">{strings.appName} on Mobile</h3>
          <ul className="text-sm text-left text-muted-foreground space-y-2 mt-2">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> View progress & statistics
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Review saved vocabulary
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span> Manage settings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">✗</span> Guided typing lessons
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">✗</span> Reflex training drills
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">✗</span> Vocabulary typing practice
            </li>
          </ul>
        </div>

        {showNavigation && (
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/progress">
              <Button variant="outline" className="w-full justify-center gap-2">
                <BarChart2 className="h-4 w-4" />
                View Progress
              </Button>
            </Link>
            <Link href="/my-vocabulary">
              <Button variant="outline" className="w-full justify-center gap-2">
                <Bookmark className="h-4 w-4" />
                My Vocabulary
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}