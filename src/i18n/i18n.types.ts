"""TypeScript type definitions for i18n system.

This module contains all TypeScript type definitions for the internationalization
(i18n) system of the Banya.Sauna platform. It includes:
- Locale type definitions
- Translation key structures
- Configuration interfaces
- Formatters and utilities types
- Component prop types

The type system is designed to provide full type safety for all i18n operations
while maintaining flexibility for different localization scenarios.
"""

export type Locale = 'ru' | 'en';

export interface TranslationValue {
  ru: string;
  en: string;
}

export type TranslationKey = string;

export interface Translations {
  [key: string]: TranslationValue | Translations;
}

export interface LocaleConfig {
  locale: Locale;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  currency: string;
  timezone: string;
  dateFormat: Intl.DateTimeFormatOptions;
  numberFormat: Intl.NumberFormatOptions;
  pluralRules: PluralRulesConfig;
}

export interface PluralRulesConfig {
  ru: {
    one: (count: number) => boolean;
    few: (count: number) => boolean;
    many: (count: number) => boolean;
    other: (count: number) => boolean;
  };
  en: {
    one: (count: number) => boolean;
    other: (count: number) => boolean;
  };
}

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: InterpolationOptions) => string;
  formatNumber: (value: number, options?: NumberFormatOptions) => string;
  formatDate: (date: string | Date, options?: DateTimeFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: CurrencyFormatOptions) => string;
  isRussian: boolean;
  isEnglish: boolean;
  direction: 'ltr' | 'rtl';
}

export interface InterpolationOptions {
  [key: string]: string | number | Date | any[];
}

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'compact' | 'scientific' | 'engineering';
}

export interface DateTimeFormatOptions {
  weekday?: 'narrow' | 'short' | 'long';
  year?: '2-digit' | '4-digit';
  month?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZoneName?: 'short' | 'long';
  timeZone?: string;
  calendar?: 'gregory' | 'iso8601' | 'buddhist' | 'ethiopic' | 'hebrew' | 'indian' | 'japanese' | 'persian' | 'roc';
}

export interface CurrencyFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  unit?: string;
  unitDisplay?: 'narrow' | 'short' | 'long';
}

export interface TranslationFile {
  [namespace: string]: Translations;
}

export interface I18nNamespaces {
  common: true;
  auth: true;
  catalog: true;
  booking: true;
  review: true;
  navigation: true;
  ui: true;
  errors: true;
  validation: true;
  payments: true;
  notifications: true;
  user: true;
  admin: true;
}

export type Namespace = keyof I18nNamespaces;

export interface UseI18nOptions {
  ns?: Namespace | Namespace[];
  keyPrefix?: string;
}

export interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
  showLanguageNames?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dropdown' | 'toggle' | 'buttons';
  onLanguageChange?: (locale: Locale) => void;
}

export interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
  fallbackLng?: Locale;
}

export interface TranslationFunction {
  (key: string, options?: InterpolationOptions): string;
  (key: string, locale: Locale, options?: InterpolationOptions): string;
}

export interface LocaleDetector {
  (req?: any): Locale;
}

export interface JsonViewerProps {
  data: Translations;
  locale: Locale;
  onChange?: (data: Translations) => void;
  readOnly?: boolean;
}

export interface CsvImporterProps {
  onImport: (data: Translations, namespace: string) => void;
  supportedNamespaces: Namespace[];
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  namespaces: Namespace[];
  locale: Locale;
  pretty?: boolean;
}

export type ThemeVariant = 'light' | 'dark' | 'system';

export interface I18nSettings {
  defaultLocale: Locale;
  fallbackLng: Locale;
  debug: boolean;
  detection: {
    order: ('path' | 'cookie' | 'browser' | 'htmlTag')[];
    caches: ('localStorage' | 'cookie')[];
  };
  interpolation: {
    escapeValue: boolean;
  prefix: string;
  suffix: string;
  formatSeparator: string;
  };'
  backend: {
    loadPath: string;
    addPath: string;
    allowMultiLoading: boolean;
  };
}

export type TranslationLoader = (
  locale: Locale,
  namespace: string
) => Promise<Translations | null>;

export type TranslationSaver = (
  locale: Locale,
  namespace: string,
  data: Translations
) => Promise<void>;

export interface TranslationResult {
  t: TranslationFunction;
  i18n: any;
}

export interface UseI18nReturn extends I18nContextType {
  hasTranslation: (key: string, locale?: Locale) => boolean;
  getLanguages: () => Locale[];
  getDefaultLanguage: () => Locale;
  getLanguageInfo: (locale: Locale) => LocaleConfig | undefined;
  getLanguageFromPath: (path: string) => Locale;
  switchLanguage: (locale: Locale, path: string) => string;
}

export type TranslationHook = () => UseI18nReturn;

export interface I18nModule {
  config: I18nSettings;
  createInstance: () => I18nContextType;
  useI18n: TranslationHook;
  init: (options?: Partial<I18nSettings>) => Promise<void>;
  changeLanguage: (locale: Locale) => Promise<void>;
  getTranslation: (key: string, locale?: Locale) => string;
  exists: (key: string, locale?: Locale) => boolean;
}

export interface ErrorMessages {
  translationNotFound: string;
  invalidLocale: string;
  missingNamespace: string;
}

export interface I18nDiagnostics {
  locale: Locale;
  namespaces: string[];
  totalKeys: number;
  missingKeys: string[];
  untranslatedKeys: string[];
  lastChecked: Date;
}