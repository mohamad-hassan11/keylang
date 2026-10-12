'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { usePreferences } from '@/hooks/usePreferences';
import { getLocaleStrings } from '@/lib/locale';
import { LanguageCode, Theme, DiacriticMode } from '@/lib/types';
import { persistenceService } from '@/services/persistence';
import { ALL_STORAGE_KEYS } from '@/lib/constants';
import { Download, Upload, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const strings = getLocaleStrings(preferences.interfaceLanguage || 'en');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const data = persistenceService.exportAll();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keylingo-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMessage('Backup exported successfully.');
    } catch {
      setBackupMessage('Export failed.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const success = persistenceService.importAll(text);
      if (success) {
        setBackupMessage('Backup imported successfully. Reloading...');
        setTimeout(() => window.location.reload(), 800);
      } else {
        setBackupMessage('Failed to import backup: invalid data.');
      }
    };
    input.click();
  };

  const handleResetConfirm = () => {
    for (const key of ALL_STORAGE_KEYS) {
      persistenceService.clear(key);
    }
    resetPreferences();
    setIsResetDialogOpen(false);
    setBackupMessage('All data reset to defaults.');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{strings.settingsTitle}</h1>
        <p className="text-muted-foreground mt-1">{strings.settingsSubtitle}</p>
      </div>

      {backupMessage && (
        <div className="p-3 text-sm rounded-lg bg-primary/10 border border-primary/20 text-primary">
          {backupMessage}
        </div>
      )}

      {/* Preferences Form */}
      <Card variant="default" padding="lg" className="space-y-6">
        <CardHeader className="p-0 pb-2">
          <CardTitle>{strings.labelLanguage} & Localization</CardTitle>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={strings.settingsInterfaceLang}
            value={preferences.interfaceLanguage || 'en'}
            onChange={(val) => updatePreference('interfaceLanguage', val as LanguageCode)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية (Arabic)' },
            ]}
          />
          <Select
            label={strings.settingsPracticeLang}
            value={preferences.practiceLanguage || 'en'}
            onChange={(val) => updatePreference('practiceLanguage', val as LanguageCode)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'ar', label: 'العربية (Arabic)' },
            ]}
          />
          <Select
            label={strings.settingsLayout}
            value={preferences.keyboardLayout || 'qwerty-us'}
            onChange={(val) => updatePreference('keyboardLayout', val)}
            options={[
              { value: 'qwerty-us', label: 'QWERTY US (ANSI)' },
              { value: 'us-international', label: 'US-International (Dutch dead keys)' },
              { value: 'arabic-101', label: 'Arabic 101' },
            ]}
          />
          <Select
            label={strings.settingsTheme}
            value={preferences.theme || 'system'}
            onChange={(val) => updatePreference('theme', val as Theme)}
            options={[
              { value: 'system', label: strings.settingsThemeSystem },
              { value: 'light', label: strings.settingsThemeLight },
              { value: 'dark', label: strings.settingsThemeDark },
            ]}
          />
          <Select
            label={strings.settingsDiacriticMode}
            value={preferences.diacriticMatching || 'lenient'}
            onChange={(val) => updatePreference('diacriticMatching', val as DiacriticMode)}
            options={[
              { value: 'lenient', label: strings.labelLenient },
              { value: 'strict', label: strings.labelStrict },
            ]}
          />
        </CardContent>
      </Card>

      {/* Data Backup & Reset */}
      <Card variant="bordered" padding="lg" className="space-y-4">
        <CardHeader className="p-0">
          <CardTitle>{strings.settingsDataBackup}</CardTitle>
          <CardDescription>Export your offline progress or restore backups.</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>{strings.actionExport}</span>
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            <span>{strings.actionImport}</span>
          </Button>
          <Button variant="danger" onClick={() => setIsResetDialogOpen(true)}>
            <RotateCcw className="h-4 w-4" />
            <span>{strings.actionResetAll}</span>
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title="Reset All Local Data?"
        description="This will clear your saved progress, vocabulary words, and statistics from localStorage. This action cannot be undone."
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
            {strings.actionCancel}
          </Button>
          <Button variant="danger" onClick={handleResetConfirm}>
            {strings.actionConfirm}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
