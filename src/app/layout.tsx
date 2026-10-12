import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'KeyLingo — Multilingual Touch-Typing & Vocabulary Trainer',
  description:
    'Web-based touch typing and vocabulary learning web app supporting English, Dutch, and Arabic across QWERTY and Arabic 101 layouts.',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="font-sans">
      <head>
        {/* Anti-FOUC Inline Script: Evaluates theme and direction synchronously before DOM paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('keylingo-preferences');
                if (stored) {
                  var parsed = JSON.parse(stored);
                  var data = parsed.data || parsed;
                  var theme = data.theme || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                  var lang = data.interfaceLanguage || 'en';
                  document.documentElement.lang = lang;
                  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
