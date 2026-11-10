
import { useParams, usePathname, useRouter } from 'next/navigation';

export type Locale = 'ru' | 'en';

export interface I18nConfig {
  locale: Locale;
  isRussian: boolean;
  isEnglish: boolean;
  direction: 'ltr' | 'rtl';
  numberFormat: Intl.NumberFormatOptions;
  dateFormat: Intl.DateTimeFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}

export interface NumberFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  locale: Locale;
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
  locale: Locale;
}

export interface CurrencyFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  locale: Locale;
}

export class I18nUtils {
  private static instance: I18nUtils;
  private readonly locales: Locale[] = ['ru', 'en'];
  private readonly defaultLocale: Locale = 'ru';

  constructor() {}

  static getInstance(): I18nUtils {
    if (!I18nUtils.instance) {
      I18nUtils.instance = new I18nUtils();
    }
    return I18nUtils.instance;
  }

  // Locale detection and utilities
  isValidLocale(locale: string): locale is Locale {
    return this.locales.includes(locale as Locale);
  }

  getDefaultLocale(): Locale {
    return this.defaultLocale;
  }

  getSupportedLocales(): Locale[] {
    return [...this.locales];
  }

  // Locale switching utilities
  switchLocale(locale: Locale, currentPath: string): string {
    const pathSegments = currentPath.split('/').filter(Boolean);
    const currentLocale = pathSegments[0];

    if (currentLocale && this.isValidLocale(currentLocale)) {
      pathSegments[0] = locale;
    } else {
      pathSegments.unshift(locale);
    }

    return `/${pathSegments.join('/')}`;
  }

  getLocaleFromPath(path: string): Locale {
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && this.isValidLocale(firstSegment)) {
      return firstSegment as Locale;
    }

    return this.defaultLocale;
  }

  // Cultural formatting utilities
  formatNumber(value: number, options?: NumberFormatOptions): string {
    const locale = options?.locale || this.defaultLocale;
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.minimumFractionDigits || 0,
      maximumFractionDigits: options?.maximumFractionDigits || 3,
      useGrouping: options?.useGrouping !== false,
    });

    return formatter.format(value);
  }

  formatDate(date: Date, options?: DateTimeFormatOptions): string {
    const locale = options?.locale || this.defaultLocale;
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: (options?.year || 'numeric') as '2-digit' | 'numeric',
      month: options?.month || 'long',
      day: options?.day || 'numeric',
    };

    if (options?.hour) formatOptions.hour = options.hour;
    if (options?.minute) formatOptions.minute = options.minute;
    if (options?.second) formatOptions.second = options.second;
    if (options?.weekday) formatOptions.weekday = options.weekday;
    if (options?.timeZoneName) formatOptions.timeZoneName = options.timeZoneName;

    const formatter = new Intl.DateTimeFormat(locale, formatOptions);
    return formatter.format(date);
  }

  formatCurrency(
    value: number,
    currency: string,
    options?: CurrencyFormatOptions
  ): string {
    const locale = options?.locale || this.defaultLocale;
    const currencyFormat = options?.currency || this.getDefaultCurrency(locale);
    const style = options?.style || 'currency';

    const formatter = new Intl.NumberFormat(locale, {
      style,
      currency: currencyFormat,
      currencyDisplay: options?.currencyDisplay || 'symbol',
    });

    return formatter.format(value);
  }

  getDefaultCurrency(locale: Locale): string {
    return locale === 'ru' ? 'RUB' : 'USD';
  }

  getCurrencySymbol(locale: Locale): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.getDefaultCurrency(locale),
      currencyDisplay: 'symbol',
    });
    return formatter.format(0).replace(/0|[.,]?[0-9]/g, '');
  }

  // Direction and layout utilities
  getTextDirection(locale: Locale): 'ltr' | 'rtl' {
    return 'ltr'; // Both Russian and English use left-to-right
  }

  getLocaleInfo(locale: Locale): I18nConfig {
    const isRussian = locale === 'ru';
    const isEnglish = locale === 'en';

    return {
      locale,
      isRussian,
      isEnglish,
      direction: this.getTextDirection(locale),
      numberFormat: {
        // Russian number formatting
        ru: {
          style: 'decimal' as const,
          useGrouping: true,
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
        },
        // English number formatting
        en: {
          style: 'decimal' as const,
          useGrouping: true,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        },
      }[locale],

      dateFormat: {
        // Russian date formatting
        ru: {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        } as const,
        // English date formatting
        en: {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        } as const,
      }[locale],

      currencyFormat: {
        // Russian currency formatting
        ru: {
          style: 'currency',
          currency: 'RUB',
          currencyDisplay: 'symbol',
        } as const,
        // English currency formatting
        en: {
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'symbol',
        } as const,
      }[locale],
    };
  }

  // Pluralization utilities
  getPluralRule(
    count: number,
    locale: Locale
  ): 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' {
    // Russian plural rules
    if (locale === 'ru') {
      if (count % 10 === 1 && count % 100 !== 11) return 'one';
      if (count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14))
        return 'few';
      if (count % 10 === 0 || (count % 10 >= 5 && count % 10 <= 9) || (count % 100 >= 11 && count % 100 <= 14))
        return 'many';
      return 'other';
    }

    // English plural rules (simplified)
    if (count === 1) return 'one';
    return 'other';
  }

  // Translation key utilities
  getTranslationKey(path: string, locale: Locale): string {
    // Normalize path for translation key generation
    const normalizedPath = path.replace(/^\/+/, '').replace(/\/+$/, '');
    const key = normalizedPath.replace(/[/]/g, '.');
    return `pages.${key}`;
  }

  // Integration with Next.js router
  useI18n() {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();

    const locale = (params.locale as Locale) || this.defaultLocale;
    const config = this.getLocaleInfo(locale);

    const switchLanguage = (newLocale: Locale) => {
      const newPath = this.switchLocale(newLocale, pathname);
      router.push(newPath);
    };

    return {
      locale,
      config,
      switchLanguage,
      formatNumber: (value: number, options?: Partial<NumberFormatOptions>) =>
        this.formatNumber(value, { locale, ...options }),
      formatDate: (date: Date, options?: Partial<DateTimeFormatOptions>) =>
        this.formatDate(date, { locale, ...options }),
      formatCurrency: (
        value: number,
        currency?: string,
        options?: Partial<CurrencyFormatOptions>
      ) =>
        this.formatCurrency(
          value,
          currency || this.getDefaultCurrency(locale),
          { locale, ...options }
        ),
      t: (key: string, options?: Record<string, any>) =>
        this.translate(key, locale, options),
    };
  }

  // Translation function (simplified - would use actual translation files)
  translate(
    key: string,
    locale: Locale,
    options?: Record<string, any>
  ): string {
    // In a real implementation, this would load from translation files
    // For now, return the key as a placeholder
    return key;
  }

  // Static methods
  static create(): I18nUtils {
    return new I18nUtils();
  }
}

// Export default instance
export const i18nUtils = I18nUtils.getInstance();