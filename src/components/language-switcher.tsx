import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '@/i18n/i18n.types';

export interface LanguageSwitcherProps {
  /** Current locale */
  currentLocale: Locale;
  /** CSS class for styling */
  className?: string;
  /** Show language names in current language */
  showLanguageNames?: boolean;
  /** Size of the switcher */
  size?: 'sm' | 'md' | 'lg';
  /** Variant of the switcher */
  variant?: 'dropdown' | 'toggle' | 'buttons';
  /** Callback when language changes */
  onLanguageChange?: (locale: Locale) => void;
}

interface LanguageOption {
  locale: Locale;
  name: string;
  flag: string;
  shortName: string;
}

const LanguageOption: React.FC<{
  option: LanguageOption;
  currentLocale: Locale;
  onSelect: (locale: Locale) => void;
  size: 'sm' | 'md' | 'lg';
  variant: 'dropdown' | 'toggle' | 'buttons';
}> = ({ option, currentLocale, onSelect, size, variant }) => {
  const isActive = currentLocale === option.locale;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm';
      case 'lg':
        return 'px-4 py-2 text-lg';
      default:
        return 'px-3 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    if (variant === 'toggle') {
      return isActive
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'text-muted-foreground hover:text-foreground border-border hover:border-border/80';
    }

    if (variant === 'dropdown') {
      return isActive
        ? 'bg-accent text-accent-foreground'
        : 'text-foreground hover:bg-muted';
    }

    // buttons variant
    return isActive
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
  };

  return (
    <button
      onClick={() => onSelect(option.locale)}
      className={`inline-flex items-center gap-2 rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${getSizeClasses()} ${getVariantClasses()}`}
      disabled={isActive}
    >
      <span className='text-lg'>{option.flag}</span>
      {variant !== 'toggle' && (
        <span className='hidden sm:inline'>{option.name}</span>
      )}
      {variant === 'toggle' && (
        <span className='font-semibold'>{option.shortName}</span>
      )}
      {isActive && variant !== 'dropdown' && (
        <span className='ml-1 text-xs'>✓</span>
      )}
    </button>
  );
};

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLocale,
  className = '',
  showLanguageNames = true,
  size = 'md',
  variant = 'buttons',
  onLanguageChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const languageOptions: LanguageOption[] = [
    {
      locale: 'ru',
      name: showLanguageNames ? 'Русский' : 'RU',
      flag: '🇷🇺',
      shortName: 'RU',
    },
    {
      locale: 'en',
      name: showLanguageNames ? 'English' : 'EN',
      flag: '🇺🇸',
      shortName: 'EN',
    },
  ];

  const currentLanguage = languageOptions.find((lang) => lang.locale === currentLocale);

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Switch language using Next.js router
    const newPath = switchLanguage(newLocale, pathname);
    router.push(newPath);

    // Notify parent component
    onLanguageChange?.(newLocale);

    // Close dropdown if open
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variant === 'dropdown' && isOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-language-switcher]')) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, variant]);

  const switchLanguage = (locale: Locale, path: string): string => {
    const pathSegments = path.split('/').filter(Boolean);
    const currentLocale = pathSegments[0];

    if (currentLocale && ['ru', 'en'].includes(currentLocale)) {
      pathSegments[0] = locale;
    } else {
      pathSegments.unshift(locale);
    }

    return `/${pathSegments.join('/')}`;
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`} data-language-switcher>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
        >
          <span className='text-lg'>{currentLanguage?.flag}</span>
          {showLanguageNames && (
            <span className='hidden sm:inline'>{currentLanguage?.name}</span>
          )}
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </button>

        {isOpen && (
          <div className='absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-border bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
            <div className='py-1' role='menu' aria-orientation='vertical'>
              {languageOptions.map((option) => (
                <div key={option.locale} className='px-1 py-1'>
                  <LanguageOption
                    option={option}
                    currentLocale={currentLocale}
                    onSelect={handleLanguageChange}
                    size={size}
                    variant={variant}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // buttons or toggle variant
  return (
    <div className={`flex gap-2 ${className}`} data-language-switcher>
      {languageOptions.map((option) => (
        <LanguageOption
          key={option.locale}
          option={option}
          currentLocale={currentLocale}
          onSelect={handleLanguageChange}
          size={size}
          variant={variant}
        />
      ))}
    </div>
  );
};

LanguageSwitcher.displayName = 'LanguageSwitcher';

export default LanguageSwitcher;