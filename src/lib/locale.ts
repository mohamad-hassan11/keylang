import { LanguageCode, Direction } from './types';

export interface LocaleStrings {
  // Brand & Meta
  appName: string;
  appTagline: string;

  // Nav Routes
  navHome: string;
  navGuided: string;
  navReflex: string;
  navVocabulary: string;
  navMyVocabulary: string;
  navProgress: string;
  navSettings: string;

  // Common Actions
  actionStart: string;
  actionRestart: string;
  actionPause: string;
  actionResume: string;
  actionComplete: string;
  actionNext: string;
  actionSave: string;
  actionRemove: string;
  actionCancel: string;
  actionConfirm: string;
  actionClose: string;
  actionExport: string;
  actionImport: string;
  actionResetAll: string;

  // Labels & Metrics
  labelWpm: string;
  labelNetWpm: string;
  labelGrossWpm: string;
  labelAccuracy: string;
  labelTime: string;
  labelErrors: string;
  labelLanguage: string;
  labelKeyboardLayout: string;
  labelTheme: string;
  labelLevel: string;
  labelCategory: string;
  labelSearch: string;
  labelStrict: string;
  labelLenient: string;

  // Statuses
  statusLocked: string;
  statusUnlocked: string;
  statusCompleted: string;

  // Home Page
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeGuidedTitle: string;
  homeGuidedDesc: string;
  homeReflexTitle: string;
  homeReflexDesc: string;
  homeVocabTitle: string;
  homeVocabDesc: string;

  // Guided Curriculum Page
  guidedTitle: string;
  guidedSubtitle: string;
  guidedLesson: string;
  guidedTargetAccuracy: string;
  guidedTargetWpm: string;

  // Reflex Page
  reflexTitle: string;
  reflexSubtitle: string;
  reflexDifficulty: string;
  reflexLength: string;
  reflexSeed: string;
  reflexAdaptive: string;

  // Vocabulary Page
  vocabTitle: string;
  vocabSubtitle: string;
  vocabPracticeLang: string;
  vocabTransLang: string;
  vocabLookupPauseNotice: string;

  // My Vocabulary Page
  myVocabTitle: string;
  myVocabSubtitle: string;
  myVocabEmpty: string;
  myVocabEmptyAction: string;

  // Progress Page
  progressTitle: string;
  progressSubtitle: string;
  progressTopSpeed: string;
  progressAvgAccuracy: string;
  progressTotalTime: string;
  progressWeakKeys: string;

  // Settings Page
  settingsTitle: string;
  settingsSubtitle: string;
  settingsInterfaceLang: string;
  settingsPracticeLang: string;
  settingsLayout: string;
  settingsTheme: string;
  settingsThemeLight: string;
  settingsThemeDark: string;
  settingsThemeSystem: string;
  settingsDiacriticMode: string;
  settingsDataBackup: string;
}

export const LOCALE_STRINGS: Record<LanguageCode, LocaleStrings> = {
  en: {
    appName: 'KeyLingo',
    appTagline: 'Multilingual Touch-Typing & Vocabulary Mastery',
    navHome: 'Home',
    navGuided: 'Guided',
    navReflex: 'Reflex',
    navVocabulary: 'Vocabulary',
    navMyVocabulary: 'My Vocabulary',
    navProgress: 'Progress',
    navSettings: 'Settings',

    actionStart: 'Start Practice',
    actionRestart: 'Restart',
    actionPause: 'Pause',
    actionResume: 'Resume',
    actionComplete: 'Finish',
    actionNext: 'Next Lesson',
    actionSave: 'Save Word',
    actionRemove: 'Remove',
    actionCancel: 'Cancel',
    actionConfirm: 'Confirm',
    actionClose: 'Close',
    actionExport: 'Export Data',
    actionImport: 'Import Data',
    actionResetAll: 'Reset All Data',

    labelWpm: 'WPM',
    labelNetWpm: 'Net WPM',
    labelGrossWpm: 'Gross WPM',
    labelAccuracy: 'Accuracy',
    labelTime: 'Time',
    labelErrors: 'Errors',
    labelLanguage: 'Language',
    labelKeyboardLayout: 'Keyboard Layout',
    labelTheme: 'Theme',
    labelLevel: 'CEFR Level',
    labelCategory: 'Category',
    labelSearch: 'Search...',
    labelStrict: 'Strict (with Diacritics)',
    labelLenient: 'Lenient (Ignore Diacritics)',

    statusLocked: 'Locked',
    statusUnlocked: 'Available',
    statusCompleted: 'Completed',

    homeHeroTitle: 'Master Typing. Learn Languages.',
    homeHeroSubtitle:
      'Train touch-typing across English, Dutch, and Arabic while expanding your vocabulary with offline translations.',
    homeGuidedTitle: 'Guided Learning',
    homeGuidedDesc: 'Learn proper finger placement from home row to full layout with interactive hand guidance.',
    homeReflexTitle: 'Reflex Training',
    homeReflexDesc: 'Build muscle memory with deterministic seeded character drills and adaptive error targeting.',
    homeVocabTitle: 'Vocabulary Practice',
    homeVocabDesc: 'Type meaningful A1–B2 words with instant word lookup and persistent personal word lists.',

    guidedTitle: 'Guided Touch-Typing Curriculum',
    guidedSubtitle: 'Structured step-by-step touch typing lessons with gating requirements.',
    guidedLesson: 'Lesson',
    guidedTargetAccuracy: 'Min Accuracy',
    guidedTargetWpm: 'Min WPM',

    reflexTitle: 'Reflex & Agility Drills',
    reflexSubtitle: 'Seeded pseudo-random drills targeting finger independence and adjacency reflexes.',
    reflexDifficulty: 'Difficulty',
    reflexLength: 'Drill Length',
    reflexSeed: 'Seed Number',
    reflexAdaptive: 'Prioritize Missed Keys',

    vocabTitle: 'Vocabulary Practice',
    vocabSubtitle: 'Practice typing real-world language vocabulary with non-penalizing word lookup.',
    vocabPracticeLang: 'Practice Language',
    vocabTransLang: 'Translation Language',
    vocabLookupPauseNotice: 'Click any word to inspect definition without timer penalty.',

    myVocabTitle: 'My Saved Vocabulary',
    myVocabSubtitle: 'Review, search, and practice words saved during typing sessions.',
    myVocabEmpty: 'No saved words yet.',
    myVocabEmptyAction: 'Start vocabulary practice and click any word to save it here!',

    progressTitle: 'Typing & Learning Analytics',
    progressSubtitle: 'Track your typing speed, accuracy milestones, and weak keys over time.',
    progressTopSpeed: 'Top Net Speed',
    progressAvgAccuracy: 'Average Accuracy',
    progressTotalTime: 'Total Time Practiced',
    progressWeakKeys: 'Keys Needing Practice',

    settingsTitle: 'Preferences & Settings',
    settingsSubtitle: 'Configure your typing layouts, interface languages, appearance, and local backups.',
    settingsInterfaceLang: 'Interface Language',
    settingsPracticeLang: 'Default Practice Language',
    settingsLayout: 'Default Keyboard Layout',
    settingsTheme: 'Appearance Theme',
    settingsThemeLight: 'Light',
    settingsThemeDark: 'Dark',
    settingsThemeSystem: 'System Default',
    settingsDiacriticMode: 'Arabic Tashkeel Matching',
    settingsDataBackup: 'Local Data Management',
  },

  nl: {
    appName: 'KeyLingo',
    appTagline: 'Meertalig Blind Typen & Woordenschat Leren',
    navHome: 'Start',
    navGuided: 'Begeleid',
    navReflex: 'Reflex',
    navVocabulary: 'Woordenschat',
    navMyVocabulary: 'Mijn Woorden',
    navProgress: 'Voortgang',
    navSettings: 'Instellingen',

    actionStart: 'Start Oefening',
    actionRestart: 'Opnieuw',
    actionPause: 'Pauze',
    actionResume: 'Hervatten',
    actionComplete: 'Voltooien',
    actionNext: 'Volgende Les',
    actionSave: 'Woord Opslaan',
    actionRemove: 'Verwijderen',
    actionCancel: 'Annuleren',
    actionConfirm: 'Bevestigen',
    actionClose: 'Sluiten',
    actionExport: 'Gegevens Exporteren',
    actionImport: 'Gegevens Importeren',
    actionResetAll: 'Alles Wissen',

    labelWpm: 'WPM',
    labelNetWpm: 'Netto WPM',
    labelGrossWpm: 'Bruto WPM',
    labelAccuracy: 'Nauwkeurigheid',
    labelTime: 'Tijd',
    labelErrors: 'Fouten',
    labelLanguage: 'Taal',
    labelKeyboardLayout: 'Toetsenbordindeling',
    labelTheme: 'Thema',
    labelLevel: 'ERK-niveau',
    labelCategory: 'Categorie',
    labelSearch: 'Zoeken...',
    labelStrict: 'Strikt (met Diakrieten)',
    labelLenient: 'Soepel (Zonder Diakrieten)',

    statusLocked: 'Vergrendeld',
    statusUnlocked: 'Beschikbaar',
    statusCompleted: 'Voltooid',

    homeHeroTitle: 'Leer Typen. Leer Woorden.',
    homeHeroSubtitle:
      'Train blind typen in het Nederlands, Engels en Arabisch terwijl je jouw woordenschat uitbreidt.',
    homeGuidedTitle: 'Begeleid Leren',
    homeGuidedDesc: 'Leer de juiste vingerpositie van de basisrij tot het volledige toetsenbord.',
    homeReflexTitle: 'Reflextraining',
    homeReflexDesc: 'Versterk spiermemory met doelgerichte patronen en adaptieve foutdetectie.',
    homeVocabTitle: 'Woordenschat Typen',
    homeVocabDesc: 'Typ betekenisvolle A1–B2 woorden met directe vertaling zonder tijdstraf.',

    guidedTitle: 'Begeleid Typcurriculum',
    guidedSubtitle: 'Gestructureerde typelessen met nauwkeurigheids- en snelheidseisen.',
    guidedLesson: 'Les',
    guidedTargetAccuracy: 'Min. Nauwkeurigheid',
    guidedTargetWpm: 'Min. WPM',

    reflexTitle: 'Reflex & Behendigheid',
    reflexSubtitle: 'Gereproduceerde oefeningen voor vingeronafhankelijkheid en snelle reflexen.',
    reflexDifficulty: 'Moeilijkheidsgraad',
    reflexLength: 'Oefenlengte',
    reflexSeed: 'Seed-nummer',
    reflexAdaptive: 'Focus op Foutgevoelige Toetsen',

    vocabTitle: 'Woordenschat Typen',
    vocabSubtitle: 'Oefen met typen van woorden en zinnen met directe ingebouwde vertaling.',
    vocabPracticeLang: 'Oefentaal',
    vocabTransLang: 'Vertaaltaal',
    vocabLookupPauseNotice: 'Klik op een woord voor uitleg; de timer pauzeert automatisch.',

    myVocabTitle: 'Mijn Opgeslagen Woorden',
    myVocabSubtitle: 'Bekijk en oefen woorden die je tijdens typsessies hebt opgeslagen.',
    myVocabEmpty: 'Nog geen opgeslagen woorden.',
    myVocabEmptyAction: 'Start een woordenschatoefening en klik op een woord om het hier te bewaren!',

    progressTitle: 'Voortgang & Statistieken',
    progressSubtitle: 'Bekijk jouw typesnelheid, nauwkeurigheid en foutpatronen over tijd.',
    progressTopSpeed: 'Hoogste Netto WPM',
    progressAvgAccuracy: 'Gem. Nauwkeurigheid',
    progressTotalTime: 'Totale Oefentijd',
    progressWeakKeys: 'Toetsen met Meeste Fouten',

    settingsTitle: 'Voorkeuren & Instellingen',
    settingsSubtitle: 'Beheer toetsenborden, interfacetalen, weergave en back-ups.',
    settingsInterfaceLang: 'Interfacetaal',
    settingsPracticeLang: 'Standaard Oefentaal',
    settingsLayout: 'Standaard Toetsenbord',
    settingsTheme: 'Thema',
    settingsThemeLight: 'Licht',
    settingsThemeDark: 'Donker',
    settingsThemeSystem: 'Systeemvoorkeur',
    settingsDiacriticMode: 'Arabische Diakrieten Match',
    settingsDataBackup: 'Lokale Gegevens',
  },

  ar: {
    appName: 'كي لينجو',
    appTagline: 'تدريب الطباعة السريعة وتعلم المفردات متعدد اللغات',
    navHome: 'الرئيسية',
    navGuided: 'المنهج التوجيهي',
    navReflex: 'تدريب ردود الفعل',
    navVocabulary: 'تدريب المفردات',
    navMyVocabulary: 'مفرداتي المحفوظة',
    navProgress: 'التقدم والإحصائيات',
    navSettings: 'الإعدادات',

    actionStart: 'بدء التدريب',
    actionRestart: 'إعادة البدء',
    actionPause: 'إيقاف مؤقت',
    actionResume: 'استئناف',
    actionComplete: 'إنهاء',
    actionNext: 'الدرس التالي',
    actionSave: 'حفظ الكلمة',
    actionRemove: 'حذف',
    actionCancel: 'إلغاء',
    actionConfirm: 'تأكيد',
    actionClose: 'إغلاق',
    actionExport: 'تصدير البيانات',
    actionImport: 'استيراد البيانات',
    actionResetAll: 'إعادة تعيين الكل',

    labelWpm: 'ك/د',
    labelNetWpm: 'السرعة الصافية',
    labelGrossWpm: 'السرعة الإجمالية',
    labelAccuracy: 'الدقة',
    labelTime: 'الوقت',
    labelErrors: 'الأخطاء',
    labelLanguage: 'اللغة',
    labelKeyboardLayout: 'تخطيط لوحة المفاتيح',
    labelTheme: 'المظهر',
    labelLevel: 'المستوى (CEFR)',
    labelCategory: 'التصنيف',
    labelSearch: 'بحث...',
    labelStrict: 'مطابقة تامة (مع التشكيل)',
    labelLenient: 'مطابقة مرنة (بدون تشكيل)',

    statusLocked: 'مغلق',
    statusUnlocked: 'متاح',
    statusCompleted: 'مكتمل',

    homeHeroTitle: 'أتقن الطباعة. تعلم اللغات.',
    homeHeroSubtitle:
      'طوّر مهارة الطباعة باللمس بالإنجليزية والهولندية والعربية مع إثراء حصيلتك اللغوية وترجمة فورية بدون إنترنت.',
    homeGuidedTitle: 'المنهج التوجيهي',
    homeGuidedDesc: 'تعلم تموضع الأصابع السليم بدءاً من صف الارتكاز حتى كامل اللوحة مع دليل بصري لليدين.',
    homeReflexTitle: 'تدريب ردود الفعل',
    homeReflexDesc: 'ابنِ الذاكرة العضلية عبر تمارين الحروف المتجاورة والتكيف مع مفاتيح الخطأ.',
    homeVocabTitle: 'ممارسة المفردات',
    homeVocabDesc: 'اكتب كلمات وجمل هادفة بمستويات A1–B2 مع ترجمة سريعة دون احتساب أخطاء.',

    guidedTitle: 'منهج الطباعة باللمس',
    guidedSubtitle: 'دروس تدريجية تبدأ من صف الارتكاز مع متطلبات اجتياز محددة للسرعة والدقة.',
    guidedLesson: 'الدرس',
    guidedTargetAccuracy: 'الحد الأدنى للدقة',
    guidedTargetWpm: 'الحد الأدنى للسرعة',

    reflexTitle: 'تدريب ردود الفعل وسرعة البديهة',
    reflexSubtitle: 'تمارين عشوائية محددة تستهدف استقلالية الأصابع والتسلسلات السريعة.',
    reflexDifficulty: 'مستوى الصعوبة',
    reflexLength: 'طول التمرين',
    reflexSeed: 'رقم البذرة (Seed)',
    reflexAdaptive: 'التركيز على الحروف الشائعة في الخطأ',

    vocabTitle: 'ممارسة المفردات اللغوية',
    vocabSubtitle: 'اكتب نصوصاً حقيقية وتعرف على معاني الكلمات مع إيقاف مؤقت للوقت أثناء الترجمة.',
    vocabPracticeLang: 'لغة الممارسة',
    vocabTransLang: 'لغة الترجمة',
    vocabLookupPauseNotice: 'انقر على أي كلمة لعرض ترجمتها دون التأثير على نقاط الدقة أو الوقت.',

    myVocabTitle: 'مفرداتي المحفوظة',
    myVocabSubtitle: 'راجع وابحث وتدرب على الكلمات التي حفظتها خلال جلسات الطباعة.',
    myVocabEmpty: 'لا توجد كلمات محفوظة حتى الآن.',
    myVocabEmptyAction: 'ابدأ تمرين المفردات وانقر على أي كلمة لحفظها في هذه القائمة!',

    progressTitle: 'إحصائيات التقدم والتعلم',
    progressSubtitle: 'تابع معدلات سرعتك ودقتك وأكثر المفاتيح التي تحتاج لتحسين أدائك فيها.',
    progressTopSpeed: 'أعلى سرعة صافية',
    progressAvgAccuracy: 'متوسط الدقة',
    progressTotalTime: 'إجمالي وقت التدريب',
    progressWeakKeys: 'المفاتيح الأكثر عرضة للخطأ',

    settingsTitle: 'التفضيلات والإعدادات',
    settingsSubtitle: 'إدارة لغة الواجهة، تخطيط لوحة المفاتيح، المظهر، والنسخ الاحتياطي للبيانات.',
    settingsInterfaceLang: 'لغة الواجهة',
    settingsPracticeLang: 'لغة الممارسة الافتراضية',
    settingsLayout: 'تخطيط اللوحة الافتراضي',
    settingsTheme: 'مظهر الشاشة',
    settingsThemeLight: 'فاتح',
    settingsThemeDark: 'داكن',
    settingsThemeSystem: 'تلقائي (حسب النظام)',
    settingsDiacriticMode: 'مطابقة التشكيل العربي',
    settingsDataBackup: 'إدارة البيانات المحلية',
  },
};

export function getDirection(lang: LanguageCode): Direction {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function isRTL(lang: LanguageCode): boolean {
  return lang === 'ar';
}

export function getLocaleStrings(lang: LanguageCode): LocaleStrings {
  return LOCALE_STRINGS[lang] || LOCALE_STRINGS.en;
}

export function t(key: keyof LocaleStrings, lang: LanguageCode): string {
  const strings = getLocaleStrings(lang);
  return strings[key] || LOCALE_STRINGS.en[key] || String(key);
}
